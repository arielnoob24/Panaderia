// ---- El pie corto -----------------------------------------------------
// En todas las vistas: la marca, si se esta abierto o cerrado, WhatsApp e
// Instagram, "Tu pedido se guardo..." y el (c). El horario completo y la
// direccion viven en #/contacto (seccion 15 del plan): el pie ya no es una
// pagina mas al final de cada pagina.
import { Link, useLocation } from 'react-router-dom';
import mascota from '@raiz/assets/img/mascota.png';
import { useCargaImagen, clases } from './useCargaImagen.js';
import EstadoAbierto from './EstadoAbierto.jsx';
import Contactos from './Contactos.jsx';
import GuardadoPie from '../pedido/GuardadoPie.jsx';

function Pie() {
  const carga = useCargaImagen();
  // En #/contacto todo eso ya esta en la vista, justo encima: repetirlo en el
  // pie solo alarga la pagina.
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
        {!enContacto && (
          <>
            <div className="pie-corto-estado">
              <EstadoAbierto />
              <Link className="pie-corto-horario" to="/contacto" state={{ entrar: true }}>Horario y cómo llegar</Link>
            </div>
            <div className="footer-contacto pie-corto-contacto"><Contactos /></div>
          </>
        )}
      </div>
      <div className="container pie-corto-final">
        {!enContacto && <p className="contacto-ficticio">Teléfono y redes de ejemplo: es un proyecto de clase y todavía no hay números reales que publicar.</p>}
        <GuardadoPie />
        <p className="footer-note">© 2026 El Tradicional · Tena, Ecuador</p>
      </div>
    </footer>
  );
}

export default Pie;
