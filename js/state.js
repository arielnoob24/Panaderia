// ---- Lo que comparten los modulos -------------------------------------
// El pedido, la entrega, la sesion y las tarifas los leen y los escriben
// varios modulos a la vez: la canasta, el pago y la cuenta. Viven
// aqui, en un solo sitio, y no copiados en cada uno.
//
// Los objetos se exportan tal cual y se modifican por dentro ('pedido.set',
// 'entrega.modo = ...'). Eso es a proposito: un modulo no puede reasignar lo
// que otro importo, pero si puede cambiarle el contenido, y asi los cuatro
// miran siempre el mismo pedido.

const CLAVE = 'eltradicional-pedido';
const pedido = new Map();
// La direccion es la calle; el resto es lo que hace falta para encontrar la
// puerta. Van aparte y no todo en un campo porque quien reparte los lee en
// momentos distintos: la calle para llegar al portal, el piso al estar ahi, y
// las notas antes de bajarse de la moto.
const entrega = { modo: 'retiro', direccion: '', piso: '', referencia: '', notas: '' };
// La cuenta es una maqueta sin servidor; la rellena account.js.
// metodo es la forma de pago preferida, la que el cobro deja marcada.
const sesion = { nombre: '', correo: '', telefono: '', direccion: '',
  dentro: false, verificado: false, metodo: 'efectivo' };
// El numero con el prefijo delante, tal como lo veria quien lo marca. Ya no
// es un canal de aviso -eso es el correo-, pero sigue siendo el telefono al
// que llamarian si hay un problema con la entrega, asi que va escrito en el
// comprobante para que se pueda comprobar que esta bien.
const telefonoLargo = (n) => `+593 ${String(n || '').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3')}`;
// Los datos de la tarjeta viven aqui y solo aqui: no se guardan ni se envian
// a ningun lado, y se borran al salir del paso de pago.
const tarjeta = { numero: '', vence: '', cvv: '', titular: '' };
const cobro = { metodo: 'efectivo', numero: '', detalle: '' };
// A nombre de quien va la factura. Por defecto, de quien pide: lo normal es que
// sean la misma persona, y preguntarlo siempre seria un formulario de mas. Se
// pide aparte solo cuando alguien dice que la factura va a otro nombre, que es
// lo que pasa cuando se compra para una oficina o se paga por un familiar.
const factura = { aOtro: false, nombre: '', ident: '', correo: '', direccion: '' };

// Lo que cuesta llevarlo. Vive aqui arriba, con los demas datos, porque el
// panel ya lo escribe al nacer para que cada opcion diga lo que vale. Es una
// tarifa fija: sin mapa no hay punto marcado del que medir la distancia.
// Cien panes es un pedido de fiesta; mas que eso se habla por telefono, no se
// teclea. El tope vive aqui, con los demas datos, porque lo usan el boton, el
// campo y lo que se recupera de lo guardado, y eso ultimo corre antes.
const MAX_UNIDADES = 100;
const ENVIO = 1.50;
const dinero = (n) => '$' + n.toFixed(2);
// La direccion en una linea, para el comprobante, el correo y el resumen. Se
// arma aqui y no en cada sitio: si estuviera escrita tres veces, anadir un
// campo mas obligaria a acordarse de los tres.
const direccionEntera = () => [entrega.direccion, entrega.piso, entrega.referencia]
  .filter(Boolean).join(' · ');
const idDe = (nombre) => nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');


// Llevarlo cuesta; pasar a retirarlo, no. De ahi que haya dos sumas: la del
// pan y la del pedido. Antes solo habia una y el envio no existia.
const subtotal = () => [...pedido.values()].reduce((s, l) => s + l.precio * l.cantidad, 0);
const envio = () => (entrega.modo === 'domicilio' ? ENVIO : 0);
const total = () => subtotal() + envio();
const unidades = () => [...pedido.values()].reduce((s, l) => s + l.cantidad, 0);

// El puente entre modulos que se llaman en circulo. La canasta necesita abrir
// la cuenta y la cuenta necesita repintar la canasta. Importarse unos a otros
// en redondo seria un lio, asi que cada modulo deja aqui lo que los demas pueden llamar y
// nadie lo mira hasta que alguien pulsa algo, cuando ya estan todos cargados.
// Es lo mismo que hacia el archivo de antes, cuando todo vivia en un solo
// ambito y una funcion de arriba llamaba a otra declarada mas abajo.
const puente = {};

export {
  CLAVE, pedido, entrega, sesion, tarjeta, cobro, factura, puente,
  MAX_UNIDADES, ENVIO,
  telefonoLargo, dinero, direccionEntera, idDe,
  subtotal, envio, total, unidades,
};
