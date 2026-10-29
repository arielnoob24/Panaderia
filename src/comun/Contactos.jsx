// WhatsApp, en #/contacto (secciones 1 y 4 del plan), con su rotulo encima y el
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
    </>
  );
}

export default Contactos;
