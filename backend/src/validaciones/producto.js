// ---- Que un producto venga bien (400 si no) ----------------------------
// Las mismas reglas que el catalogo de la pagina
// (frontend/src/servicios/reglasCatalogo.js) y que los CHECK de la base: la
// API no se fia de lo que le llega. Devuelve los datos limpios.
// - completo (POST y PUT): todo lo obligatorio tiene que estar;
// - parcial (PATCH): solo se revisa lo que llega, y algo tiene que llegar.
import { ErrorHttp } from '../errores.js';

const CAMPOS = ['nombre', 'categoria', 'foto', 'alt', 'disponible', 'destacado', 'etiqueta', 'iva', 'precio', 'tamanos'];
const OBLIGATORIOS = ['nombre', 'categoria', 'foto', 'alt', 'iva'];

const mal = (mensaje) => { throw new ErrorHttp(400, mensaje); };
const texto = (v, campo, max) => {
  if (typeof v !== 'string' || !v.trim()) mal(`Falta "${campo}".`);
  if (v.trim().length > max) mal(`"${campo}" pasa de ${max} caracteres.`);
  return v.trim().replace(/\s+/g, ' ');
};
// Dolares, mas de 0 y con hasta dos decimales, como NUMERIC(8,2) y el CHECK
// de PRODUCTOS_TAMANOS en la base.
const dinero = (v, campo) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || v >= 1000000) mal(`"${campo}" tiene que ser un precio mayor que 0.`);
  if (Math.round(v * 100) !== Math.round(v * 1000) / 10) mal(`"${campo}" lleva más de dos decimales.`);
  return v;
};

const validarProducto = (cuerpo, { parcial = false } = {}) => {
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) mal('El cuerpo tiene que ser un objeto JSON.');
  const sobran = Object.keys(cuerpo).filter((k) => !CAMPOS.includes(k) && k !== 'codigo');
  if (sobran.length) mal(`No se conoce: ${sobran.join(', ')}.`);
  if (!parcial) for (const c of OBLIGATORIOS) if (cuerpo[c] === undefined) mal(`Falta "${c}".`);
  if (!parcial && cuerpo.precio === undefined && cuerpo.tamanos === undefined) mal('Falta "precio" o "tamanos".');
  if (parcial && !Object.keys(cuerpo).some((k) => CAMPOS.includes(k))) mal('No llegó nada que cambiar.');

  const d = {};
  if (cuerpo.nombre !== undefined) d.nombre = texto(cuerpo.nombre, 'nombre', 80);
  if (cuerpo.categoria !== undefined) d.categoria = texto(cuerpo.categoria, 'categoria', 40).toLowerCase();
  if (cuerpo.foto !== undefined) {
    d.foto = texto(cuerpo.foto, 'foto', 150);
    // La raiz del archivo, sin ancho ni extension (pan-redondo, no pan-redondo-420.jpg).
    if (/\.(jpg|jpeg|png|webp|avif)$/i.test(d.foto)) mal('"foto" va sin extensión: la raíz del nombre del archivo.');
  }
  if (cuerpo.alt !== undefined) d.alt = texto(cuerpo.alt, 'alt', 200);
  for (const c of ['disponible', 'destacado']) {
    if (cuerpo[c] !== undefined) {
      if (typeof cuerpo[c] !== 'boolean') mal(`"${c}" es true o false.`);
      d[c] = cuerpo[c];
    }
  }
  if (cuerpo.etiqueta !== undefined) d.etiqueta = cuerpo.etiqueta === null ? null : texto(cuerpo.etiqueta, 'etiqueta', 30);
  if (cuerpo.iva !== undefined) {
    if (!['0', '4', '5'].includes(cuerpo.iva)) mal('"iva" es el código del SRI: "0" (0%), "4" (15%) o "5" (5%).');
    d.iva = cuerpo.iva;
  }
  if (cuerpo.tamanos !== undefined) {
    if (!Array.isArray(cuerpo.tamanos) || !cuerpo.tamanos.length) mal('"tamanos" es una lista con al menos un tamaño.');
    d.tamanos = cuerpo.tamanos.map((t, i) => ({
      valor: texto(t?.valor, `tamanos[${i}].valor`, 20),
      precio: dinero(t?.precio, `tamanos[${i}].precio`),
    }));
    if (new Set(d.tamanos.map((t) => t.valor)).size !== d.tamanos.length) mal('Hay un tamaño repetido.');
    if (cuerpo.precio !== undefined && cuerpo.precio !== d.tamanos[0].precio) mal('"precio" tiene que ser el del primer tamaño.');
  } else if (cuerpo.precio !== undefined) {
    d.precio = dinero(cuerpo.precio, 'precio');
    // Al crear o reemplazar, un precio solo es un tamaño "Único".
    if (!parcial) d.tamanos = [{ valor: 'Único', precio: d.precio }];
  }
  return d;
};

export { validarProducto };
