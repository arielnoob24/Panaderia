// Confirmar el pedido y pagar (#/confirmar). Solo se entra con una cuenta con
// el correo verificado y algo en la canasta; si no, a la portada sin dejar
// rastro en Atras (seccion 15 del plan, fase 4). Se mira al entrar y no
// despues: si estando aqui se vacia la canasta (la gaveta se abre encima con
// "Editar la canasta"), la vista se queda y el boton dice que no hay nada que
// confirmar, como en el sitio actual; deshacer lo devuelve.
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { useSesion } from '../estado/SesionProvider.jsx';
import FormularioPedido from './FormularioPedido.jsx';

function Confirmar() {
  const { lineas } = usePedido();
  const { puedePedir } = useSesion();
  const [puedeEntrar] = useState(() => puedePedir && lineas.length > 0);
  // Si es la direccion con que se abrio la pagina, el foco no se mueve: lo
  // sabe useVista (comun/apertura.js).
  if (!puedeEntrar) return <Navigate to="/" replace />;
  return <FormularioPedido />;
}

export default Confirmar;
