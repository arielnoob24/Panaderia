// ---- Autorizacion: si quien llama puede hacer esto ---------------------
// Va despues de autenticar. Busca la cuenta en USUARIOS y mira si su rol
// tiene el permiso pedido (ROLES 1:N USUARIOS, ROLES N:M PERMISOS por
// ROLES_PERMISOS, en src/models/usuarios.js). Sin cuenta o sin el permiso,
// 403. Si lo tiene, deja la cuenta en req.cuenta (la auditoria la usa).
import { ErrorHttp } from '../errores.js';
import { cuentaConPermisos } from '../models/usuarios.js';

const autorizar = (permiso) => async (req, res, next) => {
  try {
    const cuenta = await cuentaConPermisos(req.usuario.id);
    if (!cuenta || !cuenta.activa || !cuenta.permisos.includes(permiso)) {
      return next(new ErrorHttp(403, 'Tu cuenta no tiene permiso para esto.'));
    }
    req.cuenta = cuenta;
    return next();
  } catch (e) {
    return next(e);
  }
};

export { autorizar };
