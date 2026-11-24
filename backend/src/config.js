// ---- La configuracion, toda del entorno --------------------------------
// Ninguna clave va en el codigo: cada valor sale de una variable de entorno
// (en Render, Environment; en tu maquina, backend/.env, ver .env.example).
// Node 24 carga ese .env solo si se arranca con --env-file (npm run dev).

const lista = (texto) => String(texto || '').split(',').map((s) => s.trim()).filter(Boolean);

const config = {
  puerto: Number(process.env.PORT) || 3000,
  // La conexion de Prisma a la base de Supabase (el pooler, puerto 6543).
  baseDeDatos: process.env.DATABASE_URL || '',
  // Supabase Auth: de ahi salen los tokens JWT de la pagina.
  supabaseUrl: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
  // Solo si el proyecto firma los tokens con el secreto HS256 de antes; con
  // las claves nuevas (asimetricas) se usa el JWKS publico y esto va vacio.
  secretoJwt: process.env.SUPABASE_JWT_SECRET || '',
  // Para guardar direccion y forma de pago en la cuenta de Auth (/cuenta).
  claveServicio: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  // Quien puede llamar desde un navegador (CORS). Un * vale por un trozo de
  // nombre: https://*--el-tradicional-panaderia.netlify.app
  origenes: lista(process.env.ORIGENES_PERMITIDOS || 'https://arielnoob24.github.io,https://el-tradicional-panaderia.netlify.app,https://*--el-tradicional-panaderia.netlify.app'),
};

export { config };
