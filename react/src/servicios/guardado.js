// ---- Lo que el pedido guarda en este navegador -------------------------
// La misma clave, el mismo formato y la misma cookie que el sitio actual
// (seccion 8 del plan): las reglas son las de js/pedido/guardado.js y la marca
// de js/comun/storage.js, importadas y no copiadas. Asi un pedido a medias
// guardado en un sitio aparece en el otro, y sigue ahi cuando React lo
// reemplace.
//
// Todo lo que toca localStorage va en try/catch: en ventana privada escribir
// lanza, y eso no puede tumbar la pagina. El pedido sigue vivo en memoria.
import { CLAVE } from '@raiz/js/comun/state.js';
import { marcarActualizacion, olvidarMarca } from '@raiz/js/comun/storage.js';
import { leerPedidoGuardado, pedidoParaGuardar } from '@raiz/js/pedido/guardado.js';

const leerCrudo = () => {
  try { return window.localStorage.getItem(CLAVE); } catch (e) { return null; }
};

// Las lineas como pares [id, linea], la entrega y la factura, ya revisadas:
// lo de localStorage lo puede tocar cualquiera a mano.
const leerGuardado = () => leerPedidoGuardado(leerCrudo());

// Las lineas, la entrega y la factura van en un solo registro. Devuelve la
// fecha, para el pie.
const guardarPedidoAMedias = ({ lineas, entrega, factura }) => {
  const cuando = marcarActualizacion();
  try {
    window.localStorage.setItem(CLAVE, pedidoParaGuardar({ lineas, entrega, factura, cuando }));
  } catch (e) { /* en ventana privada no se puede guardar; el pedido sigue vivo en memoria */ }
  return cuando;
};

// Pedido aprobado: lo guardado se borra para que no reaparezca en la proxima
// visita, y la marca con el, que diria que se guardo algo que ya no esta.
const borrarGuardado = () => {
  try { window.localStorage.removeItem(CLAVE); } catch (e) { /* si no se pudo guardar, no hay nada que borrar */ }
  olvidarMarca();
};

export { leerGuardado, guardarPedidoAMedias, borrarGuardado };
