// ---- #/ : el inicio -------------------------------------------------------
// La portada (el h1 es su titular, con la cabecera de periodico encima) y la
// cinta de categorias con las categorias, y nada mas: sin carrusel (seccion 4 del
// plan). A la tienda se llega con "Nuestros panes", la cinta o el menu.
import { useRef } from 'react';
import { useVista } from '../comun/useVista.js';
import Hero from '../catalogo/Hero.jsx';
import Cinta from '../catalogo/Cinta.jsx';

function Inicio() {
  const tituloRef = useRef(null);
  useVista('El Tradicional | Panadería & Pastelería', tituloRef);
  return (
    <div className="vista vista-inicio">
      <Hero tituloRef={tituloRef} />
      <Cinta />
    </div>
  );
}

export default Inicio;
