// ---- La sesion: el reductor --------------------------------------------
// Lo que hacia el objeto 'sesion' de js/comun/state.js y las funciones de
// js/cuenta/account.js que lo cambiaban, como una funcion pura, igual que el
// pedido (estado/pedido.js). Ni localStorage, ni huellas, ni correo, ni azar:
// la huella y el codigo llegan ya hechos en la accion, y guardar es un efecto
// de SesionProvider.
//
// Estado:
//   cuenta     { nombre, correo, telefono, direccion, dentro, verificado,
//              metodo }, la de leerCuentaGuardada() de js/cuenta/guardada.js.
//   huella     { sal, hash } de la contrasena, o null.
//   hayCuenta  si en este navegador hay alguna cuenta, aunque la sesion este
//              cerrada.
//   pendiente  la cuenta que espera el codigo, o null: { datos, huella,
//              codigo, enviadoEn, envio }. No se guarda hasta verificarla,
//              como en el sitio actual: un correo sin probar no es cuenta.
//              envio es 'enviando', 'enviado', 'fallo' o 'sin-buzon'.
//   recuperacion  el cambio de contrasena en marcha, o null: { correo,
//              nombre, codigo, enviadoEn, intentos, listo }. listo es que el
//              codigo ya se acerto y falta la contrasena nueva. Solo en
//              memoria, como la cuenta por verificar.
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
//   { tipo: 'fallaRecuperar' }                    un intento mal
//   { tipo: 'aciertaRecuperar' }                  codigo bueno
//   { tipo: 'nuevaClave', huella }                contrasena nueva: dentro
//   { tipo: 'olvidarRecuperar' }                  se deja a medias
const cambio = (estado, parte) => ({ ...estado, ...parte, cambios: estado.cambios + 1 });

function reductor(estado, accion) {
  switch (accion.tipo) {
    case 'releer':
      return { ...estado, ...accion.leido };
    case 'porVerificar':
      return {
        ...estado,
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
      });
    case 'entrar':
      return cambio(estado, { cuenta: { ...estado.cuenta, dentro: true }, pendiente: null });
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
      return cambio(estado, { cuenta: { ...estado.cuenta, dentro: false }, pendiente: null });
    case 'recuperar':
      // Un codigo nuevo empieza de cero: sus 10 minutos y sus 5 intentos.
      return {
        ...estado,
        recuperacion: {
          correo: accion.correo, nombre: accion.nombre, codigo: accion.codigo,
          enviadoEn: accion.enviadoEn, intentos: 0, listo: false,
        },
      };
    case 'fallaRecuperar':
      if (!estado.recuperacion) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, intentos: estado.recuperacion.intentos + 1 } };
    case 'aciertaRecuperar':
      if (!estado.recuperacion) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, listo: true } };
    case 'nuevaClave':
      // La huella nueva sustituye a la vieja, que deja de valer; los datos y
      // los pedidos son los de siempre. El codigo llego a ese correo, asi que
      // queda probado que es suyo, igual que al verificarlo.
      if (!estado.recuperacion?.listo) return estado;
      return cambio(estado, {
        cuenta: { ...estado.cuenta, verificado: true, dentro: true },
        huella: accion.huella,
        hayCuenta: true,
        pendiente: null,
        recuperacion: null,
      });
    case 'olvidarRecuperar':
      return { ...estado, recuperacion: null };
    default:
      return estado;
  }
}

export { reductor };
