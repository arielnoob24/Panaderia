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

const URL_PROYECTO = 'https://ugscqizansixnsuzljtu.supabase.co';
const CLAVE_PUBLICA = 'sb_publishable_T4ayAx_e96H98bv_dlnCrg_AncGFwos';

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
