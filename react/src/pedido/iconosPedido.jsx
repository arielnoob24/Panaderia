// Los dibujos de la canasta, con el mismo trazo que los de js/pedido/cart.js.

// Basurero: tapa, asa, cuerpo que se estrecha y dos costillas. Lo usan la
// ficha del catalogo y la linea de la canasta cuando queda una sola unidad.
function Basurero() {
  return (
    <svg className="card-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4.8 7.1h14.4" />
      <path d="M9.7 7.1V5.3a1.4 1.4 0 0 1 1.4-1.4h1.8a1.4 1.4 0 0 1 1.4 1.4v1.8" />
      <path d="M6.5 7.1l.8 11.3a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-11.3" />
      <path d="M10.3 10.8v5.8" /><path d="M13.7 10.8v5.8" />
    </svg>
  );
}

// Canasta de pan: asa de arco, cuerpo ahusado y dos mimbres.
function IconoCanasta() {
  return (
    <svg className="canasta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M7.6 9.4a4.4 4.4 0 0 1 8.8 0" />
      <path d="M3.6 9.4h16.8l-1.5 8.2a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6Z" />
      <path d="M9.7 12.7l.6 3.5" /><path d="M14.3 12.7l-.6 3.5" />
    </svg>
  );
}

// El de la hoja "Entra a tu cuenta para pagar".
function IconoPersona() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <circle cx="12" cy="8.2" r="3.6" /><path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0" />
    </svg>
  );
}

export { Basurero, IconoCanasta, IconoPersona };
