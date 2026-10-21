// La franja de las espigas, en corteza. En #/ va debajo de la portada; en las
// demas vistas, encima del pie (className "franja-pie"), y es la parte de
// acento del 60-30-10 de esas vistas (seccion 15 del plan). Es adorno: el
// lector de pantalla se la salta.
import { Trigo } from './iconos.jsx';

function Franja({ className = '' }) {
  return (
    <div className={`sign-band ${className}`.trim()} aria-hidden="true">
      <div className="container sign-band-inner"><Trigo /><Trigo derecha /></div>
    </div>
  );
}

export default Franja;
