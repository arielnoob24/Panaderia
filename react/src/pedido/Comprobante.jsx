// El comprobante del pedido pagado (#/comprobante). Se llega con replace,
// para que Atras no vuelva al pago ya hecho. Fase 1: solo la ruta; el
// contenido llega en la fase 4. Le toca a logica-datos.
import { Link } from 'react-router-dom';

function Comprobante() {
  return (
    <section id="comprobante" className="section-pad">
      <div className="container">
        <h2>Comprobante</h2>
        <p>Esta vista se arma en la fase 4.</p>
        <p><Link to="/">Volver a la portada</Link></p>
      </div>
    </section>
  );
}

export default Comprobante;
