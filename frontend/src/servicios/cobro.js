// ---- Las reglas del pago, sin pantalla ---------------------------------
// Lo que decide si un pedido se puede confirmar y lo que se escribe de el:
// la factura, la tarjeta, el numero ET-XXXX, el recibo que va a IndexedDB y
// el correo. Vive aparte de las pantallas del pago (src/pedido/) para que
// las reglas esten escritas una sola vez y se puedan probar solas, sin
// navegador (pruebas/casos/cedula.mjs). Es pedido/cobro.js del sitio
// presentado, movido tal cual (fase 7): valida igual, dice lo mismo y guarda
// el mismo recibo.
//
// Aqui no se toca el DOM ni el almacenamiento: entra lo que hay y sale un
// resultado. La tarjeta tampoco se guarda aqui; solo se revisa.
import { ENVIO, dinero, telefonoLargo } from './state.js';

// Llevarlo cuesta; pasar a retirarlo, no. Tarifa fija: sin mapa no hay punto
// marcado del que medir la distancia.
const envioDe = (modo) => (modo === 'domicilio' ? ENVIO : 0);

// Las tres sumas de un pedido. 'lineas' son las lineas sueltas
// ({ nombre, precio, cantidad }), no los pares [id, linea].
const sumasDe = (lineas, modo) => {
  const subtotal = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
  const envio = envioDe(modo);
  return { subtotal, envio, total: subtotal + envio };
};

// La direccion en una linea, para el comprobante, el correo y el historial.
// La calle, el piso y la referencia van aparte en el formulario porque quien
// reparte los lee en momentos distintos; aqui se juntan.
const direccionDe = (entrega) => [entrega.direccion, entrega.piso, entrega.referencia]
  .filter(Boolean).join(' · ');

// ---- Datos para la factura ----
// El nombre no puede estar vacio y el documento tiene que ser una cedula o un
// RUC que valgan, con la misma regla que la base (FN_CEDULA_VALIDA y
// FN_RUC_VALIDO en bd/BD_EL_TRADICIONAL.sql): si el sitio aceptara un numero
// que la base rechaza, el pedido no se podria guardar con su factura. Eso
// prueba que el numero esta bien formado, no que sea de quien lo escribe.
// Los campos en el orden en que se ven, con como se nombran en el aviso.
const CAMPOS_FACTURA = [['nombre', 'el nombre'], ['ident', 'la cédula o el RUC']];

// Los dos primeros digitos son la provincia, del 01 al 24.
const provinciaValida = (d) => Number(d.slice(0, 2)) >= 1 && Number(d.slice(0, 2)) <= 24;

// Cedula: 10 digitos, provincia, tercer digito menor que 6 y el decimo es el
// verificador por modulo 10 (los impares por 2, restando 9 si pasan de 9).
const cedulaValida = (d) => {
  if (!/^\d{10}$/.test(d) || !provinciaValida(d) || Number(d[2]) > 5) return false;
  let suma = 0;
  for (let i = 0; i < 9; i += 1) {
    let n = Number(d[i]) * (i % 2 === 0 ? 2 : 1);
    if (n > 9) n -= 9;
    suma += n;
  }
  return (10 - (suma % 10)) % 10 === Number(d[9]);
};

// RUC: 13 digitos, provincia y establecimiento distinto de 000. El de persona
// natural (tercer digito menor que 6) es su cedula mas el establecimiento; el
// de entidades publicas (6) y sociedades (9) no se revisa por modulo 11,
// porque el SRI ya emite RUC que no lo cumplen.
const rucValido = (d) => {
  if (!/^\d{13}$/.test(d) || d.endsWith('000') || !provinciaValida(d)) return false;
  const tercero = Number(d[2]);
  if (tercero < 6) return cedulaValida(d.slice(0, 10));
  return tercero === 6 || tercero === 9;
};

const fallosFactura = (factura) => {
  const fallos = {};
  if (!factura.aOtro) return fallos;
  if (!String(factura.nombre).trim()) fallos.nombre = 'Escribe a nombre de quién va la factura.';
  const digitos = String(factura.ident).replace(/\D/g, '');
  if (!digitos) fallos.ident = 'Escribe la cédula o el RUC.';
  else if (digitos.length !== 10 && digitos.length !== 13) {
    fallos.ident = 'La cédula tiene 10 dígitos y el RUC 13.';
  } else if (!provinciaValida(digitos)) {
    fallos.ident = 'Los dos primeros dígitos no son de una provincia del Ecuador.';
  } else if (digitos.length === 10 && !cedulaValida(digitos)) {
    fallos.ident = 'Esta cédula no es válida: revisa los números.';
  } else if (digitos.length === 13 && !rucValido(digitos)) {
    fallos.ident = 'Este RUC no es válido: revisa los números.';
  }
  return fallos;
};

// Como se escribe en el comprobante y en el correo. A nombre propio no hace
// falta repetir el nombre de la cuenta, que ya esta arriba en el saludo.
const facturaTexto = (factura) => (factura.aOtro
  ? `${factura.nombre} · ${String(factura.ident).replace(/\D/g, '')}`
  : 'A tu nombre');

// ---- La tarjeta ----
// Luhn: es la comprobacion que hace cualquier pasarela antes de mandar nada,
// y es lo que separa un numero inventado de uno con forma de tarjeta.
const luhn = (digitos) => {
  let suma = 0;
  let doble = false;
  for (let i = digitos.length - 1; i >= 0; i -= 1) {
    let n = Number(digitos[i]);
    if (doble) { n *= 2; if (n > 9) n -= 9; }
    suma += n;
    doble = !doble;
  }
  return digitos.length > 0 && suma % 10 === 0;
};

const CAMPOS_TARJETA = [
  ['numero', 'el número'], ['vence', 'el vencimiento'], ['cvv', 'el CVV'], ['titular', 'el titular'],
];

// 'hoy' entra de fuera para que la regla del vencimiento no dependa del reloj
// de quien la lee dos veces seguidas en un cambio de mes.
const fallosTarjeta = (tarjeta, hoy = new Date()) => {
  const fallos = {};
  const num = String(tarjeta.numero).replace(/\D/g, '');
  if (num.length < 16) fallos.numero = 'Faltan dígitos: son 16.';
  else if (!luhn(num)) fallos.numero = 'Ese número no es válido. Prueba con 4242 4242 4242 4242.';
  const partes = /^(\d{2})\/(\d{2})$/.exec(tarjeta.vence);
  if (!partes) fallos.vence = 'Escríbelo como MM/AA.';
  else {
    const mes = Number(partes[1]);
    const anio = 2000 + Number(partes[2]);
    if (mes < 1 || mes > 12) fallos.vence = 'El mes va entre 01 y 12.';
    else if (anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1)) fallos.vence = 'Esa tarjeta ya venció.';
  }
  if (!/^\d{3}$/.test(tarjeta.cvv)) fallos.cvv = 'Son los 3 dígitos del reverso.';
  if (String(tarjeta.titular).trim().length < 3) fallos.titular = 'Escribe el nombre del titular.';
  return fallos;
};

// El aviso de debajo del boton cuando algo falla: dice que revisar, en el
// orden en que se ve en pantalla. Recibe las claves que fallaron.
const nombresDe = (campos, claves) => campos.filter(([c]) => claves.includes(c)).map(([, n]) => n);
// Como se dice en voz alta: "el número, el CVV y el titular".
const enLista = (nombres) => (nombres.length < 2 ? nombres.join('')
  : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`);
const avisoFactura = (claves) => `Para la factura, revisa ${enLista(nombresDe(CAMPOS_FACTURA, claves))}.`;
const avisoTarjeta = (claves) => `Revisa ${enLista(nombresDe(CAMPOS_TARJETA, claves))} de la tarjeta.`;

// Lo que se teclea en la tarjeta se reescribe con su forma (grupos de cuatro,
// MM/AA). El cursor vuelve a la misma posicion contada en digitos, no en
// caracteres: si no, al reformatear salta al final y no se puede corregir en
// medio. Devuelve el texto nuevo y donde poner el cursor.
const reformatear = (valor, cursor, agrupar) => {
  const corte = cursor === null || cursor === undefined ? valor.length : cursor;
  const antes = valor.slice(0, corte).replace(/\D/g, '').length;
  const nuevo = agrupar(valor.replace(/\D/g, ''));
  let pos = 0;
  let vistos = 0;
  while (pos < nuevo.length && vistos < antes) {
    if (/\d/.test(nuevo[pos])) vistos += 1;
    pos += 1;
  }
  return { valor: nuevo, cursor: pos };
};
const grupos4 = (d) => d.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const mmaa = (d) => (d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2, 4)}` : d);
const tresCifras = (d) => d.slice(0, 3);

// ---- Lo que se dice en la pantalla de confirmar ----
const textoEfectivo = (modo) => (modo === 'domicilio'
  ? 'Pagas en efectivo al recibir el pedido en tu puerta.'
  : 'Pagas en efectivo al retirar el pedido en el local.');

// El importe va escrito en el boton: es lo ultimo que se mira antes de
// pulsarlo. En efectivo no se cobra nada ahora, asi que ahi el boton no
// promete un pago. Con la canasta vacia no hay nada que confirmar.
const textoBotonPagar = (metodo, total, vacia) => {
  if (vacia) return 'Tu canasta está vacía';
  return metodo === 'efectivo' ? `Confirmar el pedido · ${dinero(total)}` : `Pagar ${dinero(total)}`;
};

// ---- El pedido aprobado ----
// Sin caracteres que se confundan al dictar el numero por telefono.
const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const numeroDePedido = () => 'ET-' + Array.from({ length: 4 },
  () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join('');

const detalleDe = (metodo, modo, numeroTarjeta = '') => {
  if (metodo === 'tarjeta') return `Tarjeta terminada en ${String(numeroTarjeta).replace(/\D/g, '').slice(-4)}`;
  return modo === 'domicilio' ? 'Efectivo al recibir' : 'Efectivo al retirar';
};

// Todo lo que hace falta del pedido una vez aprobado, en un solo objeto: el
// comprobante, el correo y el historial salen de aqui, asi que dicen lo mismo.
// De la tarjeta solo entran los cuatro ultimos digitos, dentro del detalle.
// 'lineas' son pares [id, linea], como los da el pedido.
const armarRecibo = ({ lineas, entrega, factura, sesion, metodo, numeroTarjeta, numero, fecha = new Date() }) => {
  const sueltas = lineas.map(([id, l]) => ({ id, nombre: l.nombre, precio: l.precio, cantidad: l.cantidad }));
  const domicilio = entrega.modo === 'domicilio';
  return {
    numero,
    fecha: fecha.toISOString(),
    modo: domicilio ? 'domicilio' : 'retiro',
    direccion: domicilio ? direccionDe(entrega) : '',
    notas: domicilio ? entrega.notas : '',
    metodo,
    detalle: detalleDe(metodo, entrega.modo, numeroTarjeta),
    ...sumasDe(sueltas, entrega.modo),
    lineas: sueltas,
    factura: facturaTexto(factura),
    facturaDireccion: factura.aOtro ? factura.direccion : '',
    nombre: sesion.nombre,
    correo: sesion.correo,
    telefono: sesion.telefono,
  };
};

// Lo que va a IndexedDB (eltradicional/pedidos): el mismo registro que ha
// guardado siempre el sitio, para que el historial lea igual los de antes,
// mas el correo de la cuenta que lo pidio: el historial de React ensena solo
// los de la cuenta abierta. Los de antes no lo traen y se siguen ensenando.
const reciboParaGuardar = (r) => ({
  numero: r.numero,
  correo: r.correo,
  fecha: r.fecha,
  modo: r.modo,
  direccion: r.direccion,
  metodo: r.detalle,
  subtotal: r.subtotal,
  envio: r.envio,
  total: r.total,
  lineas: r.lineas.map(({ id, nombre, precio, cantidad }) => ({ id, nombre, precio, cantidad })),
});

const textoModo = (modo) => (modo === 'domicilio' ? 'A domicilio' : 'Paso retirando por el local');
const textoEnvio = (envio) => (envio ? dinero(envio) : 'Gratis');

// El saludo se escribe una vez y se usa dos: en el recuadro del comprobante y
// como primer parrafo del correo. Si fueran dos textos distintos, el recuadro
// estaria ensenando un mensaje que nadie recibio.
const saludoComprobante = (r) => `Hola ${String(r.nombre).split(' ')[0]}: tu pedido `
  + `${r.numero} quedó registrado por ${dinero(r.total)}. `
  + `${r.modo === 'domicilio' ? 'Te lo llevamos a ' + r.direccion : 'Pasa a retirarlo por el local'}. `
  + 'Gracias por comprar en El Tradicional.';

// El correo lleva el detalle entero. Va en texto plano porque la plantilla de
// EmailJS lo inserta tal cual.
const cuerpoComprobante = (r) => [
  saludoComprobante(r),
  '',
  'LO QUE PEDISTE',
  ...r.lineas.map((l) => `  ${l.cantidad} × ${l.nombre} — ${dinero(l.precio * l.cantidad)}`),
  '',
  `Subtotal: ${dinero(r.subtotal)}`,
  `Envío: ${textoEnvio(r.envio)}`,
  `Total: ${dinero(r.total)}`,
  `Pago: ${r.detalle}`,
  `Factura: ${r.factura}`,
  ...(r.facturaDireccion ? [`Dirección de la factura: ${r.facturaDireccion}`] : []),
  `Entrega: ${r.modo === 'domicilio' ? 'A domicilio — ' + r.direccion : 'Paso retirando por el local'}`,
  // Quien reparte lee esto antes de bajarse de la moto, asi que va en su
  // propia linea y no pegado a la direccion.
  ...(r.notas ? [`Indicaciones: ${r.notas}`] : []),
  `Te llamamos al ${telefonoLargo(r.telefono)} si hace falta.`,
  '',
  'No se descontó ningún dinero: el cobro de este pedido no se procesa.',
].join('\n');

const asuntoComprobante = (r) => `Pedido ${r.numero} · El Tradicional`;

// Lo que dice el renglon de debajo del recuadro del correo, segun como vaya
// el envio: 'simulado' (EmailJS sin configurar), 'enviando', 'enviado' o 'fallo'.
const textoCorreo = (estado, r) => {
  if (estado === 'simulado') {
    return 'Mensaje simulado: el envío de correo no está configurado en esta copia '
      + 'del sitio, así que no salió nada. El recuadro de arriba es el mensaje que '
      + 'habría llegado.';
  }
  if (estado === 'enviando') return 'Enviando el comprobante a tu correo…';
  if (estado === 'enviado') return `Comprobante enviado a ${r.correo}. Si no lo ves, mira en la carpeta de spam.`;
  // Sin hablar de cuotas ni de servicios: a quien compra solo le sirve saber
  // que el pedido vale igual y que se quede con el numero.
  return 'No pudimos enviarte el correo en este momento. Tu pedido '
    + `quedó registrado igual: apunta el número ${r.numero}.`;
};

const avisoAprobado = (numero) => `Pago aprobado. Pedido ${numero}. Es una simulación: no se cobró nada.`;

export {
  envioDe, sumasDe, direccionDe,
  CAMPOS_FACTURA, cedulaValida, rucValido, fallosFactura, facturaTexto, avisoFactura,
  CAMPOS_TARJETA, luhn, fallosTarjeta, avisoTarjeta, enLista,
  reformatear, grupos4, mmaa, tresCifras,
  textoEfectivo, textoBotonPagar,
  numeroDePedido, detalleDe, armarRecibo, reciboParaGuardar,
  textoModo, textoEnvio, saludoComprobante, cuerpoComprobante, asuntoComprobante,
  textoCorreo, avisoAprobado,
};
