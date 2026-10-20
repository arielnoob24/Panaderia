// Lo que pasa al quedar dentro, se venga de entrar o de verificar el correo
// (entrarEnSesion() de js/cuenta/account.js):
//   - la direccion de la cuenta pasa al pedido si el pedido no tiene ninguna:
//     tener cuenta sirve para no volver a escribirla (lo escrito manda);
//   - si se venia de "Ir a pagar" y la canasta tiene algo, directo a
//     #/confirmar; si no, a Mis datos (#/cuenta). Con replace: Atras no
//     vuelve a un formulario ya hecho, igual que con el comprobante;
//   - se anuncia quien entro.
import { useLocation, useNavigate } from 'react-router-dom';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { vieneDePagar } from './Desvio.jsx';

function useTerminarEntrada() {
  const { lineas, entrega, hacer } = usePedido();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const location = useLocation();
  return ({ direccion }, aviso) => {
    if (direccion && !entrega.direccion) hacer({ tipo: 'entrega', campo: 'direccion', valor: direccion });
    navegar(vieneDePagar(location) && lineas.length ? '/confirmar' : '/cuenta', { replace: true });
    avisar(aviso);
  };
}

export { useTerminarEntrada };
