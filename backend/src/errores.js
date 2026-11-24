// Un error con su codigo HTTP: lo lanza cualquier capa (controlador, modelo,
// middleware) y lo convierte en respuesta el manejador global
// (middlewares/errores.js). 400 datos mal, 401 sin sesion, 403 sin permiso,
// 404 no existe, 409 choca con lo que ya hay.
class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export { ErrorHttp };
