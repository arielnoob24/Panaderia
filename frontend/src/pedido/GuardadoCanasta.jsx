// "Tu pedido se guardo hoy a las 14:05 en este navegador.", en la canasta,
// bajo "Ir a pagar" (el sitio no tiene pie, seccion 4 del plan). Va aparte
// del pedido, con letra de nota: no es parte de lo que se compra, es algo
// que el sitio tiene apuntado de ti. Sin nada guardado no dice nada, y con
// la canasta vacia tampoco: no hay pedido del que hablar.
// La fecha es la de la cookie (marcaBonita de servicios/storage.js).
import { marcaBonita } from '../servicios/storage.js';
import { usePedido } from '../estado/PedidoProvider.jsx';

function GuardadoCanasta() {
  const { guardadoEn, lineas } = usePedido();
  const cuando = lineas.length ? marcaBonita(guardadoEn) : '';
  return (
    <p className="canasta-guardado" hidden={!cuando}>
      {cuando ? `Tu pedido se guardó ${cuando} en este navegador.` : ''}
    </p>
  );
}

export default GuardadoCanasta;
