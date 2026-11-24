// ---- La canasta predeterminada, para toda la aplicacion -----------------
// Una por cuenta (servicios/canastaFija.js). Solo existe con la sesion
// abierta; al cambiar de cuenta, o al cerrar la sesion, se lee la de la nueva.
//
// Quien usa useCanastaFija() recibe: dentro, lineas ({ nombre, cantidad }) y
// poner(lineas), que la reemplaza entera y la guarda.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useSesion } from './SesionProvider.jsx';
import { leerCanastaFija, guardarCanastaFija, limpiar } from '../servicios/canastaFija.js';

const ContextoCanastaFija = createContext(null);

function CanastaFijaProvider({ children }) {
  const { dentro, correo } = useSesion();
  const clave = dentro ? correo : '';
  const [estado, setEstado] = useState(() => ({ clave, lineas: leerCanastaFija(clave) }));
  // Otra cuenta (o ninguna): se ajusta mientras se pinta, para que ningun
  // pintado ensene la canasta de la de antes.
  let { lineas } = estado;
  if (estado.clave !== clave) {
    lineas = leerCanastaFija(clave);
    setEstado({ clave, lineas });
  }

  const poner = useCallback((nuevas) => {
    if (!clave) return;
    const limpias = limpiar(nuevas);
    guardarCanastaFija(clave, limpias);
    setEstado({ clave, lineas: limpias });
  }, [clave]);

  const valor = useMemo(() => ({ dentro: Boolean(clave), lineas, poner }), [clave, lineas, poner]);
  return <ContextoCanastaFija.Provider value={valor}>{children}</ContextoCanastaFija.Provider>;
}

const useCanastaFija = () => useContext(ContextoCanastaFija);

export { CanastaFijaProvider, useCanastaFija };
