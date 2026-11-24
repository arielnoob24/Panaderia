// ---- Una copia local de la base, sin Supabase ni credenciales ----------
// Carga bd/BD_EL_TRADICIONAL.sql (el mismo script que crea la base de
// Supabase) en PGlite, que es PostgreSQL compilado a WebAssembly, y la sirve
// por un puerto local con el protocolo de Postgres. Prisma y pg se conectan
// a ella como a cualquier Postgres: asi se prueba el backend con la base de
// verdad (tablas, reglas, triggers y funciones), pero en memoria y sin tocar
// la de Supabase.
//
// Uso en las pruebas: const base = await levantarBase(); ... base.url ...
// Uso a mano (para prisma db pull): npm run base-local, y queda escuchando.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const SCRIPT = fileURLToPath(new URL('../../bd/BD_EL_TRADICIONAL.sql', import.meta.url));

// El script tiene dos pasos: crear la base (CREATE DATABASE) y, despues de
// \connect, todo lo de dentro. PGlite ya es una base: se corre el paso 2,
// como hace .claude/skills/probar-bd.
const paso2 = () => {
  const sql = readFileSync(SCRIPT, 'utf8');
  const marca = sql.match(/^\\connect\s+\S+\s*$/m);
  if (!marca) throw new Error('bd/BD_EL_TRADICIONAL.sql no tiene la linea \\connect');
  return sql.slice(marca.index + marca[0].length);
};

// Un puerto libre que elige el sistema.
const puertoLibre = () => new Promise((listo, mal) => {
  const s = createServer();
  s.unref();
  s.on('error', mal);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => listo(port)); });
});

const levantarBase = async ({ puerto } = {}) => {
  const db = new PGlite();
  await db.exec(`SET timezone TO 'America/Guayaquil';`);
  await db.exec(paso2());
  const port = puerto || await puertoLibre();
  const servidor = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 10 });
  await servidor.start();
  return {
    db,
    url: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable`,
    cerrar: async () => { await servidor.stop(); await db.close(); },
  };
};

export { levantarBase };

// Corrido directamente: se queda escuchando hasta Ctrl+C.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const base = await levantarBase({ puerto: Number(process.env.PUERTO) || 54329 });
  console.log(`Base local lista (bd/BD_EL_TRADICIONAL.sql en PGlite):\n  ${base.url}\nCtrl+C para cerrarla.`);
}
