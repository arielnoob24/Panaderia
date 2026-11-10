// ---- Las paginas del sitio ----------------------------------------------
// Cada pantalla es un archivo HTML de verdad (el Reto 5 no admite una sola
// pagina con rutas ni anclas). Las vistas siguen llamandose por su ruta
// ('/nosotros', '/cuenta/entrar'...), que es lo que lee vistaDeRuta; aqui se
// traduce entre esa ruta y el archivo:
//   /                    index.html
//   /nosotros            nosotros.html
//   /contacto            contacto.html
//   /tienda-<categoria>  tienda.html?c=<categoria>
//   /cuenta/entrar       entrar.html        /cuenta/crear      crear-cuenta.html
//   /cuenta/verificar    verificar.html     /cuenta/recuperar  recuperar.html
//   /cuenta              cuenta.html        /cuenta/pedidos    mis-pedidos.html
//   /cuenta/favoritos    favoritos.html
//   /cuenta/canasta      canasta-fija.html
//   /confirmar           confirmar.html     /comprobante       comprobante.html
//   /admin, /admin/<x>   admin.html?s=<x>
// Las dos del final con parametro (tienda y admin) cambian de ruta sin
// recargar: es la misma pagina con otro filtro o pestana.

const ARCHIVOS = {
  '/': 'index.html',
  '/nosotros': 'nosotros.html',
  '/contacto': 'contacto.html',
  '/confirmar': 'confirmar.html',
  '/comprobante': 'comprobante.html',
  '/cuenta': 'cuenta.html',
  '/cuenta/entrar': 'entrar.html',
  '/cuenta/crear': 'crear-cuenta.html',
  '/cuenta/verificar': 'verificar.html',
  '/cuenta/recuperar': 'recuperar.html',
  '/cuenta/pedidos': 'mis-pedidos.html',
  '/cuenta/favoritos': 'favoritos.html',
  '/cuenta/canasta': 'canasta-fija.html',
};
const RUTAS = Object.fromEntries(Object.entries(ARCHIVOS).map(([ruta, archivo]) => [archivo, ruta]));

// El nombre del archivo de una direccion; sin nombre ('/Panaderia/') es la portada.
const archivoDe = (pathname) => {
  const nombre = pathname.slice(pathname.lastIndexOf('/') + 1);
  return nombre || 'index.html';
};

// De una ruta de las vistas ('/tienda-panes', '/cuenta/crear') al archivo con
// su parametro ('tienda.html?c=panes'), relativo a la pagina actual.
function archivoDeRuta(ruta) {
  if (ARCHIVOS[ruta]) return ARCHIVOS[ruta];
  const tienda = ruta.match(/^\/tienda-(.+)$/);
  if (tienda) return `tienda.html?c=${encodeURIComponent(tienda[1])}`;
  const admin = ruta.match(/^\/admin(?:\/(.+))?$/);
  if (admin) return admin[1] ? `admin.html?s=${encodeURIComponent(admin[1])}` : 'admin.html';
  return null;
}

// De la direccion abierta a la ruta de la vista.
function rutaDeDireccion({ pathname, search }) {
  const archivo = archivoDe(pathname);
  const params = new URLSearchParams(search);
  if (archivo === 'tienda.html') return `/tienda-${params.get('c') || 'catalogo'}`;
  if (archivo === 'admin.html') return params.get('s') ? `/admin/${params.get('s')}` : '/admin';
  return RUTAS[archivo] || '/';
}

export { archivoDe, archivoDeRuta, rutaDeDireccion };
