// ---- La cuenta --------------------------------------------------------
// Crear cuenta, verificar el correo con un codigo y entrar. Es la unica parte
// que le habla a la canasta de lejos: le pasa la direccion guardada para no
// tener que escribirla otra vez, y eso va por el puente.
import {
  avisos, menuToggle, closeMenu, flechasEnMenu, apagarDetras, atraparFoco, enterAvanza,
} from './ui.js';
import { sesion, entrega, puente, dinero } from './state.js';
import { buzonListo, enviarCorreo } from './mail.js';
import { pedidosGuardados, marcaBonita } from './storage.js';

// Maqueta de cuentas. No hay servidor detras, asi que nada de esto viaja a
// ninguna parte: la cuenta queda escrita en este navegador y en ningun otro
// sitio. La contrasena no se guarda tal cual: se guarda su huella, un hash
// PBKDF2 con sal, que sirve para comprobarla al entrar pero no para leerla.
// Guardarla en claro seria ensenar a hacerlo mal.
const CLAVE_CUENTA = 'eltradicional-cuenta';

// La huella de la contrasena de la cuenta guardada: { sal, hash } en hex, o
// null si la cuenta es de antes de que se guardara.
let huellaClave = null;
const VUELTAS = 100000;
const aHex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
const deHex = (hex) => new Uint8Array((hex.match(/../g) || []).map((h) => parseInt(h, 16)));
// crypto.subtle solo existe en contexto seguro (https o el archivo abierto con
// doble clic); en otro caso no hay con que calcular la huella.
const puedeHuella = () => Boolean(window.crypto?.subtle);
const calcularHuella = async (clave, salHex) => {
  const sal = salHex ? deHex(salHex) : window.crypto.getRandomValues(new Uint8Array(16));
  const base = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(clave),
    'PBKDF2', false, ['deriveBits']);
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: sal, iterations: VUELTAS, hash: 'SHA-256' }, base, 256);
  return { sal: aHex(sal), hash: aHex(bits) };
};

const fondoC = document.createElement('div');
fondoC.className = 'cuenta-fondo';
const panelC = document.createElement('aside');
panelC.className = 'cuenta-panel';
panelC.setAttribute('role', 'dialog');
panelC.setAttribute('aria-modal', 'true');
panelC.setAttribute('aria-labelledby', 'cuenta-titulo');

// opciones: opcional, prefijo (texto fijo pegado al campo), describe (ids que
// se suman al aria-describedby) y despues (lo que va entre campo y error).
const campoHtml = (id, etiqueta, extra, opciones = {}) => {
  const describe = (opciones.describe ? opciones.describe + ' ' : '') + `cuenta-${id}-error`;
  const campo = `<input id="cuenta-${id}" ${extra} aria-describedby="${describe}">`;
  return `<div class="cuenta-campo"><label for="cuenta-${id}">${etiqueta}`
    + (opciones.opcional ? ' <span class="cuenta-campo-opcional">(opcional)</span>' : '')
    + '</label>'
    + (opciones.prefijo
      ? `<div class="cuenta-conprefijo"><span class="cuenta-prefijo">${opciones.prefijo}</span>${campo}</div>`
      : campo)
    + (opciones.despues || '')
    + `<p class="cuenta-campo-error" id="cuenta-${id}-error" hidden></p></div>`;
};

// Lo que tiene que cumplir la contrasena, escrito una sola vez: de aqui salen
// la lista que se ve debajo del campo y la comprobacion de si vale.
const REGLAS = [
  { id: 'largo', texto: 'Al menos 8 caracteres', cumple: (v) => v.length >= 8 },
  { id: 'minuscula', texto: 'Una letra minúscula', cumple: (v) => /[a-zñáéíóúü]/.test(v) },
  { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: (v) => /[A-ZÑÁÉÍÓÚÜ]/.test(v) },
  { id: 'numero', texto: 'Un número', cumple: (v) => /[0-9]/.test(v) },
];
// El +593 esta fijo delante del campo, asi que el numero va sin el cero de
// 09... Quien lo escriba de memoria con el cero no se equivoca: se lo come.
const soloNueve = (v) => v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
const telefonoBonito = (d) => (d ? `+593 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : '');

const reglasHtml = '<ul class="cuenta-reglas" id="cuenta-clave-reglas">'
  + REGLAS.map((r) => `<li data-regla="${r.id}">${r.texto}`
    + '<span class="sr-only cuenta-regla-estado">, falta</span></li>').join('')
  + '</ul>';

panelC.innerHTML =
  '<div class="cuenta-cabecera"><h2 id="cuenta-titulo" tabindex="-1">Crear cuenta</h2>'
  + '<button class="cuenta-cerrar" type="button" aria-label="Cerrar">×</button></div>'

  + '<section class="cuenta-paso" data-paso="crear">'
  + '<div class="cuenta-cuerpo">'
  + '<p class="cuenta-maqueta"><strong>Maqueta académica.</strong> Este sitio no tiene '
  + 'servidor: la cuenta se guarda solo en este navegador, y de la contraseña solo '
  + 'su huella cifrada. Aun así, no escribas una contraseña de verdad.</p>'
  + campoHtml('nombre', 'Nombre y apellido', 'type="text" autocomplete="name" maxlength="60" placeholder="María Pérez"')
  + campoHtml('correo', 'Correo', 'type="email" autocomplete="email" maxlength="80" placeholder="tu@correo.com"')
  + campoHtml('telefono', 'Teléfono', 'type="tel" inputmode="numeric" autocomplete="tel" '
    + 'maxlength="9" placeholder="990001122"', { prefijo: '+593' })
  + campoHtml('direccion', 'Dirección', 'type="text" autocomplete="street-address" maxlength="200" '
    + 'placeholder="Calle, número y una referencia"', { opcional: true })
  + campoHtml('clave', 'Contraseña', 'type="password" autocomplete="new-password" maxlength="40"',
    { describe: 'cuenta-clave-reglas', despues: reglasHtml })
  + campoHtml('repite', 'Repite la contraseña', 'type="password" autocomplete="new-password" maxlength="40"')
  + '</div>'
  + '<div class="cuenta-pie">'
  + '<p class="cuenta-aviso" role="alert" hidden></p>'
  + '<button class="button button-yellow cuenta-crear" type="button">Crear la cuenta</button>'
  + '<button class="cuenta-cambiar" type="button" data-va="entrar">Ya tengo cuenta, quiero entrar</button>'
  + '</div></section>'

  + '<section class="cuenta-paso" data-paso="verificar" hidden>'
  + '<div class="cuenta-cuerpo">'
  + '<p class="cuenta-maqueta cuenta-maqueta-codigo" hidden></p>'
  + '<p class="codigo-dicho">Escribe el código de 6 cifras que enviamos a '
  + '<strong class="codigo-correo"></strong>.</p>'
  + '<p class="codigo-estado" role="status" hidden></p>'
  + '<div class="codigo-falso" hidden>'
  + '<p class="codigo-falso-de">Correo de El Tradicional</p>'
  + '<p class="codigo-falso-texto">Tu código es <b class="codigo-valor"></b>. '
  + 'No lo compartas con nadie.</p></div>'
  + '<div class="cuenta-campo"><label for="cuenta-codigo">Código de verificación</label>'
  + '<input id="cuenta-codigo" class="campo-codigo" type="text" inputmode="numeric" '
  + 'autocomplete="one-time-code" maxlength="6" placeholder="000000" '
  + 'aria-describedby="cuenta-codigo-error">'
  + '<p class="cuenta-campo-error" id="cuenta-codigo-error" hidden></p></div>'
  + '<button class="codigo-reenviar" type="button">Enviar otro código</button>'
  + '</div>'
  + '<div class="cuenta-pie">'
  + '<p class="cuenta-aviso" role="alert" hidden></p>'
  + '<button class="button button-yellow cuenta-verificar" type="button">Verificar el correo</button>'
  + '<button class="cuenta-cambiar" type="button" data-va="crear">Cambiar el correo</button>'
  + '</div></section>'

  + '<section class="cuenta-paso" data-paso="entrar" hidden>'
  + '<div class="cuenta-cuerpo">'
  + '<p class="cuenta-maqueta"><strong>Maqueta académica.</strong> Sin servidor, solo '
  + 'se puede entrar a la cuenta que creaste en este navegador.</p>'
  + campoHtml('entrar-correo', 'Correo', 'type="email" autocomplete="email" maxlength="80" placeholder="tu@correo.com"')
  + campoHtml('entrar-clave', 'Contraseña', 'type="password" autocomplete="current-password" maxlength="40"')
  + '</div>'
  + '<div class="cuenta-pie">'
  + '<p class="cuenta-aviso" role="alert" hidden></p>'
  + '<button class="button button-yellow cuenta-entrar" type="button">Entrar</button>'
  + '<button class="cuenta-cambiar" type="button" data-va="crear">No tengo cuenta, quiero crear una</button>'
  + '</div></section>'

  + '<section class="cuenta-paso" data-paso="sesion" hidden>'
  + '<div class="cuenta-cuerpo">'
  + '<div class="cuenta-sesion"><span class="cuenta-avatar" aria-hidden="true"></span>'
  + '<div><p class="cuenta-sesion-nombre"></p><p class="cuenta-sesion-correo"></p></div></div>'
  + '<dl class="cuenta-datos">'
  + '<div><dt>Teléfono</dt><dd class="cuenta-dato-telefono"></dd></div>'
  + '<div><dt>Dirección</dt><dd class="cuenta-dato-direccion"></dd></div>'
  + '</dl>'
  + '<p class="cuenta-nota">Tu pedido ya sale a tu nombre y con tu dirección escrita.</p>'
  // Los pedidos ya pagados. Nace oculto: quien entra por primera vez no tiene
  // ninguno, y un titulo sobre una lista vacia es peor que no poner nada.
  + '<section class="cuenta-pedidos" hidden>'
  + '<h3>Tus últimos pedidos</h3>'
  + '<ul class="cuenta-pedidos-lista"></ul>'
  + '<p class="cuenta-nota">Quedan guardados en este navegador y en ninguna otra '
  + 'parte: desde otro equipo no se ven.</p>'
  + '</section>'
  + '</div>'
  + '<div class="cuenta-pie">'
  + '<button class="cuenta-salir" type="button">Cerrar sesión</button>'
  + '<p class="cuenta-nota">La cuenta se queda guardada en este navegador: '
  + 'puedes volver a entrar con tu correo y tu contraseña. No hay ningún otro lugar donde '
  + 'estuviera guardada.</p>'
  + '</div></section>';
document.body.append(fondoC, panelC);

// La entrada vive en la navegacion y se crea desde aqui: sin JavaScript no
// habria panel que abrir, asi que tampoco tiene que haber boton.
const PERSONA = '<svg class="nav-cuenta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
  + 'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
  + '<circle cx="12" cy="8.2" r="3.6"/>'
  + '<path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0"/></svg>';
const navCuenta = document.createElement('button');
navCuenta.type = 'button';
navCuenta.className = 'nav-cuenta';
// Va en el grupo de acciones, no dentro de la navegacion: asi puede quedarse
// a la derecha mientras los enlaces se centran, y en el telefono se ve
// siempre, sin tener que abrir el menu.
document.querySelector('.nav-acciones')?.prepend(navCuenta);

const tituloC = panelC.querySelector('#cuenta-titulo');
const pasosC = [...panelC.querySelectorAll('.cuenta-paso')];
const avisoCrear = panelC.querySelector('[data-paso="crear"] .cuenta-aviso');
const avisoEntrar = panelC.querySelector('[data-paso="entrar"] .cuenta-aviso');
const campoCodigo = panelC.querySelector('#cuenta-codigo');
const errorCodigo = panelC.querySelector('#cuenta-codigo-error');
const avisoVerificar = panelC.querySelector('[data-paso="verificar"] .cuenta-aviso');
const codigoCorreo = panelC.querySelector('.codigo-correo');
const codigoValor = panelC.querySelector('.codigo-valor');
const codigoFalso = panelC.querySelector('.codigo-falso');
const codigoEstado = panelC.querySelector('.codigo-estado');
const maquetaCodigo = panelC.querySelector('.cuenta-maqueta-codigo');
const codigoReenviar = panelC.querySelector('.codigo-reenviar');
const correoEntrar = panelC.querySelector('#cuenta-entrar-correo');
const errorEntrarCorreo = panelC.querySelector('#cuenta-entrar-correo-error');
const claveEntrar = panelC.querySelector('#cuenta-entrar-clave');
const errorEntrarClave = panelC.querySelector('#cuenta-entrar-clave-error');

const TITULOS_CUENTA = { crear: 'Crear cuenta', verificar: 'Verificar tu correo',
  entrar: 'Entrar', sesion: 'Tu cuenta' };

// El codigo nace en el navegador y de ahi sale por correo. Conviene decir en
// voz alta lo que eso significa y lo que no: prueba que el correo escrito
// existe y que quien se registra lo abre, que es para lo que sirve el paso,
// porque el comprobante del pedido va justo ahi. Lo que no hace es resistir a
// quien quiera saltarse el paso: el codigo esta en la memoria de su propio
// navegador y lo puede leer en las herramientas de desarrollo. Para eso haria
// falta que naciera y se comparara en un servidor, y este sitio no tiene.
let codigoEsperado = '';
let relojReenvio = 0;
const REENVIO = 45;
// A donde se manda el codigo: al correo que se acaba de escribir si venimos
// de crear la cuenta, o al de la cuenta guardada si venimos de entrar.
const correoAVerificar = () => datos.correo || sesion.correo;

const nuevoCodigo = () => {
  codigoEsperado = String(Math.floor(100000 + Math.random() * 900000));
  if (codigoValor) codigoValor.textContent = codigoEsperado;
  if (codigoCorreo) codigoCorreo.textContent = correoAVerificar();
};

// El codigo se manda y se cuenta como fue. Si el envio no esta configurado o
// falla, el recuadro que imita el correo aparece con el codigo dentro: asi el
// registro no se queda tapiado, y el parrafo de arriba dice por que se esta
// viendo en pantalla algo que deberia haber llegado al buzon.
const mandarCodigo = async () => {
  const para = correoAVerificar();
  const codigo = codigoEsperado;
  const verAtajo = (motivo) => {
    // Se vacia y no solo se oculta: si se queda el "Enviando..." dentro, el
    // lector de pantalla lo puede volver a cantar al reaparecer el renglon.
    codigoEstado.textContent = '';
    codigoEstado.hidden = true;
    codigoFalso.hidden = false;
    maquetaCodigo.hidden = false;
    maquetaCodigo.innerHTML = `<strong>Maqueta académica.</strong> ${motivo} `
      + 'El código se muestra aquí abajo para que puedas seguir.';
  };
  if (!buzonListo()) {
    verAtajo('El envío de correo no está configurado en esta copia del sitio.');
    return;
  }
  codigoFalso.hidden = true;
  maquetaCodigo.hidden = true;
  codigoEstado.hidden = false;
  codigoEstado.textContent = 'Enviando el código a tu correo…';
  const bien = await enviarCorreo(para, datos.nombre || sesion.nombre,
    'Tu código de El Tradicional',
    `Tu código para verificar la cuenta es ${codigo}.\n\n`
    + 'Caduca cuando pidas otro. No lo compartas con nadie: nadie de '
    + 'El Tradicional te lo va a pedir.');
  // Mientras el correo viajaba pudo pedirse otro codigo, y entonces este
  // mensaje habla de uno que ya no vale.
  if (codigoEsperado !== codigo) return;
  if (bien) {
    codigoEstado.textContent = 'Código enviado. Si no lo ves, mira en la carpeta de spam.';
    return;
  }
  codigoEstado.hidden = true;
  verAtajo('No se pudo enviar el correo: puede ser la red o la cuota del mes.');
};

// La espera para reenviar. Ya no es un detalle de maqueta: los correos salen
// de verdad y el plan gratuito da 200 al mes, asi que pulsar "Enviar otro
// codigo" en bucle vaciaria la cuota en una tarde.
const cuentaAtras = () => {
  window.clearInterval(relojReenvio);
  let quedan = REENVIO;
  const pintar = () => {
    if (quedan <= 0) {
      window.clearInterval(relojReenvio);
      relojReenvio = 0;
      codigoReenviar.disabled = false;
      codigoReenviar.textContent = 'Enviar otro código';
      return;
    }
    codigoReenviar.disabled = true;
    codigoReenviar.textContent = `Enviar otro código en ${quedan}s`;
    quedan -= 1;
  };
  pintar();
  relojReenvio = window.setInterval(pintar, 1000);
};

const pararCuentaAtras = () => {
  window.clearInterval(relojReenvio);
  relojReenvio = 0;
  if (codigoReenviar) {
    codigoReenviar.disabled = false;
    codigoReenviar.textContent = 'Enviar otro código';
  }
};
const verPaso = (nombre) => {
  pasosC.forEach((paso) => { paso.hidden = paso.dataset.paso !== nombre; });
  tituloC.textContent = TITULOS_CUENTA[nombre];
  // El historial se relee al entrar al paso de la sesion y no una sola vez al
  // cargar: entre una apertura y otra puede haberse pagado un pedido, y la
  // lista tendria que ensenarlo sin recargar la pagina.
  if (nombre === 'sesion') pintarPedidos();
};

// Mismo trato que en la tarjeta: un campo solo se marca cuando ya lo tocaste
// o cuando ya intentaste enviar. Avisar antes de escribir nada no ayuda.
const datos = { nombre: '', correo: '', telefono: '', direccion: '', clave: '', repite: '' };
// Cada campo elige cuando se le puede reganar. El correo y el telefono, al
// salir de ellos: corregir a alguien el correo en la tercera letra no ayuda.
// La contrasena no se marca nunca en rojo mientras escribes, porque la lista
// de abajo ya va diciendo lo que falta; solo al intentar crear la cuenta.
// La repeticion es el caso contrario, y por eso lleva 'alEscribir': ahi no hay
// nada que adivinar -o es la misma o no lo es-, y enterarse al salir del campo
// significa haber escrito cuarenta caracteres para nada. Se queda callada
// mientras este vacia, que un "no son iguales" sin haber escrito nada seria
// reganar por adelantado.
const campos = [
  { clave: 'nombre' },
  { clave: 'correo' },
  { clave: 'telefono' },
  { clave: 'direccion' },
  { clave: 'clave', soloAlIntentar: true },
  { clave: 'repite', alEscribir: true },
].map((campo) => Object.assign(campo, {
  input: panelC.querySelector(`#cuenta-${campo.clave}`),
  error: panelC.querySelector(`#cuenta-${campo.clave}-error`),
}));
const tocadosC = new Set();
let intentadoC = false;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// El correo no se despacha con un "algo esta mal": se dice que le falta, y
// todo lo que le falta. Sin @ no basta con pedir el @, porque al ponerlo
// saldria otro aviso pidiendo el resto; se pide de una vez todo lo que va
// desde el @. Con el @ puesto, se va diciendo el trozo que queda.
const fallaCorreo = (v) => {
  if (!v) return 'Escribe tu correo.';
  if (/\s/.test(v)) return 'El correo no lleva espacios.';
  const arroba = v.indexOf('@');
  if (arroba === -1) return 'Le falta el @ y todo lo que sigue, por ejemplo @gmail.com.';
  if (arroba === 0) return 'Le falta tu usuario antes del @, como juan.perez@gmail.com.';
  if (v.includes('@', arroba + 1)) return 'Tiene más de un @: el correo lleva solo uno.';
  const dominio = v.slice(arroba + 1);
  if (!dominio) return 'Le falta lo que va después del @, por ejemplo gmail.com u hotmail.com.';
  if (dominio.startsWith('.')) return 'Le falta el nombre entre el @ y el punto, como gmail u outlook.';
  if (dominio.includes('..')) return 'Tiene dos puntos seguidos: va solo uno.';
  if (!dominio.includes('.')) return 'Le falta el final, por ejemplo .com, .ec o .es.';
  if (dominio.endsWith('.')) return 'Le falta lo que va después del punto, como com o ec.';
  if (!/\.[a-z]{2,}$/i.test(dominio)) return 'El final no está completo: suele ser .com, .ec o .es.';
  if (!CORREO.test(v)) return 'Revisa el correo, algo no cuadra.';
  return '';
};
const fallosCuenta = () => {
  const f = {};
  if (datos.nombre.length < 3) f.nombre = 'Escribe tu nombre.';
  else if (!datos.nombre.includes(' ')) f.nombre = 'Falta el apellido.';
  const correo = fallaCorreo(datos.correo);
  if (correo) f.correo = correo;
  // Tras el +593 el numero va sin el cero: los celulares de aqui son 09...,
  // asi que quedan nueve cifras que empiezan en 9.
  if (!datos.telefono) f.telefono = 'Escribe tu número.';
  else if (!/^9\d{8}$/.test(datos.telefono)) f.telefono = 'Son 9 números después del +593, empezando por 9.';
  if (REGLAS.some((r) => !r.cumple(datos.clave))) f.clave = 'A la contraseña le falta algo de la lista.';
  if (datos.repite !== datos.clave) f.repite = 'Las dos no son iguales.';
  return f;
};

// La lista de obligaciones se repinta en cada tecla: es la unica parte del
// formulario que contesta mientras escribes, y por eso no hay que adivinar.
const pintarReglas = () => {
  REGLAS.forEach((r) => {
    const fila = panelC.querySelector(`[data-regla="${r.id}"]`);
    const hecha = r.cumple(datos.clave);
    fila.classList.toggle('is-hecha', hecha);
    fila.querySelector('.cuenta-regla-estado').textContent = hecha ? ', cumplido' : ', falta';
  });
};
const pintarCampos = () => {
  const fallos = fallosCuenta();
  pintarReglas();
  campos.forEach(({ clave, input, error, soloAlIntentar, alEscribir }) => {
    const momento = soloAlIntentar
      ? intentadoC
      : (intentadoC || tocadosC.has(clave) || (alEscribir && Boolean(datos[clave])));
    const texto = momento ? fallos[clave] : '';
    error.hidden = !texto;
    error.textContent = texto || '';
    input.setAttribute('aria-invalid', texto ? 'true' : 'false');
    input.classList.toggle('is-mal', Boolean(texto));
  });
  return fallos;
};
campos.forEach(({ clave, input }) => {
  input.addEventListener('input', () => {
    // El telefono solo admite cifras. El 0 de 09... se lo come el +593, asi
    // que escribir el numero de memoria tambien funciona.
    if (clave === 'telefono') input.value = soloNueve(input.value);
    datos[clave] = (clave === 'clave' || clave === 'repite') ? input.value : input.value.trim();
    pintarCampos();
  });
  input.addEventListener('blur', () => { tocadosC.add(clave); pintarCampos(); });
});
// Enter va de un campo al siguiente; en el ultimo hace lo del boton.
enterAvanza(campos.map((c) => c.input), () => panelC.querySelector('.cuenta-crear').click());

// Las contrasenas no se quedan escritas al cerrar: ni en el campo ni en la
// variable. Es lo unico de aqui que no debe sobrevivir al panel.
const olvidarFormulario = () => {
  campos.forEach(({ clave, input }) => { datos[clave] = ''; input.value = ''; });
  tocadosC.clear();
  intentadoC = false;
  pintarCampos();
  avisoCrear.hidden = true;
  avisoEntrar.hidden = true;
  correoEntrar.value = '';
  errorEntrarCorreo.hidden = true;
  correoEntrar.classList.remove('is-mal');
  claveEntrar.value = '';
  errorEntrarClave.hidden = true;
  claveEntrar.classList.remove('is-mal');
};

const guardarCuenta = () => {
  try {
    // Lo que hace falta para el pedido y la huella de la contrasena; la
    // contrasena en si no entra aqui.
    window.localStorage.setItem(CLAVE_CUENTA, JSON.stringify({
      nombre: sesion.nombre, correo: sesion.correo,
      telefono: sesion.telefono, direccion: sesion.direccion,
      verificado: sesion.verificado, sesionAbierta: sesion.dentro,
      clave: huellaClave,
    }));
  } catch (e) { /* en ventana privada no se puede guardar; la sesion sigue viva en memoria */ }
};
const correoGuardado = () => {
  try {
    const crudo = window.localStorage.getItem(CLAVE_CUENTA);
    return crudo ? String(JSON.parse(crudo).correo || '') : '';
  } catch (e) { return ''; }
};
const huellaGuardada = () => {
  try {
    const h = JSON.parse(window.localStorage.getItem(CLAVE_CUENTA) || '{}').clave;
    return h && typeof h.sal === 'string' && typeof h.hash === 'string' ? h : null;
  } catch (e) { return null; }
};
const leerCuenta = () => {
  huellaClave = huellaGuardada();
  try {
    const crudo = window.localStorage.getItem(CLAVE_CUENTA);
    if (!crudo) return;
    const dato = JSON.parse(crudo);
    if (!dato || !dato.nombre || typeof dato.correo !== 'string') return;
    sesion.nombre = String(dato.nombre).slice(0, 60);
    sesion.correo = String(dato.correo).slice(0, 80);
    sesion.telefono = soloNueve(String(dato.telefono || ''));
    sesion.direccion = String(dato.direccion || '').slice(0, 200);
    sesion.verificado = dato.verificado === true;
    // Una cuenta guardada antes de que existiera este dato no trae el campo, y
    // entonces se entra como siempre: solo un cierre expreso deja fuera.
    sesion.dentro = dato.sesionAbierta !== false;
  } catch (e) { /* almacenamiento bloqueado o dato corrupto: se empieza fuera */ }
};

const iniciales = (nombre) => nombre.split(/\s+/).filter(Boolean).slice(0, 2)
  .map((parte) => parte[0].toUpperCase()).join('');

// El boton de la cuenta no lleva texto: fuera de sesion es la silueta, y dentro
// son tus iniciales, que hacen de icono. Sin rotulo a la vista, el nombre va en
// aria-label para quien usa lector de pantalla y en title para quien usa raton;
// si no, seria un circulo sin explicacion para todos.
const nombrarBoton = (texto) => {
  navCuenta.setAttribute('aria-label', texto);
  navCuenta.setAttribute('title', texto);
};

const pintarSesion = () => {
  if (!sesion.dentro) {
    navCuenta.classList.remove('is-dentro');
    navCuenta.innerHTML = PERSONA;
    nombrarBoton('Entrar o crear una cuenta');
    return;
  }
  navCuenta.classList.add('is-dentro');
  // El nombre lo escribe quien usa el sitio, asi que entra como texto y no como
  // HTML: con innerHTML, un nombre con etiquetas dentro se ejecutaria.
  navCuenta.textContent = '';
  const marca = document.createElement('span');
  marca.className = 'nav-cuenta-iniciales';
  marca.setAttribute('aria-hidden', 'true');
  marca.textContent = iniciales(sesion.nombre);
  navCuenta.append(marca);
  nombrarBoton(`Tu cuenta, ${sesion.nombre}`);
  panelC.querySelector('.cuenta-avatar').textContent = iniciales(sesion.nombre);
  panelC.querySelector('.cuenta-sesion-nombre').textContent = sesion.nombre;
  panelC.querySelector('.cuenta-sesion-correo').textContent = sesion.correo;
  panelC.querySelector('.cuenta-dato-telefono').textContent = telefonoBonito(sesion.telefono) || '—';
  panelC.querySelector('.cuenta-dato-direccion').textContent = sesion.direccion || 'Sin dirección guardada';
};

// El historial sale de IndexedDB, que se lee con promesas, asi que esto va
// aparte de pintarSesion: lo demas del panel se pinta de golpe y no tiene por
// que esperar a una base de datos para ensenar un nombre.
const pintarPedidos = async () => {
  const zona = panelC.querySelector('.cuenta-pedidos');
  const lista = zona?.querySelector('.cuenta-pedidos-lista');
  if (!lista) return;
  const pedidos = await pedidosGuardados();
  zona.hidden = !pedidos.length;
  if (!pedidos.length) return;
  lista.textContent = '';
  pedidos.forEach((p) => {
    const fila = document.createElement('li');
    const numero = document.createElement('span');
    numero.className = 'cuenta-pedido-numero';
    numero.textContent = p.numero;
    const cuando = document.createElement('span');
    cuando.className = 'cuenta-pedido-fecha';
    cuando.textContent = marcaBonita(new Date(p.fecha));
    const cuanto = document.createElement('strong');
    cuanto.textContent = dinero(Number(p.total) || 0);
    // Cuantas cosas llevaba, que es lo que distingue un pedido de otro cuando
    // los numeros no dicen nada por si solos.
    const cuantos = (p.lineas || []).reduce((s, l) => s + (Number(l.cantidad) || 0), 0);
    const detalle = document.createElement('span');
    detalle.className = 'cuenta-pedido-detalle';
    detalle.textContent = `${cuantos} ${cuantos === 1 ? 'unidad' : 'unidades'}`
      + (p.modo === 'domicilio' ? ' · a domicilio' : ' · para retirar');
    // En el orden en que se leen: numero y total arriba, cuando y que llevaba
    // debajo. Es tambien el orden en que los dice un lector de pantalla.
    fila.append(numero, cuanto, cuando, detalle);
    lista.append(fila);
  });
};

// Tener cuenta sirve para no volver a escribir lo mismo: la direccion pasa a la
// canasta, pero solo si esta vacia. Lo que ya escribiste manda sobre la cuenta.
const prellenarPedido = () => {
  if (!sesion.dentro || !sesion.direccion || entrega.direccion) return;
  puente.ponerDireccion(sesion.direccion);
};

let ultimoFocoC = null;
const abiertoC = () => panelC.classList.contains('is-open');
const abrirC = (paso) => {
  ultimoFocoC = document.activeElement;
  // Con sesion abierta se entra a la ficha; sin ella, al paso que se pidio.
  verPaso(sesion.dentro ? 'sesion' : (paso || 'entrar'));
  fondoC.classList.add('is-open');
  panelC.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  apagarDetras(panelC, true);
  tituloC.focus();
};
const cerrarC = () => {
  menuCuenta?.classList.remove('is-open');
  navCuenta.setAttribute('aria-expanded', 'false');
  fondoC.classList.remove('is-open');
  panelC.classList.remove('is-open');
  document.body.style.overflow = '';
  // Igual que en la canasta: primero se enciende, despues se devuelve el foco.
  apagarDetras(panelC, false);
  olvidarFormulario();
  // En el telefono el menu se cerro al abrir el panel, asi que el boton al que
  // habria que volver esta escondido: el foco va al de abrir el menu, que si se ve.
  if (ultimoFocoC && ultimoFocoC.offsetParent === null) menuToggle?.focus();
  else ultimoFocoC?.focus();
};

// Pulsar el circulo no lanza al formulario de crear cuenta: despliega las dos
// puertas, entrar o registrarse, y cada una abre su paso. Estando dentro no
// hay nada que elegir, asi que va directo a la ficha de la sesion.
const menuCuenta = document.createElement('div');
menuCuenta.className = 'cuenta-menu';
menuCuenta.id = 'cuenta-menu';
menuCuenta.innerHTML = '<button type="button" data-va="entrar">Iniciar sesión</button>'
  + '<button type="button" data-va="crear">Registrarse</button>';
navCuenta.insertAdjacentElement('afterend', menuCuenta);

const abrirMenuCuenta = (abierto) => {
  menuCuenta.classList.toggle('is-open', abierto);
  navCuenta.setAttribute('aria-expanded', String(abierto));
};
navCuenta.setAttribute('aria-expanded', 'false');
navCuenta.setAttribute('aria-haspopup', 'true');
navCuenta.setAttribute('aria-controls', menuCuenta.id);
navCuenta.dataset.tip = 'Tu cuenta';
// Las dos puertas se recorren con las flechas, como el desplegable de Tienda.
flechasEnMenu(navCuenta, menuCuenta, abrirMenuCuenta,
  () => menuCuenta.classList.contains('is-open'));

navCuenta.addEventListener('click', () => {
  closeMenu();
  if (sesion.dentro) { abrirC(); return; }
  abrirMenuCuenta(!menuCuenta.classList.contains('is-open'));
});
menuCuenta.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  abrirMenuCuenta(false);
  abrirC(b.dataset.va);
}));
const fueraDeCuenta = (destino) => !navCuenta.contains(destino) && !menuCuenta.contains(destino);
document.addEventListener('click', (e) => {
  if (!fueraDeCuenta(e.target)) return;
  abrirMenuCuenta(false);
});
// Tabular fuera lo cierra: dejarlo desplegado detras del foco es ensenar un
// menu que ya no responde a nada.
document.addEventListener('focusin', (e) => {
  if (!fueraDeCuenta(e.target)) return;
  abrirMenuCuenta(false);
});
// Escape lo cierra desde donde sea y devuelve el foco al circulo, que si no
// se queda colgando en un boton que acaba de desaparecer.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !menuCuenta.classList.contains('is-open')) return;
  abrirMenuCuenta(false);
  navCuenta.focus();
});
fondoC.addEventListener('click', cerrarC);
panelC.querySelector('.cuenta-cerrar').addEventListener('click', cerrarC);
atraparFoco(panelC, abiertoC, cerrarC);

panelC.querySelectorAll('.cuenta-cambiar').forEach((boton) => {
  boton.addEventListener('click', () => {
    avisoCrear.hidden = true;
    avisoEntrar.hidden = true;
    verPaso(boton.dataset.va);
    tituloC.focus();
  });
});

// Entrar en la sesion es lo mismo se venga de crear la cuenta o de reconocerla.
const entrarEnSesion = (aviso) => {
  guardarCuenta();
  pintarSesion();
  prellenarPedido();
  olvidarFormulario();
  verPaso('sesion');
  tituloC.focus();
  avisos.textContent = aviso;
};

panelC.querySelector('.cuenta-crear').addEventListener('click', async () => {
  intentadoC = true;
  const fallos = pintarCampos();
  const malos = Object.keys(fallos);
  if (malos.length) {
    avisoCrear.hidden = false;
    avisoCrear.textContent = malos.length === 1
      ? 'Falta corregir un campo.'
      : `Faltan ${malos.length} campos por corregir.`;
    campos.find(({ clave }) => clave === malos[0])?.input.focus();
    return;
  }
  if (!puedeHuella()) {
    avisoCrear.hidden = false;
    avisoCrear.textContent = 'Este navegador no puede guardar la contraseña aquí. Abre el sitio por https.';
    return;
  }
  huellaClave = await calcularHuella(datos.clave);
  sesion.nombre = datos.nombre;
  sesion.correo = datos.correo;
  sesion.telefono = datos.telefono;
  sesion.direccion = datos.direccion;
  // La cuenta todavia no esta dentro: falta probar que el correo es suyo. Si
  // entrara aqui, el correo podria ser inventado o estar mal escrito y el
  // comprobante del pedido no llegaria a ninguna parte.
  sesion.verificado = false;
  irAVerificar();
});

// --- Verificar el correo -----------------------------------------------
const irAVerificar = () => {
  nuevoCodigo();
  campoCodigo.value = '';
  errorCodigo.hidden = true;
  campoCodigo.classList.remove('is-mal');
  avisoVerificar.hidden = true;
  codigoEstado.hidden = true;
  verPaso('verificar');
  cuentaAtras();
  tituloC.focus();
  avisos.textContent = `Te enviamos un código a ${correoAVerificar()}.`;
  mandarCodigo();
};

// El error va por dos sitios: debajo del campo, unido con aria-describedby
// para quien lo lee al enfocarlo, y en la region con role="alert" del pie,
// que el lector canta al momento. Un codigo equivocado merece interrumpir:
// quien lo escribio esta esperando una respuesta ahora, no despues.
const marcarCodigo = (texto) => {
  errorCodigo.hidden = !texto;
  errorCodigo.textContent = texto;
  campoCodigo.classList.toggle('is-mal', Boolean(texto));
  avisoVerificar.hidden = !texto;
  avisoVerificar.textContent = texto;
};

// Mientras escribe solo se limpia lo que no son cifras. El codigo no se
// comprueba al vuelo: nadie quiere que le digan que va mal a la tercera.
campoCodigo.addEventListener('input', () => {
  const limpio = campoCodigo.value.replace(/[^0-9]/g, '').slice(0, 6);
  if (limpio !== campoCodigo.value) campoCodigo.value = limpio;
  if (!errorCodigo.hidden) marcarCodigo('');
});

const comprobarCodigo = () => {
  const escrito = campoCodigo.value.trim();
  if (escrito.length !== 6) {
    marcarCodigo('El código tiene 6 cifras.');
    campoCodigo.focus();
    return;
  }
  if (escrito !== codigoEsperado) {
    marcarCodigo('Ese código no es el que enviamos. Míralo otra vez.');
    campoCodigo.focus();
    return;
  }
  marcarCodigo('');
  codigoEstado.hidden = true;
  pararCuentaAtras();
  codigoEsperado = '';
  sesion.verificado = true;
  sesion.dentro = true;
  entrarEnSesion(`Correo verificado. Entraste como ${sesion.nombre}.`);
};

panelC.querySelector('.cuenta-verificar').addEventListener('click', comprobarCodigo);
campoCodigo.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  comprobarCodigo();
});

codigoReenviar.addEventListener('click', () => {
  nuevoCodigo();
  campoCodigo.value = '';
  marcarCodigo('');
  cuentaAtras();
  campoCodigo.focus();
  avisos.textContent = 'Te enviamos un código nuevo.';
  mandarCodigo();
});

const entrar = async () => {
  const escrito = correoEntrar.value.trim();
  const marcar = (input, error, texto) => {
    error.hidden = !texto;
    error.textContent = texto || '';
    input.setAttribute('aria-invalid', texto ? 'true' : 'false');
    input.classList.toggle('is-mal', Boolean(texto));
  };
  const malCorreo = fallaCorreo(escrito);
  const malClave = claveEntrar.value ? '' : 'Escribe tu contraseña.';
  marcar(correoEntrar, errorEntrarCorreo, malCorreo);
  marcar(claveEntrar, errorEntrarClave, malClave);
  if (malCorreo) { correoEntrar.focus(); return; }
  if (malClave) { claveEntrar.focus(); return; }
  avisoEntrar.hidden = true;
  // Sin servidor solo se puede reconocer la cuenta de este navegador.
  const guardado = correoGuardado();
  if (!guardado) {
    avisoEntrar.hidden = false;
    avisoEntrar.textContent = 'En este navegador no hay ninguna cuenta creada todavía.';
    return;
  }
  if (!puedeHuella()) {
    avisoEntrar.hidden = false;
    avisoEntrar.textContent = 'Este navegador no puede comprobar la contraseña aquí. Abre el sitio por https.';
    return;
  }
  const huella = huellaGuardada();
  // Una cuenta creada antes de que se guardara la huella no tiene con que
  // comparar, y dejarla entrar con cualquier contrasena seria no pedirla.
  if (!huella) {
    avisoEntrar.hidden = false;
    avisoEntrar.textContent = 'Esta cuenta se creó sin contraseña. Vuelve a registrarte para ponerle una.';
    return;
  }
  // Correo equivocado y contrasena equivocada reciben la misma respuesta: decir
  // cual de los dos fallo le ahorra la mitad del trabajo a quien adivina.
  const correoBien = guardado.toLowerCase() === escrito.toLowerCase();
  const claveBien = (await calcularHuella(claveEntrar.value, huella.sal)).hash === huella.hash;
  if (!correoBien || !claveBien) {
    claveEntrar.value = '';
    avisoEntrar.hidden = false;
    avisoEntrar.textContent = 'El correo o la contraseña no son correctos.';
    claveEntrar.focus();
    return;
  }
  leerCuenta();
  // Una cuenta de antes de la verificacion entra igual, pero pasa por el
  // codigo: el comprobante del pedido va al correo y hay que saber que es
  // suyo y que esta bien escrito.
  if (!sesion.verificado) { sesion.dentro = false; irAVerificar(); return; }
  sesion.dentro = true;
  entrarEnSesion(`Entraste como ${sesion.nombre}.`);
};
panelC.querySelector('.cuenta-entrar').addEventListener('click', entrar);
// Enter en el correo pasa a la contrasena; en la contrasena, entra.
enterAvanza([correoEntrar, claveEntrar], entrar);
// Si el correo ya salio marcado, el aviso sigue lo que se va escribiendo:
// al poner el @ pasa a pedir lo que falta despues, y al completarlo se va.
correoEntrar.addEventListener('input', () => {
  if (errorEntrarCorreo.hidden) return;
  const texto = fallaCorreo(correoEntrar.value.trim());
  errorEntrarCorreo.hidden = !texto;
  errorEntrarCorreo.textContent = texto;
  correoEntrar.setAttribute('aria-invalid', texto ? 'true' : 'false');
  correoEntrar.classList.toggle('is-mal', Boolean(texto));
});

panelC.querySelector('.cuenta-salir').addEventListener('click', () => {
  const nombre = sesion.nombre;
  // Lo que se cierra es la sesion, no la cuenta: los datos se quedan en este
  // navegador para poder volver a entrar con el correo, que es justo lo que
  // promete el boton. Antes esto borraba la cuenta entera, y entonces "entrar"
  // contestaba que en este navegador no habia ninguna.
  // Se guarda antes de vaciar la sesion en memoria, porque es de ahi de donde
  // guardarCuenta saca lo que escribe.
  sesion.dentro = false;
  guardarCuenta();
  sesion.nombre = '';
  sesion.correo = '';
  sesion.telefono = '';
  sesion.direccion = '';
  sesion.verificado = false;
  pintarSesion();
  verPaso('entrar');
  tituloC.focus();
  avisos.textContent = `Cerraste la sesión de ${nombre}.`;
});

const iniciarCuenta = () => {
  leerCuenta();
  pintarSesion();
  prellenarPedido();
};

// Lo que la canasta puede pedirle a la cuenta: abrir el panel y saber si en
// este navegador hay alguna cuenta creada, para abrir en "entrar" o en "crear".
puente.abrirC = abrirC;
puente.correoGuardado = correoGuardado;

export { iniciarCuenta };
