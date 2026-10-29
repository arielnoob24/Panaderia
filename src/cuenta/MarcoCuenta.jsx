// Lo que comparten las vistas de la cuenta (#/cuenta/*): como las demas
// vistas, el titulo de la pestana propio, arriba del todo al llegar y el foco
// en su h1, que el lector de pantalla lee y asi dice donde se ha llegado
// (useVista). Las clases son para frontend, que hace la maquetacion: la caja
// de la vista lleva cuenta-vista y cuenta-vista-<paso>.
//
// La maquetacion (cuenta.css): el titulo va sobre el fondo claro de la pagina,
// con un filete de ambar debajo, y el formulario es una hoja de papel.
import { useRef } from 'react';
import { useVista } from '../comun/useVista.js';
import '../estilos/cuenta.css';

function MarcoCuenta({ paso, titulo, pestana, children }) {
  const tituloRef = useRef(null);
  useVista(`${pestana || titulo} | El Tradicional`, tituloRef);
  return (
    <div className={`vista cuenta-vista cuenta-vista-${paso}`}>
      <section className="cuenta-vista-caja container" aria-labelledby="cuenta-vista-titulo">
        <div className="cuenta-vista-banda">
          <h1 ref={tituloRef} id="cuenta-vista-titulo" className="cuenta-vista-titulo" tabIndex={-1}>{titulo}</h1>
        </div>
        {children}
      </section>
    </div>
  );
}

export default MarcoCuenta;
