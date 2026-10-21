// ---- Lo que el pedido guarda en este navegador -------------------------
// La misma clave, el mismo formato y la misma cookie que el sitio presentado
// (seccion 8 del plan), para que un pedido a medias guardado alli siga aqui.
// Las reglas de que se acepta de lo leido y como se escribe son las de
// js/pedido/guardado.js, movidas tal cual (fase 7); la marca de la cookie es
// la de storage.js.
//
// Todo lo que toca localStorage va en try/catch: en ventana privada escribir
// lanza, y eso no puede tumbar la pagina. El pedido sigue vivo en memoria.
import { CLAVE, MAX_UNIDADES } from './state.js';
import { marcarActualizacion, olvidarMarca } from './storage.js';

// ---- Que se acepta de lo guardado y como se escribe --------------------
// Aqui no se toca localStorage: esto solo dice que se acepta de lo leido y
// como queda lo que se guarda. Lo de abajo lee y escribe.

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

// ---- Leer, guardar y borrar --------------------------------------------
const leerCrudo = () => {
  try { return window.localStorage.getItem(CLAVE); } catch (e) { return null; }
};

// Las lineas como pares [id, linea], la entrega y la factura, ya revisadas:
// lo de localStorage lo puede tocar cualquiera a mano.
const leerGuardado = () => leerPedidoGuardado(leerCrudo());

// Las lineas, la entrega y la factura van en un solo registro. Devuelve la
// fecha, para el pie.
const guardarPedidoAMedias = ({ lineas, entrega, factura }) => {
  const cuando = marcarActualizacion();
  try {
    window.localStorage.setItem(CLAVE, pedidoParaGuardar({ lineas, entrega, factura, cuando }));
  } catch (e) { /* en ventana privada no se puede guardar; el pedido sigue vivo en memoria */ }
  return cuando;
};

// Pedido aprobado: lo guardado se borra para que no reaparezca en la proxima
// visita, y la marca con el, que diria que se guardo algo que ya no esta.
const borrarGuardado = () => {
  try { window.localStorage.removeItem(CLAVE); } catch (e) { /* si no se pudo guardar, no hay nada que borrar */ }
  olvidarMarca();
};

export { leerGuardado, guardarPedidoAMedias, borrarGuardado };
