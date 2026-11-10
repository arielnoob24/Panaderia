// ---- La canasta predeterminada de cada cuenta ----------------------------
// Una sola por cuenta, guardada en este navegador por correo (como los
// favoritos, servicios/favoritos.js). Es una lista de { nombre, cantidad }:
// el nombre es el de la linea de la canasta, con el tamano dentro ("Coca-Cola
// 2 L"), y el precio no se guarda, porque siempre se pide al de hoy.
//
// Todo va en try/catch: en ventana privada escribir lanza.
import { MAX_UNIDADES } from './state.js';

const PREFIJO = 'tradicional:canasta-fija:';
const MAX_LINEAS = 30;

const claveDe = (correo) => `${PREFIJO}${String(correo || '').trim().toLowerCase()}`;

// Lo guardado lo puede tocar cualquiera a mano: nombre en texto, cantidad
// entera entre 1 y el tope, sin repetir nombres.
const limpiar = (dato) => {
  if (!Array.isArray(dato)) return [];
  const vistos = new Map();
  for (const l of dato) {
    const nombre = typeof l?.nombre === 'string' ? l.nombre.trim() : '';
    const cantidad = Math.floor(Number(l?.cantidad));
    if (!nombre || !Number.isFinite(cantidad) || cantidad < 1) continue;
    if (!vistos.has(nombre)) vistos.set(nombre, { nombre, cantidad: Math.min(cantidad, MAX_UNIDADES) });
    if (vistos.size >= MAX_LINEAS) break;
  }
  return [...vistos.values()];
};

const leerCanastaFija = (correo) => {
  if (!correo) return [];
  try { return limpiar(JSON.parse(localStorage.getItem(claveDe(correo)))); } catch { return []; }
};

const guardarCanastaFija = (correo, lineas) => {
  if (!correo) return;
  try { localStorage.setItem(claveDe(correo), JSON.stringify(limpiar(lineas))); } catch { /* sin almacenamiento */ }
};

export { MAX_LINEAS, leerCanastaFija, guardarCanastaFija, limpiar };
