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

export { esLaDeAbrir, todaviaAbriendo };
