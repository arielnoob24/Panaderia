// ---- Modelo: la cuenta en Supabase Auth --------------------------------
// La direccion de entrega y la forma de pago preferidas no son columnas de
// USUARIOS (DIRECCIONES pide canton y calles por separado): viven en los
// metadatos de la cuenta de Auth, como en la Edge Function. Se leen y se
// cambian con la API de administracion de Auth, que pide la clave
// service_role: solo existe en el servidor (SUPABASE_SERVICE_ROLE_KEY).
import { config } from '../config.js';
import { ErrorHttp } from '../errores.js';

const pedirAuth = async (ruta, opciones = {}) => {
  if (!config.supabaseUrl || !config.claveServicio) throw new Error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  const r = await fetch(`${config.supabaseUrl}/auth/v1/admin/users/${ruta}`, {
    ...opciones,
    headers: {
      apikey: config.claveServicio,
      // La service_role de antes es un JWT y va tambien aqui; la secreta
      // nueva (sb_secret_...) no es un JWT y va solo en apikey.
      ...(config.claveServicio.startsWith('eyJ') ? { Authorization: `Bearer ${config.claveServicio}` } : {}),
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (r.status === 404) throw new ErrorHttp(401, 'Inicia sesión otra vez.');
  if (!r.ok) throw new Error(`Supabase Auth respondio ${r.status}`);
  return r.json();
};

// Lo que la pagina guarda en la cuenta: { direccion, metodo }.
const preferencias = (usuario) => ({
  direccion: usuario?.user_metadata?.direccion ?? '',
  metodo: usuario?.user_metadata?.metodo === 'tarjeta' ? 'tarjeta' : 'efectivo',
});

const leerPreferencias = async (authId) => preferencias(await pedirAuth(authId));

const guardarPreferencias = async (authId, { direccion, metodo }) => {
  const actual = await pedirAuth(authId);
  const nuevo = await pedirAuth(authId, {
    method: 'PUT',
    body: JSON.stringify({ user_metadata: { ...actual.user_metadata, direccion, metodo } }),
  });
  return preferencias(nuevo);
};

export { leerPreferencias, guardarPreferencias };
