// ---- Modelo: categorias (la relacion 1:N con PRODUCTOS) ----------------
// Una categoria tiene muchos productos; cada producto, una categoria. Con
// _count Prisma cuenta los productos de cada una en la misma consulta, y con
// include los trae.
import { prisma } from '../db.js';
import { ErrorHttp } from '../errores.js';

const listar = async () => {
  const filas = await prisma.categorias.findMany({
    include: { _count: { select: { productos: true } } },
    orderBy: { cat_codigo: 'asc' },
  });
  return filas.map((c) => ({ slug: c.cat_slug, nombre: c.cat_nombre, productos: c._count.productos }));
};

// Una categoria con sus productos (nombre, codigo y si se puede pedir).
const obtener = async (slug) => {
  const c = await prisma.categorias.findUnique({
    where: { cat_slug: slug },
    include: { productos: { select: { pro_codigo: true, pro_nombre: true, pro_disponible: true }, orderBy: { pro_codigo: 'asc' } } },
  });
  if (!c) throw new ErrorHttp(404, `No existe la categoría "${slug}".`);
  return {
    slug: c.cat_slug,
    nombre: c.cat_nombre,
    productos: c.productos.map((p) => ({ codigo: p.pro_codigo, nombre: p.pro_nombre, disponible: p.pro_disponible })),
  };
};

export { listar, obtener };
