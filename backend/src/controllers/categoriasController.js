// ---- Controlador: categorias -------------------------------------------
import * as categorias from '../models/categorias.js';

// GET /api/categorias -> 200 { categorias: [{ slug, nombre, productos }] }
const listar = async (req, res) => {
  res.json({ categorias: await categorias.listar() });
};

// GET /api/categorias/:slug -> 200 la categoria con sus productos, 404 si no existe
const obtener = async (req, res) => {
  res.json(await categorias.obtener(req.params.slug));
};

export { listar, obtener };
