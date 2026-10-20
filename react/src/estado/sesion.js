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
//   { tipo: 'editar', nombre, telefono, direccion }
//   { tipo: 'salir' }                             cierra la sesion, no borra
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
        cuenta: { ...estado.cuenta, nombre: accion.nombre, telefono: accion.telefono, direccion: accion.direccion },
      });
    case 'salir':
      // Lo que se cierra es la sesion, no la cuenta: los datos se quedan para
      // poder volver a entrar con el correo.
      return cambio(estado, { cuenta: { ...estado.cuenta, dentro: false }, pendiente: null });
    default:
      return estado;
  }
}

export { reductor };
