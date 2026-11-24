// ---- CORS: que paginas pueden llamar a la API desde el navegador -------
// Las de ORIGENES_PERMITIDOS (src/config.js) y la de tu computador en
// cualquier puerto (npm run dev, npm run preview). Un * en la lista vale por
// un trozo de nombre (las vistas previas de rama de Netlify). Al resto, el
// navegador no le deja leer la respuesta.
import cors from 'cors';
import { config } from '../config.js';

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// "https://*--sitio.netlify.app" -> /^https:\/\/[a-z0-9-]+--sitio\.netlify\.app$/
const aPatron = (origen) => new RegExp(`^${origen.split('*').map((t) => t.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('[a-z0-9-]+')}$`);
const PERMITIDOS = config.origenes.map(aPatron);

const permitido = (origen) => LOCAL.test(origen) || PERMITIDOS.some((p) => p.test(origen));

const corsApi = cors({
  // Sin Origin (curl, Render revisando /api/salud) no es un navegador: pasa.
  origin: (origen, listo) => listo(null, !origen || permitido(origen)),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Correlation-ID'],
  exposedHeaders: ['X-Correlation-ID'],
  maxAge: 600,
});

export { corsApi, permitido };
