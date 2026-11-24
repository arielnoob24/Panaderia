// ---- Rutas: /api/pedidos (todas piden sesion) --------------------------
import { Router } from 'express';
import * as c from '../controllers/pedidosController.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = Router();
router.use(autenticar);
router.get('/', c.listar);
router.post('/', c.registrar);

export default router;
