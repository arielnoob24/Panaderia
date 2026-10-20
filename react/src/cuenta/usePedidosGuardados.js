// El historial de IndexedDB (eltradicional/pedidos), el mas nuevo primero.
// Se lee cada vez que se monta quien lo pide y no una sola vez al cargar:
// entre una visita y otra puede haberse pagado un pedido. null mientras se
// lee, para no ensenar "todavia no has hecho ningun pedido" un instante.
import { useEffect, useState } from 'react';
import { todosLosPedidos } from '../servicios/cuenta.js';

function usePedidosGuardados() {
  const [pedidos, setPedidos] = useState(null);
  useEffect(() => {
    let vigente = true;
    todosLosPedidos().then((lista) => { if (vigente) setPedidos(lista); });
    return () => { vigente = false; };
  }, []);
  return pedidos;
}

export { usePedidosGuardados };
