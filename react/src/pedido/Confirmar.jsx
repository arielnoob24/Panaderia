// Confirmar el pedido y pagar (#/confirmar). Fase 1: solo la ruta; el
// contenido llega en la fase 4. Le toca a logica-datos.
import { Link } from 'react-router-dom';

function Confirmar() {
  return (
    <section id="confirmar" className="section-pad">
      <div className="container">
        <h2>Confirmar el pedido</h2>
        <p>Esta vista se arma en la fase 4.</p>
        <p><Link to="/">Volver a la portada</Link></p>
      </div>
    </section>
  );
}

export default Confirmar;
