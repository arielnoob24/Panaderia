// La region de avisos: un solo renglon invisible por el que pasa todo lo que
// hay que cantarle al lector de pantalla. Es la de js/comun/ui.js, que vivia
// al final del body; aqui va al final de la aplicacion, y quien tenga algo que
// decir lo pide con useAvisos() en vez de escribir en el nodo.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ContextoAvisos = createContext({ texto: '', avisar: () => {} });

function AvisosProvider({ children }) {
  const [texto, setTexto] = useState('');
  const avisar = useCallback((t) => setTexto(t), []);
  const valor = useMemo(() => ({ texto, avisar }), [texto, avisar]);
  return <ContextoAvisos.Provider value={valor}>{children}</ContextoAvisos.Provider>;
}

// Quien solo avisa no necesita volver a pintarse cada vez que cambia el texto,
// pero el contexto es uno solo y pequeno: no compensa partirlo en dos.
const useAvisos = () => useContext(ContextoAvisos).avisar;

function RegionAvisos() {
  const { texto } = useContext(ContextoAvisos);
  return <p className="sr-only" role="status" aria-live="polite">{texto}</p>;
}

export { AvisosProvider, RegionAvisos, useAvisos };
