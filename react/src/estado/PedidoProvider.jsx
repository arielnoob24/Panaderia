// ---- El pedido, para toda la aplicacion --------------------------------
// Context + useReducer (seccion 15 del plan). El reductor es puro
// (estado/pedido.js); aqui se le da el pedido guardado al arrancar y se guarda
// cada vez que cambian las lineas, la entrega o la factura, que es lo unico
// que sincroniza con fuera.
//
// Quien usa el pedido recibe las lineas, la entrega, la factura, el borrado
// pendiente, lo calculado (unidades, subtotal) y 'hacer', que despacha una
// accion y devuelve el estado en que queda: los avisos dicen "N productos en
// la canasta" contando ya lo que se acaba de hacer, y el estado nuevo no llega
// hasta el siguiente pintado.
//
// Tambien vive aqui el recibo del ultimo pedido aprobado, que es lo que
// ensena #/comprobante. Se olvida al salir de esa vista: a un comprobante ya
// cerrado no se vuelve con Adelante, como en el sitio actual.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ultimaActualizacion } from '@raiz/js/comun/storage.js';
import { leerGuardado, guardarPedidoAMedias, borrarGuardado } from '../servicios/guardado.js';
import { reductor, unidades, subtotal } from './pedido.js';
import { useSesion } from './SesionProvider.jsx';

const ContextoPedido = createContext(null);

// Lo guardado, y la direccion de la cuenta si el pedido no trae ninguna: tener
// cuenta sirve para no volver a escribirla. Rellenarla no es un cambio (no se
// guarda), como al arrancar el sitio actual.
const iniciar = (sesion) => {
  const { lineas, entrega, factura } = leerGuardado();
  const conCuenta = sesion.dentro && sesion.direccion && !entrega.direccion;
  return {
    lineas,
    borrado: null,
    entrega: conCuenta ? { ...entrega, direccion: sesion.direccion } : entrega,
    factura,
    cambios: 0,
  };
};

function PedidoProvider({ children }) {
  const sesion = useSesion();
  const [estado, despachar] = useReducer(reductor, sesion, iniciar);
  // Cuando se guardo por ultima vez, para el pie. Empieza con la cookie, que
  // es lo que habia antes de abrir la pagina.
  const [guardadoEn, setGuardadoEn] = useState(ultimaActualizacion);
  const [recibo, setRecibo] = useState(null);

  // Lo que se leyo al arrancar no se vuelve a escribir: guardar es para los
  // cambios, que el reductor cuenta.
  const guardados = useRef(0);
  useEffect(() => {
    if (estado.cambios === guardados.current) return;
    guardados.current = estado.cambios;
    setGuardadoEn(guardarPedidoAMedias(estado));
  }, [estado]);

  // El estado de verdad, a mano de 'hacer' entre un pintado y el siguiente.
  const actual = useRef(estado);
  useLayoutEffect(() => { actual.current = estado; }, [estado]);

  const hacer = useCallback((accion) => {
    const despues = reductor(actual.current, accion);
    actual.current = despues;
    despachar(accion);
    return despues;
  }, []);

  // Pedido aprobado: la canasta y la factura se vacian, lo guardado se borra
  // con su marca, y el recibo queda para el comprobante. 'cumplido' no cuenta
  // como cambio, asi que no se vuelve a escribir lo que se acaba de borrar.
  const cumplir = useCallback((nuevo) => {
    hacer({ tipo: 'cumplido' });
    borrarGuardado();
    setGuardadoEn(null);
    setRecibo(nuevo);
  }, [hacer]);

  // Como fue el correo del comprobante, que llega despues. Si mientras tanto
  // ya hay otro recibo, no se toca: hablaria de otro pedido.
  const anotarCorreo = useCallback((numero, envioCorreo) => {
    setRecibo((r) => (r && r.numero === numero ? { ...r, envioCorreo } : r));
  }, []);

  // Al salir de #/comprobante el recibo se olvida. Se mira mientras se pinta
  // y no en un efecto: asi Adelante no llega a ensenarlo ni un cuadro.
  const { pathname } = useLocation();
  const [rutaAntes, setRutaAntes] = useState(pathname);
  if (pathname !== rutaAntes) {
    setRutaAntes(pathname);
    if (rutaAntes === '/comprobante' && recibo) setRecibo(null);
  }

  const valor = useMemo(() => ({
    lineas: estado.lineas,
    borrado: estado.borrado,
    entrega: estado.entrega,
    factura: estado.factura,
    unidades: unidades(estado.lineas),
    subtotal: subtotal(estado.lineas),
    guardadoEn,
    recibo,
    hacer,
    cumplir,
    anotarCorreo,
  }), [estado, guardadoEn, recibo, hacer, cumplir, anotarCorreo]);

  return <ContextoPedido.Provider value={valor}>{children}</ContextoPedido.Provider>;
}

const usePedido = () => useContext(ContextoPedido);

export { PedidoProvider, usePedido };
