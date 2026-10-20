// ---- El pie -----------------------------------------------------------
// Horario con el dia de hoy marcado, si se esta abierto o cerrado (y hasta
// cuando), direccion y contacto. El estado lo calcula js/comun/horario.js, el
// mismo del sitio actual, y se pone al dia cada minuto (useHorario).
import mascota from '@raiz/assets/img/mascota.png';
import { estadoDelPie } from '@raiz/js/comun/horario.js';
import EnlaceSeccion from './EnlaceSeccion.jsx';
import { useHorario } from './useHorario.js';
import { useCargaImagen, clases } from './useCargaImagen.js';
import { IconoPin } from './iconos.jsx';
import GuardadoPie from '../pedido/GuardadoPie.jsx';

const WHATSAPP = 'https://wa.me/593990000000?text=Hola%2C%20quiero%20hacer%20una%20consulta%20sobre%20El%20Tradicional.';

// Las dos filas del horario y que dias cubre cada una (0 es domingo, como
// getDay). Es lo que index.html dice con data-dias.
const HORARIO = [
  { dias: [1, 2, 3, 4, 5], rotulo: 'Lun — Vie', horas: '08:00 — 20:00' },
  { dias: [0, 6], rotulo: 'Sáb — Dom', horas: '09:00 — 21:00' },
];

function Pie() {
  const horario = useHorario();
  const abierto = horario.abierto;
  const carga = useCargaImagen();
  return (
    <footer id="visitanos" className="site-footer" tabIndex={-1}>
      <div className="container footer-grid">
        <div className="footer-col footer-marca">
          <div className="footer-identity">
            <div className={clases('mascot-slot mascot-footer', carga.hueco)}>
              <img src={mascota} alt="Mascota panadera de El Tradicional sosteniendo una pala con pan" width="224" height="210" {...carga.imagen} />
            </div>
            <EnlaceSeccion a="inicio" className="brand"><span>El Tradicional<small>Panadería &amp; Pastelería</small></span></EnlaceSeccion>
          </div>
          <p className="footer-lema">El sabor de siempre,<br />hecho como antes</p>
        </div>
        <div className="footer-col">
          <h3>Horarios de atención</h3>
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
        </div>
        <div className="footer-col footer-visita">
          <h3>Visítanos</h3>
          <span className={abierto ? 'open-label' : 'open-label is-closed'}>
            <span className={abierto ? 'status-dot' : 'status-dot is-closed'}></span>
            {` ${estadoDelPie(horario)}`}
          </span>
          <address>Esquina de Eloy Alfaro<br />y Gabriel Espinosa</address>
          <a className="footer-mapa" href="https://www.google.com/maps/dir/?api=1&destination=-1.004033,-77.812690" target="_blank" rel="noopener">
            <IconoPin grosor="1.4" />Ver en el mapa <span aria-hidden="true">↗</span><span className="sr-only"> (abre en una pestaña nueva)</span>
          </a>
        </div>
        <div className="footer-col footer-contacto">
          <h3>Escríbenos</h3>
          <div className="contacto">
            <span className="contacto-tipo">Instagram</span>
            <a className="contacto-valor" href="https://instagram.com" target="_blank" rel="noopener">
              <svg className="contacto-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="3.3" y="3.3" width="17.4" height="17.4" rx="4.8" /><circle cx="12" cy="12" r="3.9" /><circle cx="16.9" cy="7.1" r="1" fill="currentColor" stroke="none" /></svg>
              <span>@eltradicional</span><span className="sr-only"> (abre en una pestaña nueva)</span>
            </a>
          </div>
          <div className="contacto">
            <span className="contacto-tipo">WhatsApp</span>
            <a className="contacto-valor" href={WHATSAPP} target="_blank" rel="noopener">
              <svg className="contacto-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M3.7 20.3l1.3-3.8a8.3 8.3 0 1 1 3.1 3.1Z" /><path d="M9.5 8.6c-.5.6-.5 1.5 0 2.2a8 8 0 0 0 3.7 3.7c.7.5 1.6.5 2.2 0" /></svg>
              <span>+593 99 000 0000</span><span className="sr-only"> (abre en una pestaña nueva)</span>
            </a>
          </div>
          <p className="contacto-ficticio">Teléfono y redes de ejemplo: es un proyecto de clase y todavía no hay números reales que publicar.</p>
        </div>
        <p className="footer-note">© 2026 El Tradicional · Tena, Ecuador</p>
        <GuardadoPie />
      </div>
    </footer>
  );
}

export default Pie;
