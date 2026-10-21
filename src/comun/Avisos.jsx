// La region de avisos: un solo renglon invisible por el que pasa todo lo que
// hay que cantarle al lector de pantalla. Es la de ui.js del sitio presentado, que vivia
// al final del body; aqui va al final de la aplicacion, y quien tenga algo que
// decir lo pide con useAvisos() en vez de escribir en el nodo.
import { Fragment, createContext, useCallback, useContext, useMemo, useState } from 'react';

const ContextoAvisos = createContext({ aviso: { texto: '', vez: 0 }, avisar: () => {} });

function AvisosProvider({ children }) {
  // 'vez' cuenta los avisos: pulsar dos veces lo mismo ("¿Vaciar la canasta?",
  // el tope de cien) da dos veces el mismo texto, y tiene que oirse las dos,
  // como en el sitio presentado, que reescribia el nodo aunque dijera lo mismo.
  const [aviso, setAviso] = useState({ texto: '', vez: 0 });
  const avisar = useCallback((texto) => setAviso((a) => ({ texto, vez: a.vez + 1 })), []);
  const valor = useMemo(() => ({ aviso, avisar }), [aviso, avisar]);
  return <ContextoAvisos.Provider value={valor}>{children}</ContextoAvisos.Provider>;
}

// Quien solo avisa no necesita volver a pintarse cada vez que cambia el texto,
// pero el contexto es uno solo y pequeno: no compensa partirlo en dos.
const useAvisos = () => useContext(ContextoAvisos).avisar;

// Con la clave en 'vez', cada aviso es un nodo de texto nuevo aunque diga lo
// mismo que el anterior: React no toca un texto igual, y sin cambio en el
// nodo el lector de pantalla no tiene nada que leer.
function RegionAvisos() {
  const { aviso } = useContext(ContextoAvisos);
  return (
    <p className="sr-only" role="status" aria-live="polite">
      <Fragment key={aviso.vez}>{aviso.texto}</Fragment>
    </p>
  );
}

export { AvisosProvider, RegionAvisos, useAvisos };
