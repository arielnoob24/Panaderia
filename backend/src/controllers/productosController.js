// ---- Controlador: productos --------------------------------------------
// Lee lo que trae la peticion (params, query, body), lo valida, llama al
// modelo y responde JSON con el codigo que corresponde. No sabe de SQL ni de
// Prisma. Express 5 manda solo a manejarErrores lo que falle en un async.
import * as productos from '../models/productos.js';
import { validarProducto } from '../validaciones/producto.js';
import { ErrorHttp } from '../errores.js';

// ?disponible=true|false
const siNo = (v) => {
  if (v === undefined) return undefined;
  if (v === 'true' || v === 'false') return v === 'true';
  throw new ErrorHttp(400, '"disponible" es true o false.');
};

// GET /api/productos -> 200 { productos: [...] }
const listar = async (req, res) => {
  const lista = await productos.listar({ categoria: req.query.categoria, disponible: siNo(req.query.disponible) });
  // Como la Edge Function: el navegador puede reusarla un minuto.
  res.set('Cache-Control', 'public, max-age=60').json({ productos: lista });
};

// GET /api/productos/:codigo -> 200 el producto, 404 si no existe
const obtener = async (req, res) => {
  res.json(await productos.obtener(req.params.codigo));
};

// POST /api/productos -> 201 el producto creado, con Location
const crear = async (req, res) => {
  const nuevo = await productos.crear(validarProducto(req.body), req.cuenta.codigo);
  res.status(201).location(`${req.baseUrl}/${nuevo.codigo}`).json(nuevo);
};

// PUT /api/productos/:codigo -> 200, el producto reemplazado entero
const reemplazar = async (req, res) => {
  res.json(await productos.cambiar(req.params.codigo, validarProducto(req.body), req.cuenta.codigo));
};

// PATCH /api/productos/:codigo -> 200, con solo lo que llego cambiado
const actualizar = async (req, res) => {
  res.json(await productos.cambiar(req.params.codigo, validarProducto(req.body, { parcial: true }), req.cuenta.codigo));
};

// DELETE /api/productos/:codigo -> 200, el producto retirado (agotado)
const borrar = async (req, res) => {
  const p = await productos.retirar(req.params.codigo, req.cuenta.codigo);
  res.json({ mensaje: `${p.nombre} quedó retirado: ya no se puede pedir.`, producto: p });
};

export { listar, obtener, crear, reemplazar, actualizar, borrar };
