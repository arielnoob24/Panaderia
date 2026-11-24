// ---- Todas las rutas de la API, bajo /api ------------------------------
import { Router } from 'express';
import productos from './productos.js';
import categorias from './categorias.js';
import cuenta from './cuenta.js';
import pedidos from './pedidos.js';

const router = Router();

// Para Render (Health Check Path) y para saber si la API esta arriba. No
// toca la base: sin DATABASE_URL todavia, la API igual arranca.
router.get('/salud', (req, res) => res.json({ estado: 'bien' }));

router.use('/productos', productos);
router.use('/categorias', categorias);
router.use('/cuenta', cuenta);
router.use('/pedidos', pedidos);

export default router;
