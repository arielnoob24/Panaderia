// ---- Modelo: pedidos ---------------------------------------------------
// Registrar un pedido escribe en DIRECCIONES, PEDIDOS, DETALLES_PEDIDO,
// PAGOS, CLIENTES y FACTURAS a la vez: lo hace FN_PEDIDOS_REGISTRAR en una
// sola transaccion (si algo falla, no queda nada a medias). Los precios y el
// total los pone la base; lo que mande la pagina sobre precios no cuenta.
import { prisma } from '../db.js';
import { unValor } from './funciones.js';

// Los pedidos de la cuenta, el mas nuevo primero.
const deLaCuenta = async (authId) => (await unValor(prisma.$queryRaw`
  SELECT fn_pedidos_de(${authId}::uuid) AS r`)) || [];

const registrar = (authId, pedido) => unValor(prisma.$queryRaw`
  SELECT fn_pedidos_registrar(${authId}::uuid, ${JSON.stringify(pedido)}::jsonb) AS r`);

export { deLaCuenta, registrar };
