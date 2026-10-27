// Lo que comparten las vistas de la cuenta (#/cuenta/*): como las demas
// vistas, el titulo de la pestana propio, arriba del todo al llegar y el foco
// en su h1, que el lector de pantalla lee y asi dice donde se ha llegado
// (useVista). Las clases son para frontend, que hace la maquetacion: la caja
// de la vista lleva cuenta-vista y cuenta-vista-<paso>.
//
// La maquetacion (cuenta.css): el titulo va en una banda de horno con los
// dibujos de trigo detras, y el formulario es una hoja de papel que cuelga
// de ella. La banda lleva
// banda-oscura para que la cabecera pegada se de la vuelta al pasar encima.
import { useRef } from 'react';
import { useVista } from '../comun/useVista.js';
import FondoDibujo from '../comun/FondoDibujo.jsx';
import Franja from '../comun/Franja.jsx';
import '../estilos/cuenta.css';

function MarcoCuenta({ paso, titulo, pestana, children }) {
  const tituloRef = useRef(null);
  useVista(`${pestana || titulo} | El Tradicional`, tituloRef);
  return (
    <div className={`vista cuenta-vista cuenta-vista-${paso}`}>
      <section className="cuenta-vista-caja container" aria-labelledby="cuenta-vista-titulo">
        <div className="cuenta-vista-banda banda-oscura con-fondo">
          <FondoDibujo vista={`cuenta-${paso}`} />
          <h1 ref={tituloRef} id="cuenta-vista-titulo" className="cuenta-vista-titulo" tabIndex={-1}>{titulo}</h1>
        </div>
        {children}
      </section>
      <Franja className="franja-pie" />
    </div>
  );
}

export default MarcoCuenta;
