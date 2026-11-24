// ---- Modelo: cuentas (USUARIOS, ROLES, PERMISOS) -----------------------
// La cuenta se encuentra por USU_CodigoAuth, el id que le dio Supabase Auth.
// Relaciones que se usan: ROLES 1:N USUARIOS, y ROLES N:M PERMISOS a traves
// de ROLES_PERMISOS (en el modelo no hay N:N directas: van por una entidad
// debil, y Prisma las sigue con include).
import { prisma } from '../db.js';
import { unValor } from './funciones.js';

const porAuth = (authId) => prisma.usuarios.findUnique({
  where: { usu_codigoauth: authId },
  select: { usu_codigo: true, usu_nombres: true, usu_apellidos: true, usu_correo: true, usu_celular: true, usu_activo: true },
});

// La cuenta con su rol y los nombres de sus permisos, o null.
const cuentaConPermisos = async (authId) => {
  const u = await prisma.usuarios.findUnique({
    where: { usu_codigoauth: authId },
    include: { roles: { include: { roles_permisos: { include: { permisos: true } } } } },
  });
  if (!u) return null;
  return {
    codigo: u.usu_codigo,
    activa: u.usu_activo,
    rol: u.roles.rol_nombre,
    permisos: u.roles.roles_permisos.map((rp) => rp.permisos.per_nombre),
  };
};

// Crea la fila de la cuenta (rol Cliente) o la pone al dia, con
// FN_USUARIOS_GUARDAR, que ademas deja en AUDITORIAS que lo hizo ella misma.
const guardar = ({ authId, correo, nombres, apellidos, celular }) => unValor(prisma.$queryRaw`
  SELECT fn_usuarios_guardar(${authId}::uuid, ${correo}, ${nombres}, ${apellidos}, ${celular}) AS r`);

export { porAuth, cuentaConPermisos, guardar };
