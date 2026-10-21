// "Abierto · cierra 20:00" o "Cerrado · abre 08:00", con su punto. Lo calcula
// servicios/horario.js, las cuentas del sitio presentado, y se pone al dia cada minuto
// (useHorario). Va en el pie de todas las vistas y en #/contacto; la
// insignia esta hecha para fondo oscuro (styles.css).
import { estadoDelPie } from '../servicios/horario.js';
import { useHorario } from './useHorario.js';

function EstadoAbierto() {
  const horario = useHorario();
  const abierto = horario.abierto;
  return (
    <span className={abierto ? 'open-label' : 'open-label is-closed'}>
      <span className={abierto ? 'status-dot' : 'status-dot is-closed'}></span>
      {` ${estadoDelPie(horario)}`}
    </span>
  );
}

export default EstadoAbierto;
