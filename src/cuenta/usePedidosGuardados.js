// Los pedidos de la cuenta abierta, el mas nuevo primero: los de la base
// (GET /pedidos) y los que solo estan en este navegador (servicios/pedidos.js).
// Lo usan Mis pedidos, Mis datos y el "(N)" de la ficha, asi que los tres
// cuentan lo mismo. Se lee cada vez que se monta quien lo pide y no una sola
// vez al cargar: entre una visita y otra puede haberse pagado un pedido, en
// este navegador o en otro. null mientras se lee, para no ensenar "todavia no
// has hecho ningun pedido" un instante.
import { useEffect, useState } from 'react';
import { useSesion } from '../estado/SesionProvider.jsx';
import { pedidosDeLaCuenta } from '../servicios/pedidos.js';

function usePedidosGuardados() {
  const { correo } = useSesion();
  const [pedidos, setPedidos] = useState(null);
  useEffect(() => {
    let vigente = true;
    pedidosDeLaCuenta(correo).then((lista) => { if (vigente) setPedidos(lista); });
    return () => { vigente = false; };
  }, [correo]);
  return pedidos;
}

export { usePedidosGuardados };
