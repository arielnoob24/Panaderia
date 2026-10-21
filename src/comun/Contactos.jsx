// Instagram y WhatsApp, con la nota de que son de ejemplo (seccion 1 del
// plan). Los mismos en el pie de todas las vistas y en #/contacto.
const WHATSAPP = 'https://wa.me/593990000000?text=Hola%2C%20quiero%20hacer%20una%20consulta%20sobre%20El%20Tradicional.';

function Contactos() {
  return (
    <>
      <div className="contacto">
        <span className="contacto-tipo">WhatsApp</span>
        <a className="contacto-valor" href={WHATSAPP} target="_blank" rel="noopener">
          <svg className="contacto-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M3.7 20.3l1.3-3.8a8.3 8.3 0 1 1 3.1 3.1Z" /><path d="M9.5 8.6c-.5.6-.5 1.5 0 2.2a8 8 0 0 0 3.7 3.7c.7.5 1.6.5 2.2 0" /></svg>
          <span>+593 99 000 0000</span><span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
      </div>
      <div className="contacto">
        <span className="contacto-tipo">Instagram</span>
        <a className="contacto-valor" href="https://instagram.com" target="_blank" rel="noopener">
          <svg className="contacto-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="3.3" y="3.3" width="17.4" height="17.4" rx="4.8" /><circle cx="12" cy="12" r="3.9" /><circle cx="16.9" cy="7.1" r="1" fill="currentColor" stroke="none" /></svg>
          <span>@eltradicional</span><span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
      </div>
    </>
  );
}

export default Contactos;
