// Los avisos del local que vienen de Firestore (servicios/firestore.js),
// bajo el horario de Contactanos: ahi es donde se busca si hoy se abre
// distinto. Si no hay avisos, o Firestore no contesta, no se pinta nada.
import { useEffect, useState } from 'react';
import { leerAvisos } from '../servicios/firestore.js';

function AvisosDelLocal() {
  const [avisos, setAvisos] = useState([]);
  useEffect(() => {
    let vigente = true;
    leerAvisos().then((lista) => { if (vigente) setAvisos(lista); });
    return () => { vigente = false; };
  }, []);
  if (!avisos.length) return null;
  return (
    // Una nota del horario (role="note"), no una region aparte: un <aside>
    // aqui quedaria dentro de la seccion de Contactanos, y axe lo marca.
    <div className="avisos-local" role="note" aria-labelledby="avisos-local-titulo">
      <h3 id="avisos-local-titulo" className="avisos-local-titulo">Avisos del local</h3>
      <ul className="avisos-local-lista">
        {avisos.map((a) => <li key={a.id}>{a.texto}</li>)}
      </ul>
    </div>
  );
}

export default AvisosDelLocal;
