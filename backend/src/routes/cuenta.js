// ---- Rutas: /api/cuenta (todas piden sesion) ---------------------------
import { Router } from 'express';
import * as c from '../controllers/cuentaController.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = Router();
router.use(autenticar);
router.get('/', c.leer);
router.post('/', c.guardarCuenta);
router.put('/', c.guardarCuenta);

export default router;
