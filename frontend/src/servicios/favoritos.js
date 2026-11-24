// ---- Los productos favoritos de cada cuenta ------------------------------
// Detras del sitio no hay servidor para esto: los favoritos se guardan en este
// navegador, uno por correo, para que dos cuentas que comparten computador no
// se mezclen. Es una lista de nombres de producto (los del catalogo, sin el
// tamano: el favorito es el producto).
//
// Todo va en try/catch: en ventana privada escribir lanza, y no poder guardar
// un favorito no puede tumbar la pagina.
const PREFIJO = 'tradicional:favoritos:';
const MAX_FAVORITOS = 50;

const claveDe = (correo) => `${PREFIJO}${String(correo || '').trim().toLowerCase()}`;

// Lo guardado lo puede tocar cualquiera a mano: solo se aceptan textos, sin
// repetir, hasta el tope.
const limpiar = (dato) => {
  if (!Array.isArray(dato)) return [];
  const vistos = new Set();
  for (const n of dato) {
    if (typeof n === 'string' && n.trim()) vistos.add(n);
    if (vistos.size >= MAX_FAVORITOS) break;
  }
  return [...vistos];
};

const leerFavoritos = (correo) => {
  if (!correo) return [];
  try { return limpiar(JSON.parse(localStorage.getItem(claveDe(correo)))); } catch { return []; }
};

const guardarFavoritos = (correo, lista) => {
  if (!correo) return;
  try { localStorage.setItem(claveDe(correo), JSON.stringify(limpiar(lista))); } catch { /* sin almacenamiento */ }
};

export { MAX_FAVORITOS, leerFavoritos, guardarFavoritos, limpiar };
