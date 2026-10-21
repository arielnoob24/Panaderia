// ---- #/nosotros ------------------------------------------------------------
// La historia: la foto del amasado y el texto sobre la masa clara, y los tres
// principios en una banda oscura debajo. Antes todo iba en la banda oscura,
// pero sola en su vista quedaba casi entera marron, y la regla 60-30-10 pide
// que mande la masa (seccion 15 del plan). Cuando el usuario pase las fotos
// del local, la galeria va aqui.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import fotoChica from '/assets/img/historia-amasado-430.jpg';
import fotoGrande from '/assets/img/historia-amasado-760.jpg';
import { useVista } from '../comun/useVista.js';
import { useCargaImagen, clases } from '../comun/useCargaImagen.js';
import { IconoPin } from '../comun/iconos.jsx';
import FondoDibujo from '../comun/FondoDibujo.jsx';
import Franja from '../comun/Franja.jsx';

const icono = {
  className: 'principle-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: '1.4', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false',
};

function Nosotros() {
  const tituloRef = useRef(null);
  useVista('Nosotros | El Tradicional', tituloRef);
  const carga = useCargaImagen();
  return (
    <div className="vista vista-nosotros">
      <section id="historia" className="nosotros-historia con-fondo" aria-labelledby="nosotros-titulo">
        <FondoDibujo vista="nosotros" />
        <div className="container story-grid">
          <div className={clases('story-photo', carga.hueco)}>
            <img
              src={fotoChica}
              srcSet={`${fotoChica} 430w, ${fotoGrande} 760w`}
              sizes="(max-width: 680px) min(100vw - 32px, 420px), (max-width: 900px) 300px, 430px"
              alt="Un panadero bolea la masa sobre una mesa de madera enharinada, junto a un banneton, una cuchilla de greñar y un tarro de masa madre"
              width="760"
              height="950"
              {...carga.imagen}
            />
            <span className="image-caption">Despacio sabe mejor</span>
          </div>
          <div className="nosotros-texto">
            <h1 ref={tituloRef} id="nosotros-titulo" tabIndex={-1}>El tiempo es<br /><em>nuestro ingrediente</em></h1>
            <p className="lead">No hacemos pan rápido. Hacemos pan que vale la espera.</p>
            <p>Cada madrugada, nuestro equipo llega cuando la ciudad todavía duerme.</p>
            <Link className="text-link" to="/contacto" state={{ entrar: true }}>Conoce nuestro local <IconoPin /></Link>
          </div>
        </div>
      </section>
      {/* El titulo va sobre la masa y solo los principios sobre el horno: la
          banda entera oscura dejaba la vista casi mitad marron. */}
      <section className="nosotros-principios" aria-labelledby="principios-titulo">
        <div className="container">
          <h2 id="principios-titulo">Tres cosas que no cambiamos</h2>
        </div>
        <div className="nosotros-principios-banda banda-oscura con-fondo">
          <FondoDibujo vista="principios" />
          <div className="container principles">
            <div>
              <span className="principle-mark">
                <svg {...icono}><path d="M9 2.6h6" /><path d="M9.6 2.6v2.8L8.1 7.1A3 3 0 0 0 7.1 9.4V19a2.4 2.4 0 0 0 2.4 2.4h5A2.4 2.4 0 0 0 16.9 19V9.4a3 3 0 0 0-1-2.3l-1.5-1.7V2.6" /><path d="M7.1 13h9.8" /><circle cx="10.2" cy="16.2" r="1" /><circle cx="13.6" cy="17.8" r=".75" /></svg>
              </span>
              <h3>Masa madre viva</h3>
              <p>Un cultivo que cuidamos todos los días</p>
            </div>
            <div>
              <span className="principle-mark">
                <svg {...icono}><circle cx="12" cy="12" r="8.6" /><path d="M12 6.9V12l3.3 2" /></svg>
              </span>
              <h3>Fermentación natural</h3>
              <p>Temperatura y reposo para una miga inolvidable</p>
            </div>
            <div>
              <span className="principle-mark">
                <svg {...icono}><path d="M12 21.6V7.4" /><path d="M12 7.4c.2-2.6 1.9-4.4 4.4-5 .3 2.8-1.5 4.7-4.4 5Z" /><path d="M12 7.4c-.2-2.6-1.9-4.4-4.4-5-.3 2.8 1.5 4.7 4.4 5Z" /><path d="M12 13c.2-2.6 1.9-4.4 4.4-5 .3 2.8-1.5 4.7-4.4 5Z" /><path d="M12 13c-.2-2.6-1.9-4.4-4.4-5-.3 2.8 1.5 4.7 4.4 5Z" /><path d="M12 18.6c.2-2.6 1.9-4.4 4.4-5 .3 2.8-1.5 4.7-4.4 5Z" /><path d="M12 18.6c-.2-2.6-1.9-4.4-4.4-5-.3 2.8 1.5 4.7 4.4 5Z" /></svg>
              </span>
              <h3>Origen cercano</h3>
              <p>Productores que conocemos por su nombre</p>
            </div>
          </div>
        </div>
      </section>
      <Franja className="franja-pie" />
    </div>
  );
}

export default Nosotros;
