// "Tu pedido se guardo hoy a las 14:05 en este navegador.", al final del pie.
// Va en el pie y no en la canasta: no es parte del pedido, es una nota sobre
// lo que el sitio tiene apuntado de ti. Sin nada guardado no dice nada, y con
// la canasta vacia tampoco: no hay pedido del que hablar.
// La fecha es la de la cookie (marcaBonita de js/comun/storage.js).
import { marcaBonita } from '@raiz/js/comun/storage.js';
import { usePedido } from '../estado/PedidoProvider.jsx';

function GuardadoPie() {
  const { guardadoEn, lineas } = usePedido();
  const cuando = lineas.length ? marcaBonita(guardadoEn) : '';
  return (
    <p className="footer-guardado" hidden={!cuando}>
      {cuando ? `Tu pedido se guardó ${cuando} en este navegador.` : ''}
    </p>
  );
}

export default GuardadoPie;
