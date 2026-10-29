// ---- La portada de #/ (seccion 10 del plan, "Estilo") -----------------------
// Debajo de la barra, la cabecera de periodico con la fecha y si esta
// abierto; luego dos columnas: a la izquierda el rotulo, el titular, la frase
// y los dos caminos ("Nuestros panes" y "Como llegar"); a la derecha la foto
// en arco con su pie y el sello de la casa.
//
// La entrada es una sola escena, en CSS (vistas.css, .sube-en-orden, .arco y
// .sello): el texto sube pieza a pieza, la foto se descubre de abajo arriba
// cuando ya llego y el sello cae girando. Con menos movimiento todo esta
// quieto desde el principio. El sello no gira con el desplazamiento: solo un
// poco con el raton encima (marea a quien lo mira bajar).
//
// El rotulo con la espiga, el titular, la frase, el enlace con la ola, la
// foto en arco y el sello son las mismas piezas que usa #/nosotros
// (seccion 10, "Nosotros con el estilo de la portada").
import { Link } from 'react-router-dom';
import heroChica from '/assets/img/hero-900.jpg';
import heroGrande from '/assets/img/hero-1600.jpg';
import { IconoHogaza, IconoTrigo } from '../comun/iconos.jsx';
import FondoDibujo from '../comun/FondoDibujo.jsx';
import FotoEnArco from '../comun/FotoEnArco.jsx';
import EnlaceLlegar from '../comun/EnlaceLlegar.jsx';
import CabeceraPeriodico from './CabeceraPeriodico.jsx';

// El titular es el h1 de la vista de inicio: tituloRef es donde va el foco al
// llegar (comun/useVista.js).
function Hero({ tituloRef }) {
  return (
    <section id="inicio" className="portada con-fondo">
      <FondoDibujo vista="inicio" />
      <div className="container">
        <CabeceraPeriodico />
        <div className="portada-rejilla">
          <div className="portada-texto sube-en-orden">
            <p className="rotulo rotulo-espiga portada-rotulo"><IconoTrigo />Horneado cada mañana</p>
            <h1 ref={tituloRef} className="titular" tabIndex={-1}>El sabor{' '}<em>de siempre</em></h1>
            <p className="frase portada-frase">Pan recién horneado, todos los días.</p>
            <div className="portada-acciones">
              {/* Lleva al catalogo entero: quien pulsa aqui quiere verlo todo. */}
              <Link className="button button-yellow portada-panes" to="/tienda-catalogo" state={{ entrar: true }}>
                <IconoHogaza clase="ico" />
                Nuestros panes
              </Link>
              {/* El camino secundario es un enlace, no un boton (L1, seccion
                  10): con el puntero sus letras saltan en ola, y se sigue
                  llamando "Cómo llegar". */}
              <EnlaceLlegar className="portada-llegar">Cómo llegar</EnlaceLlegar>
            </div>
          </div>
          {/* La misma foto y los mismos tamanos que pide ya el preload de
              index.html: no se baja dos veces. */}
          <FotoEnArco
            className="portada-foto"
            arcoClase="portada-arco"
            selloClase="portada-sello"
            pie="Miga abierta, corteza tostada"
            sello="Hecho a mano · Pan de la casa · "
            src={heroChica}
            srcSet={`${heroChica} 1x, ${heroGrande} 2x`}
            alt="Pan de masa madre recién cortado sobre papel de hornear, con luz natural y fondo crema"
            width="900"
            height="1200"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
