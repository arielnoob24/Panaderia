// Genera las paginas HTML del sitio a partir de index.html (npm run paginas).
// Cada pantalla es su propio archivo (src/comun/paginas.js); todas cargan el
// mismo script y solo cambian el titulo, la descripcion y la direccion
// canonica. Si cambia index.html, se vuelve a correr y se commitean los dos.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'https://arielnoob24.github.io/Panaderia/';
const raiz = (archivo) => fileURLToPath(new URL(`../${archivo}`, import.meta.url));

// archivo -> [titulo, descripcion]
const PAGINAS = {
  'nosotros.html': ['Nosotros', 'La historia de El Tradicional: masa madre, horno de leña y recetas de casa, en Tena.'],
  'tienda.html': ['Tienda', 'El catálogo de El Tradicional: panes, dulces y bebidas, con su precio y su foto.'],
  'contacto.html': ['Contacto', 'Dónde estamos, el horario y cómo escribirnos o llamarnos.'],
  'entrar.html': ['Entrar', 'Entra a tu cuenta de El Tradicional para pedir y ver tus pedidos.'],
  'crear-cuenta.html': ['Crear cuenta', 'Crea tu cuenta de El Tradicional con tu correo.'],
  'verificar.html': ['Verificar el correo', 'Escribe el código de seis cifras que llegó a tu correo.'],
  'recuperar.html': ['Recuperar la contraseña', 'Recupera el acceso a tu cuenta de El Tradicional.'],
  'cuenta.html': ['Mis datos', 'Tus datos y tu forma de pago en El Tradicional.'],
  'mis-pedidos.html': ['Mis pedidos', 'Tus pedidos anteriores en El Tradicional, para pedirlos otra vez.'],
  'favoritos.html': ['Mis favoritos', 'Tus productos favoritos en El Tradicional, para agregarlos a la canasta de una vez.'],
  'canasta-fija.html': ['Mi canasta predeterminada', 'Tu canasta de siempre en El Tradicional, lista para pedir cuando quieras.'],
  'pago.html': ['Forma de pago', 'Tu forma de pago preferida en El Tradicional.'],
  'confirmar.html': ['Confirmar el pedido', 'Revisa tu canasta, elige la entrega y paga.'],
  'comprobante.html': ['Comprobante', 'El comprobante de tu pedido en El Tradicional.'],
  'admin.html': ['Panel', 'El panel de quien atiende el local.'],
};

const portada = readFileSync(raiz('index.html'), 'utf8');
const cambiar = (texto, antes, despues) => {
  if (!texto.includes(antes)) throw new Error(`index.html ya no trae: ${antes}`);
  return texto.replace(antes, () => despues);
};
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

for (const [archivo, [titulo, descripcion]] of Object.entries(PAGINAS)) {
  const completo = `${titulo} | El Tradicional`;
  let html = portada;
  html = cambiar(html, '<title>El Tradicional | Panadería &amp; Pastelería</title>', `<title>${esc(completo)}</title>`);
  html = cambiar(html, 'content="El Tradicional: panadería y pastelería con pan recién horneado, pasteles y dulces hechos como antes."', `content="${esc(descripcion)}"`);
  html = cambiar(html, `<link rel="canonical" href="${BASE}">`, `<link rel="canonical" href="${BASE}${archivo}">`);
  html = cambiar(html, `<meta property="og:url" content="${BASE}">`, `<meta property="og:url" content="${BASE}${archivo}">`);
  html = cambiar(html, '<meta property="og:title" content="El Tradicional | Panadería &amp; Pastelería">', `<meta property="og:title" content="${esc(completo)}">`);
  html = cambiar(html, '<meta name="twitter:title" content="El Tradicional | Panadería &amp; Pastelería">', `<meta name="twitter:title" content="${esc(completo)}">`);
  writeFileSync(raiz(archivo), html);
}
console.log(`${Object.keys(PAGINAS).length} paginas escritas.`);
console.log(Object.keys(PAGINAS).join('\n'));
