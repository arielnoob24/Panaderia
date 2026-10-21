// ---- Los dibujos de linea del fondo: trigo, maiz y pan --------------------
// Dibujados aqui, sin bancos de imagenes (seccion 15 del plan). Cada funcion
// devuelve un <g> con su forma en coordenadas propias, para colocarlo,
// girarlo y escalarlo con 'en'. No son componentes: son trozos de un mismo
// <svg> (FondoDibujo.jsx), que es el que lleva aria-hidden.
//
// Las coordenadas se redondean a una cifra decimal: mas precision solo
// engorda el HTML sin que se note en pantalla.

const r = (n) => Math.round(n * 10) / 10;
const lugar = ({ x = 0, y = 0, giro = 0, escala = 1 }) => `translate(${x} ${y}) rotate(${giro}) scale(${escala})`;

// La espiga: tallo, granos por pares que se achican hacia la punta, y las
// barbas, que son lo que la distingue de una rama cualquiera.
function trazoEspiga(granos = 7) {
  const partes = ['M0 70C1.5 30 .5 -30 0 -92'];
  for (let i = 0; i < granos; i += 1) {
    const y = -18 - i * 11;
    const t = 1 - i * 0.06;
    const w = r(10 * t);
    const h = r(22 * t);
    // Grano izquierdo y derecho: una gota que se aparta del tallo hacia arriba.
    partes.push(`M0 ${y}C${-w} ${r(y - 4)} ${r(-w - 2)} ${r(y - h * 0.6)} ${-w} ${r(y - h)}C${r(-w * 0.4)} ${r(y - h * 0.8)} -1 ${r(y - h * 0.45)} 0 ${y}Z`);
    partes.push(`M0 ${y}C${w} ${r(y - 4)} ${r(w + 2)} ${r(y - h * 0.6)} ${w} ${r(y - h)}C${r(w * 0.4)} ${r(y - h * 0.8)} 1 ${r(y - h * 0.45)} 0 ${y}Z`);
    // Las barbas salen de la punta de cada grano, largas y finas.
    partes.push(`M${-w} ${r(y - h)}L${r(-w - 7)} ${r(y - h - 30)}`);
    partes.push(`M${w} ${r(y - h)}L${r(w + 7)} ${r(y - h - 30)}`);
  }
  partes.push('M0 -92C-4 -100 -1 -110 0 -116C1 -110 4 -100 0 -92Z', 'M0 -116V-150');
  return partes.join('');
}
const ESPIGA = trazoEspiga();

function espiga(en) {
  return <path d={ESPIGA} transform={lugar(en)} />;
}

// Tres espigas abiertas en abanico, atadas por el tallo: la gavilla.
function gavilla(en) {
  return (
    <g transform={lugar(en)}>
      <path d={ESPIGA} transform="rotate(-18)" />
      <path d={ESPIGA} transform="translate(6 -6)" />
      <path d={ESPIGA} transform="translate(10 0) rotate(16)" />
      <path d="M-14 34C-2 40 12 40 24 32M-12 42C0 48 14 47 24 40" />
    </g>
  );
}

// La mazorca: el cuerpo con sus hileras de granos y las hojas que la abrazan
// desde abajo, abiertas como cuando se acaba de deshojar.
const MAZORCA = [
  'M0 -82C14 -82 19 -44 17 -2C15 30 9 50 0 58C-9 50 -15 30 -17 -2C-19 -44 -14 -82 0 -82Z',
  'M-8 -76C-12 -40 -12 12 -6 50M0 -82V58M8 -76C12 -40 12 12 6 50',
  ...Array.from({ length: 12 }, (_, i) => {
    const y = -70 + i * 10.5;
    const a = r(Math.min(16, 9 + Math.sin(((i + 1) / 13) * Math.PI) * 8));
    return `M${-a} ${r(y)}Q0 ${r(y + 4)} ${a} ${r(y)}`;
  }),
  'M0 58C-22 44 -34 6 -30 -46C-22 -6 -12 24 -4 44',
  'M0 58C22 44 34 6 30 -46C22 -6 12 24 4 44',
  'M0 58C-10 48 -26 34 -40 -6C-22 18 -10 34 -2 48',
  'M0 58C2 70 -2 84 -8 96',
].join('');

function mazorca(en) {
  return <path d={MAZORCA} transform={lugar(en)} />;
}

// La hogaza: redonda, apoyada en su base, con las greñas del corte.
const HOGAZA = [
  'M-52 12C-52 -30 -26 -46 0 -46C26 -46 52 -30 52 12C52 20 46 24 38 24H-38C-46 24 -52 20 -52 12Z',
  'M-30 -20C-22 -32 -8 -35 4 -33',
  'M-34 -2C-20 -16 2 -20 18 -16',
  'M-24 14C-8 2 14 -2 32 2',
  'M-44 24C-30 30 30 30 44 24',
];
const HOGAZA_D = HOGAZA.join('');

function hogaza(en) {
  return <path d={HOGAZA_D} transform={lugar(en)} />;
}

// La barra (pan largo), con sus cortes en diagonal.
const BARRA = [
  'M-90 0C-90 -12 -80 -18 -60 -18H60C80 -18 90 -12 90 0C90 12 80 18 60 18H-60C-80 18 -90 12 -90 0Z',
  ...[-56, -24, 8, 40].map((x) => `M${x} 9C${x + 6} 0 ${x + 14} -6 ${x + 24} -10`),
].join('');

function barra(en) {
  return <path d={BARRA} transform={lugar(en)} />;
}

// El pan enrollado: una media luna de capas.
const ENROLLADO = [
  'M-64 18C-60 -10 -36 -34 0 -34C36 -34 60 -10 64 18C52 8 40 6 30 10C22 -6 12 -12 0 -12C-12 -12 -22 -6 -30 10C-40 6 -52 8 -64 18Z',
  'M-30 10C-26 -12 -16 -24 -10 -32M30 10C26 -12 16 -24 10 -32M0 -12V-34',
  'M-48 2C-44 -14 -34 -24 -24 -30M48 2C44 -14 34 -24 24 -30',
].join('');

function enrollado(en) {
  return <path d={ENROLLADO} transform={lugar(en)} />;
}

// Un grano suelto, para salpicar los huecos.
function grano(en) {
  return <path d="M0 -7C4 -4 4 4 0 7C-4 4 -4 -4 0 -7ZM0 -5V5" transform={lugar(en)} />;
}

export { espiga, gavilla, mazorca, hogaza, barra, enrollado, grano };
