// ---- El pie corto -----------------------------------------------------
// En todas las vistas: la marca, si se esta abierto o cerrado, WhatsApp e
// Instagram, "Tu pedido se guardo..." y el (c). El horario completo y la
// direccion viven en #/contacto (seccion 15 del plan): el pie ya no es una
// pagina mas al final de cada pagina.
import { Link, useLocation } from 'react-router-dom';
import mascota from '/assets/img/mascota.png';
import { useCargaImagen, clases } from './useCargaImagen.js';
import EstadoAbierto from './EstadoAbierto.jsx';
import Contactos from './Contactos.jsx';
import GuardadoPie from '../pedido/GuardadoPie.jsx';
import { movimientoReducido } from './useMovimientoReducido.js';

// Pulsar "Horario y como llegar" estando ya en #/contacto no navega (seria la
// misma direccion), pero tiene que hacer algo: lleva arriba de la vista con
// el foco en su titulo, como al llegar a ella.
const subirAlTitulo = (e) => {
  // Abrirlo en otra pestana sigue siendo cosa del navegador.
  if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: movimientoReducido() ? 'instant' : 'smooth' });
  document.querySelector('#contenido h1')?.focus({ preventScroll: true });
};

function Pie() {
  const carga = useCargaImagen();
  // Tambien en #/contacto, aunque la vista ya lo diga encima: la ayuda tiene
  // que estar en el mismo sitio en todas las paginas (WCAG 3.2.6), y quien la
  // busca abajo no tiene por que saber que en esta subio. Ahi el enlace al
  // horario es la propia vista, y lo dice.
  const enContacto = useLocation().pathname === '/contacto';
  return (
    <footer className="site-footer pie-corto">
      <div className="container pie-corto-fila">
        <div className="footer-identity">
          <div className={clases('mascot-slot mascot-footer', carga.hueco)}>
            <img src={mascota} alt="" width="224" height="210" {...carga.imagen} />
          </div>
          <Link to="/" state={{ entrar: true }} className="brand"><span>El Tradicional<small>Panadería &amp; Pastelería</small></span></Link>
        </div>
        <div className="pie-corto-estado">
          <EstadoAbierto />
          <Link className="pie-corto-horario" to="/contacto" state={{ entrar: true }} aria-current={enContacto ? 'page' : undefined} onClick={enContacto ? subirAlTitulo : undefined}>Horario y cómo llegar</Link>
        </div>
        <div className="footer-contacto pie-corto-contacto"><Contactos /></div>
      </div>
      <div className="container pie-corto-final">
        <p className="contacto-ficticio">Teléfono y redes de ejemplo: es un proyecto de clase y todavía no hay números reales que publicar.</p>
        <GuardadoPie />
        <p className="footer-note">© 2026 El Tradicional · Tena, Ecuador</p>
      </div>
    </footer>
  );
}

export default Pie;
