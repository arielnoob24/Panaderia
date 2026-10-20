// Como se llama cada categoria a la vista. En el sitio actual lo dice el menu
// Tienda de index.html y view.js lo lee de ahi; aqui el menu sale de esta
// lista (MenuTienda.jsx), asi que sigue habiendo un solo sitio donde cambiar
// "Bebidas". El orden es el del menu, y el de los chips de "Filtrar por".
const CATEGORIAS = [
  { id: 'panes', nombre: 'Panes' },
  { id: 'dulces', nombre: 'Dulces y pasteles' },
  { id: 'bebidas-frias', nombre: 'Bebidas' },
];

const nombreCategoria = (id) => CATEGORIAS.find((c) => c.id === id)?.nombre;

// La categoria que pide la direccion: 'todos' en la portada, 'catalogo' en el
// catalogo entero, o el id de una de las de Tienda. null si no es ninguna.
const categoriaDeRuta = (pathname) => {
  if (pathname === '/' || pathname === '') return 'todos';
  const m = pathname.match(/^\/tienda-(.+)$/);
  if (!m) return null;
  return m[1] === 'catalogo' || nombreCategoria(m[1]) ? m[1] : null;
};

// Panes, Dulces y Bebidas no abren una vista suya: abren el catalogo entero
// con "Filtrar por" ya puesto en esa categoria (view.js hace lo mismo).
const esDeTienda = (cat) => cat !== 'todos' && cat !== 'catalogo';
const vistaDe = (cat) => (esDeTienda(cat) ? 'catalogo' : cat);
const filtroDe = (cat) => (esDeTienda(cat) ? cat : 'todas');

export { CATEGORIAS, nombreCategoria, categoriaDeRuta, vistaDe, filtroDe };
