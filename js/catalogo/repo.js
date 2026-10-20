// ---- De donde salen los productos ------------------------------------
// El catalogo ya no esta escrito en el HTML: vive en data/productos.json y se
// trae de ahi al abrir la pagina. Asi, meter un pan nuevo o cambiar un precio
// es tocar un archivo de datos y nada mas, sin buscar entre las etiquetas.
//
// Abierto con doble clic, el navegador no deja que una pagina en file:// lea
// archivos de al lado. Para ese caso esta js/sin-servidor.js, que trae el
// catalogo ya metido dentro en CATALOGO_EMBEBIDO: si existe se usa ese, y si
// no se pide el archivo, que es lo que pasa en GitHub Pages o con Live Server.
const RUTA = 'data/productos.json';

// Lo que se espera de cada producto. Se comprueba al cargar y no al pintar: si
// una ficha viene mal escrita conviene saberlo de golpe y con su nombre, no
// descubrirlo mas tarde con un precio en blanco en medio de la vitrina.
const revisar = (p, i) => {
  const donde = p && p.nombre ? `"${p.nombre}"` : `el producto numero ${i + 1}`;
  if (!p || typeof p !== 'object') throw new Error(`${donde} no es un producto`);
  if (typeof p.nombre !== 'string' || !p.nombre.trim()) throw new Error(`a ${donde} le falta el nombre`);
  if (typeof p.categoria !== 'string' || !p.categoria.trim()) throw new Error(`a ${donde} le falta la categoria`);
  if (!Number.isFinite(p.precio) || p.precio < 0) throw new Error(`${donde} no tiene un precio valido`);
  // La foto es la raiz del nombre del archivo, sin ancho ni extension: de
  // "assets/img/productos/pan-redondo" salen "...-420.jpg" y "...-840.jpg",
  // que es lo que el navegador elige segun lo que le quepa. Se guarda asi y no
  // con la ruta entera para no repetir dos veces lo mismo en cada producto.
  if (typeof p.foto !== 'string' || !p.foto) throw new Error(`a ${donde} le falta la foto`);
  if (/\.(jpg|jpeg|png|webp|avif)$/i.test(p.foto)) {
    throw new Error(`la foto de ${donde} lleva extension: va la raiz, sin ancho ni .jpg`);
  }
  // El alt no es un adorno: sin el, quien usa lector de pantalla no sabe que
  // hay en la foto. Vacio solo valdria si la imagen fuera decorativa, y estas
  // no lo son.
  if (typeof p.alt !== 'string' || !p.alt.trim()) throw new Error(`a ${donde} le falta el texto alternativo`);
  if (p.tamanos && (!Array.isArray(p.tamanos) || !p.tamanos.length)) {
    throw new Error(`los tamanos de ${donde} no son una lista`);
  }
  (p.tamanos || []).forEach((t) => {
    if (!t || typeof t.valor !== 'string' || !Number.isFinite(t.precio)) {
      throw new Error(`un tamano de ${donde} esta incompleto`);
    }
  });
  if (p.destacado !== undefined && typeof p.destacado !== 'boolean') {
    throw new Error(`"destacado" de ${donde} tiene que ser true o false`);
  }
  // El precio que se ve en la ficha es el del primer tamano; si no coincidieran,
  // la ficha diria un precio y la canasta cobraria otro.
  if (p.tamanos && p.tamanos[0].precio !== p.precio) {
    throw new Error(`en ${donde} el precio no es el del primer tamano`);
  }
};

// Lo que falta se rellena con su valor de siempre, para que el resto del sitio
// no tenga que preguntar si tal cosa venia o no: un producto sin "disponible"
// esta disponible, y uno sin tamanos viene en uno solo.
const normalizar = (p) => ({
  nombre: p.nombre.trim(),
  categoria: p.categoria.trim(),
  precio: p.precio,
  foto: p.foto,
  alt: p.alt.trim(),
  disponible: p.disponible !== false,
  // Si sale en "Los mas pedidos" de la portada. Lo marca la panaderia, que es
  // quien sabe que se vende mas: el sitio no tiene datos de ventas.
  destacado: p.destacado === true,
  etiqueta: p.etiqueta && p.etiqueta.texto ? p.etiqueta : null,
  tamanos: p.tamanos || [],
});

const cargarProductos = async () => {
  let datos = globalThis.CATALOGO_EMBEBIDO;
  if (!datos) {
    const r = await fetch(RUTA);
    if (!r.ok) throw new Error(`no se pudo leer ${RUTA} (${r.status})`);
    datos = await r.json();
  }
  const crudos = Array.isArray(datos) ? datos : datos.productos;
  if (!Array.isArray(crudos) || !crudos.length) throw new Error(`${RUTA} no trae ningun producto`);
  crudos.forEach(revisar);
  const productos = crudos.map(normalizar);
  return { productos };
};

// revisar se exporta para el CI, que valida el JSON con estas mismas reglas.
export { cargarProductos, RUTA, revisar };
