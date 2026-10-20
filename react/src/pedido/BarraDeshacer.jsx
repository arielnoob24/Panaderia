// La barra de deshacer. Vive fuera del panel porque se quita desde los dos
// sitios, la ficha y la canasta; va por encima del panel para verse en ambos
// casos, y el cerco del foco del panel la cuenta como anexo para que el
// tabulador la alcance. Se va sola a los 12 s (seccion 5 del plan).
import { useEffect } from 'react';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { textoBorrado } from '../estado/pedido.js';
import { useCanasta } from './CanastaProvider.jsx';

const ESPERA_DESHACER = 12000;

function BarraDeshacer() {
  const { borrado } = usePedido();
  const { barraRef, deshacerRef, deshacer, olvidar } = useCanasta();

  // Cada borrado es un objeto nuevo, asi que quitar otra cosa reinicia la cuenta.
  useEffect(() => {
    if (!borrado) return undefined;
    const reloj = setTimeout(() => olvidar(borrado), ESPERA_DESHACER);
    return () => clearTimeout(reloj);
  }, [borrado, olvidar]);

  return (
    <div ref={barraRef} className="deshacer-barra" hidden={!borrado}>
      <p className="deshacer-texto">{textoBorrado(borrado)}</p>
      <button ref={deshacerRef} className="deshacer-boton" type="button" onClick={() => deshacer(borrado)}>Deshacer</button>
    </div>
  );
}

export default BarraDeshacer;
