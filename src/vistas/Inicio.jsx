// ---- #/ : el inicio -------------------------------------------------------
// La portada (el h1 es su titular, con la cabecera de periodico encima), la
// cinta cobriza con las categorias y, debajo, "Los mas pedidos" del
// mostrador. Aqui si se baja un poco: es a proposito, el resto de la pagina
// vive en sus vistas.
import { useRef } from 'react';
import { useVista } from '../comun/useVista.js';
import Hero from '../catalogo/Hero.jsx';
import Cinta from '../catalogo/Cinta.jsx';
import MasPedidos from '../catalogo/MasPedidos.jsx';

function Inicio() {
  const tituloRef = useRef(null);
  useVista('El Tradicional | Panadería & Pastelería', tituloRef);
  return (
    <div className="vista vista-inicio">
      <Hero tituloRef={tituloRef} />
      <Cinta />
      <MasPedidos />
    </div>
  );
}

export default Inicio;
