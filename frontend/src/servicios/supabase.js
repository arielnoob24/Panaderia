// ---- Supabase Auth -----------------------------------------------------
// La pagina usa Supabase solo para la cuenta: crear, verificar el correo con
// el codigo de 6 cifras, entrar, salir y cambiar la contrasena. Los datos de
// la cuenta y todo lo demas pasan por la API (servicios/api.js).
//
// La clave publishable es publica a proposito: con ella solo se puede hablar
// con Auth, porque las tablas no dejan entrar a nadie mas que a la API. La
// sesion la guarda supabase-js en localStorage (sb-...-auth-token) y la
// renueva sola.
import { createClient } from '@supabase/supabase-js';

// Las dos salen de las variables VITE_ (vite.config.js y .env.example).
const URL_PROYECTO = import.meta.env.VITE_SUPABASE_URL;
const CLAVE_PUBLICA = import.meta.env.VITE_SUPABASE_CLAVE_PUBLICA;

const supabase = createClient(URL_PROYECTO, CLAVE_PUBLICA, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

// El token de la sesion abierta, para mandarselo a la API, o '' sin sesion.
const tokenActual = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  } catch (e) {
    return '';
  }
};

export { supabase, tokenActual, URL_PROYECTO };
