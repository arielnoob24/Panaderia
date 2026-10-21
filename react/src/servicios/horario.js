// ---- El horario y los feriados ----------------------------------------
// Cuando abre la panaderia, si hoy es feriado y que hay que decir en el pie y
// en la nota del horno. No toca la pagina: son cuentas con la fecha, y los
// componentes (el pie, la nota del horno, el retiro) solo pintan lo que sale.
// Es js/comun/horario.js del sitio presentado, movido tal cual (fase 7).

const easterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};
const dateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
const holidayKeys = (year) => {
  const easter = easterSunday(year);
  const carnival = new Date(easter);
  carnival.setDate(easter.getDate() - 48);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  return new Set([
    `${year}-1-1`, `${year}-5-1`, `${year}-8-10`, `${year}-10-9`, `${year}-11-2`, `${year}-11-3`, `${year}-12-25`,
    dateKey(carnival), dateKey(new Date(carnival.getFullYear(), carnival.getMonth(), carnival.getDate() + 1)), dateKey(goodFriday)
  ]);
};
const toMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};
// El horario de hoy, en un solo sitio. Antes se calculaba dentro de
// updateOpeningStatus y no habia manera de preguntarselo desde fuera; la
// canasta lo necesita para decir hasta que hora se puede pasar a retirar, que
// es lo unico con forma de tiempo que este sitio puede afirmar sin inventarlo.
const horarioDeHoy = () => {
  const now = new Date();
  const day = now.getDay();
  const festivo = holidayKeys(now.getFullYear()).has(dateKey(now));
  const hours = day >= 1 && day <= 5 ? '08:00-20:00' : '09:00-21:00';
  const [abre, cierra] = hours.split('-');
  const ahora = now.getHours() * 60 + now.getMinutes();
  return {
    day,
    festivo,
    abre,
    cierra,
    abierto: !festivo && ahora >= toMinutes(abre) && ahora < toMinutes(cierra),
    antesDeAbrir: ahora < toMinutes(abre),
  };
};

// Google y Yelp muestran el estado con la hora, no solo "abierto": es el dato
// que responde la pregunta real, "¿me da tiempo a ir?".
const estadoDelPie = ({ festivo, abierto, antesDeAbrir, abre, cierra }) => {
  if (festivo) return 'Cerrado · día festivo';
  if (abierto) return `Abierto · cierra ${cierra}`;
  if (antesDeAbrir) return `Cerrado · abre ${abre}`;
  return 'Cerrado · abre mañana';
};

// La nota del hero decia "Recien salido del horno · Sale a las 17:00" en
// texto fijo, con un punto de estado al lado que latia en ambar a cualquier
// hora. Era el sitio afirmando un dato que no tenia, al lado de un horario que
// si se calcula. Ahora las dos cosas salen del mismo calculo.
const notaDelHorno = ({ festivo, abierto, antesDeAbrir, abre, cierra }) => {
  if (abierto) return { titulo: 'Horneando ahora mismo', dato: `Abierto hasta las ${cierra}` };
  if (festivo) return { titulo: 'Hoy no horneamos', dato: 'Día festivo · volvemos mañana' };
  if (antesDeAbrir) return { titulo: 'El horno se está calentando', dato: `Abrimos a las ${abre}` };
  return { titulo: 'Ya cerramos por hoy', dato: `Mañana abrimos a las ${abre}` };
};

// Hasta que hora se puede pasar a retirar, en la pantalla de confirmar. Es lo
// unico con forma de tiempo que el sitio puede afirmar: no tiene cola de horno
// ni reparto que consultar, y un "listo en 20 minutos" seria inventado.
const textoRetiro = ({ festivo, abierto, antesDeAbrir, abre, cierra }) => {
  if (festivo) return 'Hoy no horneamos: es día festivo.';
  if (abierto) return `Puedes retirarlo hoy hasta las ${cierra}.`;
  if (antesDeAbrir) return `Hoy abrimos a las ${abre}.`;
  return 'Hoy ya cerramos.';
};

export { horarioDeHoy, estadoDelPie, notaDelHorno, textoRetiro };
