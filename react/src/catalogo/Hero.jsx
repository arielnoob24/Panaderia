// La portada de arriba (#inicio): titular, "Ver el menu", "Como llegar" y la
// nota del horno, que dice segun la hora si se esta horneando, si el horno se
// esta calentando o si ya se cerro (js/comun/horario.js).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { notaDelHorno } from '@raiz/js/comun/horario.js';
import EnlaceSeccion from '../comun/EnlaceSeccion.jsx';
import { useHorario } from '../comun/useHorario.js';
import { IconoMenu, IconoPin } from '../comun/iconos.jsx';

// La amplitud acompana al peso tipografico: el titular recorre mas que el
// parrafo, y el parrafo mas que los botones. Cada uno sale 70 ms despues.
const subida = (i) => ({ '--rise': `${[16, 10, 8][i]}px`, '--hero-delay': `${i * 70}ms` });

function Hero() {
  const horario = useHorario();
  const nota = notaDelHorno(horario);
  const fotoRef = useRef(null);
  const [fotoLista, setFotoLista] = useState(false);

  // La foto de fondo entra con un fundido cuando ya llego, no a trozos. Es un
  // fondo de CSS, asi que se pide aparte la misma direccion que eligio la hoja
  // (Vite le puso su huella) y se avisa al llegar, como en js/comun/ui.js.
  useEffect(() => {
    const fondo = getComputedStyle(fotoRef.current).backgroundImage;
    const url = fondo.match(/url\(["']?(.*?)["']?\)/)?.[1];
    if (!url) return undefined;
    const previa = new Image();
    const lista = () => setFotoLista(true);
    previa.addEventListener('load', lista, { once: true });
    previa.src = url;
    return () => previa.removeEventListener('load', lista);
  }, []);

  return (
    <section id="inicio" className="hero" tabIndex={-1}>
      <div
        ref={fotoRef}
        className={fotoLista ? 'hero-image is-loaded' : 'hero-image'}
        role="img"
        aria-label="Pan de masa madre recién cortado sobre papel de hornear, con luz natural y fondo crema"
      ></div>
      <div className="hero-overlay"></div>
      <div className="container hero-content is-ready">
        <h1 style={subida(0)}>El sabor<br /><em>de siempre</em></h1>
        <p className="hero-copy" style={subida(1)}>Pan recién horneado todos los días, manos pacientes y recetas que saben a hogar</p>
        <div className="hero-actions" style={subida(2)}>
          {/* Lleva al catalogo entero: quien pulsa aqui quiere verlo todo. */}
          <Link className="button button-yellow" to="/tienda-catalogo" state={{ entrar: true }}>
            Ver el menú <span aria-hidden="true"><IconoMenu /></span>
          </Link>
          <EnlaceSeccion a="visitanos" className="text-link">Cómo llegar <IconoPin /></EnlaceSeccion>
        </div>
      </div>
      <div className="hero-note">
        <span className={horario.abierto ? 'status-dot' : 'status-dot is-closed'}></span>
        <span><strong className="hero-note-titulo">{nota.titulo}</strong><br /><span className="hero-note-dato">{nota.dato}</span></span>
      </div>
    </section>
  );
}

export default Hero;
