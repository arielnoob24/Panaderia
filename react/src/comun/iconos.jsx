// Los dibujos que se repiten en varias partes de la pagina, con el mismo trazo
// que en index.html. Todos son decorativos: el texto de al lado ya dice que son.

// El alfiler del mapa: "Como llegar", "Conoce nuestros locales", "Ver en el mapa".
function IconoPin({ grosor = '1.6' }) {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21.4c0 0 6.8-5.6 6.8-11A6.8 6.8 0 0 0 5.2 10.4c0 5.4 6.8 11 6.8 11Z" />
      <circle cx="12" cy="10.2" r="2.5" />
    </svg>
  );
}

// La carta de "Ver el menu".
function IconoMenu() {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <path d="M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6M9 12h6M9 16h3.5" />
    </svg>
  );
}

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

export { IconoPin, IconoMenu, Chevron, Trigo };
