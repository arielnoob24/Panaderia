// ---- La canasta -------------------------------------------------------
// El pedido en pantalla: el panel con sus cuatro pasos, la lista de lineas, la
// barra de deshacer y el control de cantidad que llevan las fichas. Los dos
// ultimos pasos del panel -pago y comprobante- los pone checkout.js; aqui se
// arma el panel entero y se reparte.
import {
  avisos, anexosDeFoco, atraparFoco, apagarDetras, enterAvanza, horarioDeHoy, reducedMotion,
} from './ui.js';
import {
  CLAVE, pedido, entrega, sesion, cobro, factura, puente,
  MAX_UNIDADES, ENVIO, dinero, idDe,
  subtotal, envio, total, unidades,
} from './state.js';
import { marcarActualizacion, olvidarMarca } from './storage.js';
import {
  montarPago, piezasDePago, comprobanteHtml, pintarPago,
  olvidarTarjeta, restablecerPagar, cancelarProceso, limpiarCopiados, reiniciarMetodo,
  cargarFactura,
} from './checkout.js';

const leerGuardado = () => {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return;
    // Antes se guardaba solo el array de lineas; se sigue aceptando ese formato.
    const dato = JSON.parse(crudo);
    const lineas = Array.isArray(dato) ? dato : (dato.lineas || []);
    lineas.forEach((l) => {
      if (l && l.id && l.nombre && l.cantidad > 0) pedido.set(l.id, { nombre: l.nombre, precio: Number(l.precio) || 0, cantidad: Math.min(l.cantidad, MAX_UNIDADES) });
    });
    if (!Array.isArray(dato)) {
      if (dato.modo === 'domicilio') entrega.modo = 'domicilio';
      if (typeof dato.direccion === 'string') entrega.direccion = dato.direccion.slice(0, 200);
      if (typeof dato.piso === 'string') entrega.piso = dato.piso.slice(0, 120);
      if (typeof dato.referencia === 'string') entrega.referencia = dato.referencia.slice(0, 200);
      if (typeof dato.notas === 'string') entrega.notas = dato.notas.slice(0, 300);
      // A nombre de quien va la factura tambien sobrevive a recargar: quien pide
      // para una oficina lo hace siempre a nombre de la misma.
      const f = dato.factura;
      if (f && typeof f === 'object') {
        factura.aOtro = f.aOtro === true;
        if (typeof f.nombre === 'string') factura.nombre = f.nombre.slice(0, 80);
        if (typeof f.ident === 'string') factura.ident = f.ident.replace(/\D/g, '').slice(0, 13);
        if (typeof f.correo === 'string') factura.correo = f.correo.slice(0, 120);
        if (typeof f.direccion === 'string') factura.direccion = f.direccion.slice(0, 160);
      }
    }
  } catch (e) { /* almacenamiento bloqueado o dato corrupto: se empieza vacio */ }
};
const guardar = () => {
  // Cuando se guardo va en dos sitios a la vez, y no por descuido: dentro del
  // propio pedido, para saber de cuando es lo que se esta recuperando, y en la
  // cookie, que es la que se lee para escribirlo en el pie sin tener que abrir
  // el pedido entero.
  const cuando = marcarActualizacion();
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify({
      lineas: [...pedido].map(([id, l]) => ({ id, ...l })),
      modo: entrega.modo,
      direccion: entrega.direccion,
      piso: entrega.piso,
      referencia: entrega.referencia,
      notas: entrega.notas,
      factura: { ...factura },
      guardado: cuando.toISOString(),
    }));
  } catch (e) { /* en ventana privada no se puede guardar; el pedido sigue vivo en memoria */ }
  puente.pintarGuardado?.(cuando);
};
const borrarGuardado = () => {
  try { window.localStorage.removeItem(CLAVE); } catch (e) { /* si no se pudo guardar, no hay nada que borrar */ }
  // Sin pedido guardado no hay nada de que dar la fecha: dejar la marca puesta
  // seria decir en el pie que se guardo algo que ya no esta.
  olvidarMarca();
  puente.pintarGuardado?.(null);
};

// Panel, fondo y region de avisos se crean desde JavaScript: sin JS no hacen falta.
const fondo = document.createElement('div');
fondo.className = 'canasta-fondo';
const panel = document.createElement('aside');
panel.className = 'canasta-panel';
panel.setAttribute('role', 'dialog');
panel.setAttribute('aria-modal', 'true');
panel.setAttribute('aria-labelledby', 'canasta-titulo');
const piezas = piezasDePago();
panel.innerHTML =
  '<div class="canasta-cabecera"><div class="canasta-cabecera-titulo">'
  + '<h2 id="canasta-titulo" tabindex="-1">Tu canasta</h2>'
  + '<span class="canasta-cabecera-cuenta" hidden></span></div>'
  + '<button class="canasta-cerrar" type="button" aria-label="Cerrar la canasta">×</button></div>'
  + '<div class="canasta-pasos">'

  + '<section class="canasta-paso" data-paso="canasta">'
  + '<div class="canasta-cuerpo"><ul class="canasta-lista"></ul>'
  // Vacia no se queda en un renglon gris: dice que hacer y lleva a hacerlo.
  + '<div class="canasta-vacio">'
  + '<span class="canasta-vacio-dibujo" aria-hidden="true"></span>'
  + '<p class="canasta-vacio-titulo">Tu canasta está vacía</p>'
  + '<p class="canasta-vacio-dicho">Elige algo de la vitrina y aparecerá aquí.</p>'
  + '<button class="canasta-vacio-ir" type="button">Ver la vitrina</button></div>'
  // Vaciar es quitar todo de una vez, asi que pregunta antes, como la X de
  // cada linea, y despues deja deshacerlo.
  + '<div class="canasta-vaciar-zona" hidden>'
  + '<button class="canasta-vaciar" type="button">Vaciar la canasta</button>'
  + '<div class="canasta-vaciar-pregunta" hidden>'
  + '<p class="canasta-confirma-dicho">¿Quitamos todo lo que hay en la canasta?</p>'
  + '<div class="canasta-confirma">'
  + '<button class="canasta-confirma-si canasta-vaciar-si" type="button">Sí, vaciar</button>'
  + '<button class="canasta-confirma-no canasta-vaciar-no" type="button">Cancelar</button>'
  + '</div></div></div></div>'
  + '<div class="canasta-pie">'
  + '<div class="canasta-total"><span>Subtotal <small class="canasta-total-cuenta"></small></span>'
  + '<strong>$0.00</strong></div>'
  + '<button class="button button-yellow canasta-enviar" type="button">'
  + 'Ir a pagar <span aria-hidden="true">→</span></button>'
  + '<p class="canasta-nota">Después eliges cómo lo recibes y cómo pagas.</p>'
  + '</div></section>'

  + '</div>'

  // "Para pagar hace falta cuenta". Antes era un renglon encima del boton y
  // casi nadie lo veia: ahora es una hoja que sube sobre la canasta, la
  // oscurece y no deja seguir sin contestar. Lo de detras queda apagado.
  + '<div class="pide-cuenta" role="alertdialog" aria-modal="true" '
  + 'aria-labelledby="pide-cuenta-titulo" aria-describedby="pide-cuenta-dicho" hidden>'
  + '<div class="pide-cuenta-hoja">'
  + '<span class="pide-cuenta-dibujo" aria-hidden="true">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
  + 'stroke-linecap="round" stroke-linejoin="round" focusable="false">'
  + '<circle cx="12" cy="8.2" r="3.6"/><path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0"/></svg></span>'
  + '<h3 id="pide-cuenta-titulo">Entra a tu cuenta para pagar</h3>'
  + '<p id="pide-cuenta-dicho">El comprobante del pedido te llega al correo, así que necesitas '
  + 'una cuenta con el correo verificado. <strong>Tu canasta se queda tal como está.</strong></p>'
  + '<button class="button button-yellow pide-cuenta-principal" type="button"></button>'
  + '<button class="pide-cuenta-otra" type="button"></button>'
  + '<button class="pide-cuenta-volver" type="button">Seguir viendo la canasta</button>'
  + '</div></div>';


// ---- La vista de confirmar el pedido ---------------------------------
// Confirmar el pedido no es una ventana encima del catalogo: es otra vista, con
// su direccion (#confirmar), su boton de volver y el atras del navegador, igual
// que la vista de categoria que abre "Ver el menu". De ahi que viva dentro de
// <main> y no dentro del panel: es una pagina mas del sitio, no un dialogo, y
// por eso tampoco lleva cerco de foco ni apaga lo de detras.
//
// En pantalla ancha se reparte en dos columnas -los datos a un lado y el
// resumen al otro, pegado al desplazarse-, que es para lo que sirve ganar el
// ancho; en el telefono es una columna con el boton pegado abajo.
const vista = document.createElement('section');
vista.id = 'confirmar';
vista.className = 'checkout section-pad';
vista.hidden = true;
vista.innerHTML =
  '<div class="container">'
  + '<div class="vista-cabeza checkout-cabeza">'
  + '<button class="vista-volver checkout-volver" type="button">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
  + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
  + '<path d="M14.5 5.5 8 12l6.5 6.5"/></svg>Volver a la tienda</button>'
  + '<h2 class="vista-titulo checkout-titulo" tabindex="-1">Confirmar el pedido</h2>'
  + '</div>'

  + '<div class="checkout-paso" data-checkout="pedido">'
  + '<div class="checkout-grid">'
  + '<div class="checkout-datos">'
  + piezas.aviso
  + '<fieldset class="canasta-entrega"><legend>¿Cómo lo quieres?</legend>'
  + '<div class="canasta-opciones">'
  + '<label><input type="radio" name="canasta-entrega" value="retiro" checked>'
  + '<span>Paso retirando<small>Gratis</small></span></label>'
  + '<label><input type="radio" name="canasta-entrega" value="domicilio">'
  + '<span>A domicilio<small>' + dinero(ENVIO) + '</small></span></label></div>'
  // Quien pasa a retirar necesita saber donde esta el local: la calle escrita
  // y un enlace que abre la aplicacion de mapas con la ruta.
  + '<div class="canasta-local">'
  + '<p class="canasta-local-titulo">Esquina de Eloy Alfaro y Gabriel Espinosa</p>'
  + '<p class="canasta-local-dato">Tena, Napo. Te esperamos en el mostrador.</p>'
  + '<a class="mapa-ruta" '
  + 'href="https://www.google.com/maps/dir/?api=1&destination=-1.004033,-77.812690" '
  + 'target="_blank" rel="noopener">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
  + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
  + '<path d="M12 21.4c0 0-6.6-5.3-6.6-10.1a6.6 6.6 0 0 1 13.2 0c0 4.8-6.6 10.1-6.6 10.1Z"/>'
  + '<circle cx="12" cy="11" r="2.4"/></svg>Cómo llegar '
  + '<span aria-hidden="true">↗</span>'
  + '<span class="sr-only"> (abre en una pestaña nueva)</span></a>'
  + '<p class="canasta-local-hora"></p></div>'

  + '<div class="canasta-direccion" hidden>'
  + '<label for="canasta-dir">¿A dónde lo llevamos?</label>'
  + '<input id="canasta-dir" type="text" autocomplete="street-address" '
  + 'placeholder="Calle, número y barrio">'
  + '<p class="canasta-aviso" role="alert" hidden>Escribe la dirección para poder llevarlo.</p>'
  // Lo que no dice la calle: en que puerta hay que golpear. Son
  // opcionales porque una casa en la esquina no tiene piso ni torre, y pedir
  // un campo que no aplica se contesta con un guion.
  + '<div class="dir-detalle">'
  + '<div><label for="canasta-piso">Piso, departamento u oficina</label>'
  + '<input id="canasta-piso" type="text" autocomplete="address-line2" '
  + 'placeholder="Torre B, piso 3, dpto. 302"></div>'
  + '<div><label for="canasta-ref">Una referencia para encontrarlo</label>'
  + '<input id="canasta-ref" type="text" '
  + 'placeholder="Portón verde, frente a la cancha"></div>'
  + '</div>'
  + '<label for="canasta-notas">Indicaciones para quien entrega '
  + '<small>(opcional)</small></label>'
  + '<textarea id="canasta-notas" rows="2" maxlength="300" '
  + 'placeholder="Timbre dañado, llamar al llegar. Hay perro."></textarea>'
  + '</div></fieldset>'

  // Como se paga y a nombre de quien va la factura, puestos por checkout.js.
  // La factura va despues del pago porque es un dato administrativo: primero se
  // decide lo que afecta al pedido y luego a quien se le emite el papel.
  + piezas.metodos
  + piezas.factura
  + '</div>'

  // La columna del resumen lleva dentro el boton de confirmar: es lo ultimo que
  // se lee, justo debajo del total, y no al final de un formulario largo.
  + '<aside class="checkout-resumen">'
  // Lo que llevas, de solo lectura: editar se hace en la canasta. Si se pudiera
  // cambiar la cantidad aqui, el total cambiaria por debajo mientras alguien
  // escribe los datos de la tarjeta. De ahi el boton de al lado, que es la
  // salida: ver el error y poder arreglarlo sin buscar la flecha de arriba.
  + '<div class="pedido-resumen">'
  + '<div class="resumen-cabeza"><h3 class="recibo-titulo">Tu pedido</h3>'
  + '<p class="resumen-cuenta"></p></div>'
  + '<ul class="recibo-lista resumen-lista"></ul>'
  + '<button class="resumen-editar" type="button">Editar la canasta</button>'
  + '</div>'

  // El desglose solo se puede escribir sabiendo como se recibe, y eso se decide
  // unos centimetros mas arriba en esta misma pantalla.
  + '<dl class="canasta-desglose">'
  + '<div><dt>Subtotal</dt><dd class="desglose-subtotal">$0.00</dd></div>'
  + '<div><dt>Envío</dt><dd class="desglose-envio">Gratis</dd></div>'
  + '<div class="desglose-suma"><dt>Total</dt><dd class="desglose-total">$0.00</dd></div>'
  + '</dl>'
  + piezas.canal
  + piezas.pie
  + '</aside>'
  + '</div></div>'

  + '<div class="checkout-paso" data-checkout="comprobante" hidden>'
  + comprobanteHtml()
  + '</div>'
  + '</div>';
document.querySelector('#contenido')?.append(vista);

// La barra de deshacer. Vive en el body y no dentro del panel porque se
// quita desde los dos sitios: desde la ficha del catalogo y desde la lista de
// la canasta. Va por encima del panel para que se vea en ambos casos, y se
// apunta en los anexos del cerco para que el tabulador la alcance.
const barraDeshacer = document.createElement('div');
barraDeshacer.className = 'deshacer-barra';
barraDeshacer.hidden = true;
barraDeshacer.innerHTML = '<p class="deshacer-texto"></p>'
  + '<button class="deshacer-boton" type="button">Deshacer</button>';
const deshacerTexto = barraDeshacer.querySelector('.deshacer-texto');
const deshacerBoton = barraDeshacer.querySelector('.deshacer-boton');
anexosDeFoco.add(barraDeshacer);

document.body.append(fondo, panel, barraDeshacer);

const titulo = panel.querySelector('#canasta-titulo');
const lista = panel.querySelector('.canasta-lista');
const vacio = panel.querySelector('.canasta-vacio');
const totalEl = panel.querySelector('[data-paso="canasta"] .canasta-total strong');
const totalCuenta = panel.querySelector('.canasta-total-cuenta');
const cabeceraCuenta = panel.querySelector('.canasta-cabecera-cuenta');
const enviar = panel.querySelector('.canasta-enviar');
const radios = [...vista.querySelectorAll('input[name="canasta-entrega"]')];
const bloqueDir = vista.querySelector('.canasta-direccion');
const campoDir = vista.querySelector('#canasta-dir');
const campoPiso = vista.querySelector('#canasta-piso');
const campoRef = vista.querySelector('#canasta-ref');
const campoNotas = vista.querySelector('#canasta-notas');
const avisoDir = vista.querySelector('.canasta-direccion .canasta-aviso');
const resumenLista = vista.querySelector('.resumen-lista');
const resumenCuenta = vista.querySelector('.resumen-cuenta');
const resumenEditar = vista.querySelector('.resumen-editar');
const localHora = vista.querySelector('.canasta-local-hora');
const desgloseSub = vista.querySelector('.desglose-subtotal');
const desgloseEnvio = vista.querySelector('.desglose-envio');
const desgloseTotal = vista.querySelector('.desglose-total');
const bloqueLocal = vista.querySelector('.canasta-local');
const pideCuenta = panel.querySelector('.pide-cuenta');
const pidePrincipal = panel.querySelector('.pide-cuenta-principal');
const pideOtra = panel.querySelector('.pide-cuenta-otra');
const listo = vista.querySelector('.canasta-listo');
const zonaVaciar = panel.querySelector('.canasta-vaciar-zona');
const botonVaciar = panel.querySelector('.canasta-vaciar');
const preguntaVaciar = panel.querySelector('.canasta-vaciar-pregunta');

const boton = document.querySelector('.floating-whatsapp');
if (boton) boton.dataset.tip = 'Tu canasta';
const cuenta = document.createElement('span');
cuenta.className = 'canasta-cuenta';
cuenta.hidden = true;
// Cada ficha del catalogo deja aqui su manera de repintarse: lo que cambia en
// el panel (o al restaurar el pedido guardado) tiene que verse en el catalogo.
const refrescos = [];
// Y donde vive el boton "mas" de cada producto, para poder devolverle el
// foco. Es una funcion y no un id fijo porque lo que viene en varios tamanios
// cambia de identificador al cambiar el tamanio elegido.
const botonesMas = [];

// Basurero del mismo trazo que el resto de los iconos: tapa, asa, cuerpo que
// se estrecha y dos costillas. Lo usan la ficha del catalogo y la linea de la
// canasta, asi que vive aqui arriba, antes que las dos.
const BASURERO = '<svg class="card-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
  + 'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
  + '<path d="M4.8 7.1h14.4"/>'
  + '<path d="M9.7 7.1V5.3a1.4 1.4 0 0 1 1.4-1.4h1.8a1.4 1.4 0 0 1 1.4 1.4v1.8"/>'
  + '<path d="M6.5 7.1l.8 11.3a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-11.3"/>'
  + '<path d="M10.3 10.8v5.8"/><path d="M13.7 10.8v5.8"/></svg>';

// La foto pequena de cada producto, para que en la canasta se reconozca de un
// vistazo y no solo por el nombre. La apunta cada ficha al montarse; una linea
// que viene con tamanio ("Torta de 1 libra") usa la de su producto.
const fotos = new Map();
const fotoDe = (nombre) => {
  for (const [base, src] of fotos) {
    if (nombre === base || nombre.startsWith(`${base} `)) return src;
  }
  return '';
};
const fotoHtml = (nombre) => {
  const src = fotoDe(nombre);
  // Sin alt: el nombre va justo al lado, y leerlo dos veces no ayuda a nadie.
  return '<span class="canasta-foto">'
    + (src ? `<img src="${src}" alt="" width="64" height="64" loading="lazy">` : '')
    + '</span>';
};

// ---- "Ya esta en la canasta" ---------------------------------------------
// Al pulsar el mas de una ficha, la foto del producto vuela hasta el boton de
// la canasta, y la canasta da un saltito al recibirla. Cambiar solo la forma
// del boton no bastaba: nadie miraba ahi. Asi se ve adonde fue el producto
// sin leer nada, y sin tapar nada. El lector de pantalla ya lo oye por avisos.
const latido = () => {
  if (!boton) return;
  // Quitar y volver a poner la clase reinicia la animacion aunque se pulse
  // varias veces seguidas.
  boton.classList.remove('is-latido');
  void boton.offsetWidth;
  boton.classList.add('is-latido');
};
const volarALaCanasta = (ficha) => {
  const img = ficha.querySelector('.product-image img');
  const destino = boton?.getBoundingClientRect();
  if (reducedMotion.matches || !img || !destino?.width) { latido(); return; }
  const origen = img.getBoundingClientRect();
  const lado = 76;
  const bolita = document.createElement('span');
  bolita.className = 'vuela-canasta';
  bolita.setAttribute('aria-hidden', 'true');
  bolita.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
  bolita.style.left = `${origen.left + origen.width / 2 - lado / 2}px`;
  bolita.style.top = `${origen.top + origen.height / 2 - lado / 2}px`;
  document.body.append(bolita);
  const dx = destino.left + destino.width / 2 - (origen.left + origen.width / 2);
  const dy = destino.top + destino.height / 2 - (origen.top + origen.height / 2);
  // Tres puntos: sale un poco hacia arriba, como lanzada, y cae en la canasta
  // haciendose pequena.
  const vuelo = bolita.animate([
    { transform: 'translate(0, 0) scale(.6)', opacity: 0 },
    { transform: 'translate(0, -24px) scale(1.1)', opacity: 1, offset: .18 },
    { transform: `translate(${dx * .55}px, ${dy * .55 - 70}px) scale(.75)`, opacity: 1, offset: .6 },
    { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: .7 },
  ], { duration: 750, easing: 'cubic-bezier(.45, 0, .55, 1)' });
  vuelo.onfinish = () => { bolita.remove(); latido(); };
  vuelo.oncancel = () => bolita.remove();
};

// Que linea esta esperando un si o un no. Vive fuera de pintar porque pintar
// rehace la lista entera en cada cambio: si la pregunta viviera en el DOM y
// nada mas, tocar el "mas" de otro producto la borraria sin contestarla.
let porConfirmar = null;
// Y desde que boton se pregunto, para devolverle el foco si dice que no: la
// pregunta la abren el basurero de la ultima unidad y la X de la linea.
let preguntoDesde = '[data-menos]';

const pintar = () => {
  lista.textContent = '';
  for (const [id, l] of pedido) {
    const li = document.createElement('li');
    li.className = 'canasta-linea';
    // Para poder devolverle el foco a esta misma linea despues de repintar.
    // Por el dataset y no por un selector: el identificador lleva dentro el
    // nombre del producto y el tamanio, y eso no siempre es un selector valido.
    li.dataset.id = id;
    if (id === porConfirmar) {
      li.classList.add('is-confirmando');
      li.innerHTML = fotoHtml(l.nombre)
        + `<div class="canasta-info"><h3>${l.nombre}</h3>`
        + `<p class="canasta-confirma-dicho">${l.cantidad === 1
          ? '¿Lo quitamos de la canasta?' : `¿Quitamos las ${l.cantidad} unidades?`}</p>`
        + '<div class="canasta-confirma">'
        + '<button class="canasta-confirma-si" type="button" '
        + `aria-label="Sí, quitar ${l.nombre} de la canasta">Sí, quitar</button>`
        + '<button class="canasta-confirma-no" type="button" '
        + `aria-label="Cancelar, dejar ${l.nombre} en la canasta">Cancelar</button>`
        + '</div></div>';
      li.querySelector('.canasta-confirma-si').addEventListener('click', () => confirmarQuitar(id));
      li.querySelector('.canasta-confirma-no').addEventListener('click', () => cancelarQuitar(id));
      // Escape dice que no, y se queda aqui: sin esto subiria hasta el
      // vigilante del panel, que lo entiende como "cierra la canasta" y se
      // llevaria por delante el pedido entero por contestar a una pregunta.
      li.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        e.stopPropagation();
        cancelarQuitar(id);
      });
      lista.append(li);
      continue;
    }
    // Con una sola unidad, quitarla es borrar el producto: el boton lo dice
    // con un basurero, igual que en la ficha del catalogo, y ademas pregunta.
    const ultima = l.cantidad === 1;
    // Foto a la izquierda; a su lado el nombre con la X en la misma linea, el
    // precio por unidad debajo y, abajo del todo, la cantidad y lo que suma.
    li.innerHTML = fotoHtml(l.nombre)
      + '<div class="canasta-info">'
      + `<div class="canasta-fila"><h3>${l.nombre}</h3>`
      // La X quita el producto entero, lleve las unidades que lleve: sin ella,
      // para quitar doce panes habia que bajar uno a uno hasta el basurero.
      + '<button class="canasta-quitar" type="button" '
      + `aria-label="Quitar ${l.nombre} de la canasta" data-tip="Quitar de la canasta">×</button></div>`
      + `<p class="canasta-precio">${dinero(l.precio)} c/u</p>`
      + '<div class="canasta-fila canasta-fila-baja">'
      + '<div class="canasta-cantidad"><button type="button" data-menos '
      + `aria-label="${ultima ? `Quitar ${l.nombre} de la canasta` : `Quitar uno de ${l.nombre}`}">`
      + `${ultima ? BASURERO : '−'}</button>`
      + `<output>${l.cantidad}</output>`
      + `<button type="button" data-mas aria-label="Añadir uno de ${l.nombre}">+</button></div>`
      + `<span class="canasta-subtotal">${dinero(l.precio * l.cantidad)}</span></div></div>`;
    li.querySelector('[data-menos]').addEventListener('click', () => {
      if (l.cantidad === 1) { pedirQuitar(id, '[data-menos]'); return; }
      cambiar(id, -1);
    });
    li.querySelector('.canasta-quitar').addEventListener('click', () => pedirQuitar(id, '.canasta-quitar'));
    li.querySelector('[data-mas]').addEventListener('click', () => cambiar(id, 1));
    lista.append(li);
  }
  pintarPie();
};

const lineaDe = (id) => [...lista.children].find((li) => li.dataset.id === id);

const pedirQuitar = (id, desde) => {
  const l = pedido.get(id);
  if (!l) return;
  porConfirmar = id;
  preguntoDesde = desde;
  pintar();
  // El boton que se acaba de pulsar ya no existe, asi que hay que recoger
  // el foco. Va al "Si, quitar" y no al "Cancelar": quien pulso el basurero o
  // la X ya dijo lo que queria, y la pregunta esta para que lo vea, no para
  // esconderle la salida. El clic de mas sigue estando ahi para el descuido.
  lineaDe(id)?.querySelector('.canasta-confirma-si')?.focus();
  avisos.textContent = l.cantidad === 1
    ? `¿Quitar ${l.nombre} de la canasta?`
    : `¿Quitar las ${l.cantidad} unidades de ${l.nombre} de la canasta?`;
};

const cancelarQuitar = (id) => {
  if (porConfirmar !== id) return;
  porConfirmar = null;
  pintar();
  // De vuelta al boton del que salio la pregunta, que es donde estaba el
  // foco antes de preguntar.
  lineaDe(id)?.querySelector(preguntoDesde)?.focus();
  avisos.textContent = `${pedido.get(id)?.nombre || 'El producto'} sigue en la canasta.`;
};

const confirmarQuitar = (id) => {
  const l = pedido.get(id);
  porConfirmar = null;
  if (!l) { pintar(); return; }
  // Se anota antes de borrar: la barra de deshacer necesita una copia, porque
  // la linea original desaparece del pedido.
  anotarBorrado(id, { ...l });
  pedido.delete(id);
  pintar();
  avisos.textContent = `Quitaste ${l.nombre}. ${unidades()} producto${unidades() === 1 ? '' : 's'} en la canasta.`;
  // La linea donde vivia el foco ya no existe. Se le pasa a "Deshacer", que
  // acaba de aparecer y es justo lo siguiente que querria quien se arrepienta.
  deshacerBoton.focus();
};

// El desglose solo se puede escribir una vez que se sabe como se recibe: el
// envio cambia el total y hasta el paso de entrega no esta decidido.
const pintarDesglose = () => {
  bloqueDir.hidden = entrega.modo !== 'domicilio';
  if (bloqueLocal) bloqueLocal.hidden = entrega.modo !== 'retiro';
  pintarHoraRetiro();
  if (desgloseSub) desgloseSub.textContent = dinero(subtotal());
  if (desgloseEnvio) desgloseEnvio.textContent = envio() ? dinero(envio()) : 'Gratis';
  if (desgloseTotal) desgloseTotal.textContent = dinero(total());
};

// Lo que llevas, escrito en la pantalla de confirmar. Va con createElement y
// textContent y no con innerHTML: el nombre sale de un archivo de datos y no
// tiene por que acabar interpretandose como etiquetas.
const pintarResumen = () => {
  if (!resumenLista) return;
  resumenLista.textContent = '';
  for (const l of pedido.values()) {
    const li = document.createElement('li');
    const que = document.createElement('span');
    que.textContent = `${l.cantidad} × ${l.nombre}`;
    const cuanto = document.createElement('span');
    cuanto.textContent = dinero(l.precio * l.cantidad);
    li.append(que, cuanto);
    resumenLista.append(li);
  }
  const n = unidades();
  if (resumenCuenta) resumenCuenta.textContent = `${n} producto${n === 1 ? '' : 's'}`;
};

// Hasta que hora se puede pasar a retirar. Sale del horario de verdad, el mismo
// que calcula el estado del pie: es lo unico con forma de tiempo que este sitio
// puede afirmar, porque no tiene cola de horno ni reparto que consultar. Un
// "listo en 20 minutos" seria inventado.
const pintarHoraRetiro = () => {
  if (!localHora) return;
  const h = horarioDeHoy();
  if (h.festivo) localHora.textContent = 'Hoy no horneamos: es día festivo.';
  else if (h.abierto) localHora.textContent = `Puedes retirarlo hoy hasta las ${h.cierra}.`;
  else if (h.antesDeAbrir) localHora.textContent = `Hoy abrimos a las ${h.abre}.`;
  else localHora.textContent = 'Hoy ya cerramos.';
};

const pintarPie = () => {
  const hayAlgo = pedido.size > 0;
  vacio.hidden = hayAlgo;
  zonaVaciar.hidden = !hayAlgo;
  totalEl.textContent = dinero(subtotal());
  const cuantos = unidades();
  const cuantosTexto = `${cuantos} producto${cuantos === 1 ? '' : 's'}`;
  totalCuenta.textContent = hayAlgo ? `(${cuantosTexto})` : '';
  cabeceraCuenta.hidden = !hayAlgo;
  cabeceraCuenta.textContent = cuantosTexto;
  enviar.disabled = !hayAlgo;
  enviar.setAttribute('aria-disabled', String(!hayAlgo));
  pintarDesglose();
  const n = unidades();
  cuenta.hidden = n === 0;
  cuenta.textContent = n;
  if (boton) boton.setAttribute('aria-label', n ? `Ver la canasta, ${n} producto${n === 1 ? '' : 's'}` : 'Ver la canasta, vacía');
  if (sesion.dentro && sesion.verificado) verPideCuenta(false);
  // El importe y el resumen de la pantalla de confirmar se recalculan aqui:
  // volver atras y cambiar la canasta tiene que verse reflejado al seguir.
  pintarResumen();
  pintarPago();
  refrescos.forEach((refrescar) => refrescar());
  guardar();
};

// ---- Moverse entre la canasta y la vista de confirmar ----------------
// La canasta se queda gaveta: es la ojeada rapida a lo que llevas y se abre
// encima de donde estes. Confirmar y el comprobante son vistas, cada una con su
// direccion y su entrada en el historial, asi que el atras del navegador va de
// una a otra igual que en la vista de categoria.
const RUTAS = { '#confirmar': 'pedido', '#comprobante': 'comprobante' };
const TITULOS = { pedido: 'Confirmar el pedido', comprobante: 'Pedido confirmado' };
const pasosVista = [...vista.querySelectorAll('.checkout-paso')];
const tituloVista = vista.querySelector('.checkout-titulo');
// Cual de los dos pasos se esta viendo, o null si no estamos en el checkout.
let pasoActual = null;

// Ensena uno de los dos pasos, o esconde la vista entera. No toca el historial:
// de eso se encargan quien abre y el popstate, para no apuntar dos veces.
const verVista = (paso, mover = true) => {
  pasoActual = paso;
  const dentro = Boolean(paso);
  document.body.classList.toggle('is-checkout', dentro);
  vista.hidden = !dentro;
  pasosVista.forEach((s) => { s.hidden = s.dataset.checkout !== paso; });
  if (!dentro) return;
  tituloVista.textContent = TITULOS[paso];
  document.title = TITULOS[paso] + ' | El Tradicional';
  // Se llega arriba de golpe y no con desplazamiento suave: es otra pagina, no
  // un salto dentro de la que ya se estaba mirando.
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (mover) tituloVista.focus({ preventScroll: true });
};

const abrirCheckout = () => {
  if (abierto()) cerrar();
  history.pushState({ checkout: 'pedido' }, '', '#confirmar');
  verVista('pedido');
};

// El comprobante sustituye a confirmar en el historial en vez de apilarse: el
// atras no puede devolver al pago de un pedido que ya esta hecho.
const verComprobante = () => {
  history.replaceState({ checkout: 'comprobante' }, '', '#comprobante');
  verVista('comprobante');
};

// Lo que hay que recoger al salir del checkout, y da igual por donde se salga:
// por el boton de volver o por el atras del navegador. Un cobro a medias se
// corta, y saliendo desde el comprobante el pedido esta cumplido y la canasta
// se vacia. Vive aparte justo porque son dos caminos: cuando esto colgaba solo
// del boton, volver atras desde el comprobante dejaba el pedido en la canasta
// como si no se hubiera hecho.
const recogerCheckout = () => {
  const desdeComprobante = pasoActual === 'comprobante';
  cancelarProceso();
  restablecerPagar();
  olvidarTarjeta();
  limpiarCopiados();
  if (!desdeComprobante) return;
  cobro.numero = '';
  olvidarBorrado();
  pedido.clear();
  // Pedido cumplido: el proximo empieza de cero, tambien en la forma de pago.
  reiniciarMetodo();
  pintar();
};

// Salir del checkout por el boton: apunta la vuelta en el historial y devuelve
// la pagina a lo que diga la direccion.
const cerrarCheckout = () => {
  recogerCheckout();
  history.pushState({}, '', location.pathname + location.search);
  verVista(null);
  // El catalogo se repinta con lo que diga la direccion, y con el el titulo.
  puente.pintarRuta?.();
  boton?.focus();
};

vista.querySelector('.checkout-volver').addEventListener('click', () => cerrarCheckout());
listo.addEventListener('click', () => cerrarCheckout());

// El popstate de view.js pregunta primero por aqui. Devuelve si la vista se
// queda en pantalla, para que alla sepan si hay categoria que pintar.
puente.verCheckout = () => {
  const paso = RUTAS[location.hash] || null;
  const limpiar = () => {
    recogerCheckout();
    verVista(null);
    history.replaceState({}, '', location.pathname + location.search);
    return false;
  };
  if (!paso) { if (pasoActual) { recogerCheckout(); verVista(null); } return false; }
  // A un comprobante sin numero no se vuelve: el pedido se cerro y sus datos
  // vivian en memoria. Y a confirmar no se entra con la canasta vacia.
  if (paso === 'comprobante' && !cobro.numero) return limpiar();
  if (paso === 'pedido' && !pedido.size) return limpiar();
  if (paso !== pasoActual) verVista(paso);
  return true;
};

// Al entrar en una categoria desde la barra, el checkout se cierra: la barra
// sigue a la vista, y pulsar "Panes" ahi significa irse.
puente.ocultarCheckout = () => { if (pasoActual) verVista(null); };
puente.verComprobante = verComprobante;

// Elegir retiro o domicilio: lo unico que cambia es el pie.
radios.forEach((radio) => radio.addEventListener('change', () => {
  if (!radio.checked) return;
  entrega.modo = radio.value === 'domicilio' ? 'domicilio' : 'retiro';
  avisoDir.hidden = true;
  pintarPie();
  if (entrega.modo === 'domicilio') campoDir.focus();
}));

campoDir.addEventListener('input', () => {
  entrega.direccion = campoDir.value.trim().slice(0, 200);
  if (entrega.direccion) avisoDir.hidden = true;
  pintarPie();
});

// Los tres campos de detalle se guardan igual, asi que se cablean en bucle.
// Ninguno es obligatorio: no cortan la confirmacion ni avisan de nada.
[[campoPiso, 'piso', 120], [campoRef, 'referencia', 200], [campoNotas, 'notas', 300]]
  .forEach(([campo, llave, tope]) => campo?.addEventListener('input', () => {
    entrega[llave] = campo.value.trim().slice(0, tope);
    guardar();
  }));


// Confirmar la canasta lleva a decidir como se recibe, no al pago: hasta no
// saberlo no se puede decir cuanto cuesta el pedido entero.
const puedePedir = () => sesion.dentro && sesion.verificado;

enviar.addEventListener('click', () => {
  if (!pedido.size) return;
  // El comprobante va al correo de la cuenta, asi que hay que saber cual es y
  // que sea suyo: un correo inventado deja el pedido sin comprobante. El
  // aviso se queda dentro de la canasta y no echa al usuario a otra parte sin
  // explicar por que.
  if (!puedePedir()) {
    verPideCuenta(true);
    pidePrincipal.focus();
    return;
  }
  verPideCuenta(false);
  pintarDesglose();
  abrirCheckout();
});

// Mientras la hoja esta arriba, lo de detras se apaga: ni se pulsa ni se
// llega con el tabulador, y el cerco de foco del panel la recorre solo a ella.
function verPideCuenta(ver) {
  if (ver) {
    // Quien llega aqui casi nunca tiene cuenta: el aviso sale justo porque no
    // la hay, asi que la puerta grande es crearla. Si en este navegador ya hay
    // una cuenta guardada, lo probable es lo contrario y la grande es entrar.
    const tiene = Boolean(puente.correoGuardado?.());
    pidePrincipal.dataset.va = tiene ? 'entrar' : 'crear';
    pidePrincipal.textContent = tiene ? 'Iniciar sesión' : 'Crear una cuenta';
    pideOtra.dataset.va = tiene ? 'crear' : 'entrar';
    pideOtra.textContent = tiene ? 'No tengo cuenta, crear una' : 'Ya tengo cuenta, iniciar sesión';
  }
  pideCuenta.hidden = !ver;
  panel.querySelector('.canasta-cabecera').inert = ver;
  panel.querySelector('.canasta-pasos').inert = ver;
}

// Saltar a la cuenta no pierde el pedido: la canasta se queda como esta y al
// volver se sigue donde se estaba. La cuenta vive en account.js, asi que se la
// llama por el puente; al pulsar ya esta cargada.
[pidePrincipal, pideOtra].forEach((b) => b.addEventListener('click', () => {
  verPideCuenta(false);
  cerrar();
  puente.abrirC(b.dataset.va);
}));
const volverDePide = () => {
  verPideCuenta(false);
  enviar.focus();
};
panel.querySelector('.pide-cuenta-volver').addEventListener('click', volverDePide);
// Escape cierra la hoja y se queda aqui: si subiera hasta el panel, cerraria
// la canasta entera por contestar a un aviso.
pideCuenta.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  e.stopPropagation();
  volverDePide();
});
// Tocar lo oscuro de alrededor es lo mismo que "Seguir viendo la canasta".
pideCuenta.addEventListener('click', (e) => { if (e.target === pideCuenta) volverDePide(); });

// El resumen es de solo lectura, asi que necesita una puerta de vuelta a donde
// si se puede cambiar la cantidad.
resumenEditar?.addEventListener('click', () => abrir());

// Sin direccion no se puede llevar nada. Antes esto cortaba el paso de "seguir
// al pago"; ahora que todo esta en una pantalla, corta la confirmacion, y lo
// llama checkout.js por el puente porque el campo es de aqui.
puente.faltaDireccion = () => {
  if (entrega.modo !== 'domicilio' || entrega.direccion) return false;
  avisoDir.hidden = false;
  campoDir.focus();
  return true;
};

// Lo ultimo que se quito, por si hay que reponerlo. Se guarda una copia: la
// linea original se borra del pedido y no se puede confiar en la referencia.
const ESPERA_DESHACER = 12000;
let borrado = null;
let relojDeshacer = 0;

const olvidarBorrado = () => {
  // Confirmar un borrado deja el foco en "Deshacer". Si la barra se va sola a
  // los doce segundos con el foco dentro, se quedaria en el body y quien usa
  // teclado perderia el sitio, asi que hay que recogerlo.
  const teniaFoco = barraDeshacer.contains(document.activeElement);
  const id = borrado?.lineas[0]?.[0];
  window.clearTimeout(relojDeshacer);
  relojDeshacer = 0;
  borrado = null;
  barraDeshacer.hidden = true;
  if (!teniaFoco) return;
  // Con el panel abierto, su titulo, que es a donde manda tambien el cambio
  // de paso. Si no, el "mas" de la ficha del producto que se quito.
  const destino = abierto() ? titulo : botonesMas.find(({ coincide }) => coincide(id))?.boton;
  destino?.focus();
};

// Lo borrado es una lista de [id, linea]: una sola al quitar un producto,
// todas al vaciar la canasta. Deshacer las repone todas.
const anotarLineas = (lineas, texto) => {
  borrado = { lineas: lineas.map(([id, l]) => [id, { ...l }]) };
  deshacerTexto.textContent = texto;
  barraDeshacer.hidden = false;
  window.clearTimeout(relojDeshacer);
  relojDeshacer = window.setTimeout(olvidarBorrado, ESPERA_DESHACER);
};
const anotarBorrado = (id, linea) => anotarLineas([[id, linea]], linea.cantidad === 1
  ? `Quitaste ${linea.nombre}.`
  : `Quitaste ${linea.nombre} (${linea.cantidad} unidades).`);

const deshacerBorrado = () => {
  if (!borrado) return;
  const repuestas = borrado.lineas;
  repuestas.forEach(([idL, l]) => pedido.set(idL, { ...l }));
  const [id, linea] = repuestas[0];
  olvidarBorrado();
  pintar();
  avisos.textContent = `${repuestas.length === 1 ? `${linea.nombre} vuelve` : 'Todo vuelve'} a la canasta. ${unidades()} producto${unidades() === 1 ? '' : 's'} en la canasta.`;
  // La barra acaba de esconderse con el foco dentro, asi que hay que
  // recogerlo: si no, se va al body y quien usa teclado pierde el sitio.
  // Va al "mas" del producto repuesto, que es a donde manda tambien quitar
  // la ultima unidad desde la ficha. Pero el destino depende de desde donde
  // se quito: con el panel abierto el catalogo esta inert, y a lo inerte no
  // se le puede dar el foco -lo intenta y se queda en el body-, asi que ahi
  // el sitio es el "mas" de la linea recien repuesta dentro del panel.
  // Si el panel esta abierto el destino vive dentro de el; si no, en la ficha
  // del catalogo. No vale mirar si el elemento "se ve": el panel cerrado sigue
  // teniendo medidas y solo esta en visibility hidden, asi que parece valido
  // y al darle el foco no pasa nada.
  const destino = abierto()
    ? ([...lista.querySelectorAll('.canasta-linea')]
        .find((li) => li.querySelector('h3')?.textContent === linea.nombre)
        ?.querySelector('[data-mas]') || panel.querySelector('.canasta-cerrar'))
    : botonesMas.find(({ coincide }) => coincide(id))?.boton;
  destino?.focus();
};

deshacerBoton.addEventListener('click', deshacerBorrado);

const preguntarVaciar = (si) => {
  preguntaVaciar.hidden = !si;
  botonVaciar.hidden = si;
};
botonVaciar.addEventListener('click', () => {
  preguntarVaciar(true);
  // Como en la X de cada linea: el foco va al "Si", que es lo que se pidio.
  preguntaVaciar.querySelector('.canasta-vaciar-si').focus();
  avisos.textContent = '¿Vaciar la canasta?';
});
preguntaVaciar.querySelector('.canasta-vaciar-no').addEventListener('click', () => {
  preguntarVaciar(false);
  botonVaciar.focus();
});
preguntaVaciar.querySelector('.canasta-vaciar-si').addEventListener('click', () => {
  preguntarVaciar(false);
  const n = unidades();
  anotarLineas([...pedido], `Vaciaste la canasta (${n} producto${n === 1 ? '' : 's'}).`);
  pedido.clear();
  porConfirmar = null;
  pintar();
  avisos.textContent = 'Vaciaste la canasta.';
  deshacerBoton.focus();
});
// Escape contesta que no y se queda aqui, como en la pregunta de cada linea:
// si subiera, cerraria el panel entero.
preguntaVaciar.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  e.stopPropagation();
  preguntarVaciar(false);
  botonVaciar.focus();
});

const cambiar = (id, delta) => {
  const l = pedido.get(id);
  if (!l) return;
  l.cantidad += delta;
  if (l.cantidad < 1) {
    anotarBorrado(id, { ...l, cantidad: 1 });
    pedido.delete(id);
  } else {
    pedido.set(id, l);
  }
  pintar();
};

let ultimoFoco = null;
const abrir = () => {
  ultimoFoco = document.activeElement;
  fondo.classList.add('is-open');
  panel.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  apagarDetras(panel, true);
  panel.querySelector('.canasta-cerrar').focus();
};
const cerrar = () => {
  fondo.classList.remove('is-open');
  panel.classList.remove('is-open');
  document.body.style.overflow = '';
  // Se enciende antes de devolver el foco: a lo apagado no se le puede dar.
  apagarDetras(panel, false);
  // Una pregunta sin contestar no sobrevive al cierre: al volver, la linea se
  // ve entera otra vez y no con un "¿lo quitamos?" de la visita anterior.
  // Hay que repintar, no basta con olvidarla: la pregunta esta dibujada.
  if (porConfirmar) { porConfirmar = null; pintar(); }
  preguntarVaciar(false);
  verPideCuenta(false);
  ultimoFoco?.focus();
};
const abierto = () => panel.classList.contains('is-open');

fondo.addEventListener('click', cerrar);
panel.querySelector('.canasta-cerrar').addEventListener('click', cerrar);
panel.querySelector('.canasta-vacio-ir').addEventListener('click', () => {
  cerrar();
  document.querySelector('#catalogo')?.scrollIntoView({ behavior: 'smooth' });
});
atraparFoco(panel, abierto, cerrar);

// El boton flotante pasa a ser el acceso al pedido. El contacto general de
// WhatsApp sigue en la navegacion y en el pie, asi que no se pierde.
if (boton) {
  boton.removeAttribute('href');
  boton.removeAttribute('target');
  boton.removeAttribute('rel');
  boton.setAttribute('role', 'button');
  boton.setAttribute('tabindex', '0');
  boton.textContent = '';
  boton.classList.add('is-canasta');
  // Canasta de pan: asa de arco, cuerpo ahusado y dos mimbres. Mismo trazo
  // que los iconos del pie, para que no parezca prestado de otro sitio.
  boton.insertAdjacentHTML('beforeend',
    '<svg class="canasta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    + 'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + '<path d="M7.6 9.4a4.4 4.4 0 0 1 8.8 0"/>'
    + '<path d="M3.6 9.4h16.8l-1.5 8.2a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6Z"/>'
    + '<path d="M9.7 12.7l.6 3.5"/><path d="M14.3 12.7l-.6 3.5"/></svg>');
  boton.append(cuenta);
  // Vive en la cabecera, al lado del circulo de la cuenta: en la computadora
  // se ve ahi, arriba a la derecha, que es donde se busca la canasta de una
  // tienda. En el telefono el CSS lo sigue dejando flotando abajo.
  const acciones = document.querySelector('.nav-acciones');
  if (acciones) acciones.insertBefore(boton, acciones.querySelector('.menu-toggle'));
  boton.addEventListener('click', abrir);
  boton.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
}

// La vista ya esta armada y en la pagina: el cobro puede buscar sus trozos
// dentro de ella.
montarPago(vista);

// Enter recorre la direccion, la tarjeta y la factura en el orden en que se
// ven. Del ultimo campo solo lleva al boton de confirmar, sin pulsarlo: un
// Enter de mas no tiene que bastar para hacer un pedido.
enterAvanza(['#canasta-dir', '#canasta-piso', '#canasta-ref', '#canasta-notas',
  '#pago-numero', '#pago-vence', '#pago-cvv', '#pago-titular',
  '#factura-nombre', '#factura-ident', '#factura-correo', '#factura-dir',
].map((id) => vista.querySelector(id)), () => vista.querySelector('.canasta-pagar')?.focus());

// Sin JavaScript cada "Pedir" sigue siendo un enlace a WhatsApp que funciona.
// Con JS se cambia por el control de cantidad: mientras no hay nada pedido solo
// se ve el signo mas, y al usarlo se abre en quitar, la cuenta y sumar.
// Se llama desde el arranque, cuando view.js ya pinto las fichas: antes de eso
// no habria ningun "Pedir" que cambiar.
const montarControlesDeFicha = () => {
  document.querySelectorAll('.product-card .order-button').forEach((enlace) => {
    const ficha = enlace.closest('.product-card');
    const nombre = ficha.querySelector('h3')?.textContent.trim();
    const precio = parseFloat((ficha.querySelector('.product-bottom strong')?.textContent || '').replace(/[^0-9.]/g, ''));
    if (!nombre || Number.isNaN(precio)) return;
    // Lo que viene en varios tamanios no tiene un nombre ni un precio fijos: los
    // dicta el que este elegido. Y como el nombre que se guarda lleva el tamanio
    // dentro, cada uno es su propia linea de la canasta sin tocar la canasta.
    const tamanos = [...ficha.querySelectorAll('.tamano-input')];
    const elegido = () => tamanos.find((t) => t.checked) || tamanos[0];
    const nombreDe = () => (tamanos.length ? `${nombre} ${elegido().value}` : nombre);
    const precioDe = () => (tamanos.length ? Number(elegido().dataset.precio) : precio);
    const idDeAhora = () => idDe(nombreDe());
    const importe = ficha.querySelector('.product-bottom strong');
    // La foto mas chica del srcset, que es la que basta para la canasta.
    const img = ficha.querySelector('.product-image img');
    const chica = img?.getAttribute('srcset')?.split(',')[0].trim().split(' ')[0] || img?.getAttribute('src');
    if (chica) fotos.set(nombre, chica);

    const grupo = document.createElement('div');
    grupo.className = 'card-cantidad';
    // La cuenta es un campo, no un letrero: para llevarse veinte panes nadie
    // quiere pulsar veinte veces. Sigue siendo texto y no un number porque el
    // de tipo numero trae sus propias flechitas y acepta signos y comas.
    grupo.innerHTML = '<button class="card-menos" type="button" hidden></button>'
      + '<input class="card-numero" type="text" inputmode="numeric" autocomplete="off" '
      + 'maxlength="3" value="0" hidden>'
      + '<button class="card-mas" type="button">+</button>';
    const menos = grupo.querySelector('.card-menos');
    const cuentaFicha = grupo.querySelector('.card-numero');
    const mas = grupo.querySelector('.card-mas');
    const cuantos = () => pedido.get(idDeAhora())?.cantidad || 0;

    const refrescar = () => {
      const n = cuantos();
      grupo.classList.toggle('is-lleno', n > 0);
      menos.hidden = n === 0;
      cuentaFicha.hidden = n === 0;
      // Si lo esta escribiendo ahora mismo, no se le pisa lo tecleado.
      if (document.activeElement !== cuentaFicha) cuentaFicha.value = n;
      // Con una sola unidad, quitarla es borrar el producto del pedido: el boton
      // lo dice con un basurero. Desde dos vuelve a ser un signo de resta.
      menos.innerHTML = n === 1 ? BASURERO : '<span aria-hidden="true">−</span>';
      const comoSeLlama = nombreDe();
      menos.setAttribute('aria-label', n === 1 ? `Quitar ${comoSeLlama} de la canasta` : `Quitar uno de ${comoSeLlama}`);
      menos.dataset.tip = n === 1 ? 'Quitar de la canasta' : 'Uno menos';
      mas.setAttribute('aria-label', n ? `Añadir otro de ${comoSeLlama}` : `Añadir ${comoSeLlama} a la canasta`);
      cuentaFicha.setAttribute('aria-label', `Cantidad de ${comoSeLlama}`);
      mas.dataset.tip = n ? 'Uno más' : 'Añadir a la canasta';
      cuentaFicha.dataset.tip = `Escribe cuántos quieres, hasta ${MAX_UNIDADES}`;
      if (importe) importe.textContent = dinero(precioDe());
    };
    refrescos.push(refrescar);
    botonesMas.push({ coincide: (id) => idDeAhora() === id, boton: mas });
    tamanos.forEach((t) => t.addEventListener('change', () => {
      refrescar();
      avisos.textContent = `${nombreDe()}, ${dinero(precioDe())}.`;
    }));

    const cuantosQuedan = () => `${unidades()} producto${unidades() === 1 ? '' : 's'} en la canasta.`;
    mas.addEventListener('click', () => {
      const comoSeLlama = nombreDe();
      const l = pedido.get(idDeAhora()) || { nombre: comoSeLlama, precio: precioDe(), cantidad: 0 };
      l.cantidad = Math.min(l.cantidad + 1, MAX_UNIDADES);
      pedido.set(idDeAhora(), l);
      pintar();
      volarALaCanasta(ficha);
      avisos.textContent = `${comoSeLlama} añadido. ${cuantosQuedan()}`;
    });
    // Mientras teclea solo se limpia lo que no son cifras; el numero no se
    // corrige hasta que termina, que corregirlo al vuelo impide escribir un 12
    // (al pasar por el 1 ya seria valido y saltaria solo).
    cuentaFicha.addEventListener('input', () => {
      const limpio = cuentaFicha.value.replace(/[^0-9]/g, '').slice(0, 3);
      if (limpio !== cuentaFicha.value) cuentaFicha.value = limpio;
    });
    cuentaFicha.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); cuentaFicha.blur(); }
      if (e.key === 'Escape') { cuentaFicha.value = cuantos(); cuentaFicha.blur(); }
      // Es un campo de texto y no un number justamente para no heredar sus
      // flechitas, pero las teclas de flecha si se esperan en algo que cuenta:
      // suben y bajan de uno sin tener que borrar y reescribir el numero.
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const ahora = Math.min(parseInt(cuentaFicha.value, 10) || 0, MAX_UNIDADES);
      const paso = e.key === 'ArrowUp' ? 1 : -1;
      cuentaFicha.value = Math.max(0, Math.min(ahora + paso, MAX_UNIDADES));
    });
    // Al salir del campo se asienta: se recorta al tope y, si quedo en cero o
    // en blanco, el producto sale de la canasta, que es lo que un cero dice.
    cuentaFicha.addEventListener('blur', () => {
      const comoSeLlama = nombreDe();
      const id = idDeAhora();
      const pedida = Math.min(parseInt(cuentaFicha.value, 10) || 0, MAX_UNIDADES);
      const antes = cuantos();
      if (pedida === antes) { cuentaFicha.value = antes; return; }
      if (pedida <= 0) {
        const antesDeBorrar = pedido.get(id);
        if (antesDeBorrar) anotarBorrado(id, antesDeBorrar);
        pedido.delete(id);
        pintar();
        avisos.textContent = `${comoSeLlama} quitado. ${cuantosQuedan()}`;
        mas.focus();
        return;
      }
      const l = pedido.get(id) || { nombre: comoSeLlama, precio: precioDe(), cantidad: 0 };
      const recortado = (parseInt(cuentaFicha.value, 10) || 0) > MAX_UNIDADES;
      l.cantidad = pedida;
      pedido.set(id, l);
      pintar();
      avisos.textContent = recortado
        ? `El máximo es ${MAX_UNIDADES} por producto, así que quedaron ${MAX_UNIDADES} de ${comoSeLlama}. ${cuantosQuedan()}`
        : `${pedida} de ${comoSeLlama}. ${cuantosQuedan()}`;
    });

    menos.addEventListener('click', () => {
      const comoSeLlama = nombreDe();
      const seVa = cuantos() <= 1;
      cambiar(idDeAhora(), -1);
      avisos.textContent = seVa ? `${comoSeLlama} quitado. ${cuantosQuedan()}` : `Una unidad menos de ${comoSeLlama}. ${cuantosQuedan()}`;
      // El boton recien usado desaparece; el foco pasa al mas para no perderse.
      if (seVa) mas.focus();
    });

    enlace.replaceWith(grupo);
  });
};

// Lo guardado se recupera al final, cuando ya existe todo lo que hay que
// repintar con ello.
const iniciarCanasta = () => {
  // Nadie llega al checkout con un enlace: lo que se confirma vive en memoria y
  // en este navegador, no en la direccion. Si alguien recarga o pega la URL, se
  // limpia el hash y se queda en el catalogo.
  if (RUTAS[location.hash]) history.replaceState({}, '', location.pathname + location.search);
  leerGuardado();
  radios.forEach((radio) => { radio.checked = radio.value === entrega.modo; });
  campoDir.value = entrega.direccion;
  if (campoPiso) campoPiso.value = entrega.piso;
  if (campoRef) campoRef.value = entrega.referencia;
  if (campoNotas) campoNotas.value = entrega.notas;
  cargarFactura();
  pintar();
};

// Lo que los demas modulos pueden pedirle a la canasta. Va por el puente porque
// ellos tambien se llaman desde aqui: el cobro ensena el comprobante. Las
// entradas de las vistas -verCheckout, ocultarCheckout y verComprobante- se
// apuntan mas arriba, donde se declaran.
puente.guardar = guardar;
puente.borrarGuardado = borrarGuardado;
puente.enfocarTitulo = () => tituloVista.focus();
// El contador del boton flotante se queda en cero al emitir el comprobante.
puente.vaciarContador = () => {
  cuenta.hidden = true;
  if (boton) boton.setAttribute('aria-label', 'Ver la canasta, vacía');
};
// La cuenta rellena la direccion del pedido con la que tenga guardada.
puente.ponerDireccion = (direccion) => {
  entrega.direccion = direccion;
  campoDir.value = direccion;
  pintarPie();
};

export { montarControlesDeFicha, iniciarCanasta };
