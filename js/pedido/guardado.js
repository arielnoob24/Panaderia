// ---- El pedido guardado, sin pantalla ----------------------------------
// Como se lee y como se escribe el pedido a medias en localStorage. Vive
// aparte de cart.js porque cart.js arma el panel al cargarse, y la version en
// React (react/, seccion 15 del plan) necesita estas mismas reglas sin ese
// panel: asi los dos sitios leen y escriben el mismo formato, y un pedido
// guardado en uno sigue ahi cuando el otro lo reemplace.
//
// Aqui no se toca localStorage: quien llama lee y escribe, con su try/catch.
// Esto solo dice que se acepta de lo leido y como queda lo que se guarda.
import { MAX_UNIDADES } from '../comun/state.js';

// Lo de la entrega y la factura cuando no hay nada guardado.
const ENTREGA_VACIA = { modo: 'retiro', direccion: '', piso: '', referencia: '', notas: '' };
const FACTURA_VACIA = { aOtro: false, nombre: '', ident: '', correo: '', direccion: '' };

// Lo que hay en localStorage lo puede tocar cualquiera a mano, asi que cada
// linea se revisa antes de entrar al pedido: con nombre, con identificador y
// con una cantidad que sea un numero de verdad, recortada al tope.
const lineaValida = (l) => {
  if (!l || typeof l !== 'object' || !l.id || !l.nombre) return null;
  const cantidad = Math.floor(Number(l.cantidad));
  if (!Number.isFinite(cantidad) || cantidad < 1) return null;
  return [String(l.id), {
    nombre: String(l.nombre),
    precio: Number(l.precio) || 0,
    cantidad: Math.min(cantidad, MAX_UNIDADES),
  }];
};

// Devuelve las lineas como pares [id, linea], en el orden en que se
// guardaron, y la entrega y la factura completas (con lo de por defecto donde
// no habia nada). Con un texto que no se entiende, todo vacio: un pedido roto
// no puede tumbar la pagina.
const leerPedidoGuardado = (crudo) => {
  const vacio = { lineas: [], entrega: { ...ENTREGA_VACIA }, factura: { ...FACTURA_VACIA } };
  if (!crudo) return vacio;
  let dato;
  try { dato = JSON.parse(crudo); } catch (e) { return vacio; }
  if (!dato || typeof dato !== 'object') return vacio;
  // Antes se guardaba solo el array de lineas; se sigue aceptando ese formato.
  const crudas = Array.isArray(dato) ? dato : (Array.isArray(dato.lineas) ? dato.lineas : []);
  const lineas = crudas.map(lineaValida).filter(Boolean);
  if (Array.isArray(dato)) return { ...vacio, lineas };
  const entrega = { ...ENTREGA_VACIA };
  if (dato.modo === 'domicilio') entrega.modo = 'domicilio';
  if (typeof dato.direccion === 'string') entrega.direccion = dato.direccion.slice(0, 200);
  if (typeof dato.piso === 'string') entrega.piso = dato.piso.slice(0, 120);
  if (typeof dato.referencia === 'string') entrega.referencia = dato.referencia.slice(0, 200);
  if (typeof dato.notas === 'string') entrega.notas = dato.notas.slice(0, 300);
  // A nombre de quien va la factura tambien sobrevive a recargar: quien pide
  // para una oficina lo hace siempre a nombre de la misma.
  const factura = { ...FACTURA_VACIA };
  const f = dato.factura;
  if (f && typeof f === 'object') {
    factura.aOtro = f.aOtro === true;
    if (typeof f.nombre === 'string') factura.nombre = f.nombre.slice(0, 80);
    if (typeof f.ident === 'string') factura.ident = f.ident.replace(/\D/g, '').slice(0, 13);
    if (typeof f.correo === 'string') factura.correo = f.correo.slice(0, 120);
    if (typeof f.direccion === 'string') factura.direccion = f.direccion.slice(0, 160);
  }
  return { lineas, entrega, factura };
};

// El texto que va a localStorage. 'lineas' son pares [id, linea], como los da
// un Map. Cuando se guardo va dentro del propio pedido, para saber de cuando
// es lo que se recupera; la cookie lleva la misma fecha para el pie.
const pedidoParaGuardar = ({ lineas, entrega, factura, cuando }) => JSON.stringify({
  lineas: lineas.map(([id, l]) => ({ id, ...l })),
  modo: entrega.modo,
  direccion: entrega.direccion,
  piso: entrega.piso,
  referencia: entrega.referencia,
  notas: entrega.notas,
  factura: { ...factura },
  guardado: cuando.toISOString(),
});

export { leerPedidoGuardado, pedidoParaGuardar };
