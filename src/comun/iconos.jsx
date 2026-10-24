// Los dibujos que se repiten en varias partes de la pagina, con el mismo trazo
// que en index.html. Todos son decorativos: el texto de al lado ya dice que son.

// El alfiler del mapa: "Como llegar", "Conoce nuestros locales", "Ver en el mapa".
function IconoPin({ grosor = '1.6', clase = 'link-icon' }) {
  return (
    <svg className={clase} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21.4c0 0 6.8-5.6 6.8-11A6.8 6.8 0 0 0 5.2 10.4c0 5.4 6.8 11 6.8 11Z" />
      <circle cx="12" cy="10.2" r="2.5" />
    </svg>
  );
}

// ---- Los iconos de linea del estilo editorial (seccion 10 del plan) ------
// Mismo trazo que los dibujos de trigo del fondo: 1.6, puntas redondas, sin
// relleno. Salen de la muestra que aprobo el usuario. clase deja que cada
// sitio los mida y los mueva (el boton inclina la hogaza, la cinta la gira).
function Linea({ clase = 'ico', children }) {
  return (
    <svg className={clase} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

// La hogaza: "Nuestros panes" y Panes en la cinta.
const IconoHogaza = ({ clase }) => (
  <Linea clase={clase}>
    <path d="M2.5 15c0-5 4.3-8.5 9.5-8.5s9.5 3.5 9.5 8.5c0 1.7-1.3 3-3 3h-13c-1.7 0-3-1.3-3-3z" />
    <path d="M7 10.5l2.5 3M11 9.5l2.5 3.5M15 9.5l2.5 3.5" />
  </Linea>
);

// La galleta de chocolate: Dulces y pasteles en la cinta.
const IconoGalleta = ({ clase }) => (
  <svg className={clase || 'ico'} viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-75 29-147t81-128.5q52-56.5 125-91T475-881q21 0 43 2t45 7q-9 45 6 85t45 66.5q30 26.5 71.5 36.5t85.5-5q-26 59 7.5 113t99.5 56q1 11 1.5 20.5t.5 20.5q0 82-31.5 154.5t-85.5 127q-54 54.5-127 86T480-80Zm-60-480q25 0 42.5-17.5T480-620q0-25-17.5-42.5T420-680q-25 0-42.5 17.5T360-620q0 25 17.5 42.5T420-560Zm-80 200q25 0 42.5-17.5T400-420q0-25-17.5-42.5T340-480q-25 0-42.5 17.5T280-420q0 25 17.5 42.5T340-360Zm260 40q17 0 28.5-11.5T640-360q0-17-11.5-28.5T600-400q-17 0-28.5 11.5T560-360q0 17 11.5 28.5T600-320ZM480-160q122 0 216.5-84T800-458q-50-22-78.5-60T683-603q-77-11-132-66t-68-132q-80-2-140.5 29t-101 79.5Q201-644 180.5-587T160-480q0 133 93.5 226.5T480-160Zm0-324Z" />
  </svg>
);

// La botella: Bebidas en la cinta.
const IconoBotella = ({ clase }) => (
  <Linea clase={clase}>
    <path d="M10 2h4v3l1.5 3v12a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V8L10 5z" />
    <path d="M8.5 12h7" />
  </Linea>
);

// La espiga del rotulo "Horneado cada manana".
const IconoTrigo = ({ clase }) => (
  <Linea clase={clase}>
    <path d="M12 22V8" />
    <path d="M12 12c-3 0-4.5-2-4.5-4 2.5 0 4.5 1.5 4.5 4zM12 12c3 0 4.5-2 4.5-4-2.5 0-4.5 1.5-4.5 4zM12 17c-3 0-4.5-2-4.5-4 2.5 0 4.5 1.5 4.5 4zM12 17c3 0 4.5-2 4.5-4-2.5 0-4.5 1.5-4.5 4zM12 8c-1-1-1-3 0-5 1 2 1 4 0 5z" />
  </Linea>
);

// La cesta con asa: el boton de la canasta, arriba y el flotante del telefono.
const IconoCestaAsa = ({ clase = 'canasta-icono' }) => (
  <Linea clase={clase}>
    <path d="M4 11h16l-1.5 9h-13z" />
    <path d="M7 11c0-4 2.2-7 5-7s5 3 5 7" />
    <path d="M4 11h16M9 14v3M12 14v3M15 14v3" />
  </Linea>
);

// El chevron de "Volver al inicio" y "Volver a la tienda".
function Chevron({ izquierda, grosor = '1.9' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={izquierda ? 'M14.5 5.5 8 12l6.5 6.5' : 'M9.5 5.5 16 12l-6.5 6.5'} />
    </svg>
  );
}

// La espiga de la franja; la de la derecha es la misma, volteada por CSS.
function Trigo({ derecha }) {
  return (
    <svg className={derecha ? 'sign-trigo is-derecha' : 'sign-trigo'} viewBox="0 0 120 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 14h104" />
      <path d="M52 14C56 7 62 4 68 4C67 10 61 13 52 14Z" />
      <path d="M52 14C56 21 62 24 68 24C67 18 61 15 52 14Z" />
      <path d="M66 14C70 7 76 4 82 4C81 10 75 13 66 14Z" />
      <path d="M66 14C70 21 76 24 82 24C81 18 75 15 66 14Z" />
      <path d="M80 14C84 7 90 4 96 4C95 10 89 13 80 14Z" />
      <path d="M80 14C84 21 90 24 96 24C95 18 89 15 80 14Z" />
      <path d="M94 14C98 7 104 4 110 4C109 10 103 13 94 14Z" />
      <path d="M94 14C98 21 104 24 110 24C109 18 103 15 94 14Z" />
    </svg>
  );
}

export {
  IconoPin, Chevron, Trigo,
  IconoHogaza, IconoGalleta, IconoBotella, IconoTrigo, IconoCestaAsa,
};
