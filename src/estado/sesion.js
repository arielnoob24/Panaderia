// ---- La sesion: el reductor --------------------------------------------
// Como el pedido (estado/pedido.js), una funcion pura. Ni Supabase, ni la
// API, ni localStorage, ni la hora: lo que cambia llega ya hecho en la
// accion, y hablar con fuera es cosa de SesionProvider.
//
// Estado:
//   cuenta     { nombre, correo, telefono, direccion, dentro, verificado,
//              metodo }. Con la sesion de Supabase abierta, dentro y
//              verificado son true (Auth no deja entrar sin el correo
//              verificado).
//   hayCuenta  si en este navegador ya entro alguna cuenta, aunque la sesion
//              este cerrada.
//   pendiente  la cuenta que espera el codigo, o null: { datos, enviadoEn,
//              envio }. envio es 'enviado' o 'fallo'. El codigo no esta: lo
//              genera, lo manda y lo comprueba Supabase Auth.
//   recuperacion  el codigo para cambiar la contrasena, o null: { correo,
//              enviadoEn, intentos, listo, enCurso }. listo es que el codigo
//              ya se acerto y falta la contrasena nueva; enCurso, que se esta
//              en sus casillas (con "Cambiar el correo" se vuelve al correo
//              sin perder la hora ni los intentos). Solo en memoria.
//   envioClave cuando salio el ultimo codigo de recuperar (0 si ninguno): la
//              espera para pedir otro vale aunque la recuperacion se borre.
//   cambios    cuantas veces cambio la cuenta; lo mira el efecto que guarda
//              la copia, asi que lo leido al arrancar no se reescribe.
//
// Acciones:
//   { tipo: 'dentro', cuenta }                    entro: datos de la API
//   { tipo: 'porVerificar', datos, enviadoEn, envio }
//   { tipo: 'codigo', enviadoEn, envio }          se pidio otro codigo
//   { tipo: 'editar', cuenta }                    datos cambiados
//   { tipo: 'salir' }                             cierra la sesion, no borra
//   { tipo: 'recuperar', correo, enviadoEn }      salio un codigo
//   { tipo: 'reabrirRecuperar' }                  otra vez a sus casillas
//   { tipo: 'fallaRecuperar' }                    un intento mal
//   { tipo: 'aciertaRecuperar', ahora }           codigo bueno
//   { tipo: 'olvidarRecuperar' }                  "Cambiar el correo"
//   { tipo: 'caducarRecuperar' }                  pasaron los 10 minutos

// Los 10 minutos del codigo de recuperar, tambien aqui: aunque una vista no
// los mirara, el reductor no acepta un acierto fuera de plazo. La hora llega
// en la accion: el reductor no la lee.
import { CADUCA_RECUPERAR } from '../servicios/cuenta.js';

const vigente = (r, ahora) => Boolean(r) && ahora - r.enviadoEn <= CADUCA_RECUPERAR;

const cambio = (estado, parte) => ({ ...estado, ...parte, cambios: estado.cambios + 1 });

function reductor(estado, accion) {
  switch (accion.tipo) {
    case 'dentro':
      return cambio(estado, {
        cuenta: { ...accion.cuenta, dentro: true, verificado: true },
        hayCuenta: true,
        pendiente: null,
        recuperacion: null,
      });
    case 'porVerificar':
      return {
        ...estado,
        recuperacion: null,
        pendiente: { datos: accion.datos, enviadoEn: accion.enviadoEn, envio: accion.envio },
      };
    case 'codigo':
      if (!estado.pendiente) return estado;
      return { ...estado, pendiente: { ...estado.pendiente, enviadoEn: accion.enviadoEn, envio: accion.envio } };
    case 'editar':
      return cambio(estado, { cuenta: { ...estado.cuenta, ...accion.cuenta } });
    case 'salir':
      // Lo que se cierra es la sesion: la copia de los datos se queda para
      // ofrecer entrar otra vez con ese correo.
      return cambio(estado, { cuenta: { ...estado.cuenta, dentro: false }, pendiente: null, recuperacion: null });
    case 'recuperar':
      // Un codigo nuevo empieza de cero: sus 10 minutos y sus 5 intentos.
      return {
        ...estado,
        envioClave: accion.enviadoEn,
        recuperacion: {
          correo: accion.correo, enviadoEn: accion.enviadoEn, intentos: 0, listo: false, enCurso: true,
        },
      };
    case 'reabrirRecuperar':
      if (!estado.recuperacion) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, enCurso: true } };
    case 'fallaRecuperar':
      if (!estado.recuperacion) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, intentos: estado.recuperacion.intentos + 1 } };
    case 'aciertaRecuperar':
      if (!vigente(estado.recuperacion, accion.ahora)) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, listo: true } };
    case 'olvidarRecuperar':
      // Se vuelve al correo, pero la hora y los intentos se quedan: si no,
      // cambiar el correo serviria para saltarse la espera y los 5 intentos.
      if (!estado.recuperacion) return estado;
      return { ...estado, recuperacion: { ...estado.recuperacion, enCurso: false, listo: false } };
    case 'caducarRecuperar':
      return { ...estado, recuperacion: null };
    default:
      return estado;
  }
}

export { reductor, vigente };
