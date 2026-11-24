// Como se llama cada categoria a la vista. En el sitio presentado lo decia el
// menu Tienda de index.html y view.js lo leia de ahi; aqui la cinta de la
// portada y "Filtrar por" salen de esta lista, asi que sigue habiendo un solo
// sitio donde cambiar "Bebidas". El orden es el de los dos. Cada una lleva
// la frase en cursiva que sale bajo el titulo de la tienda (seccion 10 del
// plan, "La tienda con el estilo de la portada"); el usuario puede cambiarlas.
const CATEGORIAS = [
  { id: 'panes', nombre: 'Panes', frase: 'Lo que sale del horno cada mañana.' },
  { id: 'dulces', nombre: 'Dulces y pasteles', frase: 'Para endulzar la tarde.' },
  { id: 'bebidas-frias', nombre: 'Bebidas', frase: 'Para acompañar el pan.' },
];
// La de "Todo el catalogo", que no es una categoria.
const FRASE_CATALOGO = 'Panes, dulces y bebidas de la casa.';

const nombreCategoria = (id) => CATEGORIAS.find((c) => c.id === id)?.nombre;
const fraseCategoria = (id) => CATEGORIAS.find((c) => c.id === id)?.frase ?? FRASE_CATALOGO;

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

export { CATEGORIAS, nombreCategoria, fraseCategoria, categoriaDeRuta, vistaDe, filtroDe };
