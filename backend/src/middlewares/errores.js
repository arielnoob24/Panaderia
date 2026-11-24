// ---- Ruta que no existe y manejo global de errores ---------------------
// Van al final de app.js. Cualquier error que llegue con next(error) o se
// lance en un controlador async termina aqui y sale como JSON con su codigo.
// Un 500 no cuenta detalles internos al cliente: se registran con el
// Correlation-ID, y la respuesta lleva ese numero para buscarlos.
import { ErrorHttp } from '../errores.js';

function noEncontrada(req, res, next) {
  next(new ErrorHttp(404, `No existe ${req.method} ${req.originalUrl}.`));
}

// Errores conocidos de otras capas, a su codigo HTTP.
function aErrorHttp(e) {
  if (e instanceof ErrorHttp) return e;
  // express.json() con un cuerpo que no es JSON.
  if (e.type === 'entity.parse.failed') return new ErrorHttp(400, 'El cuerpo no es JSON válido.');
  if (e.type === 'entity.too.large') return new ErrorHttp(400, 'El cuerpo es demasiado grande.');
  // Prisma: un valor unico repetido (otro producto con ese nombre).
  if (e.code === 'P2002') return new ErrorHttp(409, 'Ya existe un registro con ese dato.');
  // Prisma: lo que se queria cambiar o borrar no existe.
  if (e.code === 'P2025') return new ErrorHttp(404, 'No existe.');
  return null;
}

// Express reconoce el manejador de errores porque tiene cuatro parametros.
// eslint-disable-next-line no-unused-vars
function manejarErrores(e, req, res, next) {
  const conocido = aErrorHttp(e);
  if (conocido) return res.status(conocido.estado).json({ error: conocido.message });
  console.error(JSON.stringify({ nivel: 'error', correlacion: req.correlacion, mensaje: e.message, pila: e.stack }));
  return res.status(500).json({ error: 'Algo falló en el servidor. Intenta otra vez.', correlacion: req.correlacion });
}

export { noEncontrada, manejarErrores };
