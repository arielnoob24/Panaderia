// Como se llama cada categoria a la vista. En el sitio actual lo dice el menu
// Tienda de index.html y view.js lo lee de ahi; aqui todavia no hay menu, asi
// que el nombre vive en un solo sitio y el menu, cuando llegue, saldra de aqui.
// El orden es el del menu.
const CATEGORIAS = [
  { id: 'panes', nombre: 'Panes' },
  { id: 'dulces', nombre: 'Dulces y pasteles' },
  { id: 'bebidas-frias', nombre: 'Bebidas' },
];

const nombreCategoria = (id) => CATEGORIAS.find((c) => c.id === id)?.nombre;

export { CATEGORIAS, nombreCategoria };
