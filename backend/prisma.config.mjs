// ---- Configuracion de Prisma 7 -------------------------------------------
// Donde esta el esquema y a que base se conecta el CLI (db pull, migrate):
// DIRECT_URL, la conexion directa a Postgres (en Supabase, la del puerto
// 5432). El servidor usa DATABASE_URL (el pooler), en src/db.js.
// Sin DIRECT_URL vale DATABASE_URL; las dos salen del entorno o de .env.
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || '' },
});
