// ---- La API -----------------------------------------------------------
// La unica puerta de la pagina a la base de datos: la Edge Function "api" de
// Supabase (supabase/functions/api/index.ts). La pagina nunca habla con las
// tablas; le pide las cosas a la API y la API decide que se puede.
// La direccion no es secreta: cualquiera la ve en el navegador. Lo que
// protege la base es que las tablas no dejan entrar a nadie mas que a la API.
import { tokenActual } from './supabase.js';

const API = 'https://ugscqizansixnsuzljtu.supabase.co/functions/v1/api';

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
    r = await window.fetch(`${API}${ruta}`, {
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

export { API, pedirApi, FalloApi };
