// ---- La API -----------------------------------------------------------
// La unica puerta de la pagina a la base de datos: la Edge Function "api" de
// Supabase (supabase/functions/api/index.ts). La pagina nunca habla con las
// tablas; le pide las cosas a la API y la API decide que se puede.
// La direccion no es secreta: cualquiera la ve en el navegador. Lo que
// protege la base es que las tablas no dejan entrar a nadie mas que a la API.
const API = 'https://ugscqizansixnsuzljtu.supabase.co/functions/v1/api';

// Si la API no contesta a tiempo se deja de esperar: la pagina no se puede
// quedar en blanco porque el servidor tarde.
const ESPERA = 4000;

// Pide una ruta ("/productos") y devuelve el JSON. Lanza si no hay red, si
// tarda mas de ESPERA o si la API responde con un error.
const pedirApi = async (ruta, { espera = ESPERA } = {}) => {
  const r = await window.fetch(`${API}${ruta}`, { signal: AbortSignal.timeout(espera) });
  const cuerpo = await r.json().catch(() => null);
  if (!r.ok) throw new Error(cuerpo?.error || `la API respondio ${r.status}`);
  return cuerpo;
};

export { API, pedirApi };
