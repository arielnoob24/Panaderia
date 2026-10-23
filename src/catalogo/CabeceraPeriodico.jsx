// ---- La cabecera de periodico de la portada (seccion 10 del plan) ---------
// La fecha de hoy, el nombre del oficio entre dos filetes dobles y si esta
// abierto. La fecha y el estado salen del mismo reloj que #/contacto
// (useHorario, que se pone al dia cada minuto), asi que a medianoche cambian
// los dos a la vez. En el telefono solo quedan la fecha y el estado (CSS).
import { useHorario } from '../comun/useHorario.js';

const FECHA = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });

// "Miércoles, 21 de octubre": Intl lo da en minuscula, como se escribe en
// medio de una frase; en la cabecera va al principio.
const hoyEnLetra = (fecha) => {
  const texto = FECHA.format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};
const hoyEnCifras = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

// Lo mismo que dice #/contacto, con las palabras de la cabecera.
const estadoDeHoy = ({ festivo, abierto, antesDeAbrir, abre, cierra }) => {
  if (festivo) return 'Cerrado · día festivo';
  if (abierto) return `Abierto · hasta las ${cierra}`;
  if (antesDeAbrir) return `Cerrado · abre a las ${abre}`;
  return 'Cerrado · abre mañana';
};

function CabeceraPeriodico() {
  const horario = useHorario();
  const hoy = new Date();
  return (
    <div className="periodico">
      <time className="rotulo periodico-fecha" dateTime={hoyEnCifras(hoy)}>{hoyEnLetra(hoy)}</time>
      <span className="periodico-doble" aria-hidden="true"></span>
      {/* El oficio repite la marca, que ya dice el logo: el lector se lo
          salta y no lee "Pastelería Cerrado..." de corrido. */}
      <span className="rotulo periodico-oficio" aria-hidden="true">Panadería &amp; Pastelería</span>
      <span className="periodico-doble" aria-hidden="true"></span>
      <span className="rotulo periodico-estado">
        <span className={horario.abierto ? 'status-dot' : 'status-dot is-closed'}></span>
        {estadoDeHoy(horario)}
      </span>
    </div>
  );
}

export default CabeceraPeriodico;
