// ---- Rutas: /api/productos ---------------------------------------------
// Leer es publico (el catalogo). Escribir pide sesion (autenticar, 401) y el
// permiso productos.gestionar (autorizar, 403): el rol Administrador lo tiene.
import { Router } from 'express';
import * as c from '../controllers/productosController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';

const router = Router();
const gestionar = [autenticar, autorizar('productos.gestionar')];

router.get('/', c.listar);
router.get('/:codigo', c.obtener);
router.post('/', gestionar, c.crear);
router.put('/:codigo', gestionar, c.reemplazar);
router.patch('/:codigo', gestionar, c.actualizar);
router.delete('/:codigo', gestionar, c.borrar);

export default router;
