// ---- La sesion: el reductor --------------------------------------------
// Lo que hacia el objeto 'sesion' de js/comun/state.js y las funciones de
// js/cuenta/account.js que lo cambiaban, como una funcion pura, igual que el
// pedido (estado/pedido.js). Ni localStorage, ni huellas, ni correo, ni azar:
// la huella y el codigo llegan ya hechos en la accion, y guardar es un efecto
// de SesionProvider.
//
// Estado:
//   cuenta     { nombre, correo, telefono, direccion, dentro, verificado,
//              metodo }, la de leerCuentaGuardada() de servicios/cuenta.js.
//   huella     { sal, hash } de la contrasena, o null.
//   hayCuenta  si en este navegador hay alguna cuenta, aunque la sesion este
//              cerrada.
//   pendiente  la cuenta que espera el codigo, o null: { datos, huella,
//              codigo, enviadoEn, envio }. No se guarda hasta verificarla,
//              como en el sitio actual: un correo sin probar no es cuenta.
//              envio es 'enviando', 'enviado', 'fallo' o 'sin-buzon'.
//   recuperacion  el codigo para cambiar la contrasena, o null: { correo,
//              nombre, codigo, enviadoEn, intentos, listo, enCurso }. listo
//              es que el codigo ya se acerto y falta la contrasena nueva;
//              enCurso, que se esta en sus casillas (con "Cambiar el correo"
//              se vuelve al correo sin perder el codigo ni sus intentos). Solo
//              en memoria, como la cuenta por verificar, y se borra al entrar,
//              verificar, salir o crear otra: un codigo acertado y sin usar no
//              puede quedarse abierto para el siguiente que use el navegador.
//   envioClave cuando salio el ultimo codigo de recuperar (0 si ninguno): la
//              espera de 45 s vale aunque la recuperacion se borre.
//   cambios    cuantas veces cambio algo que se guarda; lo mira el efecto de
//              guardar, asi que lo leido al arrancar no se reescribe.
//
// Acciones:
//   { tipo: 'releer', leido }                     otra pestana la cambio
//   { tipo: 'porVerificar', datos, huella, codigo, enviadoEn, envio }
//   { tipo: 'codigo', codigo, enviadoEn, envio }  se pidio otro codigo
//   { tipo: 'envio', codigo, envio }              como fue el correo
//   { tipo: 'verificar' }                         codigo bueno: cuenta y dentro
//   { tipo: 'entrar' }                            contrasena buena
//   { tipo: 'editar', nombre, telefono, direccion, metodo }
//   { tipo: 'salir' }                             cierra la sesion, no borra
//   { tipo: 'recuperar', correo, nombre, codigo, enviadoEn }  salio un codigo
//   { tipo: 'reabrirRecuperar' }                  otra vez a sus casillas
//   { tipo: 'fallaRecuperar' }                    un intento mal
//   { tipo: 'aciertaRecuperar', ahora }           codigo bueno
//   { tipo: 'nuevaClave', huella, ahora }         contrasena nueva: dentro
//   { tipo: 'olvidarRecuperar' }                  "Cambiar el correo"
//   { tipo: 'caducarRecuperar' }                  pasaron los 10 minutos

// Los 10 minutos del codigo de recuperar, tambien aqui: aunque una vista no
// los mirara, el reductor no acepta un acierto ni una contrasena fuera de
// plazo. La hora llega en la accion: el reductor no la lee.
import { CADUCA_RECUPERAR } from '../servicios/cuenta.js';

const vigente = (r, ahora) => Boolean(r) && ahora - r.enviadoEn <= CADUCA_RECUPERAR;

const cambio = (estado, parte) => ({ ...estado, ...parte, cambios: estado.cambios + 1 });

function reductor(estado, accion) {
  switch (accion.tipo) {
    case 'releer':
      return { ...estado, ...accion.leido };
    case 'porVerificar':
      return {
        ...estado,
        recuperacion: null,
        pendiente: {
          datos: accion.datos, huella: accion.huella,
          codigo: accion.codigo, enviadoEn: accion.enviadoEn, envio: accion.envio,
        },
      };
    case 'codigo':
      if (!estado.pendiente) return estado;
      return {
        ...estado,
        pendiente: { ...estado.pendiente, codigo: accion.codigo, enviadoEn: accion.enviadoEn, envio: accion.envio },
      };
    case 'envio':
      // Mientras el correo viajaba pudo pedirse otro codigo, y entonces esta
      // respuesta habla de uno que ya no vale.
      if (!estado.pendiente || estado.pendiente.codigo !== accion.codigo) return estado;
      return { ...estado, pendiente: { ...estado.pendiente, envio: accion.envio } };
    case 'verificar':
      if (!estado.pendiente) return estado;
      return cambio(estado, {
        cuenta: { metodo: 'efectivo', ...estado.pendiente.datos, verificado: true, dentro: true },
        huella: estado.pendiente.huella,
        hayCuenta: true,
        pendiente: null,
        recuperacion: null,
      });
    case 'entrar':
      return cambio(estado, { cuenta: { ...estado.cuenta, dentro: true }, pendiente: null, recuperacion: null });
    case 'editar':
      return cambio(estado, {
        cuenta: {
          ...estado.cuenta,
          nombre: accion.nombre,
          telefono: accion.telefono,
          direccion: accion.direccion,
          // Solo los dos que hay en el cobro, como leerCuentaGuardada().
          metodo: accion.metodo === 'tarjeta' ? 'tarjeta' : 'efectivo',
        },
      });
    case 'salir':
      // Lo que se cierra es la sesion, no la cuenta: los datos se quedan para
      // poder volver a entrar con el correo.
      return cambio(estado, { cuenta: { ...estado.cuenta, dentro: false }, pendiente: null, recuperacion: null });
    case 'recuperar':
      // Un codigo nuevo empieza de cero: sus 10 minutos y sus 5 intentos.
      return {
        ...estado,
        envioClave: accion.enviadoEn,
        recuperacion: {
          correo: accion.correo, nombre: accion.nombre, codigo: accion.codigo,
          enviadoEn: accion.enviadoEn, intentos: 0, listo: false, enCurso: true,
        },
      };
    case 'reabrirRecuperar':
      // El mismo codigo, con los intentos que le queden.
      if (!estado.recuperacion) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, enCurso: true } };
    case 'fallaRecuperar':
      if (!estado.recuperacion) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, intentos: estado.recuperacion.intentos + 1 } };
    case 'aciertaRecuperar':
      if (!vigente(estado.recuperacion, accion.ahora)) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, listo: true } };
    case 'nuevaClave':
      // La huella nueva sustituye a la vieja, que deja de valer; los datos y
      // los pedidos son los de siempre. El codigo llego a ese correo, asi que
      // queda probado que es suyo, igual que al verificarlo.
      if (!estado.recuperacion?.listo || !vigente(estado.recuperacion, accion.ahora)) return estado;
      return cambio(estado, {
        cuenta: { ...estado.cuenta, verificado: true, dentro: true },
        huella: accion.huella,
        hayCuenta: true,
        pendiente: null,
        recuperacion: null,
      });
    case 'olvidarRecuperar':
      // Se vuelve al correo, pero el codigo, su hora y sus intentos se quedan:
      // si no, cambiar el correo serviria para saltarse la espera de 45 s y
      // los 5 intentos. Acertado o no, hay que volver a escribirlo.
      if (!estado.recuperacion) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, enCurso: false, listo: false } };
    case 'caducarRecuperar':
      return { ...estado, recuperacion: null };
    default:
      return estado;
  }
}

export { reductor, vigente };
