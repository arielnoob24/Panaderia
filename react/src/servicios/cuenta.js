// ---- La cuenta de este navegador ---------------------------------------
// Leer y guardar la cuenta, la huella de la contrasena, las reglas de cada
// campo y el codigo que se manda por correo (secciones 7 y 15 del plan).
//
// Misma clave y mismo formato de localStorage que el sitio actual: lo que se
// acepta de lo guardado es leerCuentaGuardada() de js/cuenta/guardada.js,
// importado, y lo que se escribe es lo mismo que escribe guardarCuenta() de
// js/cuenta/account.js. Asi una cuenta creada aqui sirve alli y al reves.
//
// Las reglas (REGLAS, fallaCorreo, fallaNombre, fallaTelefono), la huella
// PBKDF2 y los textos del codigo estan copiados TAL CUAL de
// js/cuenta/account.js, sin reescribirlos: ese archivo no se puede importar
// porque arma su panel en la pagina al cargarse. Si se cambia una regla, se
// cambia en los dos sitios hasta que el actual se retire (fase 7).
//
// Todo lo que toca localStorage va en try/catch: en ventana privada falla, y
// eso no puede tumbar la pagina.
import { CLAVE_CUENTA, soloNueve, codigoAlAzar, leerCuentaGuardada, correoDeCuenta } from '@raiz/js/cuenta/guardada.js';
import { buzonListo, enviarCorreo } from '@raiz/js/comun/mail.js';
import { pedidosGuardados } from '@raiz/js/comun/storage.js';

// ---- La huella de la contrasena (copiado de account.js) ---------------
// La contrasena no se guarda tal cual: se guarda su huella, un hash PBKDF2
// con sal, que sirve para comprobarla al entrar pero no para leerla.
const VUELTAS = 100000;
const aHex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
const deHex = (hex) => new Uint8Array((hex.match(/../g) || []).map((h) => parseInt(h, 16)));
// crypto.subtle solo existe en contexto seguro (https o localhost); en otro
// caso no hay con que calcular la huella.
const puedeHuella = () => Boolean(window.crypto?.subtle);
const calcularHuella = async (clave, salHex) => {
  const sal = salHex ? deHex(salHex) : window.crypto.getRandomValues(new Uint8Array(16));
  const base = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(clave),
    'PBKDF2', false, ['deriveBits']);
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: sal, iterations: VUELTAS, hash: 'SHA-256' }, base, 256);
  return { sal: aHex(sal), hash: aHex(bits) };
};

// ---- Las reglas de cada campo (copiado de account.js) -----------------
// Lo que tiene que cumplir la contrasena, escrito una sola vez: de aqui salen
// la lista que se ve debajo del campo y la comprobacion de si vale.
const REGLAS = [
  { id: 'largo', texto: 'Al menos 8 caracteres', cumple: (v) => v.length >= 8 },
  { id: 'minuscula', texto: 'Una letra minúscula', cumple: (v) => /[a-zñáéíóúü]/.test(v) },
  { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: (v) => /[A-ZÑÁÉÍÓÚÜ]/.test(v) },
  { id: 'numero', texto: 'Un número', cumple: (v) => /[0-9]/.test(v) },
];

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
// Nombre y telefono se comprueban igual al crear la cuenta y al editarla.
const fallaNombre = (v) => {
  if (v.length < 3) return 'Escribe tu nombre.';
  if (!v.includes(' ')) return 'Falta el apellido.';
  return '';
};
// Tras el +593 el numero va sin el cero: los celulares de aqui son 09...,
// asi que quedan nueve cifras que empiezan en 9.
const fallaTelefono = (v) => {
  if (!v) return 'Escribe tu número.';
  if (!/^9\d{8}$/.test(v)) return 'Son 9 números después del +593, empezando por 9.';
  return '';
};
// Los fallos de crear la cuenta, en el orden en que se ven los campos (el
// foco va al primero).
const fallosCuenta = (datos) => {
  const f = {};
  if (fallaNombre(datos.nombre)) f.nombre = fallaNombre(datos.nombre);
  const correo = fallaCorreo(datos.correo);
  if (correo) f.correo = correo;
  if (fallaTelefono(datos.telefono)) f.telefono = fallaTelefono(datos.telefono);
  if (REGLAS.some((r) => !r.cumple(datos.clave))) f.clave = 'A la contraseña le falta algo de la lista.';
  if (datos.repite !== datos.clave) f.repite = 'Las dos no son iguales.';
  return f;
};
// Los de editar: los mismos nombre y telefono.
const fallosEditar = (v) => {
  const f = {};
  if (fallaNombre(v.nombre)) f.nombre = fallaNombre(v.nombre);
  if (fallaTelefono(v.telefono)) f.telefono = fallaTelefono(v.telefono);
  return f;
};
// El aviso del pie al intentar enviar con errores, igual en crear y editar.
const avisoFaltan = (n) => (n === 1 ? 'Falta corregir un campo.' : `Faltan ${n} campos por corregir.`);

const telefonoBonito = (d) => (d ? `+593 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : '');
const iniciales = (nombre) => nombre.split(/\s+/).filter(Boolean).slice(0, 2)
  .map((parte) => parte[0].toUpperCase()).join('');

// ---- Lo guardado ------------------------------------------------------
const leerCrudo = () => {
  try { return window.localStorage.getItem(CLAVE_CUENTA); } catch (e) { return null; }
};
// La huella guardada, o null si la cuenta es de antes de que se guardara (o
// alguien la toco a mano y ya no tiene forma de huella).
const huellaDe = (crudo) => {
  try {
    const h = JSON.parse(crudo || '{}').clave;
    return h && typeof h.sal === 'string' && typeof h.hash === 'string' ? { sal: h.sal, hash: h.hash } : null;
  } catch (e) { return null; }
};
// La cuenta ya revisada, su huella y si en este navegador hay alguna (aunque
// la sesion este cerrada: la hoja de pagar ofrece entonces entrar).
const leerCuenta = () => {
  const crudo = leerCrudo();
  return {
    cuenta: leerCuentaGuardada(crudo),
    huella: huellaDe(crudo),
    hayCuenta: Boolean(correoDeCuenta(crudo)),
    // El correo tal cual esta escrito, aunque la cuenta no valga entera: es
    // con el que se compara al entrar, como correoGuardado() de account.js.
    correoGuardado: correoDeCuenta(crudo),
  };
};
// Lo mismo que escribe guardarCuenta() de account.js: lo que hace falta para
// el pedido y la huella de la contrasena; la contrasena en si no entra aqui.
const guardarCuenta = (cuenta, huella) => {
  try {
    window.localStorage.setItem(CLAVE_CUENTA, JSON.stringify({
      nombre: cuenta.nombre, correo: cuenta.correo,
      telefono: cuenta.telefono, direccion: cuenta.direccion,
      verificado: cuenta.verificado, sesionAbierta: cuenta.dentro,
      metodo: cuenta.metodo, clave: huella,
    }));
  } catch (e) { /* en ventana privada no se puede guardar; la sesion sigue viva en memoria */ }
};

// Otra pestana (de este sitio o del actual) puede entrar o salir: el evento
// 'storage' avisa, y quien escucha vuelve a leer. key null es que se vacio
// todo el almacenamiento.
const escucharCuenta = (avisar) => {
  const alGuardarse = (e) => { if (e.key === null || e.key === CLAVE_CUENTA) avisar(); };
  window.addEventListener('storage', alGuardarse);
  return () => window.removeEventListener('storage', alGuardarse);
};

// ---- El codigo de verificacion ----------------------------------------
// El codigo nace en el navegador y de ahi sale por correo. Prueba que el
// correo escrito existe y que quien se registra lo abre, que es para lo que
// sirve el paso; no resiste a quien quiera saltarselo leyendo la memoria de
// su propio navegador. Para eso haria falta un servidor, y no lo hay.
// La espera para reenviar: el plan gratuito de EmailJS da 200 correos al mes.
const REENVIO = 45;
// Al azar de verdad (crypto.getRandomValues), el mismo del sitio actual.
const nuevoCodigo = codigoAlAzar;

// Manda el codigo y dice como fue: 'enviado', 'fallo' o 'sin-buzon'. Nunca
// lanza (enviarCorreo tampoco): si no sale, el recuadro que imita el correo
// lo ensena en pantalla y el registro no se queda tapiado.
const mandarCodigo = async (para, nombre, codigo) => {
  if (!buzonListo()) return 'sin-buzon';
  const bien = await enviarCorreo(para, nombre,
    'Tu código de El Tradicional',
    `Tu código para verificar la cuenta es ${codigo}.\n\n`
    + 'Caduca cuando pidas otro. No lo compartas con nadie: nadie de '
    + 'El Tradicional te lo va a pedir.');
  return bien ? 'enviado' : 'fallo';
};
// Como sale un codigo nuevo: sin buzon ya se sabe que no llegara; con buzon,
// esta enviandose y la respuesta llega despues ('enviado' o 'fallo').
const envioInicial = () => (buzonListo() ? 'enviando' : 'sin-buzon');
// Por que se ve el codigo en pantalla, con el texto del sitio actual.
const MOTIVO_SIN_CORREO = {
  'sin-buzon': 'El envío de correo no está configurado en esta copia del sitio.',
  fallo: 'No se pudo enviar el correo: puede ser la red o la cuota del mes.',
};
// Lo que oye el lector de pantalla al salir un codigo: si no hay correo que
// mandar, no se le puede decir que se envio mientras la pantalla dice que no
// (WCAG 4.1.3). Lo mismo se dice cuando el envio falla despues.
const AVISO_SIN_CORREO = 'No pudimos enviar el correo; el código está en pantalla.';
const avisoDelCodigo = (enviado) => (MOTIVO_SIN_CORREO[envioInicial()] ? AVISO_SIN_CORREO : enviado);

// ---- Recuperar la contrasena (solo React, fase 5 del plan) -------------
// El mismo codigo de 6 cifras, con otro texto, por la misma plantilla de
// EmailJS: asunto y cuerpo viajan como variables. Aqui no hay recuadro de
// respaldo: con el codigo en pantalla cualquiera que abriera este navegador
// podria cambiar la contrasena. Si el correo no sale, no se recupera.
const CADUCA_RECUPERAR = 10 * 60 * 1000;
const INTENTOS_RECUPERAR = 5;
const SIN_CORREO_RECUPERAR = 'No pudimos enviar el correo. Inténtalo más tarde.';
const CADUCO_RECUPERAR = 'El código caducó: dura 10 minutos. Vuelve a pedirlo.';
// true si salio. Nunca lanza, como enviarCorreo.
const mandarCodigoClave = async (para, nombre, codigo) => {
  if (!buzonListo()) return false;
  return enviarCorreo(para, nombre,
    'Tu código para cambiar la contraseña',
    `Tu código para cambiar tu contraseña de El Tradicional es ${codigo}.\n\n`
    + 'Caduca en 10 minutos. Si no lo pediste tú, no hagas nada: tu contraseña '
    + 'sigue siendo la misma. No lo compartas con nadie: nadie de El Tradicional '
    + 'te lo va a pedir.');
};

// El correo a medias (ana.perez@gmail.com -> a…@gmail.com): basta para que
// su dueno lo reconozca y no se lo ensena entero a quien use el navegador.
const correoAMedias = (correo) => {
  const arroba = correo.indexOf('@');
  if (arroba < 1) return '…';
  return `${correo[0]}…${correo.slice(arroba)}`;
};

// ---- El historial -----------------------------------------------------
// Todos los pedidos pagados en este navegador, el mas nuevo primero. Si la
// base no se abre, una lista vacia: lo mismo que ve quien no ha pedido nada.
const todosLosPedidos = () => pedidosGuardados(Infinity);
// Los de una cuenta: los que llevan su correo y los de antes de que se
// apuntara (sin correo), que no se sabe de quien son y se siguen ensenando.
const deLaCuenta = (pedidos, correo) => {
  const suyo = String(correo || '').toLowerCase();
  return pedidos.filter((p) => !p.correo || String(p.correo).toLowerCase() === suyo);
};

export {
  soloNueve, puedeHuella, calcularHuella,
  REGLAS, fallaCorreo, fallaNombre, fallaTelefono, fallosCuenta, fallosEditar, avisoFaltan,
  telefonoBonito, iniciales,
  leerCuenta, guardarCuenta, escucharCuenta,
  REENVIO, nuevoCodigo, buzonListo, envioInicial, mandarCodigo, MOTIVO_SIN_CORREO,
  AVISO_SIN_CORREO, avisoDelCodigo,
  CADUCA_RECUPERAR, INTENTOS_RECUPERAR, SIN_CORREO_RECUPERAR, CADUCO_RECUPERAR, mandarCodigoClave, correoAMedias,
  todosLosPedidos, deLaCuenta,
};
