// ---- Lo que la canasta guarda en este navegador ------------------------
// La misma clave, el mismo formato y la misma cookie que el sitio actual
// (seccion 8 del plan): las reglas son las de js/pedido/guardado.js y la marca
// de js/comun/storage.js, importadas y no copiadas. Asi un pedido a medias
// guardado en un sitio aparece en el otro, y sigue ahi cuando React lo
// reemplace.
//
// Todo lo que toca localStorage va en try/catch: en ventana privada escribir
// lanza, y eso no puede tumbar la pagina. El pedido sigue vivo en memoria.
import { CLAVE } from '@raiz/js/comun/state.js';
import { marcarActualizacion } from '@raiz/js/comun/storage.js';
import { leerPedidoGuardado, pedidoParaGuardar } from '@raiz/js/pedido/guardado.js';

// La clave de la cuenta del sitio actual (js/cuenta/account.js). Aqui solo se
// mira si hay un correo: la cuenta entera llega en la fase 5.
const CLAVE_CUENTA = 'eltradicional-cuenta';

const leerCrudo = () => {
  try { return window.localStorage.getItem(CLAVE); } catch (e) { return null; }
};

// Las lineas como pares [id, linea], ya revisadas: lo de localStorage lo puede
// tocar cualquiera a mano.
const leerCanasta = () => leerPedidoGuardado(leerCrudo()).lineas;

// La entrega y la factura todavia no viven en React (fase 4), pero van en el
// mismo registro que las lineas. Se vuelven a leer justo antes de escribir y se
// dejan como estaban: guardar la canasta no puede borrar la direccion que se
// escribio en el sitio actual. Devuelve la fecha, para el pie.
const guardarCanasta = (lineas) => {
  const { entrega, factura } = leerPedidoGuardado(leerCrudo());
  const cuando = marcarActualizacion();
  try {
    window.localStorage.setItem(CLAVE, pedidoParaGuardar({ lineas, entrega, factura, cuando }));
  } catch (e) { /* en ventana privada no se puede guardar; el pedido sigue vivo en memoria */ }
  return cuando;
};

// Si en este navegador ya hay una cuenta, como correoGuardado() de account.js.
const correoGuardado = () => {
  try {
    const crudo = window.localStorage.getItem(CLAVE_CUENTA);
    if (!crudo) return '';
    const dato = JSON.parse(crudo);
    return dato && typeof dato.correo === 'string' ? dato.correo : '';
  } catch (e) { return ''; }
};

export { leerCanasta, guardarCanasta, correoGuardado };
