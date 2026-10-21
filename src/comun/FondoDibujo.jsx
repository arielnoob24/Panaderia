// ---- El fondo dibujado de cada vista --------------------------------------
// Trigo, maiz y pan en linea fina, detras del contenido, para que la masa no
// se vea vacia (seccion 15 del plan). Distinto en cada vista y quieto: es
// papel pintado, no algo que mirar. Va con aria-hidden porque no dice nada
// que no diga ya la pagina, y sin eventos de puntero para no tapar nada.
//
// Cada pieza es un <svg> anclado a una esquina con un ancho fijo
// (vistas.css), y no un dibujo que se estira: asi no se deforma ni se recorta
// distinto en cada pantalla. El color y lo tenue los pone vistas.css.
import { barra, enrollado, espiga, gavilla, grano, hogaza, mazorca } from './trazos.jsx';

// Cada vista: sus piezas, con su caja (viewBox) y donde va.
const PIEZAS = {
  // El mostrador oscuro de #/: una gavilla y una mazorca tumbada arriba,
  // entre el titulo y el enlace a la tienda, donde la banda queda libre.
  inicio: [
    { donde: 'arriba-derecha', caja: '-150 -190 300 290', trazos: [gavilla({ giro: 14, escala: 1.15 })] },
    { donde: 'arriba-izquierda', caja: '-90 -110 180 230', trazos: [mazorca({ giro: -28 })] },
  ],
  // #/nosotros, sobre la masa: la gavilla grande junto al texto y unas
  // espigas sueltas arriba, junto a la foto.
  nosotros: [
    { donde: 'abajo-derecha', caja: '-150 -190 300 290', trazos: [gavilla({ giro: -10, escala: 1.2 })] },
    { donde: 'arriba-izquierda', caja: '-140 -60 280 120', trazos: [espiga({ x: -40, y: 20, giro: 70, escala: 0.6 }), espiga({ x: 40, y: 10, giro: 100, escala: 0.55 }), grano({ x: 110, y: -30, giro: 40 }), grano({ x: -120, y: -36, giro: -20 })] },
  ],
  // Los principios, en la banda oscura: dos espigas tumbadas.
  principios: [
    { donde: 'abajo-derecha', caja: '-170 -80 340 160', trazos: [espiga({ x: -20, y: 30, giro: -78, escala: 0.9 }), espiga({ x: 30, y: 50, giro: -96, escala: 0.8 })] },
  ],
  // La tienda: panes a los lados del titulo.
  tienda: [
    { donde: 'arriba-izquierda', caja: '-110 -70 220 140', trazos: [barra({ giro: -14, escala: 1 }), grano({ x: 80, y: 46, giro: 20 }), grano({ x: -86, y: -46, giro: -40 })] },
    { donde: 'arriba-derecha', caja: '-120 -80 240 160', trazos: [hogaza({ x: -30, y: 10, escala: 1.1 }), enrollado({ x: 70, y: -30, giro: 18, escala: 0.62 })] },
  ],
  // Las bandas de la cuenta, una por paso: a la derecha del titulo, que es
  // corto, y lejos de la hoja de papel que cuelga debajo.
  'cuenta-entrar': [
    { donde: 'arriba-derecha', caja: '-170 -70 340 140', trazos: [espiga({ x: -10, y: 30, giro: 104, escala: 0.75 }), grano({ x: -140, y: -20, giro: 30 }), grano({ x: 120, y: 40, giro: -20 })] },
  ],
  'cuenta-crear': [
    { donde: 'arriba-derecha', caja: '-170 -80 340 160', trazos: [espiga({ x: -40, y: 10, giro: 82, escala: 0.8 }), espiga({ x: 60, y: 40, giro: 96, escala: 0.7 }), grano({ x: -150, y: 50, giro: 30 })] },
  ],
  'cuenta-verificar': [
    { donde: 'arriba-derecha', caja: '-90 -110 180 230', trazos: [mazorca({ giro: 62 })] },
  ],
  // Recuperar: un pan enrollado, que da la vuelta sobre si mismo como la
  // contrasena que se rehace, y unos granos sueltos.
  'cuenta-recuperar': [
    { donde: 'arriba-derecha', caja: '-140 -80 280 160', trazos: [enrollado({ x: 10, y: 0, giro: -24, escala: 0.85 }), grano({ x: -110, y: 40, giro: 30 }), grano({ x: 112, y: -44, giro: -24 }), grano({ x: 96, y: 52, giro: 60 })] },
  ],
  'cuenta-datos': [
    { donde: 'arriba-derecha', caja: '-80 -60 160 110', trazos: [hogaza({ escala: 1 })] },
  ],
  'cuenta-pedidos': [
    { donde: 'arriba-derecha', caja: '-120 -80 240 160', trazos: [enrollado({ x: -40, y: 0, giro: -12, escala: 0.7 }), barra({ x: 50, y: 20, giro: 10, escala: 0.6 })] },
  ],
  // #/contacto: maiz cruzado abajo a la izquierda y una hogaza a la derecha.
  contacto: [
    { donde: 'abajo-izquierda', caja: '-110 -120 220 240', trazos: [mazorca({ x: -20, giro: -20 }), mazorca({ x: 30, y: 10, giro: 22, escala: 0.9 })] },
    { donde: 'arriba-derecha', caja: '-80 -60 160 110', trazos: [hogaza({ escala: 1 })] },
  ],
};

function FondoDibujo({ vista }) {
  const piezas = PIEZAS[vista] || [];
  return (
    <div className={`fondo-dibujo fondo-${vista}`} aria-hidden="true">
      {piezas.map((p) => (
        <svg key={p.donde} className={`fondo-pieza is-${p.donde}`} viewBox={p.caja} focusable="false">
          {p.trazos.map((t, i) => <g key={i}>{t}</g>)}
        </svg>
      ))}
    </div>
  );
}

export default FondoDibujo;
