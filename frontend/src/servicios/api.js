// ---- La API -----------------------------------------------------------
// La unica puerta de la pagina a la base de datos: la Edge Function "api" de
// Supabase (supabase/functions/api/index.ts). La pagina nunca habla con las
// tablas; le pide las cosas a la API y la API decide que se puede.
// La direccion no es secreta: cualquiera la ve en el navegador. Lo que
// protege la base es que las tablas no dejan entrar a nadie mas que a la API.
import { tokenActual } from './supabase.js';

// La direccion sale de VITE_API_URL (vite.config.js): hoy la Edge Function
// de Supabase; cuando el backend Express este en Render, la suya. El panel
// (/admin/...) sigue en la Edge Function: va a VITE_API_ADMIN_URL.
const API = import.meta.env.VITE_API_URL.replace(/\/$/, '');
const API_ADMIN = import.meta.env.VITE_API_ADMIN_URL.replace(/\/$/, '');

// Si la API no contesta a tiempo se deja de esperar: la pagina no se puede
// quedar en blanco porque el servidor tarde.
const ESPERA = 4000;

// Un fallo de la API, con el codigo HTTP (0 si ni siquiera contesto).
class FalloApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

// Pide una ruta ("/productos") y devuelve el JSON. Con sesion: true manda el
// token de la sesion de Supabase Auth, que es como la API sabe quien llama.
// Lanza FalloApi si no hay red, si tarda mas de ESPERA o si la API responde
// con un error.
const pedirApi = async (ruta, { metodo = 'GET', cuerpo, sesion = false, espera = ESPERA } = {}) => {
  const cabeceras = {};
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (sesion) cabeceras.Authorization = `Bearer ${await tokenActual()}`;
  let r;
  try {
    r = await window.fetch(`${ruta.startsWith('/admin/') ? API_ADMIN : API}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(espera),
    });
  } catch (e) {
    throw new FalloApi('la API no contesto', 0);
  }
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new FalloApi(datos?.error || `la API respondio ${r.status}`, r.status);
  return datos;
};

// El despertador: Render gratis apaga la API tras 15 minutos sin trafico y
// tarda cerca de un minuto en volver. Al abrir la pagina se le toca la puerta
// (/salud) sin esperar respuesta: el catalogo de esa primera visita puede
// salir del respaldo, pero cuando alguien crea su cuenta o paga, la API ya
// esta despierta. Solo con la API en Render; la Edge Function no duerme.
const despertarApi = () => {
  if (!/\.onrender\.com\//.test(`${API}/`)) return;
  window.fetch(`${API}/salud`, { signal: AbortSignal.timeout(90000) }).catch(() => {});
};

export { API, pedirApi, FalloApi, despertarApi };
