// ---- #/nosotros ------------------------------------------------------------
// Con el estilo de la portada (seccion 10 del plan, "Nosotros con el estilo
// de la portada"): la historia en dos columnas como la portada pero en
// espejo, la foto del amasado en arco a la izquierda con su sello, y debajo
// los tres principios sobre la masa, entre las lineas dobles de la cabecera
// de periodico. Las piezas son las de la portada (FotoEnArco, Sello,
// EnlaceLlegar y las clases de vistas.css), no una copia.
//
// La historia entra con la escena de la portada, una vez. Los principios
// aparecen al llegar a ellos (useAparecer). Cuando el usuario pase las fotos
// del local, la galeria va aqui.
import { useLayoutEffect, useRef, useState } from 'react';
import fotoChica from '/assets/img/historia-amasado-430.jpg';
import fotoGrande from '/assets/img/historia-amasado-760.jpg';
import { useVista } from '../comun/useVista.js';
import { movimientoReducido } from '../comun/useMovimientoReducido.js';
import { IconoTrigo } from '../comun/iconos.jsx';
import FondoDibujo from '../comun/FondoDibujo.jsx';
import FotoEnArco from '../comun/FotoEnArco.jsx';
import EnlaceLlegar from '../comun/EnlaceLlegar.jsx';
import Franja from '../comun/Franja.jsx';

const icono = {
  className: 'principio-icono', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: '1.4', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false',
};

// Cada principio con su icono de linea. La clase dice que movimiento hace el
// icono con el puntero encima (vistas.css): el tarro de la masa da un
// saltito, la aguja del reloj da la vuelta y la espiga se mece.
const PRINCIPIOS = [
  {
    clase: 'principio-masa',
    nombre: 'Masa madre viva',
    frase: 'Un cultivo que cuidamos todos los días',
    dibujo: <svg {...icono}><path d="M9 2.6h6" /><path d="M9.6 2.6v2.8L8.1 7.1A3 3 0 0 0 7.1 9.4V19a2.4 2.4 0 0 0 2.4 2.4h5A2.4 2.4 0 0 0 16.9 19V9.4a3 3 0 0 0-1-2.3l-1.5-1.7V2.6" /><path d="M7.1 13h9.8" /><circle cx="10.2" cy="16.2" r="1" /><circle cx="13.6" cy="17.8" r=".75" /></svg>,
  },
  {
    clase: 'principio-tiempo',
    nombre: 'Fermentación natural',
    frase: 'Temperatura y reposo para una miga inolvidable',
    dibujo: <svg {...icono}><circle cx="12" cy="12" r="8.6" /><path className="principio-aguja" d="M12 6.9V12l3.3 2" /></svg>,
  },
  {
    clase: 'principio-origen',
    nombre: 'Origen cercano',
    frase: 'Productores que conocemos por su nombre',
    dibujo: <svg {...icono}><path d="M12 21.6V7.4" /><path d="M12 7.4c.2-2.6 1.9-4.4 4.4-5 .3 2.8-1.5 4.7-4.4 5Z" /><path d="M12 7.4c-.2-2.6-1.9-4.4-4.4-5-.3 2.8 1.5 4.7 4.4 5Z" /><path d="M12 13c.2-2.6 1.9-4.4 4.4-5 .3 2.8-1.5 4.7-4.4 5Z" /><path d="M12 13c-.2-2.6-1.9-4.4-4.4-5-.3 2.8 1.5 4.7 4.4 5Z" /><path d="M12 18.6c.2-2.6 1.9-4.4 4.4-5 .3 2.8-1.5 4.7-4.4 5Z" /><path d="M12 18.6c-.2-2.6-1.9-4.4-4.4-5-.3 2.8 1.5 4.7 4.4 5Z" /></svg>,
  },
];

// Los principios aparecen cuando la seccion entra en pantalla, una vez: las
// lineas dobles se dibujan y las columnas suben una tras otra. Devuelve la
// ref de la seccion y en que punto esta (data-aparece en vistas.css):
//   null      sin marcar: todo visible y quieto (menos movimiento, o un
//             navegador sin IntersectionObserver)
//   'espera'  escondido hasta que se llegue a ella
//   'escena'  ya se veia al abrir la vista: entra con la escena de arriba,
//             un poco despues de la historia
//   'ya'      se llego bajando: entra en ese momento
// Solo se esconde cuando ya hay quien lo vaya a ensenar: si el observador no
// se puede crear, nada queda oculto. Se marca antes de pintar (layout
// effect) para que no se vea un cuadro con todo y luego desaparezca.
function useAparecer() {
  const ref = useRef(null);
  const [aparece, setAparece] = useState(null);
  useLayoutEffect(() => {
    const zona = ref.current;
    if (!zona || movimientoReducido() || !('IntersectionObserver' in window)) return undefined;
    setAparece('espera');
    // La primera respuesta del observador dice como estaba al abrir.
    let primera = true;
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) {
        setAparece(primera ? 'escena' : 'ya');
        observador.disconnect();
      }
      primera = false;
    }, { rootMargin: '0px 0px -12% 0px' });
    observador.observe(zona);
    return () => observador.disconnect();
  }, []);
  return [ref, aparece];
}

function Nosotros() {
  const tituloRef = useRef(null);
  useVista('Nosotros | El Tradicional', tituloRef);
  const [principiosRef, aparece] = useAparecer();
  return (
    <div className="vista vista-nosotros">
      <section id="historia" className="nosotros-historia con-fondo" aria-labelledby="nosotros-titulo">
        <FondoDibujo vista="nosotros" />
        {/* El texto va antes que la foto, para que el lector llegue primero
            al titulo; la rejilla pone la foto a la izquierda (espejo de la
            portada) y, en el telefono, debajo. */}
        <div className="container nosotros-rejilla">
          <div className="nosotros-texto sube-en-orden">
            <p className="rotulo rotulo-espiga"><IconoTrigo />Nuestra historia</p>
            <h1 ref={tituloRef} id="nosotros-titulo" className="titular" tabIndex={-1}>El tiempo es{' '}<em>nuestro ingrediente</em></h1>
            <p className="frase">No hacemos pan rápido. Hacemos pan que vale la espera.</p>
            <p className="nosotros-madrugada">Cada madrugada, nuestro equipo llega cuando la ciudad todavía duerme.</p>
            <EnlaceLlegar className="nosotros-llegar">Conoce nuestro local</EnlaceLlegar>
          </div>
          <FotoEnArco
            className="nosotros-foto"
            arcoClase="nosotros-arco"
            selloClase="nosotros-sello"
            pie="Despacio sabe mejor"
            sello="Masa madre · Hecho despacio · "
            src={fotoChica}
            srcSet={`${fotoChica} 430w, ${fotoGrande} 760w`}
            sizes="(max-width: 680px) min(100vw - 32px, 400px), (max-width: 900px) 300px, 420px"
            alt="Un panadero bolea la masa sobre una mesa de madera enharinada, junto a un banneton, una cuchilla de greñar y un tarro de masa madre"
            width="760"
            height="950"
          />
        </div>
      </section>
      <section ref={principiosRef} className="nosotros-principios" data-aparece={aparece || undefined} aria-labelledby="principios-titulo">
        <div className="container">
          <div className="principios-cabeza">
            <span className="linea-doble" aria-hidden="true"></span>
            <h2 id="principios-titulo" className="principios-titulo">Tres cosas que no cambiamos</h2>
            <span className="linea-doble" aria-hidden="true"></span>
          </div>
          {/* La lista ya dice cuantos son y en que puesto va cada uno: el
              "N.º" es para la vista y el lector se lo salta. Las estrellas
              que los separan son de CSS (::before), sin texto. role="list"
              porque Safari quita el rol de lista con list-style: none. */}
          <ol className="principios" role="list">
            {PRINCIPIOS.map((p, i) => (
              <li key={p.clase} className={`principio ${p.clase}`} style={{ '--n': i }}>
                <span className="rotulo principio-numero" aria-hidden="true">N.º {i + 1}</span>
                {p.dibujo}
                <h3>{p.nombre}</h3>
                <p>{p.frase}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <Franja className="franja-pie" />
    </div>
  );
}

export default Nosotros;
