// ---- La conexion a la base (capa de datos) -----------------------------
// Un solo PrismaClient para todo el servidor. Prisma 7 habla con Postgres
// por un "adaptador": aqui, el de pg (el cliente de Postgres de Node), con la
// DATABASE_URL de la base de Supabase. Los modelos de src/models/ lo usan.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from './config.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.baseDeDatos }),
});

export { prisma };
