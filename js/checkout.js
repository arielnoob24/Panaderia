// ---- Pago simulado y comprobante --------------------------------------
// Los dos ultimos pasos del panel de la canasta: elegir como se paga y, una
// vez "cobrado", el comprobante y el correo que lo repite. El panel entero lo
// crea cart.js; este modulo le pasa el HTML de sus dos pasos y despues trabaja
// sobre ellos. Lo que necesita de la canasta -cambiar de paso, vaciarla- va por
// el puente, porque la canasta tambien llama aqui.
import { avisos } from './ui.js';
import {
  pedido, entrega, sesion, tarjeta, cobro, factura, puente, direccionEntera,
  dinero, telefonoLargo, subtotal, envio, total,
} from './state.js';
import { buzonListo, enviarCorreo } from './mail.js';

// Las piezas que pone este modulo dentro de la pantalla de confirmar el pedido.
// No son un paso propio: la canasta las intercala entre la entrega y el
// resumen, porque todo se decide en la misma pantalla. Vienen separadas para
// que sea la canasta la que decida el orden en que se leen.
//
// Ya no hay "Total a pagar" ni una linea con la modalidad: en una sola pantalla
// el total esta en el desglose y en el boton, y como se recibe el pedido se ve
// unos centimetros mas arriba. Repetirlos era decir tres veces lo mismo.
const piezasDePago = () => ({
  aviso: ''
  + '<p class="pago-demo"><strong>Esto es una demostración.</strong> Es un proyecto de clase: '
  + 'no se procesa ningún cobro real y los datos de la tarjeta no se guardan ni se envían.</p>',

  metodos: ''
  + '<fieldset class="canasta-entrega pago-metodos"><legend>¿Cómo quieres pagar?</legend>'
  + '<div class="canasta-opciones">'
  + '<label><input type="radio" name="canasta-metodo" value="efectivo" checked><span>Efectivo</span></label>'
  + '<label><input type="radio" name="canasta-metodo" value="tarjeta"><span>Tarjeta</span></label>'
  + '</div></fieldset>'

  + '<div class="pago-detalle" data-detalle="efectivo">'
  + '<p class="pago-dato pago-efectivo">Pagas al retirar el pedido.</p></div>'

  + '<div class="pago-detalle" data-detalle="tarjeta" hidden>'
  + '<p class="pago-prueba">Tarjeta de prueba: <strong>4242 4242 4242 4242</strong>, '
  + 'cualquier vencimiento futuro y CVV 123. No escribas una tarjeta de verdad.</p>'
  + '<div class="pago-campo"><label for="pago-numero">Número de la tarjeta</label>'
  + '<input id="pago-numero" type="text" inputmode="numeric" autocomplete="off" '
  + 'placeholder="4242 4242 4242 4242" maxlength="19" aria-describedby="pago-numero-error">'
  + '<p class="pago-campo-error" id="pago-numero-error" hidden></p></div>'
  + '<div class="pago-fila">'
  + '<div class="pago-campo"><label for="pago-vence">Vencimiento</label>'
  + '<input id="pago-vence" type="text" inputmode="numeric" autocomplete="off" '
  + 'placeholder="MM/AA" maxlength="5" aria-describedby="pago-vence-error">'
  + '<p class="pago-campo-error" id="pago-vence-error" hidden></p></div>'
  + '<div class="pago-campo"><label for="pago-cvv">CVV</label>'
  + '<input id="pago-cvv" type="text" inputmode="numeric" autocomplete="off" '
  + 'placeholder="123" maxlength="3" aria-describedby="pago-cvv-error">'
  + '<p class="pago-campo-error" id="pago-cvv-error" hidden></p></div></div>'
  + '<div class="pago-campo"><label for="pago-titular">Nombre del titular</label>'
  + '<input id="pago-titular" type="text" autocomplete="off" '
  + 'placeholder="Como aparece en la tarjeta" maxlength="60" aria-describedby="pago-titular-error">'
  + '<p class="pago-campo-error" id="pago-titular-error" hidden></p></div></div>',

  // A nombre de quien va la factura. Lo normal es que sea de quien pide, asi que
  // eso viene marcado y no hay nada que rellenar; los campos aparecen solo al
  // decir que va a otro nombre, que es el caso de comprar para una oficina o de
  // que pague un familiar.
  factura: ''
  + '<fieldset class="canasta-entrega factura-bloque"><legend>Datos para la factura</legend>'
  + '<div class="canasta-opciones">'
  + '<label><input type="radio" name="canasta-factura" value="mi" checked>'
  + '<span>A mi nombre</span></label>'
  + '<label><input type="radio" name="canasta-factura" value="otro">'
  + '<span>A nombre de otra persona</span></label></div>'
  + '<div class="factura-mia">'
  + '<p class="factura-dato"><strong class="factura-mi-nombre"></strong><br>'
  + '<span class="factura-mi-correo"></span></p>'
  + '<p class="factura-nota">Son los datos de tu cuenta. Si te falta la cédula o el RUC, '
  + 'elige la otra opción y escríbelos.</p></div>'
  + '<div class="factura-otra" hidden>'
  + '<div class="pago-campo"><label for="factura-nombre">Nombre o razón social</label>'
  + '<input id="factura-nombre" type="text" autocomplete="off" maxlength="80" '
  + 'placeholder="A quién se le factura" aria-describedby="factura-nombre-error">'
  + '<p class="pago-campo-error" id="factura-nombre-error" hidden></p></div>'
  + '<div class="pago-campo"><label for="factura-ident">Cédula o RUC</label>'
  + '<input id="factura-ident" type="text" inputmode="numeric" autocomplete="off" '
  + 'maxlength="13" placeholder="10 dígitos, o 13 si es RUC" '
  + 'aria-describedby="factura-ident-error">'
  + '<p class="pago-campo-error" id="factura-ident-error" hidden></p></div>'
  + '<div class="pago-campo"><label for="factura-correo">Correo para enviarle la factura '
  + '<small>(opcional)</small></label>'
  + '<input id="factura-correo" type="email" autocomplete="off" maxlength="120" '
  + 'placeholder="Si se la quieres hacer llegar a esa persona"></div>'
  + '<div class="pago-campo"><label for="factura-dir">Dirección '
  + '<small>(opcional)</small></label>'
  + '<input id="factura-dir" type="text" autocomplete="off" maxlength="160" '
  + 'placeholder="La que debe constar en la factura"></div>'
  + '<p class="factura-nota">El comprobante del pedido sigue llegando a tu correo; '
  + 'esto es solo a nombre de quién sale la factura.</p></div>'
  + '</fieldset>',

  canal: ''
  + '<div class="pago-canal"><h3 class="pago-canal-titulo">Dónde te llega el comprobante</h3>'
  + '<p class="pago-canal-dato">A <strong class="pago-canal-correo"></strong>, '
  + 'el correo verificado de tu cuenta.</p></div>',

  pie: ''
  + '<div class="canasta-pie">'
  + '<p class="canasta-aviso pago-error" role="alert" hidden></p>'
  + '<button class="button button-yellow canasta-pagar" type="button">Confirmar el pedido</button>'
  + '<p class="canasta-nota">Simulación académica: no se cobra ni un centavo.</p>'
  + '</div>',
});

const comprobanteHtml = () => ''
  + '<div class="checkout-recibo">'
  + '<div class="recibo-cuerpo">'
  + '<p class="recibo-sello"><span aria-hidden="true">✓</span> Pedido registrado</p>'
  + '<p class="recibo-simulado">Pedido simulado. Es una demostración académica: '
  + 'no se realizó ningún cobro y la panadería todavía no ha recibido nada.</p>'
  + '<dl class="recibo-datos">'
  + '<div><dt>Número de pedido</dt><dd><span class="recibo-numero">ET-0000</span>'
  + '<button class="recibo-copiar" type="button">Copiar</button></dd></div>'
  + '<div><dt>Subtotal</dt><dd class="recibo-subtotal">$0.00</dd></div>'
  + '<div><dt>Envío</dt><dd class="recibo-envio">Gratis</dd></div>'
  + '<div><dt>Total</dt><dd class="recibo-total">$0.00</dd></div>'
  + '<div><dt>Pago</dt><dd class="recibo-metodo"></dd></div>'
  + '<div><dt>Entrega</dt><dd class="recibo-modo"></dd></div>'
  + '<div><dt>Factura</dt><dd class="recibo-factura"></dd></div>'
  + '<div class="recibo-linea-dir" hidden><dt>Dirección</dt><dd class="recibo-direccion"></dd></div>'
  + '<div class="recibo-linea-notas" hidden><dt>Indicaciones</dt>'
  + '<dd class="recibo-notas"></dd></div>'
  + '</dl>'
  + '<h3 class="recibo-titulo">Lo que pediste</h3><ul class="recibo-lista"></ul></div>'
  + '<div class="codigo-falso recibo-enviado">'
  + '<p class="codigo-falso-de recibo-enviado-de"></p>'
  + '<p class="codigo-falso-texto recibo-enviado-texto"></p></div>'
  + '<p class="recibo-simulado recibo-envio-estado" role="status"></p>'
  + '<div class="recibo-pie">'
  + '<p class="recibo-copiado" role="status" hidden></p>'
  + '<button class="button button-yellow canasta-listo" type="button">Listo, cerrar</button>'
  + '<p class="canasta-nota">Apunta o copia el número antes de cerrar: al cerrar, '
  + 'el pedido queda cumplido y la canasta se vacía.</p>'
  + '</div></div>';

// Los trozos del panel con que trabaja. Se rellenan en montarPago, que corre
// cuando la canasta ya armo el panel.
let panel = null;
let metodos = [];
let detalles = [];
let camposTarjeta = [];
let pagoEfectivo = null;
let pagar = null;
let errorPago = null;
let canalCorreo = null;
let reciboEnviadoDe = null;
let reciboEnviadoTexto = null;
let reciboEnvioEstado = null;
let reciboCopiar = null;
let reciboCopiado = null;
let facturaRadios = [];
let facturaCampos = [];
let facturaMia = null;
let facturaOtra = null;

// ---- Datos para la factura ----
// Dos reglas y nada mas, porque la factura de verdad no se emite aqui: el nombre
// no puede estar vacio y el documento tiene que tener forma de cedula o de RUC.
// No se comprueba el digito verificador: eso valida que el numero exista, no que
// sea de quien dice, y en una maqueta sin SRI detras daria una falsa sensacion de
// haberlo verificado.
const facturaAOtro = () => facturaRadios.find((r) => r.checked)?.value === 'otro';

const revisarFactura = () => {
  const fallos = {};
  if (!facturaAOtro()) return fallos;
  if (!factura.nombre) fallos.nombre = 'Escribe a nombre de quién va la factura.';
  const digitos = factura.ident.replace(/\D/g, '');
  if (!digitos) fallos.ident = 'Escribe la cédula o el RUC.';
  else if (digitos.length !== 10 && digitos.length !== 13) {
    fallos.ident = 'La cédula tiene 10 dígitos y el RUC 13.';
  } else if (Number(digitos.slice(0, 2)) < 1 || Number(digitos.slice(0, 2)) > 24) {
    // Los dos primeros digitos son la provincia, del 01 al 24. Es la unica
    // comprobacion que se puede hacer sin inventarse una validacion completa.
    fallos.ident = 'Los dos primeros dígitos no son de una provincia del Ecuador.';
  }
  return fallos;
};

// Los errores solo salen cuando ya se intento confirmar o cuando el campo se
// dejo atras: avisar mientras alguien escribe su cedula es regañarle a medias.
const tocadosFactura = new Set();
let intentadoFactura = false;

const pintarFactura = () => {
  const aOtro = facturaAOtro();
  factura.aOtro = aOtro;
  if (facturaMia) facturaMia.hidden = aOtro;
  if (facturaOtra) facturaOtra.hidden = !aOtro;
  const nombreMio = panel?.querySelector('.factura-mi-nombre');
  const correoMio = panel?.querySelector('.factura-mi-correo');
  if (nombreMio) nombreMio.textContent = sesion.nombre || 'Tu nombre';
  if (correoMio) correoMio.textContent = sesion.correo;
  const fallos = revisarFactura();
  facturaCampos.forEach(({ clave, input, error }) => {
    const mal = fallos[clave] && (intentadoFactura || tocadosFactura.has(clave));
    error.hidden = !mal;
    error.textContent = mal ? fallos[clave] : '';
    input.setAttribute('aria-invalid', String(Boolean(mal)));
  });
  return fallos;
};

// Pedido cumplido: la proxima factura vuelve a ser a nombre de quien pide.
const olvidarFactura = () => {
  factura.aOtro = false;
  factura.nombre = '';
  factura.ident = '';
  factura.correo = '';
  factura.direccion = '';
  facturaRadios.forEach((r) => { r.checked = r.value === 'mi'; });
  facturaCampos.forEach(({ input, error }) => {
    input.value = '';
    error.hidden = true;
    input.removeAttribute('aria-invalid');
  });
  tocadosFactura.clear();
  intentadoFactura = false;
  pintarFactura();
};

// Lo guardado del pedido anterior, de vuelta a los campos. La canasta llama a
// esto al arrancar, cuando ya leyo el almacenamiento y el panel existe.
const cargarFactura = () => {
  facturaRadios.forEach((r) => { r.checked = r.value === (factura.aOtro ? 'otro' : 'mi'); });
  facturaCampos.forEach(({ clave, input }) => { input.value = factura[clave]; });
  const correo = panel?.querySelector('#factura-correo');
  const dir = panel?.querySelector('#factura-dir');
  if (correo) correo.value = factura.correo;
  if (dir) dir.value = factura.direccion;
  pintarFactura();
};

// Como se escribe en el comprobante y en el correo. A nombre propio no hace
// falta repetir el nombre de la cuenta, que ya esta arriba en el saludo.
const facturaTexto = () => (factura.aOtro
  ? `${factura.nombre} · ${factura.ident.replace(/\D/g, '')}`
  : 'A tu nombre');

// ---- Pago simulado ----
// El proyecto es academico: la gracia es enseñar el recorrido completo, no
// cobrar. Cada pantalla lo dice en voz alta para que nadie crea otra cosa.
const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta' };
const metodoActual = () => metodos.find((m) => m.checked)?.value || 'efectivo';
let procesando = false;
let temporizador = 0;


const pintarPago = () => {
  const metodo = metodoActual();
  pagoEfectivo.textContent = entrega.modo === 'domicilio'
    ? 'Pagas en efectivo al recibir el pedido en tu puerta.'
    : 'Pagas en efectivo al retirar el pedido en el local.';
  detalles.forEach((d) => { d.hidden = d.dataset.detalle !== metodo; });
  if (canalCorreo) canalCorreo.textContent = sesion.correo;
  // El nombre y el correo de la cuenta pueden haber cambiado desde la ultima
  // vez que se abrio esto, asi que se vuelven a escribir aqui y no una sola vez.
  pintarFactura();
  // Mientras procesa, el boton dice otra cosa y no se le puede pisar el texto.
  if (procesando) return;
  // Si se vacia la canasta estando en la vista de confirmar -se puede, la
  // gaveta se abre encima-, no hay nada que confirmar. Antes el boton se
  // dejaba pulsar y no pasaba nada.
  const vacia = pedido.size === 0;
  pagar.disabled = vacia;
  pagar.setAttribute('aria-disabled', String(vacia));
  if (vacia) {
    pagar.textContent = 'Tu canasta está vacía';
    return;
  }
  // El importe va escrito en el boton: es lo ultimo que se mira antes de
  // pulsarlo, y teniendo el pedido entero en una pantalla que se desplaza, el
  // desglose puede haberse quedado arriba fuera de la vista. En efectivo no se
  // cobra nada ahora, asi que ahi el boton no promete un pago.
  pagar.textContent = metodo === 'efectivo'
    ? `Confirmar el pedido · ${dinero(total())}`
    : `Pagar ${dinero(total())}`;
};

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

const tocados = new Set();
let intentado = false;

const fallosTarjeta = () => {
  const fallos = {};
  const num = tarjeta.numero.replace(/\D/g, '');
  if (num.length < 16) fallos.numero = 'Faltan dígitos: son 16.';
  else if (!luhn(num)) fallos.numero = 'Ese número no es válido. Prueba con 4242 4242 4242 4242.';
  const partes = /^(\d{2})\/(\d{2})$/.exec(tarjeta.vence);
  if (!partes) fallos.vence = 'Escríbelo como MM/AA.';
  else {
    const mes = Number(partes[1]);
    const anio = 2000 + Number(partes[2]);
    const hoy = new Date();
    if (mes < 1 || mes > 12) fallos.vence = 'El mes va entre 01 y 12.';
    else if (anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1)) fallos.vence = 'Esa tarjeta ya venció.';
  }
  if (!/^\d{3}$/.test(tarjeta.cvv)) fallos.cvv = 'Son los 3 dígitos del reverso.';
  if (tarjeta.titular.length < 3) fallos.titular = 'Escribe el nombre del titular.';
  return fallos;
};

// Un campo solo se marca cuando ya lo tocaste o cuando ya intentaste pagar:
// avisar de un error antes de escribir nada no ayuda a nadie.
const pintarTarjeta = () => {
  const fallos = fallosTarjeta();
  camposTarjeta.forEach(({ clave, input, error }) => {
    const texto = (intentado || tocados.has(clave)) ? fallos[clave] : '';
    error.hidden = !texto;
    error.textContent = texto || '';
    input.setAttribute('aria-invalid', texto ? 'true' : 'false');
    input.classList.toggle('is-mal', Boolean(texto));
  });
  return fallos;
};

// El cursor vuelve a la misma posicion contada en digitos, no en caracteres:
// si no, al reformatear salta al final y no se puede corregir en medio.
const reformatear = (input, agrupar) => {
  const corte = input.selectionStart === null ? input.value.length : input.selectionStart;
  const antes = input.value.slice(0, corte).replace(/\D/g, '').length;
  input.value = agrupar(input.value.replace(/\D/g, ''));
  let pos = 0;
  let vistos = 0;
  while (pos < input.value.length && vistos < antes) {
    if (/\d/.test(input.value[pos])) vistos += 1;
    pos += 1;
  }
  try { input.setSelectionRange(pos, pos); } catch (e) { /* el campo puede no estar enfocado */ }
};
const grupos4 = (d) => d.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const mmaa = (d) => (d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2, 4)}` : d);

const olvidarTarjeta = () => {
  camposTarjeta.forEach(({ clave, input }) => { tarjeta[clave] = ''; input.value = ''; });
  tocados.clear();
  intentado = false;
  pintarTarjeta();
  errorPago.hidden = true;
};

const respaldoCopiar = (texto) => {
  // Sin permiso de portapapeles (o sin HTTPS) queda el camino de siempre.
  const temporal = document.createElement('textarea');
  temporal.value = texto;
  temporal.setAttribute('readonly', '');
  temporal.style.cssText = 'position:fixed;top:-100px;opacity:0';
  document.body.append(temporal);
  temporal.select();
  let hecho = false;
  try { hecho = document.execCommand('copy'); } catch (e) { hecho = false; }
  temporal.remove();
  return hecho;
};

// Sin caracteres que se confundan al dictar el numero por telefono.
const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const numeroDePedido = () => 'ET-' + Array.from({ length: 4 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join('');

const detalleDe = (metodo) => {
  if (metodo === 'efectivo') return entrega.modo === 'domicilio' ? 'Efectivo al recibir' : 'Efectivo al retirar';
  if (metodo === 'tarjeta') return `Tarjeta terminada en ${tarjeta.numero.replace(/\D/g, '').slice(-4)}`;
  return METODOS[metodo];
};

const pintarComprobante = () => {
  panel.querySelector('.recibo-numero').textContent = cobro.numero;
  panel.querySelector('.recibo-subtotal').textContent = dinero(subtotal());
  panel.querySelector('.recibo-envio').textContent = envio() ? dinero(envio()) : 'Gratis';
  panel.querySelector('.recibo-total').textContent = dinero(total());
  panel.querySelector('.recibo-metodo').textContent = cobro.detalle;
  panel.querySelector('.recibo-modo').textContent = entrega.modo === 'domicilio' ? 'A domicilio' : 'Paso retirando por el local';
  panel.querySelector('.recibo-factura').textContent = facturaTexto();
  panel.querySelector('.recibo-linea-dir').hidden = entrega.modo !== 'domicilio';
  panel.querySelector('.recibo-direccion').textContent = direccionEntera();
  // Las indicaciones solo salen si hay alguna: una fila "Indicaciones: —" no
  // informa de nada y alarga el comprobante.
  panel.querySelector('.recibo-linea-notas').hidden = entrega.modo !== 'domicilio' || !entrega.notas;
  panel.querySelector('.recibo-notas').textContent = entrega.notas;
  const recibo = panel.querySelector('.recibo-lista');
  recibo.textContent = '';
  for (const l of pedido.values()) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${l.cantidad} × ${l.nombre}</span><span>${dinero(l.precio * l.cantidad)}</span>`;
    recibo.append(li);
  }
  reciboEnviadoDe.textContent = `Correo de El Tradicional · para ${sesion.correo}`;
  reciboEnviadoTexto.textContent = saludoComprobante();
};

// El saludo del comprobante se escribe una vez y se usa dos: en el recuadro
// del panel y como primer parrafo del correo. Si fueran dos textos distintos,
// el recuadro estaria ensenando un mensaje que nadie recibio.
const saludoComprobante = () => `Hola ${sesion.nombre.split(' ')[0]}: tu pedido `
  + `${cobro.numero} quedó registrado por ${dinero(total())}. `
  + `${entrega.modo === 'domicilio' ? 'Te lo llevamos a ' + direccionEntera() : 'Pasa a retirarlo por el local'}. `
  + 'Gracias por comprar en El Tradicional.';

// El correo si puede llevar el detalle entero, que en un SMS no cabria. Va en
// texto plano porque la plantilla de EmailJS lo inserta tal cual.
const cuerpoComprobante = () => {
  const lineas = [...pedido.values()]
    .map((l) => `  ${l.cantidad} × ${l.nombre} — ${dinero(l.precio * l.cantidad)}`);
  return [
    saludoComprobante(),
    '',
    'LO QUE PEDISTE',
    ...lineas,
    '',
    `Subtotal: ${dinero(subtotal())}`,
    `Envío: ${envio() ? dinero(envio()) : 'Gratis'}`,
    `Total: ${dinero(total())}`,
    `Pago: ${cobro.detalle}`,
    `Factura: ${facturaTexto()}`,
    ...(factura.aOtro && factura.direccion ? [`Dirección de la factura: ${factura.direccion}`] : []),
    `Entrega: ${entrega.modo === 'domicilio' ? 'A domicilio — ' + direccionEntera() : 'Paso retirando por el local'}`,
    // Quien reparte lee esto antes de bajarse de la moto, asi que va en su
    // propia linea y no pegado a la direccion.
    ...(entrega.modo === 'domicilio' && entrega.notas ? [`Indicaciones: ${entrega.notas}`] : []),
    `Te llamamos al ${telefonoLargo(sesion.telefono)} si hace falta.`,
    '',
    'Este pedido es parte de un proyecto académico: el cobro está simulado y',
    'no se descontó ningún dinero. El correo, en cambio, es real.',
  ].join('\n');
};

const restablecerPagar = () => {
  procesando = false;
  panel.classList.remove('is-procesando');
  pagar.disabled = false;
  pagar.removeAttribute('aria-disabled');
  pintarPago();
};

// Cerrar el panel a medio pago no puede dejar el cobro simulado corriendo por
// detras: la canasta llama a esto al cerrar.
const cancelarProceso = () => {
  if (temporizador) { window.clearTimeout(temporizador); temporizador = 0; }
};

// Al cerrar, los dos renglones de "copiado" se van: al volver a abrir no tiene
// que seguir puesto el aviso de la visita anterior.
const limpiarCopiados = () => {
  if (reciboCopiado) reciboCopiado.hidden = true;
};

// Pedido cumplido: el proximo empieza en efectivo, como la primera vez.
const reiniciarMetodo = () => {
  metodos.forEach((m) => { m.checked = m.value === 'efectivo'; });
};

// El correo del comprobante sale aqui, no antes: el pedido ya tiene numero y
// metodo, asi que el mensaje puede decir algo cierto. No se espera a que
// termine para ensenar el recibo -el pedido ya esta hecho y hacer esperar a
// alguien por un correo seria castigarlo por la red que tenga-, asi que el
// recuadro sale al momento diciendo que va en camino y se corrige cuando el
// envio responde.
const mandarComprobante = async () => {
  const decir = (texto, bien) => {
    reciboEnvioEstado.textContent = texto;
    reciboEnvioEstado.classList.toggle('is-bien', Boolean(bien));
  };
  if (!buzonListo()) {
    decir('Mensaje simulado: el envío de correo no está configurado en esta copia '
      + 'del sitio, así que no salió nada. El recuadro de arriba es el mensaje que '
      + 'habría llegado.');
    return;
  }
  const numero = cobro.numero;
  const para = sesion.correo;
  decir('Enviando el comprobante a tu correo…');
  const bien = await enviarCorreo(para, sesion.nombre,
    `Pedido ${numero} · El Tradicional`, cuerpoComprobante());
  // Si mientras el correo viajaba se confirmo otro pedido, el recuadro ya no
  // habla de este: entonces el aviso sobra y escribirlo seria mentir sobre el
  // recibo que se esta mirando.
  if (cobro.numero !== numero) return;
  decir(bien
    ? `Comprobante enviado a ${para}. Si no lo ves, mira en la carpeta de spam.`
    : 'No se pudo enviar el correo (puede ser la red o la cuota del mes). Tu pedido '
      + `quedó registrado igual: apunta el número ${numero}.`, bien);
};

const aprobar = (metodo) => {
  procesando = false;
  cobro.metodo = metodo;
  cobro.numero = numeroDePedido();
  cobro.detalle = detalleDe(metodo);
  pintarComprobante();
  mandarComprobante();
  // El comprobante ya esta emitido: la canasta guardada se borra para que no
  // reaparezca en la proxima visita, pero las lineas siguen en memoria para
  // poder leer el recibo y armar el mensaje hasta que se cierre el panel.
  puente.borrarGuardado();
  puente.vaciarContador();
  olvidarTarjeta();
  olvidarFactura();
  restablecerPagar();
  puente.verComprobante();
  avisos.textContent = `Pago aprobado. Pedido ${cobro.numero}. Es una simulación: no se cobró nada.`;
};

// La canasta llama a esto una vez, con el panel ya creado.
const montarPago = (elPanel) => {
  panel = elPanel;
  metodos = [...panel.querySelectorAll('input[name="canasta-metodo"]')];
  detalles = [...panel.querySelectorAll('.pago-detalle')];
  pagoEfectivo = panel.querySelector('.pago-efectivo');
  pagar = panel.querySelector('.canasta-pagar');
  errorPago = panel.querySelector('.pago-error');
  canalCorreo = panel.querySelector('.pago-canal-correo');
  reciboEnviadoDe = panel.querySelector('.recibo-enviado-de');
  reciboEnviadoTexto = panel.querySelector('.recibo-enviado-texto');
  // Clase propia y no solo '.recibo-simulado': ese aviso ya existe mas arriba,
  // el del cobro simulado, y querySelector se habria quedado con ese.
  reciboEnvioEstado = panel.querySelector('.recibo-envio-estado');
  reciboCopiar = panel.querySelector('.recibo-copiar');
  reciboCopiado = panel.querySelector('.recibo-copiado');

  facturaRadios = [...panel.querySelectorAll('input[name="canasta-factura"]')];
  facturaMia = panel.querySelector('.factura-mia');
  facturaOtra = panel.querySelector('.factura-otra');
  facturaCampos = [
    { clave: 'nombre', nombre: 'el nombre', input: panel.querySelector('#factura-nombre'), error: panel.querySelector('#factura-nombre-error') },
    { clave: 'ident', nombre: 'la cédula o el RUC', input: panel.querySelector('#factura-ident'), error: panel.querySelector('#factura-ident-error') },
  ];
  const facturaCorreo = panel.querySelector('#factura-correo');
  const facturaDir = panel.querySelector('#factura-dir');

  facturaRadios.forEach((r) => r.addEventListener('change', () => {
    if (!r.checked) return;
    errorPago.hidden = true;
    // Al volver a "a mi nombre" se dejan de avisar errores de campos que ya no
    // se piden, pero lo escrito se queda: puede ser un cambio de idea de ida y
    // vuelta, y borrarlo obligaria a teclear la cedula otra vez.
    intentadoFactura = false;
    tocadosFactura.clear();
    pintarFactura();
    puente.guardar?.();
    if (facturaAOtro()) facturaCampos[0].input.focus();
  }));

  facturaCampos.forEach(({ clave, input }) => {
    input.addEventListener('input', () => {
      // El documento es numerico: dejar escribir letras ahi solo lleva a un
      // error que se podia haber evitado al teclear.
      if (clave === 'ident') input.value = input.value.replace(/\D/g, '').slice(0, 13);
      factura[clave] = input.value.trim().slice(0, clave === 'nombre' ? 80 : 13);
      pintarFactura();
      puente.guardar?.();
    });
    input.addEventListener('blur', () => { tocadosFactura.add(clave); pintarFactura(); });
  });

  facturaCorreo?.addEventListener('input', () => {
    factura.correo = facturaCorreo.value.trim().slice(0, 120);
    puente.guardar?.();
  });
  facturaDir?.addEventListener('input', () => {
    factura.direccion = facturaDir.value.trim().slice(0, 160);
    puente.guardar?.();
  });

  camposTarjeta = [
    { clave: 'numero', nombre: 'el número', input: panel.querySelector('#pago-numero'), error: panel.querySelector('#pago-numero-error') },
    { clave: 'vence', nombre: 'el vencimiento', input: panel.querySelector('#pago-vence'), error: panel.querySelector('#pago-vence-error') },
    { clave: 'cvv', nombre: 'el CVV', input: panel.querySelector('#pago-cvv'), error: panel.querySelector('#pago-cvv-error') },
    { clave: 'titular', nombre: 'el titular', input: panel.querySelector('#pago-titular'), error: panel.querySelector('#pago-titular-error') },
  ];

  camposTarjeta.forEach(({ clave, input }) => {
    input.addEventListener('input', () => {
      if (clave === 'numero') reformatear(input, grupos4);
      if (clave === 'vence') reformatear(input, mmaa);
      if (clave === 'cvv') reformatear(input, (d) => d.slice(0, 3));
      tarjeta[clave] = clave === 'titular' ? input.value.trim().slice(0, 60) : input.value;
      pintarTarjeta();
    });
    input.addEventListener('blur', () => { tocados.add(clave); pintarTarjeta(); });
  });

  metodos.forEach((m) => m.addEventListener('change', () => {
    if (!m.checked) return;
    errorPago.hidden = true;
    pintarPago();
  }));

  reciboCopiar.addEventListener('click', async () => {
    const texto = panel.querySelector('.recibo-numero').textContent.trim();
    let hecho = false;
    try {
      if (!navigator.clipboard) throw new Error('sin portapapeles');
      await navigator.clipboard.writeText(texto);
      hecho = true;
    } catch (e) {
      hecho = respaldoCopiar(texto);
    }
    reciboCopiado.hidden = false;
    reciboCopiado.textContent = hecho
      ? `Número ${texto} copiado.`
      : `No se pudo copiar; apunta el ${texto} a mano.`;
  });

  pagar.addEventListener('click', () => {
    if (procesando || !pedido.size) return;
    // El aviso y el foco los pone la canasta, que es de quien es el campo.
    if (puente.faltaDireccion()) return;
    // La factura se revisa antes que la tarjeta porque su bloque esta mas
    // arriba en la pantalla: avisar primero de lo de abajo manda el foco hacia
    // atras y hace parecer que el formulario salta.
    intentadoFactura = true;
    const malFactura = pintarFactura();
    const faltaFactura = facturaCampos.filter(({ clave }) => malFactura[clave]);
    if (faltaFactura.length) {
      errorPago.hidden = false;
      errorPago.textContent = `Para la factura, revisa ${faltaFactura.map((c) => c.nombre).join(' y ')}.`;
      faltaFactura[0].input.focus();
      return;
    }
    const metodo = metodoActual();
    if (metodo === 'tarjeta') {
      intentado = true;
      const fallos = pintarTarjeta();
      const faltan = camposTarjeta.filter(({ clave }) => fallos[clave]);
      if (faltan.length) {
        errorPago.hidden = false;
        errorPago.textContent = `Revisa ${faltan.map((c) => c.nombre).join(', ')} de la tarjeta.`;
        faltan[0].input.focus();
        return;
      }
    }
    errorPago.hidden = true;
    procesando = true;
    panel.classList.add('is-procesando');
    pagar.innerHTML = '<span class="pago-girando" aria-hidden="true"></span> Procesando el pago…';
    pagar.disabled = true;
    pagar.setAttribute('aria-disabled', 'true');
    // El boton se desactiva, asi que el foco se va con el: al titulo, que es
    // ademas lo que lee el lector de pantalla al cambiar de paso.
    puente.enfocarTitulo();
    avisos.textContent = 'Procesando el pago…';
    temporizador = window.setTimeout(() => { temporizador = 0; aprobar(metodo); }, 1500);
  });
};

export {
  montarPago, piezasDePago, comprobanteHtml,
  pintarPago, pintarComprobante, olvidarTarjeta, restablecerPagar,
  cancelarProceso, limpiarCopiados, reiniciarMetodo, cargarFactura,
};
