// La pagina de siempre: portada, franja, catalogo e historia. Es la misma para
// #/ y para las vistas de catalogo (#/tienda-catalogo, #/tienda-<categoria>):
// como en el sitio actual, la vista no es otra pagina sino el catalogo solo,
// con la portada y la historia apartadas por body.is-vista (styles.css). Asi
// las fichas son las mismas al ir y volver, y no se vuelven a montar.
import { Navigate, useLocation } from 'react-router-dom';
import { useAparecer } from '../comun/useAparecer.js';
import { Trigo } from '../comun/iconos.jsx';
import Hero from './Hero.jsx';
import Catalogo from './Catalogo.jsx';
import Historia from './Historia.jsx';
import { categoriaDeRuta } from './categorias.js';
import { SECCIONES } from '../comun/secciones.js';

// La franja de las espigas: es adorno, y el lector de pantalla se la salta.
function Franja() {
  const aparecer = useAparecer('reveal-band');
  return (
    <section ref={aparecer.ref} className={`sign-band ${aparecer.className}`} data-motion={aparecer['data-motion']} aria-hidden="true">
      <div className="container sign-band-inner"><Trigo /><Trigo derecha /></div>
    </section>
  );
}

function Portada() {
  const { pathname } = useLocation();
  const categoria = categoriaDeRuta(pathname);
  if (!categoria) {
    // #historia, #visitanos... abiertos tal cual: React Router los lee como
    // #/historia. No son rutas, pero se va a la portada y se baja a la seccion
    // (Catalogo.jsx), como hacia el salto de ancla del sitio actual.
    const seccion = pathname.slice(1);
    if (SECCIONES.includes(seccion)) return <Navigate to="/" replace state={{ seccion, alAbrir: true }} />;
    // Lo demas vuelve a la portada, sin dejar rastro en Atras.
    return <Navigate to="/" replace />;
  }
  return (
    <>
      <Hero />
      <Franja />
      <Catalogo categoria={categoria} />
      <Historia />
    </>
  );
}

export default Portada;
