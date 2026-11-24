// ---- Correlation-ID y registro de cada peticion ------------------------
// Cada peticion lleva un identificador: el que mande el cliente en
// X-Correlation-ID o uno nuevo. Va de vuelta en la respuesta y en cada linea
// del registro, asi una queja ("me dio error a las 10:31") se encuentra en
// los logs de Render por ese numero. Al terminar se escribe una linea JSON:
// metodo, ruta, codigo y cuanto tardo.
import { randomUUID } from 'node:crypto';

// Solo se acepta un identificador corto y sin caracteres raros (que no se
// pueda meter basura en los logs).
const VALIDO = /^[A-Za-z0-9._-]{1,100}$/;

function correlacion(req, res, next) {
  const recibido = req.get('X-Correlation-ID');
  req.correlacion = recibido && VALIDO.test(recibido) ? recibido : randomUUID();
  res.set('X-Correlation-ID', req.correlacion);
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    console.log(JSON.stringify({
      nivel: res.statusCode >= 500 ? 'error' : 'info',
      correlacion: req.correlacion,
      metodo: req.method,
      ruta: req.originalUrl,
      estado: res.statusCode,
      ms: Math.round(ms * 10) / 10,
    }));
  });
  next();
}

export { correlacion };
