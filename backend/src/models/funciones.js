// ---- Llamar a las funciones de la base ---------------------------------
// Pedidos y cuentas los escribe la base en una sola transaccion
// (FN_PEDIDOS_REGISTRAR, FN_USUARIOS_GUARDAR... en bd/BD_EL_TRADICIONAL.sql):
// precios, IVA, factura y auditoria viven ahi, y el backend no los repite.
// Prisma las llama con $queryRaw; los valores van como parametros ($1, $2),
// nunca pegados al SQL.
import { ErrorHttp } from '../errores.js';

// El codigo de error de Postgres (SQLSTATE) venga como venga en el error de
// Prisma y su adaptador.
const codigoPg = (e) => e?.meta?.code
  || e?.meta?.driverAdapterError?.cause?.originalCode
  || e?.cause?.originalCode || e?.cause?.code || e?.code;
const mensajePg = (e) => e?.meta?.driverAdapterError?.cause?.originalMessage
  || e?.cause?.originalMessage || e?.meta?.message || e?.message;

// 22023 es un dato que la base no acepta ("Ya no tenemos Palanqueta"): 400
// con su texto, que esta escrito para el cliente. 42501, sin permiso: 403.
const traducir = (e) => {
  const codigo = codigoPg(e);
  if (codigo === '22023') return new ErrorHttp(400, mensajePg(e));
  if (codigo === '42501') return new ErrorHttp(403, mensajePg(e));
  return e;
};

// Corre una consulta que devuelve una sola columna "r" (un JSONB).
const unValor = async (consulta) => {
  try {
    const [fila] = await consulta;
    return fila?.r ?? null;
  } catch (e) {
    throw traducir(e);
  }
};

export { unValor, traducir };
