// ---- #/contacto -------------------------------------------------------------
// Con el estilo de la portada (seccion 10 del plan, "Contacto con el estilo
// de la portada"): arriba, como la portada, el texto (rotulo con la espiga,
// el titular, la direccion y "Ver en el mapa") y a su lado el mapa en un
// marco fino con su sello; debajo, sobre la masa y entre las lineas dobles
// de la cabecera de periodico, el horario como una carta (con el dia de hoy
// marcado y si se esta abierto) y Escribenos, con WhatsApp con
// la ola de "Cómo llegar". El sitio no tiene
// pie (seccion 4 del plan): esto es lo que llevaba.
//
// Como la portada y Nosotros, cabe en una sola pantalla sin desplazarse
// (vistas.css): el mapa, el titular y los espacios se ajustan al alto
// visible. Todo entra en una sola escena, una vez.
import { useEffect, useRef, useState } from 'react';
import { useVista } from '../comun/useVista.js';
import { useHorario } from '../comun/useHorario.js';
import EstadoAbierto from '../comun/EstadoAbierto.jsx';
import Contactos from '../comun/Contactos.jsx';
import Sello from '../comun/Sello.jsx';
import { IconoPin, IconoTrigo } from '../comun/iconos.jsx';
import FondoDibujo from '../comun/FondoDibujo.jsx';

// Las dos filas del horario y que dias cubre cada una (0 es domingo, como
// getDay). Es lo que index.html dice con data-dias.
const HORARIO = [
  { dias: [1, 2, 3, 4, 5], rotulo: 'Lun — Vie', horas: '08:00 — 20:00' },
  { dias: [0, 6], rotulo: 'Sáb — Dom', horas: '09:00 — 21:00' },
];
const MAPA = 'https://www.google.com/maps/dir/?api=1&destination=-1.004033,-77.812690';
// El mapa de Google sin clave (seccion 15 del plan): no pide cuenta ni tarjeta.
const MAPA_EMBEBIDO = 'https://maps.google.com/maps?q=-1.004033,-77.812690&z=17&output=embed';

function Contacto() {
  const tituloRef = useRef(null);
  useVista('Visítanos | El Tradicional', tituloRef);
  const horario = useHorario();
  // El mapa no captura el scroll: el iframe no recibe el puntero hasta hacer
  // clic en el marco (el clic cae en el marco, que esta debajo), y se
  // restablece al salir el puntero (raton o lapiz), al tocar fuera o al
  // desplazar la pagina. Con el dedo no hay "salir": se suelta tocando fuera
  // del mapa, que es donde el usuario empieza a desplazar la pagina.
  const marcoRef = useRef(null);
  const [mapaActivo, setMapaActivo] = useState(false);
  useEffect(() => {
    if (!mapaActivo) return undefined;
    const fuera = (e) => { if (!marcoRef.current?.contains(e.target)) setMapaActivo(false); };
    const suelta = () => setMapaActivo(false);
    document.addEventListener('pointerdown', fuera);
    window.addEventListener('scroll', suelta, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', fuera);
      window.removeEventListener('scroll', suelta);
    };
  }, [mapaActivo]);
  return (
    <div className="vista vista-contacto">
      <section id="visitanos" className="contacto-vista con-fondo" aria-labelledby="contacto-titulo">
        <FondoDibujo vista="contacto" />
        <div className="container contacto-rejilla">
          <div className="contacto-texto sube-en-orden">
            <p className="rotulo rotulo-espiga"><IconoTrigo />Dónde estamos</p>
            {/* En los telefonos bajos el estado sube aqui, junto al rotulo,
                como en la cabecera de periodico de la portada, para que la
                vista quepa; el del horario se quita entonces. Solo uno de
                los dos se ve (y se lee) a la vez: el otro va display: none
                (vistas.css). */}
            <EstadoAbierto />
            <h1 ref={tituloRef} id="contacto-titulo" className="titular" tabIndex={-1}>Visítanos{' '}<em>en Tena</em></h1>
            <address className="frase contacto-direccion">Esquina de Eloy Alfaro<br />{' '}y Gabriel Espinosa, Tena</address>
            {/* Lo que se viene a hacer aqui es llegar: es el boton principal
                de la vista y el unico relleno de ambar (WhatsApp es secundario,
                con borde), el ticket como "Nuestros panes". */}
            <a className="button button-yellow contacto-mapa-enlace" href={MAPA} target="_blank" rel="noopener">
              <IconoPin clase="ico" grosor="1.6" />Ver en el mapa<span className="sr-only"> (abre en una pestaña nueva)</span>
            </a>
          </div>
          <div className="contacto-mapa">
            {/* El marco es el filete de la foto en arco, recto para no
                recortar el mapa. loading="lazy": en el telefono queda mas
                abajo y pesa; se pide cuando se acerca a la pantalla. */}
            <div
              ref={marcoRef}
              className={mapaActivo ? 'contacto-mapa-marco is-activo' : 'contacto-mapa-marco'}
              onClick={() => setMapaActivo(true)}
              onPointerLeave={(e) => { if (e.pointerType !== 'touch') setMapaActivo(false); }}
            >
              <iframe
                src={MAPA_EMBEBIDO}
                title="Mapa de la ubicación de El Tradicional, en Eloy Alfaro y Gabriel Espinosa, Tena"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            {/* Arriba a la derecha, donde el mapa de Google no pone mandos
                ni creditos; deja pasar el puntero al mapa (vistas.css). */}
            <Sello texto="Eloy Alfaro · Gabriel Espinosa · " className="contacto-sello" />
          </div>
          <div className="contacto-horario">
            <div className="contacto-cabeza">
              <span className="linea-doble" aria-hidden="true"></span>
              <h2 className="contacto-subtitulo">Horario de atención</h2>
              <span className="linea-doble" aria-hidden="true"></span>
            </div>
            <EstadoAbierto />
            {/* Una carta: el dia, los puntos guia y la hora. Los puntos son
                un borde del dt (vistas.css), sin texto que leer. */}
            <dl className="carta-horario">
              {HORARIO.map((fila) => {
                const esHoy = fila.dias.includes(horario.day);
                return (
                  <div key={fila.rotulo} data-dias={fila.dias.join(',')} className={esHoy ? 'is-today' : undefined}>
                    <dt>{fila.rotulo}{esHoy && <span className="dia-hoy">hoy</span>}</dt>
                    <dd>{fila.horas}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="contacto-horario-nota">En feriados nacionales cerramos.</p>
          </div>
          {/* Va despues del horario: lo primero que se busca es donde y si
              esta abierto; escribir viene luego. */}
          <div className="contacto-escribir">
            <div className="contacto-cabeza">
              <span className="linea-doble" aria-hidden="true"></span>
              <h2 className="contacto-subtitulo">Escríbenos</h2>
              <span className="linea-doble" aria-hidden="true"></span>
            </div>
            <div className="contacto-lista"><Contactos /></div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contacto;
