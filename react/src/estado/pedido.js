// ---- El pedido: el reductor --------------------------------------------
// Lo que hacia el Map 'pedido' de js/comun/state.js y las funciones de
// js/pedido/cart.js que lo cambiaban, como una funcion pura: recibe el estado
// y una accion y devuelve el estado nuevo. Ni localStorage ni avisos ni foco:
// guardar es un efecto de PedidoProvider, y lo demas lo hace quien despacha.
//
// Estado:
//   lineas   pares [id, { nombre, precio, cantidad }] en el orden en que
//            entraron, que es el orden del Map del sitio actual y el que se
//            guarda en localStorage.
//   borrado  lo ultimo que se quito, por si se deshace: { lineas, vaciado }.
//            Es una copia; cada borrado nuevo es otro objeto, y eso es lo que
//            reinicia los 12 s de la barra de deshacer.
//
// Acciones:
//   { tipo: 'agregar', id, nombre, precio }           uno mas (hasta el tope)
//   { tipo: 'cambiar', id, nombre, precio, cantidad }  cantidad exacta; 0 quita
//   { tipo: 'quitar', id }                             el producto entero
//   { tipo: 'vaciar' }                                 todo
//   { tipo: 'reponer' }                                deshace el ultimo borrado
//   { tipo: 'olvidar' }                                ya no se puede deshacer
import { MAX_UNIDADES } from '@raiz/js/comun/state.js';

const lineaDe = (lineas, id) => lineas.find(([otro]) => otro === id)?.[1];

// Una linea que ya esta se cambia en su sitio; una nueva va al final.
const poner = (lineas, id, linea) => (lineaDe(lineas, id)
  ? lineas.map((par) => (par[0] === id ? [id, linea] : par))
  : [...lineas, [id, linea]]);

const sacar = (estado, id) => {
  const linea = lineaDe(estado.lineas, id);
  if (!linea) return estado;
  return {
    lineas: estado.lineas.filter(([otro]) => otro !== id),
    borrado: { lineas: [[id, { ...linea }]], vaciado: false },
  };
};

// Cien panes es un pedido de fiesta; mas que eso se habla por telefono.
const recortar = (n) => Math.min(Math.floor(n), MAX_UNIDADES);

function reductor(estado, accion) {
  switch (accion.tipo) {
    case 'agregar': {
      const { id, nombre, precio } = accion;
      const antes = lineaDe(estado.lineas, id);
      // Lo que ya estaba conserva su nombre y su precio, como en cart.js.
      const linea = antes
        ? { ...antes, cantidad: recortar(antes.cantidad + 1) }
        : { nombre, precio, cantidad: 1 };
      return { ...estado, lineas: poner(estado.lineas, id, linea) };
    }
    case 'cambiar': {
      const { id, nombre, precio } = accion;
      const cantidad = recortar(Number(accion.cantidad) || 0);
      // Un cero es lo que dice: el producto sale de la canasta, y se puede deshacer.
      if (cantidad < 1) return sacar(estado, id);
      const antes = lineaDe(estado.lineas, id);
      const linea = antes ? { ...antes, cantidad } : { nombre, precio, cantidad };
      return { ...estado, lineas: poner(estado.lineas, id, linea) };
    }
    case 'quitar':
      return sacar(estado, accion.id);
    case 'vaciar':
      if (!estado.lineas.length) return estado;
      return {
        lineas: [],
        borrado: { lineas: estado.lineas.map(([id, l]) => [id, { ...l }]), vaciado: true },
      };
    case 'reponer': {
      if (!estado.borrado) return estado;
      // Lo repuesto pisa lo que se haya vuelto a anadir mientras tanto, como
      // pedido.set() en el sitio actual.
      const lineas = estado.borrado.lineas
        .reduce((todas, [id, l]) => poner(todas, id, { ...l }), estado.lineas);
      return { lineas, borrado: null };
    }
    case 'olvidar':
      return estado.borrado ? { ...estado, borrado: null } : estado;
    default:
      return estado;
  }
}

// ---- Lo que se calcula al pintar ---------------------------------------
const unidades = (lineas) => lineas.reduce((s, [, l]) => s + l.cantidad, 0);
const subtotal = (lineas) => lineas.reduce((s, [, l]) => s + l.precio * l.cantidad, 0);
const cantidadDe = (lineas, id) => lineaDe(lineas, id)?.cantidad || 0;
const productos = (n) => `${n} producto${n === 1 ? '' : 's'}`;

// Lo que dice la barra de deshacer, igual que anotarBorrado() de cart.js.
const textoBorrado = (borrado) => {
  if (!borrado) return '';
  if (borrado.vaciado) return `Vaciaste la canasta (${productos(unidades(borrado.lineas))}).`;
  const [, l] = borrado.lineas[0];
  return l.cantidad === 1 ? `Quitaste ${l.nombre}.` : `Quitaste ${l.nombre} (${l.cantidad} unidades).`;
};

export { reductor, lineaDe, unidades, subtotal, cantidadDe, productos, textoBorrado };
