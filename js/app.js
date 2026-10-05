// ---- El arranque ------------------------------------------------------
// Lo unico que carga el HTML. Trae los productos, manda pintar la vitrina y
// enciende las piezas en el orden en que se necesitan unas a otras.
//
// El orden no es decorativo: el control de cantidad se pone sobre fichas que
// ya existen, la canasta recupera lo guardado cuando esos controles ya estan
// puestos -si no, no tendria como repintarlos- y la cuenta va al final, porque
// pasa la direccion guardada al campo de la canasta.
import { cargarProductos, RUTA } from './repo.js';
import { montarCatalogo } from './view.js';
import { montarControlesDeFicha, iniciarCanasta } from './cart.js';
import { iniciarCuenta } from './account.js';
import { updateOpeningStatus, vigilarImagenes } from './ui.js';

const catalogStatus = document.querySelector('.catalog-status');

// Si los productos no llegan, el resto del sitio sigue en pie: se cuenta lo que
// pasa donde iba el catalogo, en el mismo renglon que ya avisa de cuantos hay,
// y no se deja un hueco mudo.
const sinCatalogo = (e) => {
  console.error(`No se pudo cargar ${RUTA}:`, e);
  if (!catalogStatus) return;
  catalogStatus.textContent = 'No se pudo cargar el catálogo. Recarga la página; '
    + 'si sigue sin salir, escríbenos y te decimos qué hay hoy.';
};

const arrancar = async () => {
  try {
    const { productos } = await cargarProductos();
    montarCatalogo(productos);
    // Las fichas ya estan en la pagina: ahora se les cambia el "Pedir" por el
    // control de cantidad y se vigila la carga de sus fotos.
    montarControlesDeFicha();
    vigilarImagenes();
  } catch (e) {
    sinCatalogo(e);
  }
  // Esto va fuera del try: aunque el catalogo falle, la canasta guardada y la
  // cuenta de este navegador siguen siendo validas y hay que ensenarlas.
  iniciarCanasta();
  iniciarCuenta();

  updateOpeningStatus();
  window.setInterval(updateOpeningStatus, 60000);
};

arrancar();
