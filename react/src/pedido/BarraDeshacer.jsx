// La barra de deshacer. Vive fuera del panel porque se quita desde los dos
// sitios, la ficha y la canasta; va por encima del panel para verse en ambos
// casos, y el cerco del foco del panel la cuenta como anexo para que el
// tabulador la alcance. Se va sola a los 12 s (seccion 5 del plan).
//
// El reloj se para mientras la barra tiene el foco o el puntero encima: quien
// la esta leyendo o a punto de pulsar no tiene que ver como se le escapa
// (WCAG 2.2.1). Al soltarla sigue con lo que le quedaba, como en cart.js.
//
// Con la hoja de "Entra a tu cuenta para pagar" arriba, la barra queda inert:
// la hoja es modal y el tabulador da la vuelta solo dentro de ella.
import { useEffect, useRef, useState } from 'react';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { textoBorrado } from '../estado/pedido.js';
import { useCanasta } from './CanastaProvider.jsx';

const ESPERA_DESHACER = 12000;

function BarraDeshacer() {
  const { borrado } = usePedido();
  const { barraRef, deshacerRef, deshacer, olvidar, pide } = useCanasta();
  const [foco, setFoco] = useState(false);
  const [puntero, setPuntero] = useState(false);
  // Escondida ya no tiene ni foco ni puntero encima, aunque el navegador no
  // llegue a avisar: el proximo borrado empieza sin pausa.
  if (!borrado && (foco || puntero)) {
    setFoco(false);
    setPuntero(false);
  }
  const pausada = foco || puntero;

  // Lo que le queda al reloj, y de que borrado: cada borrado es un objeto
  // nuevo, asi que quitar otra cosa vuelve a dar los 12 s enteros.
  const queda = useRef(ESPERA_DESHACER);
  const deQuien = useRef(null);
  useEffect(() => {
    if (!borrado) return undefined;
    if (deQuien.current !== borrado) {
      deQuien.current = borrado;
      queda.current = ESPERA_DESHACER;
    }
    if (pausada) return undefined;
    const desde = Date.now();
    const reloj = setTimeout(() => olvidar(borrado), Math.max(queda.current, 0));
    return () => {
      clearTimeout(reloj);
      queda.current -= Date.now() - desde;
    };
  }, [borrado, pausada, olvidar]);

  // onFocus y onBlur de React burbujean (son focusin y focusout): pasar de un
  // elemento a otro dentro de la barra no cuenta como irse.
  const alPerderFoco = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setFoco(false);
  };

  return (
    <div
      ref={barraRef}
      className="deshacer-barra"
      hidden={!borrado}
      inert={Boolean(pide)}
      onFocus={() => setFoco(true)}
      onBlur={alPerderFoco}
      onPointerEnter={() => setPuntero(true)}
      onPointerLeave={() => setPuntero(false)}
    >
      <p className="deshacer-texto">{textoBorrado(borrado)}</p>
      <button ref={deshacerRef} className="deshacer-boton" type="button" onClick={() => deshacer(borrado)}>Deshacer</button>
    </div>
  );
}

export default BarraDeshacer;
