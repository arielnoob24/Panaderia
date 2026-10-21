// ---- El pedido: el reductor --------------------------------------------
// Lo que hacian el Map 'pedido', 'entrega' y 'factura' de js/comun/state.js y
// las funciones de js/pedido/ que los cambiaban, como una funcion pura: recibe
// el estado y una accion y devuelve el estado nuevo. Ni localStorage ni avisos
// ni foco: guardar es un efecto de PedidoProvider, y lo demas lo hace quien
// despacha. Van juntos porque se guardan juntos, en un solo registro.
//
// Estado:
//   lineas   pares [id, { nombre, precio, cantidad }] en el orden en que
//            entraron, que es el orden del Map del sitio actual y el que se
//            guarda en localStorage.
//   borrado  lo ultimo que se quito, por si se deshace: { lineas, vaciado }.
//            Es una copia; cada borrado nuevo es otro objeto, y eso es lo que
//            reinicia los 12 s de la barra de deshacer.
//   entrega  { modo, direccion, piso, referencia, notas }
//   factura  { aOtro, nombre, ident, correo, direccion }
//   cambios  cuantas veces ha cambiado algo que se guarda. Lo mira el efecto
//            de guardar: lo que se lee al arrancar no es un cambio, y vaciar
//            al aprobar un pedido tampoco (lo guardado se borra entero).
//
// Acciones:
//   { tipo: 'agregar', id, nombre, precio }           uno mas (hasta el tope)
//   { tipo: 'cambiar', id, nombre, precio, cantidad }  cantidad exacta; 0 quita
//   { tipo: 'quitar', id }                             el producto entero
//   { tipo: 'vaciar' }                                 todo
//   { tipo: 'reponer' }                                deshace el ultimo borrado
//   { tipo: 'olvidar' }                                ya no se puede deshacer
//   { tipo: 'entrega', campo, valor }                  un dato de la entrega
//   { tipo: 'factura', campo, valor }                  un dato de la factura
//   { tipo: 'cumplido' }                               pedido aprobado: canasta
//                                                      vacia y factura limpia
//   { tipo: 'sumar', lineas: [{ id, nombre, precio, cantidad }] }
//                                                      pedir otra vez: suma a
//                                                      lo que haya, con el tope
import { MAX_UNIDADES } from '@raiz/js/comun/state.js';

const FACTURA_VACIA = { aOtro: false, nombre: '', ident: '', correo: '', direccion: '' };

const lineaDe = (lineas, id) => lineas.find(([otro]) => otro === id)?.[1];

// Una linea que ya esta se cambia en su sitio; una nueva va al final.
const poner = (lineas, id, linea) => (lineaDe(lineas, id)
  ? lineas.map((par) => (par[0] === id ? [id, linea] : par))
  : [...lineas, [id, linea]]);

// Todo cambio que se guarda pasa por aqui: asi no hay uno que se olvide de
// contar.
const cambio = (estado, nuevo) => ({ ...estado, ...nuevo, cambios: estado.cambios + 1 });

const sacar = (estado, id) => {
  const linea = lineaDe(estado.lineas, id);
  if (!linea) return estado;
  return cambio(estado, {
    lineas: estado.lineas.filter(([otro]) => otro !== id),
    borrado: { lineas: [[id, { ...linea }]], vaciado: false },
  });
};

// Cien panes es un pedido de fiesta; mas que eso se habla por telefono.
const recortar = (n) => Math.min(Math.floor(n), MAX_UNIDADES);

function reductor(estado, accion) {
  switch (accion.tipo) {
    case 'agregar': {
      const { id, nombre, precio } = accion;
      const antes = lineaDe(estado.lineas, id);
      // En el tope no cambia nada, y lo que no cambia no se vuelve a guardar.
      if (antes && antes.cantidad >= MAX_UNIDADES) return estado;
      // Lo que ya estaba conserva su nombre y su precio, como en cart.js.
      const linea = antes
        ? { ...antes, cantidad: recortar(antes.cantidad + 1) }
        : { nombre, precio, cantidad: 1 };
      return cambio(estado, { lineas: poner(estado.lineas, id, linea) });
    }
    case 'cambiar': {
      const { id, nombre, precio } = accion;
      const cantidad = recortar(Number(accion.cantidad) || 0);
      // Un cero es lo que dice: el producto sale de la canasta, y se puede deshacer.
      if (cantidad < 1) return sacar(estado, id);
      const antes = lineaDe(estado.lineas, id);
      const linea = antes ? { ...antes, cantidad } : { nombre, precio, cantidad };
      return cambio(estado, { lineas: poner(estado.lineas, id, linea) });
    }
    case 'quitar':
      return sacar(estado, accion.id);
    case 'vaciar':
      if (!estado.lineas.length) return estado;
      return cambio(estado, {
        lineas: [],
        borrado: { lineas: estado.lineas.map(([id, l]) => [id, { ...l }]), vaciado: true },
      });
    case 'reponer': {
      if (!estado.borrado) return estado;
      // Lo repuesto pisa lo que se haya vuelto a anadir mientras tanto, como
      // pedido.set() en el sitio actual.
      const lineas = estado.borrado.lineas
        .reduce((todas, [id, l]) => poner(todas, id, { ...l }), estado.lineas);
      return cambio(estado, { lineas, borrado: null });
    }
    case 'olvidar':
      return estado.borrado ? { ...estado, borrado: null } : estado;
    case 'entrega':
      if (estado.entrega[accion.campo] === accion.valor) return estado;
      return cambio(estado, { entrega: { ...estado.entrega, [accion.campo]: accion.valor } });
    case 'factura':
      if (estado.factura[accion.campo] === accion.valor) return estado;
      return cambio(estado, { factura: { ...estado.factura, [accion.campo]: accion.valor } });
    case 'cumplido':
      // La entrega se queda en memoria, como en el sitio actual: si se pide
      // otra vez en esta visita, es a la misma puerta. La factura vuelve a ser
      // a nombre de quien pide.
      return { ...estado, lineas: [], borrado: null, factura: { ...FACTURA_VACIA } };
    case 'sumar': {
      // Lo de un pedido anterior (pedido/pedirOtraVez.js): cada linea se suma
      // a la que ya haya, hasta el tope, con el nombre y el precio de hoy.
      let lineas = estado.lineas;
      for (const l of accion.lineas || []) {
        const antes = lineaDe(lineas, l.id);
        const cantidad = recortar((antes ? antes.cantidad : 0) + (Number(l.cantidad) || 0));
        if (cantidad < 1 || (antes && antes.cantidad === cantidad)) continue;
        lineas = poner(lineas, l.id, { ...antes, nombre: l.nombre, precio: l.precio, cantidad });
      }
      return lineas === estado.lineas ? estado : cambio(estado, { lineas });
    }
    default:
      return estado;
  }
}

// ---- Lo que se calcula al pintar ---------------------------------------
const unidades = (lineas) => lineas.reduce((s, [, l]) => s + l.cantidad, 0);
const subtotal = (lineas) => lineas.reduce((s, [, l]) => s + l.precio * l.cantidad, 0);
const cantidadDe = (lineas, id) => lineaDe(lineas, id)?.cantidad || 0;
const productos = (n) => `${n} producto${n === 1 ? '' : 's'}`;
const enTope = (cantidad) => cantidad >= MAX_UNIDADES;
// Lo que se dice al pulsar el mas de algo que ya esta en el tope, desde la
// ficha o desde la linea, igual que avisoTope() de cart.js.
const avisoTope = (nombre) => `El máximo es ${MAX_UNIDADES} por producto. Ya hay ${MAX_UNIDADES} de ${nombre} en la canasta.`;
const consejoTope = `El máximo es ${MAX_UNIDADES} por producto`;

// Lo que dice la barra de deshacer, igual que anotarBorrado() de cart.js.
const textoBorrado = (borrado) => {
  if (!borrado) return '';
  if (borrado.vaciado) return `Vaciaste la canasta (${productos(unidades(borrado.lineas))}).`;
  const [, l] = borrado.lineas[0];
  return l.cantidad === 1 ? `Quitaste ${l.nombre}.` : `Quitaste ${l.nombre} (${l.cantidad} unidades).`;
};

export {
  reductor, lineaDe, unidades, subtotal, cantidadDe, productos, textoBorrado,
  enTope, avisoTope, consejoTope,
};
