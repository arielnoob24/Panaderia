// ---- Controlador: la cuenta de quien llama -----------------------------
// Igual que /cuenta de la Edge Function: nombre y telefono en USUARIOS;
// direccion y forma de pago, en la cuenta de Supabase Auth.
import { porAuth, guardar } from '../models/usuarios.js';
import { leerPreferencias, guardarPreferencias } from '../models/authSupabase.js';
import { validarCuenta, partirNombre } from '../validaciones/cuenta.js';
import { ErrorHttp } from '../errores.js';

// Lo que la pagina ve de la cuenta.
const aCuenta = (fila, pref) => ({
  nombre: `${fila.usu_nombres} ${fila.usu_apellidos}`,
  correo: fila.usu_correo,
  telefono: String(fila.usu_celular).slice(1),
  direccion: pref.direccion,
  metodo: pref.metodo,
});

const SIN_DATOS = 'Esta cuenta todavía no tiene datos.';

// GET /api/cuenta -> 200 los datos, 404 si aun no tiene fila en USUARIOS
const leer = async (req, res) => {
  const fila = await porAuth(req.usuario.id);
  if (!fila) throw new ErrorHttp(404, SIN_DATOS);
  res.json(aCuenta(fila, await leerPreferencias(req.usuario.id)));
};

// POST /api/cuenta -> 201 la fila nueva al verificar el correo (200 si ya existia)
// PUT  /api/cuenta -> 200 los datos cambiados, 404 si aun no tiene fila
const guardarCuenta = async (req, res) => {
  const datos = validarCuenta(req.body);
  const fila = await porAuth(req.usuario.id);
  if (req.method === 'PUT' && !fila) throw new ErrorHttp(404, SIN_DATOS);
  const pref = await guardarPreferencias(req.usuario.id, { direccion: datos.direccion, metodo: datos.metodo });
  // Verificado en otra pestana: la fila ya esta, se devuelve como esta.
  if (req.method === 'POST' && fila) return res.json(aCuenta(fila, pref));
  const { nombres, apellidos } = partirNombre(datos.nombre);
  const guardada = await guardar({ authId: req.usuario.id, correo: req.usuario.correo, nombres, apellidos, celular: `0${datos.telefono}` });
  return res.status(req.method === 'POST' ? 201 : 200).json(aCuenta(guardada, pref));
};

export { leer, guardarCuenta };
