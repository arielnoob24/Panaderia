// ---- La cuenta ---------------------------------------------------------
// Las reglas de cada campo, lo que se recuerda de la cuenta en este
// navegador y los textos del codigo (secciones 7 y 8 del plan).
//
// La cuenta de verdad vive en Supabase: la contrasena y la verificacion del
// correo en Supabase Auth, y nombre y telefono en la tabla USUARIOS, que se
// lee y se cambia por la API. Aqui solo queda una copia de lo ultimo que se
// vio, para pintar la pagina al momento y sin red.
//
// Todo lo que toca localStorage va en try/catch: en ventana privada falla, y
// eso no puede tumbar la pagina.
import { pedidosGuardados } from './storage.js';

// ---- Que se acepta de la copia guardada -------------------------------
const CLAVE_CUENTA = 'eltradicional-cuenta';

// El telefono se guarda sin el 0 ni el +593: los nueve digitos del movil.
// Lo pegado o lo que trae el autorrelleno puede venir con el prefijo del pais
// (+593 99..., 593 099...): el 593 solo se quita si sobran cifras, porque con
// nueve o menos es lo que se esta escribiendo a mano. El campo no lleva
// maxlength: recortaria lo pegado antes de llegar aqui y se perderian las
// ultimas cifras; el tope de nueve lo pone esta funcion.
const soloNueve = (v) => {
  let d = v.replace(/\D/g, '');
  if (d.length > 9 && d.startsWith('593')) d = d.slice(3);
  return d.replace(/^0+/, '').slice(0, 9);
};

// Como esta la cuenta sin sesion: lo que lee la pagina antes de entrar.
const SIN_CUENTA = {
  nombre: '', correo: '', telefono: '', direccion: '',
  dentro: false, verificado: false, metodo: 'efectivo',
};

// Lo de localStorage lo puede tocar cualquiera a mano, asi que se revisa
// antes de usarlo. Sin nombre o sin correo no hay copia.
const leerCopia = (crudo) => {
  if (!crudo) return null;
  let dato;
  try { dato = JSON.parse(crudo); } catch (e) { return null; }
  if (!dato || typeof dato !== 'object' || !dato.nombre || typeof dato.correo !== 'string') return null;
  return {
    nombre: String(dato.nombre).slice(0, 120),
    correo: String(dato.correo).slice(0, 254),
    telefono: soloNueve(String(dato.telefono || '')),
    direccion: String(dato.direccion || '').slice(0, 200),
    metodo: dato.metodo === 'tarjeta' ? 'tarjeta' : 'efectivo',
  };
};

// ---- Las reglas de cada campo -----------------------------------------
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

// ---- La copia guardada -------------------------------------------------
// La copia de la ultima cuenta que entro en este navegador, o null. Se
// conserva al cerrar la sesion: la hoja de "Entra a tu cuenta para pagar"
// ofrece entonces entrar y no crear.
const leerCuenta = () => {
  try { return leerCopia(window.localStorage.getItem(CLAVE_CUENTA)); } catch (e) { return null; }
};
// Sin contrasena ni token: eso lo guarda Supabase Auth.
const guardarCuenta = (cuenta) => {
  try {
    window.localStorage.setItem(CLAVE_CUENTA, JSON.stringify({
      nombre: cuenta.nombre, correo: cuenta.correo, telefono: cuenta.telefono,
      direccion: cuenta.direccion, metodo: cuenta.metodo,
    }));
  } catch (e) { /* en ventana privada no se puede guardar; la sesion sigue viva en memoria */ }
};

// ---- El codigo de verificacion ----------------------------------------
// El codigo lo genera y lo manda Supabase Auth (plantillas "Confirm signup"
// y "Reset password" con {{ .Token }}), y lo comprueba Auth: la pagina nunca
// lo conoce. Supabase no deja pedir otro antes de 60 s.
const REENVIO = 60;
// Por que no salio el correo, y lo que oye el lector de pantalla.
const MOTIVO_SIN_CORREO = {
  fallo: 'No pudimos enviarte el correo en este momento. Espera un poco y pide otro código.',
};
const AVISO_SIN_CORREO = 'No pudimos enviar el correo. Pide otro código en un momento.';
const avisoDelCodigo = (enviado) => enviado;

// ---- Recuperar la contrasena ------------------------------------------
// El mismo codigo de 6 cifras, de la plantilla "Reset password". La pagina
// le da 10 minutos y 5 intentos, aunque Auth lo acepte mas tiempo.
const CADUCA_RECUPERAR = 10 * 60 * 1000;
const INTENTOS_RECUPERAR = 5;
const SIN_CORREO_RECUPERAR = 'No pudimos enviar el correo. Inténtalo más tarde.';
const CADUCO_RECUPERAR = 'El código caducó: dura 10 minutos. Vuelve a pedirlo.';

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
  soloNueve, SIN_CUENTA,
  REGLAS, fallaCorreo, fallaNombre, fallaTelefono, fallosCuenta, fallosEditar, avisoFaltan,
  telefonoBonito, iniciales,
  leerCuenta, guardarCuenta,
  REENVIO, MOTIVO_SIN_CORREO, AVISO_SIN_CORREO, avisoDelCodigo,
  CADUCA_RECUPERAR, INTENTOS_RECUPERAR, SIN_CORREO_RECUPERAR, CADUCO_RECUPERAR,
  todosLosPedidos, deLaCuenta,
};
