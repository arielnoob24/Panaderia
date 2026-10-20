// ---- El pedido, para toda la aplicacion --------------------------------
// Context + useReducer (seccion 15 del plan). El reductor es puro
// (estado/pedido.js); aqui se le da el pedido guardado al arrancar y se guarda
// cada vez que cambian las lineas, que es lo unico que sincroniza con fuera.
//
// Quien usa el pedido recibe las lineas, el borrado pendiente, lo calculado
// (unidades, subtotal) y 'hacer', que despacha una accion y devuelve el estado
// en que queda: los avisos dicen "N productos en la canasta" contando ya lo
// que se acaba de hacer, y el estado nuevo no llega hasta el siguiente pintado.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ultimaActualizacion } from '@raiz/js/comun/storage.js';
import { leerCanasta, guardarCanasta } from '../servicios/guardado.js';
import { reductor, unidades, subtotal } from './pedido.js';

const ContextoPedido = createContext(null);

const iniciar = () => ({ lineas: leerCanasta(), borrado: null });

function PedidoProvider({ children }) {
  const [estado, despachar] = useReducer(reductor, undefined, iniciar);
  // Lo que se leyo al arrancar no se vuelve a escribir: guardar es para los
  // cambios. Se compara por identidad, que el reductor solo cambia al tocar
  // las lineas.
  const lineasLeidas = useRef(estado.lineas);
  // Cuando se guardo por ultima vez, para el pie. Empieza con la cookie, que
  // es lo que habia antes de abrir la pagina.
  const [guardadoEn, setGuardadoEn] = useState(ultimaActualizacion);

  useEffect(() => {
    if (estado.lineas === lineasLeidas.current) return;
    setGuardadoEn(guardarCanasta(estado.lineas));
  }, [estado.lineas]);

  // El estado de verdad, a mano de 'hacer' entre un pintado y el siguiente.
  const actual = useRef(estado);
  useLayoutEffect(() => { actual.current = estado; }, [estado]);

  const hacer = useCallback((accion) => {
    const despues = reductor(actual.current, accion);
    actual.current = despues;
    despachar(accion);
    return despues;
  }, []);

  const valor = useMemo(() => ({
    lineas: estado.lineas,
    borrado: estado.borrado,
    unidades: unidades(estado.lineas),
    subtotal: subtotal(estado.lineas),
    guardadoEn,
    hacer,
  }), [estado, guardadoEn, hacer]);

  return <ContextoPedido.Provider value={valor}>{children}</ContextoPedido.Provider>;
}

const usePedido = () => useContext(ContextoPedido);

export { PedidoProvider, usePedido };
