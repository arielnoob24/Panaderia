// ---- Las tarifas, los topes y los formatos de siempre ------------------
// Lo que de js/comun/state.js del sitio presentado sigue haciendo falta,
// movido tal cual (fase 7): la clave del pedido guardado, el tope por
// producto, el envio y como se escriben el dinero, el telefono y el id de un
// producto. El resto de aquel archivo era estado que varios modulos tocaban a
// la vez (el Map del pedido, la entrega, la sesion, el puente); en React eso
// vive en los reductores de src/estado/ y no tiene sitio aqui.

const CLAVE = 'eltradicional-pedido';
// El numero con el prefijo delante, tal como lo veria quien lo marca. Ya no
// es un canal de aviso -eso es el correo-, pero sigue siendo el telefono al
// que llamarian si hay un problema con la entrega, asi que va escrito en el
// comprobante para que se pueda comprobar que esta bien.
const telefonoLargo = (n) => `+593 ${String(n || '').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3')}`;

// Lo que cuesta llevarlo. Es una tarifa fija: sin mapa no hay punto marcado
// del que medir la distancia.
// Cien panes es un pedido de fiesta; mas que eso se habla por telefono, no se
// teclea. El tope vive aqui porque lo usan el boton, el campo y lo que se
// recupera de lo guardado.
const MAX_UNIDADES = 100;
const ENVIO = 1.50;
const dinero = (n) => '$' + n.toFixed(2);
const idDe = (nombre) => nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');

export { CLAVE, MAX_UNIDADES, ENVIO, telefonoLargo, dinero, idDe };
