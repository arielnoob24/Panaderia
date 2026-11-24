// ---- La aplicacion Express ---------------------------------------------
// Las capas, de fuera hacia dentro:
//   middlewares (correlacion, CORS, JSON) -> rutas (src/routes) ->
//   controladores (src/controllers) -> modelos (src/models, Prisma) -> base.
// Al final, la ruta que no existe (404) y el manejo global de errores.
// Se exporta sin escuchar en ningun puerto: las pruebas la levantan solas.
import express from 'express';
import rutas from './routes/index.js';
import { correlacion } from './middlewares/correlacion.js';
import { corsApi } from './middlewares/cors.js';
import { noEncontrada, manejarErrores } from './middlewares/errores.js';

const app = express();
app.disable('x-powered-by');

app.use(correlacion);
app.use(corsApi);
app.use(express.json({ limit: '100kb' }));

app.use('/api', rutas);

app.use(noEncontrada);
app.use(manejarErrores);

export default app;
