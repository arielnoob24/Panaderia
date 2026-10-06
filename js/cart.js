// ---- La canasta -------------------------------------------------------
// El pedido en pantalla: el panel con sus cuatro pasos, la lista de lineas, la
// barra de deshacer y el control de cantidad que llevan las fichas. Los dos
// ultimos pasos del panel -pago y comprobante- los pone checkout.js, y el mapa
// del reparto, map.js; aqui se arma el panel entero y se reparte.
import { avisos, anexosDeFoco, atraparFoco, apagarDetras, horarioDeHoy } from './ui.js';
import {
  CLAVE, pedido, entrega, sesion, cobro, puente,
  MAX_UNIDADES, ENVIO_BASE, dinero, idDe,
  subtotal, envio, total, unidades,
} from './state.js';
import { montarMapa, armarMapa, armarMapaLocal, buscarDireccion, irAlPunto } from './map.js';
import {
  montarPago, piezasDePago, comprobanteHtml, pintarPago,
  olvidarTarjeta, restablecerPagar, cancelarProceso, limpiarCopiados, reiniciarMetodo,
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
      // El punto del mapa viene de lo que haya en este navegador: se mira que
      // sean dos numeros de verdad antes de cobrar una distancia con ellos.
      const p = dato.punto;
      if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
        && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180) {
        entrega.punto = { lat: p.lat, lng: p.lng };
      }
    }
  } catch (e) { /* almacenamiento bloqueado o dato corrupto: se empieza vacio */ }
};
const guardar = () => {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify({
      lineas: [...pedido].map(([id, l]) => ({ id, ...l })),
      modo: entrega.modo,
      direccion: entrega.direccion,
      piso: entrega.piso,
      referencia: entrega.referencia,
      notas: entrega.notas,
      punto: entrega.punto,
    }));
  } catch (e) { /* en ventana privada no se puede guardar; el pedido sigue vivo en memoria */ }
};
const borrarGuardado = () => {
  try { window.localStorage.removeItem(CLAVE); } catch (e) { /* si no se pudo guardar, no hay nada que borrar */ }
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
  '<div class="canasta-cabecera"><h2 id="canasta-titulo" tabindex="-1">Tu canasta</h2>'
  + '<button class="canasta-cerrar" type="button" aria-label="Cerrar la canasta">×</button></div>'
  + '<div class="canasta-pasos">'

  + '<section class="canasta-paso" data-paso="canasta">'
  + '<div class="canasta-cuerpo"><ul class="canasta-lista"></ul>'
  + '<p class="canasta-vacio">Tu canasta está vacía.</p></div>'
  + '<div class="canasta-pie">'
  + '<p class="canasta-aviso pide-cuenta" role="alert" hidden>'
  + 'Para pedir necesitas una cuenta con el correo verificado: ahí te llega el comprobante.'
  + '<button class="pide-cuenta-boton" type="button">Crear cuenta o entrar</button></p>'
  + '<div class="canasta-total"><span>Subtotal</span><strong>$0.00</strong></div>'
  + '<button class="button button-yellow canasta-enviar" type="button">'
  + 'Ir a pagar <span aria-hidden="true">→</span></button>'
  + '<p class="canasta-nota">Después eliges cómo lo recibes y cómo pagas.</p>'
  + '</div></section>'

  + '</div>';


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
  + '<span>A domicilio<small>Desde ' + dinero(ENVIO_BASE) + '</small></span></label></div>'
  // Quien pasa a retirar tambien necesita ver donde esta el local, no solo
  // leer la calle. Este mapa es de referencia y nada mas: no se marca nada en
  // el, asi que no se arrastra ni captura la rueda del raton, y para llegar de
  // verdad esta el enlace, que abre la aplicacion de mapas con la ruta.
  + '<div class="canasta-local">'
  + '<p class="canasta-local-titulo">Esquina de Eloy Alfaro y Gabriel Espinosa</p>'
  + '<p class="canasta-local-dato">Tena, Napo. Te esperamos en el mostrador.</p>'
  + '<div class="mapa-caja mapa-caja-local"><div class="mapa-local-lienzo"></div>'
  + '<p class="mapa-fallo mapa-local-fallo" hidden>No se pudo cargar el mapa, '
  + 'pero la dirección de arriba es la buena</p></div>'
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
  // Primero se pregunta donde, y solo despues se afina. Pedir el punto en el
  // mapa de entrada obliga a buscar a mano un sitio que el usuario sabe decir
  // con palabras; escribirlo es mas rapido y el mapa queda para precisar.
  + '<label for="canasta-busca">¿A dónde lo llevamos?</label>'
  + '<div class="dir-busca">'
  + '<input id="canasta-busca" class="dir-busca-campo" type="search" '
  + 'autocomplete="off" role="combobox" aria-expanded="false" '
  + 'aria-controls="canasta-busca-lista" aria-autocomplete="list" '
  + 'placeholder="Calle, barrio o un sitio conocido">'
  + '<button class="dir-busca-aqui mapa-aqui" type="button">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
  + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
  + '<circle cx="12" cy="12" r="3.3"/><path d="M12 2v3.2M12 18.8V22M22 12h-3.2M5.2 12H2"/>'
  + '<circle cx="12" cy="12" r="8"/></svg>Usar mi ubicación</button>'
  + '</div>'
  + '<ul id="canasta-busca-lista" class="dir-resultados" role="listbox" '
  + 'aria-label="Direcciones encontradas" hidden></ul>'
  + '<p class="dir-busca-estado" role="status"></p>'
  // Si el buscador no encuentra el sitio -y en Tena pasa, porque no todas las
  // calles estan en el mapa de OpenStreetMap-, hay que poder seguir igual.
  + '<button class="dir-a-mano text-link" type="button">Prefiero marcarlo en el mapa</button>'

  + '<div class="mapa-zona" hidden>'
  + '<div class="mapa-caja"><div class="mapa-lienzo"></div>'
  + '<p class="mapa-fallo" hidden>No se pudo cargar el mapa. '
  + 'Escribe la dirección y cobramos la tarifa de salida</p></div>'
  + '<div class="mapa-pie">'
  // Marcar el punto no puede depender de acertarle con el raton: este boton
  // deja la aguja en el centro de lo que se esta mirando, y el mapa se mueve
  // con las flechas. Es el camino de quien va solo con teclado, y de paso el
  // de quien en el telefono no quiere pelearse con el pulgar.
  + '<button class="mapa-centro" type="button">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
  + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
  + '<path d="M12 21.4c0 0-6.6-5.3-6.6-10.1a6.6 6.6 0 0 1 13.2 0c0 4.8-6.6 10.1-6.6 10.1Z"/>'
  + '<circle cx="12" cy="11" r="2.4"/></svg>Marcar el centro del mapa</button>'
  + '<p class="mapa-dato">Arrastra la aguja hasta la puerta, o mueve el mapa '
  + 'con las flechas y pulsa Enter</p>'
  + '</div></div>'

  + '<label for="canasta-dir">La dirección, tal como la escribirías</label>'
  + '<input id="canasta-dir" type="text" autocomplete="street-address" '
  + 'placeholder="Calle y número">'
  + '<p class="canasta-aviso" role="alert" hidden>Escribe la dirección para poder llevarlo.</p>'
  // Lo que no sale de ningun mapa: en que puerta hay que golpear. Son
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

  // Como se paga, puesto por checkout.js.
  + piezas.metodos
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
const enviar = panel.querySelector('.canasta-enviar');
const radios = [...vista.querySelectorAll('input[name="canasta-entrega"]')];
const bloqueDir = vista.querySelector('.canasta-direccion');
const campoDir = vista.querySelector('#canasta-dir');
const campoPiso = vista.querySelector('#canasta-piso');
const campoRef = vista.querySelector('#canasta-ref');
const campoNotas = vista.querySelector('#canasta-notas');
const avisoDir = vista.querySelector('.canasta-direccion .canasta-aviso');
const mapaZona = vista.querySelector('.canasta-direccion .mapa-zona');
const buscaCampo = vista.querySelector('#canasta-busca');
const buscaLista = vista.querySelector('.dir-resultados');
const buscaEstado = vista.querySelector('.dir-busca-estado');
const buscaAMano = vista.querySelector('.dir-a-mano');
const resumenLista = vista.querySelector('.resumen-lista');
const resumenCuenta = vista.querySelector('.resumen-cuenta');
const resumenEditar = vista.querySelector('.resumen-editar');
const localHora = vista.querySelector('.canasta-local-hora');
const desgloseSub = vista.querySelector('.desglose-subtotal');
const desgloseEnvio = vista.querySelector('.desglose-envio');
const desgloseTotal = vista.querySelector('.desglose-total');
const bloqueLocal = vista.querySelector('.canasta-local');
const pideCuenta = panel.querySelector('.pide-cuenta');
const pideCuentaBoton = panel.querySelector('.pide-cuenta-boton');
const listo = vista.querySelector('.canasta-listo');

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

// Que linea esta esperando un si o un no. Vive fuera de pintar porque pintar
// rehace la lista entera en cada cambio: si la pregunta viviera en el DOM y
// nada mas, tocar el "mas" de otro producto la borraria sin contestarla.
let porConfirmar = null;

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
      li.innerHTML =
        `<div><h3>${l.nombre}</h3>`
        + '<p class="canasta-confirma-dicho">¿Lo quitamos de la canasta?</p>'
        + '<div class="canasta-confirma">'
        + '<button class="canasta-confirma-si" type="button" '
        + `aria-label="Sí, quitar ${l.nombre} de la canasta">Sí, quitar</button>`
        + '<button class="canasta-confirma-no" type="button" '
        + `aria-label="Cancelar, dejar ${l.nombre} en la canasta">Cancelar</button>`
        + '</div></div>'
        + `<span class="canasta-subtotal">${dinero(l.precio * l.cantidad)}</span>`;
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
    li.innerHTML =
      `<div><h3>${l.nombre}</h3><p class="canasta-precio">${dinero(l.precio)} la unidad</p>`
      + '<div class="canasta-cantidad"><button type="button" data-menos '
      + `aria-label="${ultima ? `Quitar ${l.nombre} de la canasta` : `Quitar uno de ${l.nombre}`}">`
      + `${ultima ? BASURERO : '−'}</button>`
      + `<output>${l.cantidad}</output>`
      + `<button type="button" data-mas aria-label="Añadir uno de ${l.nombre}">+</button></div></div>`
      + `<span class="canasta-subtotal">${dinero(l.precio * l.cantidad)}</span>`;
    li.querySelector('[data-menos]').addEventListener('click', () => {
      if (l.cantidad === 1) { pedirQuitar(id); return; }
      cambiar(id, -1);
    });
    li.querySelector('[data-mas]').addEventListener('click', () => cambiar(id, 1));
    lista.append(li);
  }
  pintarPie();
};

const lineaDe = (id) => [...lista.children].find((li) => li.dataset.id === id);

const pedirQuitar = (id) => {
  const l = pedido.get(id);
  if (!l) return;
  porConfirmar = id;
  pintar();
  // El basurero que se acaba de pulsar ya no existe, asi que hay que recoger
  // el foco. Va al "Si, quitar" y no al "Cancelar": quien pulso el basurero
  // ya dijo lo que queria, y la pregunta esta para que lo vea, no para
  // esconderle la salida. El clic de mas sigue estando ahi para el descuido.
  lineaDe(id)?.querySelector('.canasta-confirma-si')?.focus();
  avisos.textContent = `¿Quitar ${l.nombre} de la canasta?`;
};

const cancelarQuitar = (id) => {
  if (porConfirmar !== id) return;
  porConfirmar = null;
  pintar();
  // De vuelta al basurero del que salio la pregunta, que es donde estaba el
  // foco antes de preguntar.
  lineaDe(id)?.querySelector('[data-menos]')?.focus();
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
  totalEl.textContent = dinero(subtotal());
  enviar.disabled = !hayAlgo;
  enviar.setAttribute('aria-disabled', String(!hayAlgo));
  pintarDesglose();
  const n = unidades();
  cuenta.hidden = n === 0;
  cuenta.textContent = n;
  if (boton) boton.setAttribute('aria-label', n ? `Ver la canasta, ${n} producto${n === 1 ? '' : 's'}` : 'Ver la canasta, vacía');
  if (pideCuenta && sesion.dentro && sesion.verificado) pideCuenta.hidden = true;
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
  // El mapa que toque, al llegar: el de referencia si se pasa a retirar -que es
  // lo que viene marcado- y el de marcar el punto solo si ya habia uno guardado
  // de un pedido anterior. Aqui y no al armar el panel, porque el panel se crea
  // al cargar la pagina y entonces descargar Leaflet seria para nada.
  if (entrega.modo === 'domicilio') { if (entrega.punto) mostrarMapa(); }
  else armarMapaLocal();
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
  pintarDesglose();
  // Cada modo trae su mapa, y ninguno se descarga antes de hacer falta: el de
  // referencia al retirar, el de marcar el punto al pedir a domicilio. Ese
  // segundo se arma solo si ya habia un punto guardado; si no, espera a que el
  // buscador o el boton de a mano lo pidan.
  if (entrega.modo === 'domicilio') {
    if (entrega.punto) mostrarMapa();
    buscaCampo.focus();
  } else {
    armarMapaLocal();
  }
}));

// El mapa de marcar vive escondido hasta que hay algo que precisar. Esto lo
// descubre y lo arma; llamarlo dos veces no cuesta nada porque armarMapa ya se
// protege de repetirse.
const mostrarMapa = () => {
  if (mapaZona.hidden) mapaZona.hidden = false;
  armarMapa();
};

campoDir.addEventListener('input', () => {
  entrega.direccion = campoDir.value.trim().slice(0, 200);
  if (entrega.direccion) avisoDir.hidden = true;
  pintarPie();
});

// ---- El buscador de direcciones ---------------------------------------
// Escribir, elegir de una lista y acabar de precisar en el mapa, que es el
// orden en que lo hace quien ya ha pedido comida por una aplicacion.

// Se cierra la lista y se devuelve el campo a su estado de reposo. Vive aparte
// porque la cierran cuatro cosas: elegir, Escape, perder el foco y vaciar.
const cerrarResultados = () => {
  buscaLista.hidden = true;
  buscaLista.textContent = '';
  buscaCampo.setAttribute('aria-expanded', 'false');
  buscaCampo.removeAttribute('aria-activedescendant');
};

// Elegir un resultado no termina nada: rellena la calle, lleva el mapa ahi y
// deja la aguja puesta para que se arrastre hasta la puerta. El buscador
// acierta la cuadra; la puerta la sabe el usuario.
const tomarResultado = (sitio) => {
  entrega.direccion = sitio.nombre.slice(0, 200);
  campoDir.value = entrega.direccion;
  buscaCampo.value = sitio.nombre;
  avisoDir.hidden = true;
  cerrarResultados();
  mostrarMapa();
  irAlPunto(sitio.punto);
  buscaEstado.textContent = 'Arrastra la aguja hasta la puerta si hace falta.';
  pintarPie();
  guardar();
};

const pintarResultados = (sitios) => {
  buscaLista.textContent = '';
  sitios.forEach((sitio, i) => {
    const li = document.createElement('li');
    li.id = `dir-resultado-${i}`;
    li.className = 'dir-resultado';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.tabIndex = -1;
    li.textContent = sitio.nombre;
    li.addEventListener('click', () => tomarResultado(sitio));
    // Enter sobre la opcion enfocada: lo mismo que el clic. Las flechas mueven
    // el foco de verdad, asi que no hace falta llevar un indice aparte.
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); tomarResultado(sitio); }
    });
    buscaLista.append(li);
  });
  buscaLista.hidden = sitios.length === 0;
  buscaCampo.setAttribute('aria-expanded', String(sitios.length > 0));
};

// Nominatim pide no abusar, asi que no se consulta en cada tecla: se espera a
// que la mano pare. Cuatro letras es el minimo con el que una busqueda devuelve
// algo util en una ciudad pequena.
let relojBusca = 0;
let ultimaBusca = '';
const PAUSA_BUSCA = 650;

const lanzarBusqueda = (texto) => {
  if (texto === ultimaBusca) return;
  ultimaBusca = texto;
  buscaEstado.textContent = 'Buscando…';
  buscarDireccion(texto).then((sitios) => {
    // Puede haber llegado la respuesta de una busqueda que ya no es la que esta
    // escrita: si el campo cambio mientras tanto, esta respuesta no vale.
    if (buscaCampo.value.trim() !== texto) return;
    pintarResultados(sitios);
    buscaEstado.textContent = sitios.length
      ? `${sitios.length} resultado${sitios.length === 1 ? '' : 's'}. Elige el más cercano.`
      : 'No se encontró. Escribe la dirección abajo y márcala en el mapa.';
  }).catch(() => {
    cerrarResultados();
    buscaEstado.textContent = 'No se pudo buscar ahora. Márcalo en el mapa.';
    mostrarMapa();
  });
};

buscaCampo?.addEventListener('input', () => {
  const texto = buscaCampo.value.trim();
  window.clearTimeout(relojBusca);
  if (texto.length < 4) {
    cerrarResultados();
    ultimaBusca = '';
    buscaEstado.textContent = '';
    return;
  }
  relojBusca = window.setTimeout(() => lanzarBusqueda(texto), PAUSA_BUSCA);
});

// Abajo desde el campo entra en la lista; Escape la cierra sin tocar nada.
// Ese Escape se queda aqui, igual que el de la pregunta de quitar una linea: si
// subiera, el vigilante de la pagina lo entiende como "cierra lo que haya
// abierto" y se lleva el foco al boton de la tienda, que es lo ultimo que
// quiere quien solo estaba descartando una lista de direcciones.
buscaCampo?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !buscaLista.hidden) {
    e.preventDefault();
    e.stopPropagation();
    cerrarResultados();
    return;
  }
  if (e.key === 'ArrowDown' && !buscaLista.hidden) {
    e.preventDefault();
    buscaLista.firstElementChild?.focus();
    return;
  }
  // Enter sin haber elegido nada busca ya, sin esperar la pausa.
  if (e.key === 'Enter') {
    e.preventDefault();
    const texto = buscaCampo.value.trim();
    window.clearTimeout(relojBusca);
    if (texto.length >= 4) lanzarBusqueda(texto);
  }
});

// Dentro de la lista, las flechas recorren y Escape vuelve al campo. El foco se
// mueve de verdad en lugar de simularse con aria-activedescendant: son opciones
// que ya son elementos, y asi Enter y Tab hacen lo que se espera.
buscaLista?.addEventListener('keydown', (e) => {
  const opciones = [...buscaLista.children];
  const i = opciones.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); (opciones[i + 1] || opciones[0]).focus(); }
  else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (i <= 0) buscaCampo.focus();
    else opciones[i - 1].focus();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cerrarResultados();
    buscaCampo.focus();
  }
});

// Al salir del buscador se cierra la lista, pero no si el foco se fue a una de
// sus opciones: eso es justo lo contrario de haberse ido.
buscaLista?.addEventListener('focusout', () => {
  window.setTimeout(() => {
    if (!buscaLista.contains(document.activeElement) && document.activeElement !== buscaCampo) {
      cerrarResultados();
    }
  }, 0);
});

buscaAMano?.addEventListener('click', () => {
  cerrarResultados();
  mostrarMapa();
  buscaEstado.textContent = 'Mueve el mapa y marca el punto de entrega.';
  // El lienzo de Leaflet es tabulable, asi que se le puede dar el foco; si
  // todavia se esta descargando, el foco va al boton de marcar el centro, que
  // ya esta ahi y explica el camino sin raton.
  const lienzo = vista.querySelector('.mapa-lienzo');
  (lienzo?.isConnected && lienzo.tabIndex >= 0 ? lienzo : vista.querySelector('.mapa-centro'))?.focus();
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
    pideCuenta.hidden = false;
    pideCuentaBoton.focus();
    avisos.textContent = 'Para pedir hace falta una cuenta con el correo verificado.';
    return;
  }
  pideCuenta.hidden = true;
  pintarDesglose();
  abrirCheckout();
});

// Saltar a la cuenta no pierde el pedido: la canasta se queda como esta y al
// volver se sigue donde se estaba. La cuenta vive en account.js, asi que se la
// llama por el puente; al pulsar ya esta cargada.
pideCuentaBoton.addEventListener('click', () => {
  pideCuenta.hidden = true;
  cerrar();
  // Quien llega aqui casi nunca tiene cuenta: el aviso sale justo porque no
  // la hay. Aterrizar en "Entrar" le costaria un clic de mas para llegar a
  // "Registrarse". Si en este navegador ya hay una cuenta guardada, lo
  // probable es lo contrario y entonces si abre en "Entrar".
  puente.abrirC(puente.correoGuardado() ? 'entrar' : 'crear');
});

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
  const id = borrado?.id;
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

const anotarBorrado = (id, linea) => {
  borrado = { id, linea: { ...linea } };
  deshacerTexto.textContent = linea.cantidad === 1
    ? `Quitaste ${linea.nombre}.`
    : `Quitaste ${linea.nombre} (${linea.cantidad} unidades).`;
  barraDeshacer.hidden = false;
  window.clearTimeout(relojDeshacer);
  relojDeshacer = window.setTimeout(olvidarBorrado, ESPERA_DESHACER);
};

const deshacerBorrado = () => {
  if (!borrado) return;
  const { id, linea } = borrado;
  pedido.set(id, { ...linea });
  olvidarBorrado();
  pintar();
  avisos.textContent = `${linea.nombre} vuelve a la canasta. ${unidades()} producto${unidades() === 1 ? '' : 's'} en la canasta.`;
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
  pideCuenta.hidden = true;
  ultimoFoco?.focus();
};
const abierto = () => panel.classList.contains('is-open');

fondo.addEventListener('click', cerrar);
panel.querySelector('.canasta-cerrar').addEventListener('click', cerrar);
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
  boton.addEventListener('click', abrir);
  boton.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
}

// La vista ya esta armada y en la pagina: el mapa y el cobro pueden buscar sus
// trozos dentro de ella.
montarMapa(vista);
montarPago(vista);

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
  pintar();
};

// Lo que los demas modulos pueden pedirle a la canasta. Va por el puente porque
// ellos tambien se llaman desde aqui: el cobro ensena el comprobante, el mapa
// pide el desglose y la cuenta repinta el pie. Las entradas de las vistas
// -verCheckout, ocultarCheckout y verComprobante- se apuntan mas arriba, donde
// se declaran.
puente.pintarPie = pintarPie;
puente.pintarDesglose = pintarDesglose;
// El boton de "usar mi ubicacion" vive junto al buscador y lo atiende map.js,
// pero el mapa esta escondido hasta que hay algo que precisar y descubrirlo es
// cosa de aqui, que es donde esta el panel.
puente.mostrarMapa = () => mostrarMapa();
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
