// ---- Donde se guarda cada cosa ----------------------------------------
// Detras del sitio no hay servidor, asi que todo lo que sobrevive a cerrar la
// pagina se queda en este navegador. No todo dura lo mismo ni ocupa igual, y
// de ahi que haya cuatro sitios y no uno solo:
//
//   localStorage    el pedido a medias y la cuenta. Tienen que seguir ahi
//                   manana, asi que van al unico sitio que no se vacia.
//   sessionStorage  por donde ibas mirando el catalogo. Vale para esta
//                   pestana y nada mas: recargar no te mueve de sitio, pero
//                   volver otro dia es empezar limpio.
//   IndexedDB       los pedidos ya pagados. Son varios, van creciendo y cada
//                   uno trae su recibo entero; eso no es un dato suelto.
//   cookie          la marca de cuando se guardo por ultima vez.
//
// Lo de aqui se traga sus propios errores y lo dice en lo que devuelve. En una
// ventana privada escribir lanza, y que no se pueda recordar el orden del
// catalogo no puede tumbar la pagina: se sigue sin recordarlo.

// ---- La marca de la ultima vez (cookie) -------------------------------
// Va en una cookie por lo que es: un dato corto, con fecha de caducidad
// propia, que acompana a todo lo demas sin ser de nadie en particular. Un mes
// es lo que se tarda en volver a una panaderia; pasado eso, una marca vieja no
// dice nada que sirva.
const COOKIE = 'eltradicional-guardado';
const UN_MES = 60 * 60 * 24 * 30;

// Se llama cada vez que algo se guarda, sea el pedido, la entrega o un pago.
// Devuelve la fecha para que quien la pinte no tenga que volver a leerla.
const marcarActualizacion = (cuando = new Date()) => {
  try {
    document.cookie = `${COOKIE}=${encodeURIComponent(cuando.toISOString())}`
      + `; path=/; max-age=${UN_MES}; SameSite=Lax`;
  } catch (e) { /* sin cookies no hay marca; el pedido se guarda igual */ }
  return cuando;
};

const ultimaActualizacion = () => {
  try {
    const trozo = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`));
    if (!trozo) return null;
    const fecha = new Date(decodeURIComponent(trozo.slice(COOKIE.length + 1)));
    // Una cookie la puede tocar cualquiera a mano: si lo que hay dentro no es
    // una fecha, es como no tener ninguna.
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  } catch (e) { return null; }
};

const olvidarMarca = () => {
  try { document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`; }
  catch (e) { /* si no se pudo escribir, no hay nada que borrar */ }
};

// "hoy a las 14:05" dice mas que una fecha entera: lo que importa de lo
// guardado es si es de ahora o de la semana pasada.
const marcaBonita = (fecha) => {
  if (!fecha) return '';
  const hora = fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  const hoy = new Date();
  const mismoDia = (a, b) => a.toDateString() === b.toDateString();
  if (mismoDia(fecha, hoy)) return `hoy a las ${hora}`;
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  if (mismoDia(fecha, ayer)) return `ayer a las ${hora}`;
  const dia = fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'long' });
  return `el ${dia} a las ${hora}`;
};

// ---- Por donde ibas mirando (sessionStorage) --------------------------
// La categoria abierta, el orden y el filtro. Esto no es del pedido: es de
// este rato mirando, y por eso dura lo que dura la pestana. Si durara para
// siempre, quien dejo puesto "solo los disponibles" volveria una semana
// despues a un catalogo a medias sin acordarse de por que.
const CLAVE_VISTA = 'eltradicional-vista';

const recordarVista = (vista) => {
  try { window.sessionStorage.setItem(CLAVE_VISTA, JSON.stringify(vista)); }
  catch (e) { /* en ventana privada no se recuerda; la vista sale como de nuevas */ }
};

const vistaRecordada = () => {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_VISTA);
    if (!crudo) return null;
    const v = JSON.parse(crudo);
    return v && typeof v === 'object' ? v : null;
  } catch (e) { return null; }
};

// ---- Los pedidos ya hechos (IndexedDB) -------------------------------
// Cada pago aprobado deja aqui su recibo. Son registros que se acumulan y que
// se buscan por numero de pedido, que es justo lo que IndexedDB sabe hacer y
// lo que localStorage no: alli habria que guardar la lista entera en una sola
// clave y reescribirla completa cada vez que se anade uno.
const BASE = 'eltradicional';
const ALMACEN = 'pedidos';
const VERSION = 1;
// Cuantos se ensenan en la cuenta. Guardados estan todos; a la vista, los
// ultimos: una lista sin fin dentro de un panel no la lee nadie.
const A_LA_VISTA = 5;

// La base se abre la primera vez que hace falta y no al arrancar: quien entra
// solo a mirar el catalogo no tiene por que pagar la apertura de una base que
// no va a usar. La promesa se guarda para no abrirla dos veces.
let abriendo = null;
const abrir = () => {
  if (abriendo) return abriendo;
  abriendo = new Promise((listo, falla) => {
    if (!window.indexedDB) { falla(new Error('este navegador no trae IndexedDB')); return; }
    const pet = window.indexedDB.open(BASE, VERSION);
    pet.onupgradeneeded = () => {
      const db = pet.result;
      if (db.objectStoreNames.contains(ALMACEN)) return;
      // El numero de pedido es la clave: es unico y es lo que la gente tiene
      // apuntado cuando viene a preguntar por uno.
      db.createObjectStore(ALMACEN, { keyPath: 'numero' }).createIndex('fecha', 'fecha');
    };
    pet.onsuccess = () => listo(pet.result);
    pet.onerror = () => falla(pet.error);
    // En ventana privada hay navegadores donde la peticion no contesta: ni
    // exito ni error. Sin esto, el panel de la cuenta se quedaria esperando
    // una lista que no va a llegar nunca.
    pet.onblocked = () => falla(new Error('la base esta bloqueada'));
  // Si no se pudo abrir, se olvida la promesa fallada: asi el siguiente que
  // lo intente vuelve a probar en vez de heredar el error de antes.
  }).catch((e) => { abriendo = null; throw e; });
  return abriendo;
};

const guardarPedido = async (recibo) => {
  try {
    const db = await abrir();
    await new Promise((listo, falla) => {
      const t = db.transaction(ALMACEN, 'readwrite');
      t.objectStore(ALMACEN).put(recibo);
      t.oncomplete = listo;
      t.onerror = () => falla(t.error);
      t.onabort = () => falla(t.error);
    });
    marcarActualizacion();
    return true;
  } catch (e) {
    // Que no se pueda guardar el historial no cambia que el pedido se hizo: el
    // comprobante ya esta en pantalla y el correo ya salio. Se apunta en la
    // consola y se sigue.
    console.warn('No se pudo guardar el pedido en el historial:', e);
    return false;
  }
};

// Los mas nuevos primero, que es como se buscan. Si la base no se puede abrir
// se devuelve una lista vacia, y quien la pinte no vera historial: lo mismo
// que ve quien todavia no ha pedido nada.
const pedidosGuardados = async (tope = A_LA_VISTA) => {
  try {
    const db = await abrir();
    const todos = await new Promise((listo, falla) => {
      const t = db.transaction(ALMACEN, 'readonly');
      const pet = t.objectStore(ALMACEN).getAll();
      pet.onsuccess = () => listo(pet.result || []);
      pet.onerror = () => falla(pet.error);
    });
    return todos
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
      .slice(0, tope);
  } catch (e) { return []; }
};

export {
  marcarActualizacion, ultimaActualizacion, olvidarMarca, marcaBonita,
  recordarVista, vistaRecordada,
  guardarPedido, pedidosGuardados,
};
