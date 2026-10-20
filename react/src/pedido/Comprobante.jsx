// El comprobante del pedido pagado (#/comprobante). Se llega con replace,
// para que Atras no vuelva al pago ya hecho. Sin recibo (se recargo, o se
// vuelve con Adelante a un comprobante ya cerrado) no hay nada que ensenar:
// a la portada, como hace cart.js con un comprobante sin numero.
import { Navigate } from 'react-router-dom';
import { usePedido } from '../estado/PedidoProvider.jsx';
import Recibo from './Recibo.jsx';

function Comprobante() {
  const { recibo } = usePedido();
  if (!recibo) return <Navigate to="/" replace />;
  return <Recibo recibo={recibo} />;
}

export default Comprobante;
