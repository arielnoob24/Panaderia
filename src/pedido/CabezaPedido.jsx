// La cabeza de #/confirmar y #/comprobante: "Volver a la tienda" y el titulo
// de la vista, que es su h1.
import { Chevron } from '../comun/iconos.jsx';

function CabezaPedido({ titulo, tituloRef, onVolver }) {
  return (
    <div className="vista-cabeza checkout-cabeza">
      <button className="vista-volver checkout-volver" type="button" onClick={onVolver}>
        <Chevron izquierda />Volver a la tienda
      </button>
      <h1 ref={tituloRef} className="vista-titulo checkout-titulo" tabIndex={-1}>{titulo}</h1>
    </div>
  );
}

export default CabezaPedido;
