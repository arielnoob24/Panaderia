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

// La rebanada de pastel: Dulces y pasteles en la cinta.
const IconoPastel = ({ clase }) => (
  <Linea clase={clase}>
    <path d="M4 11l14-5v13H4z" />
    <path d="M4 15h14M4 11h14" />
    <path d="M14 4.5c.5-1.2 1.6-1.6 2.5-1" />
  </Linea>
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

// La flecha de "Toda la tienda".
const IconoFlecha = ({ clase }) => (
  <Linea clase={clase}>
    <path d="M4 12h15M14 6l6 6-6 6" />
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

// El chevron de las flechas de la fila y de "Volver al inicio".
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
  IconoHogaza, IconoPastel, IconoBotella, IconoTrigo, IconoFlecha, IconoCestaAsa,
};
