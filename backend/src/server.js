// ---- Arranque: la app escucha en su puerto -----------------------------
// Render pone PORT; en tu maquina, 3000. npm start / npm run dev.
import app from './app.js';
import { config } from './config.js';

if (!config.baseDeDatos) console.warn('Falta DATABASE_URL: la API arranca, pero lo que lee la base va a fallar.');
app.listen(config.puerto, () => console.log(`API de El Tradicional en el puerto ${config.puerto}`));
