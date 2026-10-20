// ---- La sesion, para toda la aplicacion (solo lectura) -----------------
// Quien esta dentro y si su correo esta verificado. En la fase 4 React no
// crea cuentas ni entra en ellas (eso es la fase 5): lee la que dejo el sitio
// actual en este navegador (servicios/cuenta.js). Con eso decide si "Ir a
// pagar" lleva a confirmar o a la hoja de "Entra a tu cuenta para pagar", y
// a que correo va el comprobante.
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { suscribirCuenta, cuentaActual } from '../servicios/cuenta.js';

const ContextoSesion = createContext(null);

function SesionProvider({ children }) {
  const cuenta = useSyncExternalStore(suscribirCuenta, cuentaActual);
  // Pagar pide una cuenta con la sesion abierta y el correo verificado: el
  // comprobante va a ese correo, y uno inventado dejaria el pedido sin el.
  const valor = useMemo(() => ({ ...cuenta, puedePedir: cuenta.dentro && cuenta.verificado }), [cuenta]);
  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

const useSesion = () => useContext(ContextoSesion);

export { SesionProvider, useSesion };
