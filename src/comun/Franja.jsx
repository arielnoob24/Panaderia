// La franja de las espigas, en corteza, al final de Nosotros, Contacto y la
// tienda (className "franja-pie"): es la parte de acento del 60-30-10
// de esas vistas. En #/ la sustituye la cinta de categorias (Cinta.jsx,
// seccion 10 del plan); las demas vistas cambian en la segunda vuelta del
// estilo. Es adorno: el lector de pantalla se la salta.
import { Trigo } from './iconos.jsx';

function Franja({ className = '' }) {
  return (
    <div className={`sign-band ${className}`.trim()} aria-hidden="true">
      <div className="container sign-band-inner"><Trigo /><Trigo derecha /></div>
    </div>
  );
}

export default Franja;
