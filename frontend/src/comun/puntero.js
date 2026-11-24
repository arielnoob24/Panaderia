// ---- Hay raton o no --------------------------------------------------------
// Los efectos de pasar por encima (la ficha que sube, el boton que se levanta)
// van en styles.css bajo html.con-puntero, y no bajo una media query: en el
// portatil tactil del usuario (hover: hover) daba falso y nunca los veia, y
// (any-hover: hover) depende de lo que el navegador crea que hay conectado,
// que no se puede comprobar desde aqui. Lo que si se sabe es con que llega
// cada evento: un raton o un lapiz que se mueven encienden la clase, y un
// dedo que toca la apaga, para que en el telefono no se quede pegado el
// efecto de lo ultimo tocado.
const CLASE = 'con-puntero';

function vigilarPuntero() {
  const raiz = document.documentElement;
  const mirar = (e) => {
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') raiz.classList.add(CLASE);
    else if (e.pointerType === 'touch') raiz.classList.remove(CLASE);
  };
  // pointerover llega tambien sin mover (el raton ya estaba encima al cargar);
  // pointerdown, antes de que el dedo pinte nada.
  const opciones = { passive: true, capture: true };
  window.addEventListener('pointermove', mirar, opciones);
  window.addEventListener('pointerover', mirar, opciones);
  window.addEventListener('pointerdown', mirar, opciones);
}

export { vigilarPuntero };
