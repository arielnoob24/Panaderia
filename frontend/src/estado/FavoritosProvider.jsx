// ---- Los favoritos, para toda la aplicacion ----------------------------
// Solo existen con la sesion abierta: sin cuenta, tocar el corazon no guarda
// nada y abre la hoja que pide iniciar sesion (PideCuentaFavoritos). La lista
// es de nombres de producto y se guarda por correo (servicios/favoritos.js).
// Al cambiar de cuenta, o al cerrar la sesion, se lee la de la cuenta nueva.
//
// Quien usa useFavoritos() recibe: dentro, favoritos (lista de nombres),
// esFavorito(nombre) y alternar(nombre, origen). El origen es el elemento que
// se toco, para devolverle el foco al cerrar la hoja.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useSesion } from './SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { MAX_FAVORITOS, leerFavoritos, guardarFavoritos } from '../servicios/favoritos.js';
import PideCuentaFavoritos from '../catalogo/PideCuentaFavoritos.jsx';

const ContextoFavoritos = createContext(null);

function FavoritosProvider({ children }) {
  const { dentro, correo } = useSesion();
  const avisar = useAvisos();
  const clave = dentro ? correo : '';
  const [estado, setEstado] = useState(() => ({ clave, lista: leerFavoritos(clave) }));
  // Otra cuenta (o ninguna): se ajusta mientras se pinta, para que ningun
  // pintado ensene los favoritos de la de antes.
  let { lista } = estado;
  if (estado.clave !== clave) {
    lista = leerFavoritos(clave);
    setEstado({ clave, lista });
  }
  const [pide, setPide] = useState(null);

  const alternar = useCallback((nombre, origen) => {
    if (!clave) {
      setPide({ origen: origen || null });
      return;
    }
    const esta = lista.includes(nombre);
    if (!esta && lista.length >= MAX_FAVORITOS) {
      avisar(`Ya tienes ${MAX_FAVORITOS} favoritos, que es el máximo. Quita alguno para añadir otro.`);
      return;
    }
    const nueva = esta ? lista.filter((n) => n !== nombre) : [...lista, nombre];
    guardarFavoritos(clave, nueva);
    setEstado({ clave, lista: nueva });
    avisar(esta ? `${nombre} ya no está en tus favoritos.` : `${nombre} guardado en tus favoritos.`);
  }, [clave, lista, avisar]);

  const valor = useMemo(() => ({
    dentro: Boolean(clave),
    favoritos: lista,
    esFavorito: (nombre) => lista.includes(nombre),
    alternar,
  }), [clave, lista, alternar]);

  return (
    <ContextoFavoritos.Provider value={valor}>
      {children}
      <PideCuentaFavoritos pide={pide} onCerrar={() => setPide(null)} />
    </ContextoFavoritos.Provider>
  );
}

const useFavoritos = () => useContext(ContextoFavoritos);

export { FavoritosProvider, useFavoritos };
