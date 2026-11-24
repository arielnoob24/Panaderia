// ---- Rutas: /api/categorias (publicas, solo lectura) -------------------
import { Router } from 'express';
import * as c from '../controllers/categoriasController.js';

const router = Router();
router.get('/', c.listar);
router.get('/:slug', c.obtener);

export default router;
