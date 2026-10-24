// ---- La portada de #/ (seccion 10 del plan, "Estilo") -----------------------
// Debajo de la barra, la cabecera de periodico con la fecha y si esta
// abierto; luego dos columnas: a la izquierda el rotulo, el titular, la frase
// y los dos caminos ("Nuestros panes" y "Como llegar"); a la derecha la foto
// en arco con su pie y el sello de la casa.
//
// La entrada es una sola escena, en CSS (styles.css, .portada): el texto sube
// pieza a pieza, la foto se descubre de abajo arriba cuando ya llego y el
// sello cae girando. Con menos movimiento todo esta quieto desde el
// principio. El sello no gira con el desplazamiento: solo un poco con el
// raton encima (marea a quien lo mira bajar).
import { Link } from 'react-router-dom';
import heroChica from '/assets/img/hero-900.jpg';
import heroGrande from '/assets/img/hero-1600.jpg';
import { useCargaImagen, clases } from '../comun/useCargaImagen.js';
import { IconoHogaza, IconoPin, IconoTrigo } from '../comun/iconos.jsx';
import FondoDibujo from '../comun/FondoDibujo.jsx';
import TextoOla from '../comun/TextoOla.jsx';
import CabeceraPeriodico from './CabeceraPeriodico.jsx';

// El sello es dibujo: lo que dice ya lo dicen el titular y la foto. Va fuera
// del componente porque no cambia nunca (y asi no se rehace al repintar).
const SELLO = (
  <div className="portada-sello" aria-hidden="true">
    <svg viewBox="0 0 150 150" focusable="false">
      <defs><path id="portada-sello-aro" d="M75,75 m-56,0 a56,56 0 1,1 112,0 a56,56 0 1,1 -112,0" /></defs>
      <circle cx="75" cy="75" r="72" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="75" cy="75" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
      <text className="portada-sello-aro"><textPath href="#portada-sello-aro">Hecho a mano · Pan de la casa · </textPath></text>
      <text className="portada-sello-centro" x="75" y="84" textAnchor="middle">✦</text>
    </svg>
  </div>
);

// El titular es el h1 de la vista de inicio: tituloRef es donde va el foco al
// llegar (comun/useVista.js).
function Hero({ tituloRef }) {
  const carga = useCargaImagen();
  return (
    <section id="inicio" className="portada con-fondo">
      <FondoDibujo vista="inicio" />
      <div className="container">
        <CabeceraPeriodico />
        <div className="portada-rejilla">
          <div className="portada-texto">
            <p className="rotulo portada-rotulo"><IconoTrigo />Horneado cada mañana</p>
            <h1 ref={tituloRef} tabIndex={-1}>El sabor{' '}<em>de siempre</em></h1>
            <p className="portada-frase">Pan recién horneado, todos los días.</p>
            <div className="portada-acciones">
              {/* Lleva al catalogo entero: quien pulsa aqui quiere verlo todo. */}
              <Link className="button button-yellow" to="/tienda-catalogo" state={{ entrar: true }}>
                <IconoHogaza clase="ico" />
                Nuestros panes
              </Link>
              {/* El camino secundario es un enlace, no un boton (L1, seccion
                  10): con el puntero sus letras saltan en ola, y se sigue
                  llamando "Cómo llegar". */}
              <Link className="portada-llegar" to="/contacto" state={{ entrar: true }}>
                <IconoPin clase="ico" grosor="1.8" />
                <TextoOla>Cómo llegar</TextoOla>
              </Link>
            </div>
          </div>
          <div className="portada-foto">
            <figure>
              <div className={clases('portada-arco', carga.hueco)}>
                {/* La misma foto y los mismos tamanos que pide ya el preload
                    de index.html: no se baja dos veces. */}
                <img
                  src={heroChica}
                  srcSet={`${heroChica} 1x, ${heroGrande} 2x`}
                  alt="Pan de masa madre recién cortado sobre papel de hornear, con luz natural y fondo crema"
                  width="900"
                  height="1200"
                  fetchPriority="high"
                  {...carga.imagen}
                />
              </div>
              <figcaption>Miga abierta, corteza tostada</figcaption>
            </figure>
            {SELLO}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
