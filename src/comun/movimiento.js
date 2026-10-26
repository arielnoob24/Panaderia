// ---- El ritmo del movimiento (seccion 10 del plan) ------------------------
// Las duraciones y curvas de Motion y de element.animate() salen de aqui, con
// los mismos valores que :root de styles.css (--dur-*, --ease-*): si cambia
// uno, cambia el otro. Ningun componente escribe las suyas a mano.
//
// Dos clases y nada fuera de ellas:
//   respuesta a un toque (boton pulsado, contador, visto, errores): micro y rapida
//   escena (cambio de vista, pasos, desplegar, la canasta): base en adelante
// Lo que sale dura mas o menos la mitad de lo que entra, y nada usa ease-in:
// arrancar despacio hace que el sitio parezca tardar en contestar.

// En segundos, que es lo que pide Motion (--dur-micro ... --dur-scene).
const DURACION = {
  micro: 0.16,
  rapida: 0.2,
  base: 0.4,
  lenta: 0.56,
  editorial: 0.76,
  escena: 1.1,
};

// Las curvas de :root como listas, que es lo que pide Motion.
const CURVA = {
  salida: [0.16, 1, 0.3, 1], // --ease-out
  ui: [0.2, 0, 0, 1], // --ease-ui
  suave: [0.22, 1, 0.36, 1], // --ease-soft
  acento: [0.34, 1.24, 0.64, 1], // --ease-accent
};

// Los rebotes de respuesta (el visto de la contrasena, el numero de la
// canasta): muelles cortos, que se asientan en unos 200 ms.
const RESORTE = {
  rebote: { type: 'spring', stiffness: 640, damping: 17, mass: 0.7 },
  salto: { type: 'spring', stiffness: 520, damping: 26, mass: 0.6 },
  // La pastilla que viaja de una opcion a otra (Filtrar por, Ordenar por):
  // unos 250 ms y casi sin rebote.
  pastilla: { type: 'spring', duration: 0.25, bounce: 0.08 },
};

// Al pulsar, botones y fichas bajan un poco (respuesta).
const PULSAR = { scale: 0.97, transition: { duration: DURACION.micro, ease: CURVA.ui } };

// Lo mismo para element.animate(), que quiere milisegundos y la curva en texto.
const ms = (segundos) => Math.round(segundos * 1000);
const curvaCss = ([x1, y1, x2, y2]) => `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;

export { DURACION, CURVA, RESORTE, PULSAR, ms, curvaCss };
