// "Nuestra manera" (#historia): la foto del amasado y los tres principios.
// Cada zona entra con su animacion, como las reparte motionMap en
// js/comun/ui.js: mascara para la foto, eje X para el texto y en secuencia
// los principios.
import fotoChica from '@raiz/assets/img/historia-amasado-430.jpg';
import fotoGrande from '@raiz/assets/img/historia-amasado-760.jpg';
import EnlaceSeccion from '../comun/EnlaceSeccion.jsx';
import { useAparecer } from '../comun/useAparecer.js';
import { useCargaImagen, clases } from '../comun/useCargaImagen.js';
import { IconoPin } from '../comun/iconos.jsx';

const icono = {
  className: 'principle-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: '1.4', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false',
};

function Historia() {
  const foto = useAparecer('reveal-mask');
  const texto = useAparecer('reveal-x');
  const principios = useAparecer('reveal-line');
  const carga = useCargaImagen();
  return (
    <section id="historia" className="story section-pad" tabIndex={-1}>
      <div className="container story-grid">
        <div ref={foto.ref} className={clases('story-photo', foto.className, carga.hueco)} data-motion={foto['data-motion']}>
          <img
            src={fotoChica}
            srcSet={`${fotoChica} 430w, ${fotoGrande} 760w`}
            sizes="(max-width: 680px) min(100vw - 32px, 420px), (max-width: 900px) 300px, 430px"
            alt="Un panadero bolea la masa sobre una mesa de madera enharinada, junto a un banneton, una cuchilla de greñar y un tarro de masa madre"
            loading="lazy"
            width="760"
            height="950"
            {...carga.imagen}
          />
          <span className="image-caption">Despacio sabe mejor</span>
        </div>
        <div ref={texto.ref} className={clases('story-copy', texto.className)} data-motion={texto['data-motion']}>
          <p className="eyebrow">Nuestra manera</p>
          <h2>El tiempo es<br /><em>nuestro ingrediente</em></h2>
          <p className="lead">No hacemos pan rápido. Hacemos pan que vale la espera.</p>
          <p>Cada madrugada, nuestro equipo llega cuando la ciudad todavía duerme</p>
          <div ref={principios.ref} className={clases('principles', principios.className)} data-motion={principios['data-motion']}>
            <div>
              <span className="principle-mark">
                <svg {...icono}><path d="M9 2.6h6" /><path d="M9.6 2.6v2.8L8.1 7.1A3 3 0 0 0 7.1 9.4V19a2.4 2.4 0 0 0 2.4 2.4h5A2.4 2.4 0 0 0 16.9 19V9.4a3 3 0 0 0-1-2.3l-1.5-1.7V2.6" /><path d="M7.1 13h9.8" /><circle cx="10.2" cy="16.2" r="1" /><circle cx="13.6" cy="17.8" r=".75" /></svg>
                <span className="principle-number">01</span>
              </span>
              <h3>Masa madre viva</h3>
              <p>Un cultivo que cuidamos todos los días</p>
            </div>
            <div>
              <span className="principle-mark">
                <svg {...icono}><circle cx="12" cy="12" r="8.6" /><path d="M12 6.9V12l3.3 2" /></svg>
                <span className="principle-number">02</span>
              </span>
              <h3>Fermentación natural</h3>
              <p>Temperatura y reposo para una miga inolvidable</p>
            </div>
            <div>
              <span className="principle-mark">
                <svg {...icono}><path d="M12 21.6V7.4" /><path d="M12 7.4c.2-2.6 1.9-4.4 4.4-5 .3 2.8-1.5 4.7-4.4 5Z" /><path d="M12 7.4c-.2-2.6-1.9-4.4-4.4-5-.3 2.8 1.5 4.7 4.4 5Z" /><path d="M12 13c.2-2.6 1.9-4.4 4.4-5 .3 2.8-1.5 4.7-4.4 5Z" /><path d="M12 13c-.2-2.6-1.9-4.4-4.4-5-.3 2.8 1.5 4.7 4.4 5Z" /><path d="M12 18.6c.2-2.6 1.9-4.4 4.4-5 .3 2.8-1.5 4.7-4.4 5Z" /><path d="M12 18.6c-.2-2.6-1.9-4.4-4.4-5-.3 2.8 1.5 4.7 4.4 5Z" /></svg>
                <span className="principle-number">03</span>
              </span>
              <h3>Origen cercano</h3>
              <p>Productores que conocemos por su nombre</p>
            </div>
          </div>
          <EnlaceSeccion a="visitanos" className="text-link dark">Conoce nuestros locales <IconoPin /></EnlaceSeccion>
        </div>
      </div>
    </section>
  );
}

export default Historia;
