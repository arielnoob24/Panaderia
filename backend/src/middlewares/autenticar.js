// ---- Autenticacion: quien llama, por su token JWT ----------------------
// La pagina inicia sesion con Supabase Auth y manda su token en
// "Authorization: Bearer <jwt>". Aqui se comprueba la FIRMA del token (que
// lo emitio Supabase y nadie lo cambio), que no haya caducado y que sea para
// usuarios de la app (aud "authenticated"). Si vale, req.usuario dice quien
// es; si no, 401. La API no guarda sesiones: cada peticion trae su token
// (stateless).
//
// La firma se comprueba con:
// - las claves publicas del proyecto (JWKS), si firma con claves nuevas
//   (asimetricas): no hace falta ningun secreto;
// - o SUPABASE_JWT_SECRET, si el proyecto todavia firma con el secreto HS256.
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from '../config.js';
import { ErrorHttp } from '../errores.js';

let claves = null;
const comoVerificar = () => {
  if (config.secretoJwt) return new TextEncoder().encode(config.secretoJwt);
  if (!claves) claves = createRemoteJWKSet(new URL(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`));
  return claves;
};

async function autenticar(req, res, next) {
  const token = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return next(new ErrorHttp(401, 'Inicia sesión otra vez.'));
  try {
    const { payload } = await jwtVerify(token, comoVerificar(), { audience: 'authenticated' });
    // Con "Confirm email" activo, Supabase no da sesion sin el correo
    // verificado; si el token dice lo contrario, tampoco vale.
    if (!payload.sub || !payload.email || payload.user_metadata?.email_verified === false) {
      return next(new ErrorHttp(401, 'Inicia sesión otra vez.'));
    }
    req.usuario = { id: payload.sub, correo: String(payload.email).toLowerCase() };
    return next();
  } catch (e) {
    return next(new ErrorHttp(401, 'Inicia sesión otra vez.'));
  }
}

export { autenticar };
