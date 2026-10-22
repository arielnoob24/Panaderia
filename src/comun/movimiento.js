// ---- El ritmo del movimiento (seccion 10 del plan) ------------------------
// Las duraciones y curvas de Motion y de element.animate() salen de aqui, con
// los mismos valores que :root de styles.css (--dur-*, --ease-*): si cambia
// uno, cambia el otro. Ningun componente escribe las suyas a mano.
//
// Dos clases y nada fuera de ellas:
//   respuesta a un toque (boton pulsado, contador, visto, errores): micro y rapida
//   escena (cambio de vista, pasos, desplegar, la canasta, el carrusel): base en adelante
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
};

// Al pulsar, botones y fichas bajan un poco (respuesta).
const PULSAR = { scale: 0.97, transition: { duration: DURACION.micro, ease: CURVA.ui } };

// Lo mismo para element.animate(), que quiere milisegundos y la curva en texto.
const ms = (segundos) => Math.round(segundos * 1000);
const curvaCss = ([x1, y1, x2, y2]) => `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;

// La curva como funcion de 0 a 1, para lo que se mueve a mano cuadro a
// cuadro (el carrusel, useFila.js). Se busca el t de la x por biseccion:
// veinte vueltas sobran para una precision por debajo del pixel.
function curvaFuncion([x1, y1, x2, y2]) {
  const punto = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let bajo = 0;
    let alto = 1;
    let t = x;
    for (let i = 0; i < 20; i += 1) {
      t = (bajo + alto) / 2;
      if (punto(t, x1, x2) < x) bajo = t;
      else alto = t;
    }
    return punto(t, y1, y2);
  };
}

export { DURACION, CURVA, RESORTE, PULSAR, ms, curvaCss, curvaFuncion };
