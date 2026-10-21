// ---- #/contacto -------------------------------------------------------------
// Donde estamos y cuando: la direccion, el mapa con "Ver en el mapa" debajo,
// WhatsApp e Instagram, y en la tarjeta oscura si se esta abierto y el
// horario con el dia de hoy marcado. Es lo que antes iba en el pie largo de todas las
// paginas (seccion 15 del plan).
import { useRef } from 'react';
import { useVista } from '../comun/useVista.js';
import { useHorario } from '../comun/useHorario.js';
import EstadoAbierto from '../comun/EstadoAbierto.jsx';
import Contactos from '../comun/Contactos.jsx';
import { IconoPin } from '../comun/iconos.jsx';
import FondoDibujo from '../comun/FondoDibujo.jsx';
import Franja from '../comun/Franja.jsx';

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
  return (
    <div className="vista vista-contacto">
      <section id="visitanos" className="contacto-vista con-fondo" aria-labelledby="contacto-titulo">
        <FondoDibujo vista="contacto" />
        <div className="container contacto-rejilla">
          <div className="contacto-datos">
            <h1 ref={tituloRef} id="contacto-titulo" tabIndex={-1}>Visítanos en Tena</h1>
            <address className="contacto-direccion">Esquina de Eloy Alfaro<br />y Gabriel Espinosa, Tena</address>
          </div>
          <div className="contacto-mapa">
            {/* loading="lazy": el mapa pesa y en el telefono queda mas abajo;
                se pide cuando se acerca a la pantalla. */}
            <iframe
              className="contacto-mapa-marco"
              src={MAPA_EMBEBIDO}
              title="Mapa de la ubicación de El Tradicional, en Eloy Alfaro y Gabriel Espinosa, Tena"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            {/* Lo que se viene a hacer aqui es llegar: es el boton principal
                de la vista, en ambar como "Ver el menu" en el inicio. */}
            <a className="button button-yellow contacto-mapa-enlace" href={MAPA} target="_blank" rel="noopener">
              <IconoPin grosor="1.6" />Ver en el mapa <span aria-hidden="true">↗</span><span className="sr-only"> (abre en una pestaña nueva)</span>
            </a>
          </div>
          <div className="contacto-horario banda-oscura">
            <h2>Horario de atención</h2>
            <EstadoAbierto />
            <dl className="footer-horario">
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
          {/* Va despues del horario: en el telefono, lo primero que se busca
              es donde y si esta abierto; escribir viene luego. */}
          <div className="contacto-escribir">
            <h2 className="contacto-subtitulo">Escríbenos</h2>
            <div className="contacto-lista"><Contactos /></div>
            <p className="contacto-nota">Teléfono y redes de ejemplo: es un proyecto de clase y todavía no hay números reales que publicar.</p>
          </div>
        </div>
      </section>
      <Franja className="franja-pie" />
    </div>
  );
}

export default Contacto;
