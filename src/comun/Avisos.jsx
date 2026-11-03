// La region de avisos: un solo renglon invisible por el que pasa todo lo que
// hay que cantarle al lector de pantalla. Es la de ui.js del sitio presentado, que vivia
// al final del body; aqui va al final de la aplicacion, y quien tenga algo que
// decir lo pide con useAvisos() en vez de escribir en el nodo.
import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ContextoAvisos = createContext({ aviso: { texto: '', vez: 0 }, avisar: () => {} });

// Un aviso seguido de un cambio de pagina ("Contrasena cambiada...", "Iniciaste
// sesion como...") se perderia con la pagina que lo dijo. Cada aviso se deja
// en sessionStorage con su hora, y la pagina que abre justo despues lo repite
// en su region, una sola vez.
const CLAVE = 'tradicional:aviso';
const VIGENCIA = 4000;
const recordar = (texto) => {
  try { sessionStorage.setItem(CLAVE, JSON.stringify({ texto, hora: Date.now() })); } catch { /* sin almacenamiento */ }
};
const pendiente = () => {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CLAVE));
    sessionStorage.removeItem(CLAVE);
    return guardado && Date.now() - guardado.hora < VIGENCIA ? guardado.texto : '';
  } catch { return ''; }
};

function AvisosProvider({ children }) {
  // 'vez' cuenta los avisos: pulsar dos veces lo mismo ("¿Vaciar la canasta?",
  // el tope de cien) da dos veces el mismo texto, y tiene que oirse las dos,
  // como en el sitio presentado, que reescribia el nodo aunque dijera lo mismo.
  const [aviso, setAviso] = useState({ texto: '', vez: 0 });
  const avisar = useCallback((texto) => {
    recordar(texto);
    setAviso((a) => ({ texto, vez: a.vez + 1 }));
  }, []);
  // El de la pagina anterior, un momento despues de abrir: una region que ya
  // trae texto al pintarse no siempre se lee.
  useEffect(() => {
    const dicho = pendiente();
    if (!dicho) return undefined;
    const reloj = setTimeout(() => setAviso((a) => ({ texto: dicho, vez: a.vez + 1 })), 400);
    return () => clearTimeout(reloj);
  }, []);
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
