// ---- Modelo: productos (CRUD con los metodos de Prisma) ----------------
// Relaciones del catalogo en el esquema (prisma/schema.prisma):
// - CATEGORIAS 1:N PRODUCTOS, ETIQUETAS 1:N PRODUCTOS, TARIFAS_IVA 1:N PRODUCTOS;
// - PRODUCTOS N:M TAMANOS a traves de PRODUCTOS_TAMANOS, que guarda el
//   precio y el orden de cada tamano (una N:M con datos propios).
// Cada escritura va en una transaccion que fija app.usuario: el trigger de
// AUDITORIAS de la base anota quien cambio el producto y como quedo.
import { prisma } from '../db.js';
import { ErrorHttp } from '../errores.js';

// Lo que se trae de cada producto: sus relaciones, con los tamanos en orden.
const INCLUIR = {
  categorias: true,
  etiquetas: true,
  tarifas_iva: true,
  productos_tamanos: { include: { tamanos: true }, orderBy: { pta_orden: 'asc' } },
};

// Una fila de la base pasa a un producto con la forma de
// frontend/data/productos.json (la misma que da la Edge Function), mas su
// codigo y su tarifa de IVA. Con un solo tamano "Único" no lleva lista.
const aProducto = (f) => {
  const tamanos = f.productos_tamanos.map((t) => ({ valor: t.tamanos.tam_descripcion, precio: Number(t.pta_precio) }));
  const unico = tamanos.length === 1 && tamanos[0].valor === 'Único';
  return {
    codigo: f.pro_codigo,
    nombre: f.pro_nombre,
    categoria: f.categorias.cat_slug,
    precio: tamanos[0]?.precio ?? 0,
    destacado: f.pro_destacado,
    foto: f.pro_foto,
    alt: f.pro_textoalternativo,
    disponible: f.pro_disponible,
    iva: f.tarifas_iva.tiv_codigosri,
    ...(f.etiquetas ? { etiqueta: { color: f.etiquetas.eti_color, texto: f.etiquetas.eti_texto } } : {}),
    ...(unico ? {} : { tamanos }),
  };
};

// ---- Leer ----------------------------------------------------------------

// El catalogo, en el orden de PRO_Codigo (el de "Recomendados"). Filtros
// opcionales: ?categoria=panes y ?disponible=true.
const listar = async ({ categoria, disponible } = {}) => {
  const filas = await prisma.productos.findMany({
    where: {
      ...(categoria ? { categorias: { cat_slug: categoria } } : {}),
      ...(disponible === undefined ? {} : { pro_disponible: disponible }),
    },
    include: INCLUIR,
    orderBy: { pro_codigo: 'asc' },
  });
  return filas.map(aProducto);
};

const obtener = async (codigo) => {
  const fila = await prisma.productos.findUnique({ where: { pro_codigo: codigo }, include: INCLUIR });
  if (!fila) throw new ErrorHttp(404, `No existe el producto ${codigo}.`);
  return aProducto(fila);
};

// ---- De lo que manda el cliente a los codigos de la base -----------------
// La categoria llega por su slug, la etiqueta por su texto, el IVA por su
// codigo del SRI y cada tamano por su descripcion: aqui se buscan sus
// codigos. Si alguno no existe, 400 diciendo cual.
const buscarCodigos = async (tx, d) => {
  const codigos = {};
  if (d.categoria !== undefined) {
    const c = await tx.categorias.findUnique({ where: { cat_slug: d.categoria } });
    if (!c) throw new ErrorHttp(400, `No existe la categoría "${d.categoria}".`);
    codigos.cat_codigo = c.cat_codigo;
  }
  if (d.etiqueta !== undefined) {
    if (d.etiqueta === null) codigos.eti_codigo = null;
    else {
      const e = await tx.etiquetas.findUnique({ where: { eti_texto: d.etiqueta } });
      if (!e) throw new ErrorHttp(400, `No existe la etiqueta "${d.etiqueta}".`);
      codigos.eti_codigo = e.eti_codigo;
    }
  }
  if (d.iva !== undefined) {
    const t = await tx.tarifas_iva.findUnique({ where: { tiv_codigosri: d.iva } });
    if (!t) throw new ErrorHttp(400, `No existe la tarifa de IVA "${d.iva}".`);
    codigos.tiv_codigo = t.tiv_codigo;
  }
  if (d.tamanos !== undefined) {
    codigos.tamanos = [];
    for (const [i, t] of d.tamanos.entries()) {
      const tam = await tx.tamanos.findUnique({ where: { tam_descripcion: t.valor } });
      if (!tam) throw new ErrorHttp(400, `No existe el tamaño "${t.valor}".`);
      codigos.tamanos.push({ tam_codigo: tam.tam_codigo, pta_precio: t.precio, pta_orden: i + 1 });
    }
  }
  return codigos;
};

// Las columnas propias de PRODUCTOS que vienen en los datos.
const columnas = (d) => ({
  ...(d.nombre !== undefined ? { pro_nombre: d.nombre } : {}),
  ...(d.foto !== undefined ? { pro_foto: d.foto } : {}),
  ...(d.alt !== undefined ? { pro_textoalternativo: d.alt } : {}),
  ...(d.disponible !== undefined ? { pro_disponible: d.disponible } : {}),
  ...(d.destacado !== undefined ? { pro_destacado: d.destacado } : {}),
});

// Una transaccion con app.usuario puesto (lo lee el trigger de AUDITORIAS).
const conAuditoria = (usuario, trabajo) => prisma.$transaction(async (tx) => {
  await tx.$queryRaw`SELECT set_config('app.usuario', ${usuario}, true)`;
  return trabajo(tx);
});

// Los tamanos de un producto, en una sola operacion por tamano: se actualiza
// el precio de los que ya tenia, se crean los nuevos y se borran los que ya
// no van. Un tamano que ya se vendio (DETALLES_PEDIDO) o tiene receta no se
// puede borrar: la base lo impide y se responde 400.
const ponerTamanos = async (tx, codigo, tamanos) => {
  const nuevos = new Set(tamanos.map((t) => t.tam_codigo));
  // Primero se apartan los ordenes (la base no deja dos tamanos con el mismo).
  await tx.productos_tamanos.updateMany({ where: { pro_codigo: codigo }, data: { pta_orden: { increment: 100 } } });
  for (const t of tamanos) {
    await tx.productos_tamanos.upsert({
      where: { pro_codigo_tam_codigo: { pro_codigo: codigo, tam_codigo: t.tam_codigo } },
      update: { pta_precio: t.pta_precio, pta_orden: t.pta_orden },
      create: { pro_codigo: codigo, ...t },
    });
  }
  try {
    await tx.productos_tamanos.deleteMany({ where: { pro_codigo: codigo, tam_codigo: { notIn: [...nuevos] } } });
  } catch (e) {
    throw new ErrorHttp(400, 'No se puede quitar un tamaño que ya está en pedidos o recetas: márcalo como agotado.');
  }
};

// ---- Escribir --------------------------------------------------------------

// POST: un producto nuevo con sus tamanos (create anidado: PRODUCTOS y
// PRODUCTOS_TAMANOS en la misma operacion).
const crear = (d, usuario) => conAuditoria(usuario, async (tx) => {
  const c = await buscarCodigos(tx, d);
  const fila = await tx.productos.create({
    data: {
      ...columnas(d),
      cat_codigo: c.cat_codigo,
      eti_codigo: c.eti_codigo ?? null,
      tiv_codigo: c.tiv_codigo,
      productos_tamanos: { create: c.tamanos },
    },
    include: INCLUIR,
  });
  return aProducto(fila);
});

// PUT: reemplaza el producto entero (todos los campos y sus tamanos).
// PATCH: cambia solo lo que llega. Los dos usan esto; la diferencia esta en
// lo que exige la validacion (src/validaciones/producto.js).
const cambiar = (codigo, d, usuario) => conAuditoria(usuario, async (tx) => {
  const actual = await tx.productos.findUnique({ where: { pro_codigo: codigo }, include: { productos_tamanos: { include: { tamanos: true } } } });
  if (!actual) throw new ErrorHttp(404, `No existe el producto ${codigo}.`);
  // "precio" solo, en un PATCH: el del tamano unico.
  if (d.precio !== undefined && d.tamanos === undefined) {
    if (actual.productos_tamanos.length !== 1) throw new ErrorHttp(400, 'Este producto tiene varios tamaños: cambia sus precios con "tamanos".');
    d = { ...d, tamanos: [{ valor: actual.productos_tamanos[0].tamanos.tam_descripcion, precio: d.precio }] };
  }
  const c = await buscarCodigos(tx, d);
  await tx.productos.update({
    where: { pro_codigo: codigo },
    data: {
      ...columnas(d),
      ...(c.cat_codigo ? { cat_codigo: c.cat_codigo } : {}),
      ...(c.eti_codigo !== undefined ? { eti_codigo: c.eti_codigo } : {}),
      ...(c.tiv_codigo ? { tiv_codigo: c.tiv_codigo } : {}),
    },
  });
  if (c.tamanos) await ponerTamanos(tx, codigo, c.tamanos);
  return aProducto(await tx.productos.findUnique({ where: { pro_codigo: codigo }, include: INCLUIR }));
});

// DELETE: un producto que ya se vendio no se puede borrar sin romper los
// pedidos y facturas que lo nombran. Se retira: queda agotado
// (PRO_Disponible = false), deja de poder pedirse y el historial sigue entero.
const retirar = (codigo, usuario) => conAuditoria(usuario, async (tx) => {
  const fila = await tx.productos.update({ where: { pro_codigo: codigo }, data: { pro_disponible: false }, include: INCLUIR });
  return aProducto(fila);
});

export { listar, obtener, crear, cambiar, retirar };
