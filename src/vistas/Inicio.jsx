// ---- #/ : el inicio -------------------------------------------------------
// La portada (el h1 es su titular), la franja de las espigas y, debajo, "Los
// mas pedidos" en el mostrador. Aqui si se baja un poco: es a proposito, el
// resto de la pagina vive en sus vistas.
import { useRef } from 'react';
import Franja from '../comun/Franja.jsx';
import { useVista } from '../comun/useVista.js';
import Hero from '../catalogo/Hero.jsx';
import MasPedidos from '../catalogo/MasPedidos.jsx';

function Inicio() {
  const tituloRef = useRef(null);
  useVista('El Tradicional | Panadería & Pastelería', tituloRef);
  return (
    <div className="vista vista-inicio">
      <Hero tituloRef={tituloRef} />
      <Franja />
      <MasPedidos />
    </div>
  );
}

export default Inicio;
