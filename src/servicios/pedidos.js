// ---- Los pedidos en la base -------------------------------------------
// Pagar registra el pedido en la base por la API (POST /pedidos), y Mis
// pedidos los lee de ahi (GET /pedidos): se ven desde cualquier navegador.
// La pagina manda solo lo que se eligio y se escribio; los precios, el IVA,
// el total y el numero los pone la base. Lo que contesta es el registro de
// siempre (numero, fecha, modo, direccion, metodo, sumas y lineas).
import { pedirApi } from './api.js';
import { todosLosPedidos, deLaCuenta } from './cuenta.js';

// La base puede tardar mas que el catalogo: hace cinco cosas en una.
const ESPERA_PEDIDO = 10000;

// Lo que se manda. De la tarjeta, solo sus cuatro ultimos digitos.
const pedidoParaApi = ({ lineas, entrega, factura, metodo, numeroTarjeta }) => ({
  lineas: lineas.map(([, l]) => ({ nombre: l.nombre, cantidad: l.cantidad })),
  modo: entrega.modo === 'domicilio' ? 'domicilio' : 'retiro',
  direccion: entrega.direccion, piso: entrega.piso, referencia: entrega.referencia, notas: entrega.notas,
  metodo,
  ultimos: metodo === 'tarjeta' ? String(numeroTarjeta).replace(/\D/g, '').slice(-4) : '',
  factura: factura.aOtro
    ? { aOtro: true, nombre: factura.nombre, ident: factura.ident, correo: factura.correo, direccion: factura.direccion }
    : { aOtro: false },
});

// Por que no se registro, dicho para quien paga. Si no se registro, tampoco
// se cobro: se dice, para que no lo intente con miedo.
const textoDelFallo = (e) => {
  if (e.estado === 400) return e.message;
  if (e.estado === 401) return 'Tu sesión caducó. Vuelve a iniciar sesión para pagar; tu canasta se queda como está.';
  if (e.estado === 0) return 'No pudimos registrar tu pedido: parece que no hay conexión. No se cobró nada; inténtalo otra vez.';
  return 'No pudimos registrar tu pedido en este momento. No se cobró nada; inténtalo otra vez.';
};

// { pedido } si se registro, o { error } con el texto para la pantalla.
const registrarPedido = async (datos) => {
  try {
    return { pedido: await pedirApi('/pedidos', { metodo: 'POST', cuerpo: pedidoParaApi(datos), sesion: true, espera: ESPERA_PEDIDO }) };
  } catch (e) {
    return { error: textoDelFallo(e) };
  }
};

// Los de la cuenta, el mas nuevo primero: los de la base, mas los que solo
// estan en este navegador (los de antes de que hubiera base). Si la API no
// contesta, solo los de este navegador: mejor algo que nada.
const pedidosDeLaCuenta = async (correo) => {
  const locales = deLaCuenta(await todosLosPedidos(), correo);
  let enBase = [];
  try {
    enBase = (await pedirApi('/pedidos', { sesion: true })).pedidos || [];
  } catch (e) {
    return locales;
  }
  const yaEstan = new Set(enBase.map((p) => p.numero));
  return [...enBase, ...locales.filter((p) => !yaEstan.has(p.numero))]
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
};

export { registrarPedido, pedidosDeLaCuenta };
