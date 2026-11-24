// ---- Controlador: los pedidos de quien llama ---------------------------
import * as pedidos from '../models/pedidos.js';
import { ErrorHttp } from '../errores.js';

// GET /api/pedidos -> 200 { pedidos: [...] }, el mas nuevo primero
const listar = async (req, res) => {
  res.json({ pedidos: await pedidos.deLaCuenta(req.usuario.id) });
};

// POST /api/pedidos -> 201 el pedido registrado; 400 si la base no lo
// acepta ("Ya no tenemos Palanqueta", con su texto para el cliente)
const registrar = async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new ErrorHttp(400, 'El pedido no llegó bien.');
  res.status(201).json(await pedidos.registrar(req.usuario.id, req.body));
};

export { listar, registrar };
