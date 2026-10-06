// ---- Pago simulado y comprobante --------------------------------------
// Los dos ultimos pasos del panel de la canasta: elegir como se paga y, una
// vez "cobrado", el comprobante y el correo que lo repite. El panel entero lo
// crea cart.js; este modulo le pasa el HTML de sus dos pasos y despues trabaja
// sobre ellos. Lo que necesita de la canasta -cambiar de paso, vaciarla- va por
// el puente, porque la canasta tambien llama aqui.
import { avisos } from './ui.js';
import {
  pedido, entrega, sesion, tarjeta, cobro, puente,
  dinero, telefonoLargo, subtotal, envio, total,
} from './state.js';
import { buzonListo, enviarCorreo } from './mail.js';

// QR decorativo: los modulos salen de una secuencia fija, asi que siempre se
// dibuja igual y tiene la textura de un QR, pero no codifica nada. Por eso va
// aria-hidden y con un texto al lado que explica que es.
const qrDecorativo = () => {
  const lado = 25;
  const enOjo = (x, y) => [[0, 0], [lado - 7, 0], [0, lado - 7]].some(([ox, oy]) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7);
  let semilla = 20260926;
  const modulos = [];
  for (let y = 0; y < lado; y += 1) {
    for (let x = 0; x < lado; x += 1) {
      semilla = (semilla * 1103515245 + 12345) % 2147483648;
      if (enOjo(x, y) || semilla % 100 >= 46) continue;
      modulos.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    }
  }
  const ojo = (x, y) => `<path d="M${x + 0.5} ${y + 0.5}h6v6h-6z" fill="none" stroke="currentColor" stroke-width="1"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return '<svg class="pago-qr" viewBox="-1 -1 27 27" aria-hidden="true" focusable="false"><g fill="currentColor">'
    + modulos.join('') + ojo(0, 0) + ojo(lado - 7, 0) + ojo(0, lado - 7) + '</g></svg>';
};


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
  + '<label><input type="radio" name="canasta-metodo" value="transferencia"><span>Transferencia</span></label>'
  + '<label><input type="radio" name="canasta-metodo" value="deuna"><span>DeUna</span></label>'
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
  + '<p class="pago-campo-error" id="pago-titular-error" hidden></p></div></div>'

  + '<div class="pago-detalle" data-detalle="transferencia" hidden>'
  + '<p class="pago-dato">Transfiere desde tu banco y avísanos con el comprobante.</p>'
  + '<dl class="pago-banco">'
  + '<div><dt>Banco</dt><dd>Banco Pichincha</dd></div>'
  + '<div><dt>Tipo de cuenta</dt><dd>Corriente</dd></div>'
  + '<div><dt>Número de cuenta</dt><dd><span class="pago-cuenta">2100123456</span></dd></div>'
  + '<div><dt>Titular</dt><dd>Panadería El Tradicional Cía. Ltda.</dd></div>'
  + '<div><dt>RUC</dt><dd>1591234567001</dd></div></dl>'
  + '<button class="pago-copiar" type="button">Copiar el número de cuenta</button>'
  + '<p class="pago-copiado" role="status" hidden></p>'
  + '<p class="pago-dato pago-ficticio">Datos bancarios ficticios, puestos para la demostración.</p></div>'

  + '<div class="pago-detalle" data-detalle="deuna" hidden>'
  + '<p class="pago-dato">Abre DeUna en la app de tu banco y escanea el código.</p>'
  + '<div class="pago-qr-caja">' + qrDecorativo()
  + '<p class="pago-qr-alt">Código QR de adorno: tiene la forma de un QR de DeUna '
  + 'para El Tradicional, pero no codifica nada y no abre ningún cobro.</p></div></div>',

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
  + '<div class="recibo-linea-dir" hidden><dt>Dirección</dt><dd class="recibo-direccion"></dd></div>'
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
let copiar = null;
let copiado = null;
let canalCorreo = null;
let reciboEnviadoDe = null;
let reciboEnviadoTexto = null;
let reciboEnvioEstado = null;
let reciboCopiar = null;
let reciboCopiado = null;

// ---- Pago simulado ----
// El proyecto es academico: la gracia es enseñar el recorrido completo, no
// cobrar. Cada pantalla lo dice en voz alta para que nadie crea otra cosa.
const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia bancaria', deuna: 'DeUna' };
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
  if (metodo === 'deuna') return 'DeUna (QR)';
  return METODOS[metodo];
};

const pintarComprobante = () => {
  panel.querySelector('.recibo-numero').textContent = cobro.numero;
  panel.querySelector('.recibo-subtotal').textContent = dinero(subtotal());
  panel.querySelector('.recibo-envio').textContent = envio() ? dinero(envio()) : 'Gratis';
  panel.querySelector('.recibo-total').textContent = dinero(total());
  panel.querySelector('.recibo-metodo').textContent = cobro.detalle;
  panel.querySelector('.recibo-modo').textContent = entrega.modo === 'domicilio' ? 'A domicilio' : 'Paso retirando por el local';
  panel.querySelector('.recibo-linea-dir').hidden = entrega.modo !== 'domicilio';
  panel.querySelector('.recibo-direccion').textContent = entrega.direccion;
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
  + `${entrega.modo === 'domicilio' ? 'Te lo llevamos a ' + entrega.direccion : 'Pasa a retirarlo por el local'}. `
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
    `Entrega: ${entrega.modo === 'domicilio' ? 'A domicilio — ' + entrega.direccion : 'Paso retirando por el local'}`,
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
  if (copiado) copiado.hidden = true;
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
  copiar = panel.querySelector('.pago-copiar');
  copiado = panel.querySelector('.pago-copiado');
  canalCorreo = panel.querySelector('.pago-canal-correo');
  reciboEnviadoDe = panel.querySelector('.recibo-enviado-de');
  reciboEnviadoTexto = panel.querySelector('.recibo-enviado-texto');
  // Clase propia y no solo '.recibo-simulado': ese aviso ya existe mas arriba,
  // el del cobro simulado, y querySelector se habria quedado con ese.
  reciboEnvioEstado = panel.querySelector('.recibo-envio-estado');
  reciboCopiar = panel.querySelector('.recibo-copiar');
  reciboCopiado = panel.querySelector('.recibo-copiado');

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
    copiado.hidden = true;
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

  copiar.addEventListener('click', async () => {
    const texto = panel.querySelector('.pago-cuenta').textContent.trim();
    let hecho = false;
    try {
      if (!navigator.clipboard) throw new Error('sin portapapeles');
      await navigator.clipboard.writeText(texto);
      hecho = true;
    } catch (e) {
      hecho = respaldoCopiar(texto);
    }
    copiado.hidden = false;
    copiado.textContent = hecho ? 'Número de cuenta copiado.' : 'No se pudo copiar; selecciónalo a mano.';
  });

  pagar.addEventListener('click', () => {
    if (procesando || !pedido.size) return;
    // El aviso y el foco los pone la canasta, que es de quien es el campo.
    if (puente.faltaDireccion()) return;
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
  cancelarProceso, limpiarCopiados, reiniciarMetodo,
};
