// Si la persona pidio menos movimiento al sistema. Es lo mismo que la
// constante reducedMotion de js/comun/ui.js, pero como hook: si cambia el
// ajuste con la pagina abierta, lo que dependa de el se vuelve a pintar.
import { useSyncExternalStore } from 'react';

const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
const suscribir = (avisar) => {
  consulta.addEventListener('change', avisar);
  return () => consulta.removeEventListener('change', avisar);
};
const leer = () => consulta.matches;

// Para leerlo dentro de un temporizador o un manejador sin suscribirse: ahi
// solo importa lo que valga en ese momento.
const movimientoReducido = leer;

function useMovimientoReducido() {
  return useSyncExternalStore(suscribir, leer);
}

export { useMovimientoReducido, movimientoReducido };
