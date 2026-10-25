// WhatsApp e Instagram, en #/contacto, que lleva al lado la nota de que son
// de ejemplo (secciones 1 y 4 del plan). Cada uno con su rotulo encima y el
// enlace con el aspecto y la ola de "Cómo llegar" (EnlaceLlegar, seccion 10,
// "Contacto con el estilo de la portada"). El rotulo de encima no entra en el
// nombre del enlace: va repetido escondido (prefijo), para quien salta de
// enlace en enlace.
import EnlaceLlegar from './EnlaceLlegar.jsx';

const WHATSAPP = 'https://wa.me/593990000000?text=Hola%2C%20quiero%20hacer%20una%20consulta%20sobre%20El%20Tradicional.';

const icono = {
  className: 'ico', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.6',
  strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false',
};

function Contactos() {
  return (
    <>
      <div className="contacto">
        <span className="rotulo contacto-tipo">WhatsApp</span>
        <EnlaceLlegar
          className="contacto-valor"
          href={WHATSAPP}
          prefijo="WhatsApp: "
          icono={<svg {...icono}><path d="M3.7 20.3l1.3-3.8a8.3 8.3 0 1 1 3.1 3.1Z" /><path d="M9.5 8.6c-.5.6-.5 1.5 0 2.2a8 8 0 0 0 3.7 3.7c.7.5 1.6.5 2.2 0" /></svg>}
        >
          +593 99 000 0000
        </EnlaceLlegar>
      </div>
      <div className="contacto">
        <span className="rotulo contacto-tipo">Instagram</span>
        <EnlaceLlegar
          className="contacto-valor"
          href="https://instagram.com"
          prefijo="Instagram: "
          icono={<svg {...icono}><rect x="3.3" y="3.3" width="17.4" height="17.4" rx="4.8" /><circle cx="12" cy="12" r="3.9" /><circle cx="16.9" cy="7.1" r="1" fill="currentColor" stroke="none" /></svg>}
        >
          @eltradicional
        </EnlaceLlegar>
      </div>
    </>
  );
}

export default Contactos;
