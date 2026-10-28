// ---- Las vistas que llegan en su propio archivo ------------------------
// La cuenta y el pago no se ven al abrir la portada, y eran casi la mitad
// del JS (seccion 15 del plan, fase 6, punto 5). Van aparte con React.lazy:
// el archivo principal no los trae, y cada uno se pide la primera vez que
// hace falta. Lo que comparten con el principal (la sesion, el pedido,
// Motion, los avisos...) se queda en el principal y no se repite: Vite solo
// saca a cada parte lo que nadie mas usa.
//
// Para que al llegar no haya que esperar, se piden antes de tiempo:
//   - con la intencion: el puntero o el foco sobre lo que lleva a la cuenta
//     o a pagar (FichaCuenta, "Ir a pagar" de la canasta);
//   - con el navegador en reposo, ya cargada la pagina (precargarEnReposo).
// Mientras tanto, cambiar de vista es una transicion de React Router: se
// sigue viendo la vista de antes hasta que la nueva puede pintarse, y llega
// con su fundido de siempre (App.jsx).
import { lazy } from 'react';

// Si el archivo no llega se vuelve a pedir una vez, solo, antes de decir
// nada: un corte de un instante (el telefono que cambia de antena) no tiene
// por que acabar en el aviso. Donde el navegador recuerda el fallo, el
// segundo intento falla enseguida y no cuesta nada.
const ESPERA_REINTENTO = 800;
const conUnReintento = (importar) => importar().catch(() => new Promise((listo) => {
  setTimeout(listo, ESPERA_REINTENTO);
}).then(importar));

// Una vista aparte: su archivo se pide una sola vez, lo pida el lazy o
// precargar. Si falla se olvida la promesa, aunque en Chrome y Edge volver a
// pedirlo no sirve hasta recargar (FalloDeCarga.jsx).
function aparte(importar, grupo) {
  let promesa = null;
  const vista = {
    traer() {
      if (!promesa) {
        promesa = conUnReintento(importar).catch((error) => {
          promesa = null;
          throw error;
        });
        // Las de su grupo, a la vez: abrir #/cuenta sin sesion lleva a
        // #/cuenta/entrar, y crear sigue en verificar. Si llegaran una tras
        // otra, el desvio se quedaria esperando a la segunda con la vista
        // vacia.
        precargar(grupo);
      }
      return promesa;
    },
  };
  vista.Componente = lazy(vista.traer);
  return vista;
}

// Lo que se pide junto: quien va a la cuenta suele seguir de un paso a otro,
// y #/confirmar acaba en #/comprobante. "Ir a pagar" pide los dos grupos,
// porque sin sesion se pasa por la cuenta.
const APARTE = {
  confirmar: aparte(() => import('../pedido/Confirmar.jsx'), 'pago'),
  comprobante: aparte(() => import('../pedido/Comprobante.jsx'), 'pago'),
  'cuenta-entrar': aparte(() => import('../cuenta/Entrar.jsx'), 'cuenta'),
  'cuenta-crear': aparte(() => import('../cuenta/CrearCuenta.jsx'), 'cuenta'),
  'cuenta-verificar': aparte(() => import('../cuenta/Verificar.jsx'), 'cuenta'),
  'cuenta-recuperar': aparte(() => import('../cuenta/Recuperar.jsx'), 'cuenta'),
  cuenta: aparte(() => import('../cuenta/MisDatos.jsx'), 'cuenta'),
  'cuenta-pedidos': aparte(() => import('../cuenta/MisPedidos.jsx'), 'cuenta'),
  // El panel no se precarga en reposo: casi nadie lo abre. Se pide con la
  // intencion (la opcion "Panel" de la ficha) o al entrar a #/admin.
  admin: aparte(() => import('../admin/Panel.jsx'), 'admin'),
};

const GRUPOS = {
  cuenta: ['cuenta-entrar', 'cuenta-crear', 'cuenta-verificar', 'cuenta-recuperar', 'cuenta', 'cuenta-pedidos'],
  pago: ['confirmar', 'comprobante'],
  admin: ['admin'],
};

// Pedir antes de tiempo no tiene que romper nada: si falla, la vista lo
// vuelve a intentar al hacer falta, y ahi si se dice. Sin red ni se intenta:
// el navegador recordaria el fallo y la vista ya no podria cargar aunque
// volviera la red.
function precargar(...grupos) {
  if (navigator.onLine === false) return;
  grupos.forEach((g) => GRUPOS[g].forEach((cual) => { APARTE[cual].traer().catch(() => {}); }));
}

// Con la pagina ya cargada y el navegador sin nada que hacer, se traen
// todas: asi la primera vez que se abre la cuenta o el pago ya estan. No si
// quien visita pidio ahorrar datos.
function precargarEnReposo() {
  if (navigator.connection?.saveData) return;
  const reposo = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  const luego = () => reposo(() => precargar('pago', 'cuenta'), { timeout: 4000 });
  if (document.readyState === 'complete') luego();
  else window.addEventListener('load', luego, { once: true });
}

export { APARTE, precargar, precargarEnReposo };
