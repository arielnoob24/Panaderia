// ---- La vista con que se abre la pagina ---------------------------------
// Al abrir la pagina no se mueve ni el foco ni el desplazamiento: son los del
// navegador, como en cualquier pagina que se carga. Al llegar a una vista
// despues, si (useVista).
//
// Antes se sabia por la direccion: la primera de React Router se llama
// 'default'. Pero esa entrada del historial se sigue llamando asi al volver a
// ella con Atras, y entonces volver a la portada desde la cuenta dejaba el
// foco en body (WCAG 2.4.3). Ahora es una marca del modulo que gasta la
// primera vista que se monta: la de abrir la pagina, aunque antes haya pasado
// por un desvio (#historia -> #/nosotros, #/cuenta sin sesion -> entrar),
// porque los desvios no montan ninguna vista.
let porAbrir = true;

// Devuelve si esta es la vista de abrir la pagina, y gasta la marca. Se llama
// una sola vez por vista, al montarse (en un efecto: un pintado que React
// tire a medias no la gasta).
function esLaDeAbrir() {
  const era = porAbrir;
  porAbrir = false;
  return era;
}

// Sin gastarla, para lo que se pinta antes de que la vista se monte (App no
// anima la entrada de la vista con que se abre la pagina).
const todaviaAbriendo = () => porAbrir;

// ---- El desplazamiento con Atras y Adelante -------------------------------
// El navegador devuelve a cada entrada del historial el desplazamiento que
// tenia, y lo hace despues del popstate, cuando React ya pinto la vista y
// useVista la subio arriba: el h1 enfocado se quedaba fuera de la pantalla.
// Al cambiar de vista se va arriba del todo (seccion 15 del plan), asi que,
// ya abierta la pagina, el desplazamiento lo decide la pagina ('manual'):
// las vistas suben (useVista) y la tienda, entre categorias, que no es
// cambiar de vista, vuelve a donde se estaba (posicionTienda).
//
// Se pone despues de 'load' y no al arrancar: al recargar, el navegador
// devuelve el desplazamiento mientras carga, y abrir la pagina es suyo. Por
// lo mismo vuelve a 'auto' al irse (pagehide), porque el modo es de la
// entrada y lo leeria la recarga.
function cederDesplazamiento() {
  const { history } = window;
  if (!('scrollRestoration' in history)) return;
  const manual = () => { history.scrollRestoration = 'manual'; };
  if (document.readyState === 'complete') setTimeout(manual, 0);
  else window.addEventListener('load', () => setTimeout(manual, 0), { once: true });
  window.addEventListener('pagehide', () => { history.scrollRestoration = 'auto'; });
  // Si el navegador la devuelve de su cache al volver, sigue siendo suya.
  window.addEventListener('pageshow', (e) => { if (e.persisted) manual(); });
}

// Lo que estaba desplazada cada entrada de la tienda, por su clave de React
// Router. Fuera del componente: se sale de la tienda y se vuelve, y Atras
// puede llegar a una categoria de antes.
const posicionTienda = new Map();

export { esLaDeAbrir, todaviaAbriendo, cederDesplazamiento, posicionTienda };
