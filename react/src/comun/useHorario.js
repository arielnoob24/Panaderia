// El horario de hoy, al dia cada minuto, como hacia el setInterval de
// js/app.js. Lo usan la nota del horno y el pie: con un solo reloj para los
// dos, y no uno por cada sitio que lo pinta.
// Las cuentas (feriados, Pascua, que texto toca) son las de servicios/horario.js,
// las mismas del sitio actual.
import { useSyncExternalStore } from 'react';
import { horarioDeHoy } from '../servicios/horario.js';

const CADA = 60000;
let horario = horarioDeHoy();
const oyentes = new Set();
let reloj = null;

const suscribir = (avisar) => {
  oyentes.add(avisar);
  if (!reloj) {
    // Al volver a suscribirse despues de un rato sin nadie, lo guardado puede
    // ser de otra hora: se recalcula antes de arrancar.
    horario = horarioDeHoy();
    reloj = setInterval(() => {
      horario = horarioDeHoy();
      oyentes.forEach((f) => f());
    }, CADA);
  }
  return () => {
    oyentes.delete(avisar);
    if (!oyentes.size) { clearInterval(reloj); reloj = null; }
  };
};
const leer = () => horario;

function useHorario() {
  return useSyncExternalStore(suscribir, leer);
}

export { useHorario };
