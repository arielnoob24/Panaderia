// ---- "Agregar se nota aunque sea rapido" (S1, seccion 4 del plan) -----------
// Dos movimientos del control de cantidad de la ficha, que son aspecto y no
// logica, y por eso viven aqui y no en pedido/:
//
// - soltarGolpe: cada toque del + o del - suelta un "+1" (o "−1") que sube
//   desde el boton y se desvanece. Va por el DOM y no por estado, como la
//   foto que vuela a la canasta: con prisa salen varios a la vez y cada uno
//   se borra solo al acabar. Es aria-hidden: lo que paso ya lo anuncia el
//   control ("Pan redondo añadido...").
// - useNumeroQueEntra: el numero de la ficha entra deslizandose cada vez que
//   cambia, desde abajo si crecio y desde arriba si bajo, como el de la
//   canasta. No mientras se escribe en el: ahi el numero es de quien teclea.
//
// Con menos movimiento no sale ninguno de los dos.
import { useEffect, useRef } from 'react';
import { CURVA, DURACION, curvaCss, ms } from './movimiento.js';
import { movimientoReducido } from './useMovimientoReducido.js';

// Lo que sube el "+1" antes de desaparecer, y cuanto se aparta de lado como
// mucho: si salen varios seguidos, no se tapan del todo.
const SUBIDA = 46;
const DE_LADO = 14;

function soltarGolpe(contenedor, texto) {
  if (!contenedor || movimientoReducido()) return;
  const golpe = document.createElement('span');
  golpe.className = 'card-golpe';
  golpe.textContent = texto;
  golpe.style.right = `${Math.round(Math.random() * DE_LADO)}px`;
  contenedor.append(golpe);
  const vuelo = golpe.animate([
    { opacity: 1, transform: 'translateY(0) scale(.9)' },
    { opacity: 0, transform: `translateY(-${SUBIDA}px) scale(1.15)` },
  ], { duration: ms(DURACION.editorial), easing: curvaCss(CURVA.suave), fill: 'forwards' });
  vuelo.onfinish = () => golpe.remove();
  vuelo.oncancel = () => golpe.remove();
}

// campoRef es el numero (un campo de texto) y n la cantidad que ensena.
function useNumeroQueEntra(campoRef, n) {
  const antes = useRef(n);
  useEffect(() => {
    const era = antes.current;
    antes.current = n;
    // De 0 a algo el numero ya entra con el control que se estira (CSS), y
    // a 0 el campo se esconde.
    if (era === n || !era || !n) return;
    const campo = campoRef.current;
    if (!campo || document.activeElement === campo || movimientoReducido()) return;
    campo.animate([
      { opacity: 0, transform: `translateY(${n > era ? 60 : -60}%)` },
      { opacity: 1, transform: 'none' },
    ], { duration: ms(DURACION.rapida), easing: curvaCss(CURVA.salida) });
  }, [campoRef, n]);
}

export { soltarGolpe, useNumeroQueEntra };
