// El historial de IndexedDB (eltradicional/pedidos), el mas nuevo primero,
// solo con los pedidos de la cuenta abierta (y los de antes de que el pedido
// guardara el correo: no se sabe de quien son). Lo usan Mis pedidos, Mis
// datos y el "(N)" de la ficha, asi que los tres cuentan lo mismo.
// Se lee cada vez que se monta quien lo pide y no una sola vez al cargar:
// entre una visita y otra puede haberse pagado un pedido. null mientras se
// lee, para no ensenar "todavia no has hecho ningun pedido" un instante.
import { useEffect, useState } from 'react';
import { useSesion } from '../estado/SesionProvider.jsx';
import { todosLosPedidos, deLaCuenta } from '../servicios/cuenta.js';

function usePedidosGuardados() {
  const { correo } = useSesion();
  const [pedidos, setPedidos] = useState(null);
  useEffect(() => {
    let vigente = true;
    todosLosPedidos().then((lista) => { if (vigente) setPedidos(lista); });
    return () => { vigente = false; };
  }, []);
  // El filtro se calcula al pintar: si cambia la cuenta, cambia la lista.
  return pedidos ? deLaCuenta(pedidos, correo) : null;
}

export { usePedidosGuardados };
