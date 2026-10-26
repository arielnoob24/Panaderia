// ---- "Ordenar por": un desplegable propio (seccion 4 del plan) ------------
// El <select> del navegador se veia generico en la tienda editorial. Este es
// el patron de combobox de solo seleccion del APG: el boton (role=combobox)
// se queda con el foco todo el rato y dice con aria-activedescendant cual
// de las opciones de la lista (role=listbox) es la que se esta mirando.
//
// Teclado, como pide el plan y el APG:
//   cerrado: Enter, Espacio, Alt+Abajo o Abajo abren en la elegida; Arriba,
//     Inicio y Fin abren en la de antes, la primera o la ultima; una letra
//     abre en la que empieza por ella.
//   abierto: Arriba/Abajo, Inicio y Fin recorren (sin dar la vuelta); una
//     letra salta; Enter, Espacio o Alt+Arriba eligen y cierran; Esc y Tab
//     cierran sin cambiar.
// Un clic fuera (o el foco que se va) cierra. Elegir con el raton o el dedo
// tambien cierra, y el foco nunca sale del boton, asi que al cerrar ya esta
// donde tiene que estar. Quien anuncia el orden es el catalogo (onCambio),
// solo si cambia, como hacia el onChange del <select>.
//
// El panel entra con fundido y scale(.96) desde el boton (CSS, vistas.css,
// --dur-fast) y la flecha gira; con menos movimiento solo aparece. Las dos
// pastillas (la de la elegida y la de la que se mira) son un elemento cada una
// (layoutId de Motion) y viajan de una opcion a otra con un resorte corto; con
// menos movimiento saltan.
import { useEffect, useId, useRef, useState } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { RESORTE } from '../comun/movimiento.js';

// Lo que se ha escrito seguido para saltar a una opcion. Pasado este rato
// sin teclear, se empieza de cero (como en un <select>).
const PAUSA_LETRAS = 500;

function OrdenarPor({ opciones, valor, onCambio, rotuloId }) {
  const base = useId();
  const reducido = useReducedMotion();
  const viaje = reducido ? { duration: 0 } : RESORTE.pastilla;
  const [abierto, setAbierto] = useState(false);
  // La opcion que se esta mirando (puntero o flechas), por su indice.
  const [activa, setActiva] = useState(0);
  const letras = useRef({ texto: '', reloj: 0 });

  const cajaRef = useRef(null);
  const elegida = Math.max(0, opciones.findIndex(([v]) => v === valor));

  // Un toque fuera cierra aunque no se lleve el foco (en Safari tocar algo
  // que no es un control no lo quita del boton).
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (!cajaRef.current?.contains(e.target)) setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);
  // El reloj de las letras no sobrevive al componente.
  useEffect(() => () => clearTimeout(letras.current.reloj), []);
  const listaId = `${base}-lista`;
  const idDe = (i) => `${base}-op-${i}`;

  const abrir = (i = elegida) => { setActiva(i); setAbierto(true); };
  const cerrar = () => setAbierto(false);
  const elegir = (i) => {
    cerrar();
    const [v] = opciones[i];
    if (v !== valor) onCambio(v);
  };
  const limitar = (i) => Math.min(opciones.length - 1, Math.max(0, i));

  // Una letra (o varias seguidas) salta a la siguiente que empieza asi; si
  // es la misma letra repetida, va pasando por las que empiezan por ella
  // ("p" lleva a un precio y la siguiente "p", al otro). Si lo escrito no
  // es el principio de ninguna, vale la ultima letra sola.
  const buscar = (tecla) => {
    const l = letras.current;
    clearTimeout(l.reloj);
    l.texto = (l.texto + tecla).toLowerCase();
    l.reloj = setTimeout(() => { l.texto = ''; }, PAUSA_LETRAS);
    const base = abierto ? activa : elegida;
    const desde = (inicio, busca) => opciones.map((_, k) => (inicio + k) % opciones.length)
      .find((k) => opciones[k][1].toLowerCase().startsWith(busca));
    // Con una sola letra se busca desde la siguiente; con una palabra, desde
    // la que ya se mira, que puede seguir valiendo.
    const repetida = [...l.texto].every((c) => c === l.texto[0]);
    if (repetida) return desde(base + 1, l.texto[0]);
    return desde(base, l.texto) ?? desde(base + 1, l.texto.at(-1));
  };
  const olvidarLetras = () => {
    clearTimeout(letras.current.reloj);
    letras.current.texto = '';
  };

  const alTeclear = (e) => {
    const { key, altKey } = e;
    // Lo que se escribe salta; cualquier otra tecla empieza la busqueda de
    // cero. El espacio no se escribe: siempre abre o elige (seccion 4 del
    // plan), y ninguna opcion hace falta buscarla por su segunda palabra.
    const escribe = key.length === 1 && key !== ' ' && !e.ctrlKey && !e.metaKey && !altKey;
    if (escribe) {
      const k = buscar(key);
      e.preventDefault();
      if (k === undefined) return;
      if (abierto) setActiva(k);
      else abrir(k);
      return;
    }
    olvidarLetras();
    if (!abierto) {
      if (key === 'Enter' || key === ' ' || key === 'ArrowDown') { e.preventDefault(); abrir(); return; }
      if (key === 'ArrowUp') { e.preventDefault(); abrir(altKey ? elegida : limitar(elegida - 1)); return; }
      if (key === 'Home') { e.preventDefault(); abrir(0); return; }
      if (key === 'End') { e.preventDefault(); abrir(opciones.length - 1); }
      return;
    }
    if (key === 'ArrowDown') { e.preventDefault(); setActiva(limitar(activa + 1)); return; }
    if (key === 'ArrowUp' && altKey) { e.preventDefault(); elegir(activa); return; }
    if (key === 'ArrowUp') { e.preventDefault(); setActiva(limitar(activa - 1)); return; }
    if (key === 'Home') { e.preventDefault(); setActiva(0); return; }
    if (key === 'End') { e.preventDefault(); setActiva(opciones.length - 1); return; }
    if (key === 'Enter' || key === ' ') { e.preventDefault(); elegir(activa); return; }
    if (key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); return; }
    // Tab sigue su camino: cierra sin cambiar y el foco pasa al siguiente.
    if (key === 'Tab') cerrar();
  };

  return (
    <div ref={cajaRef} className={abierto ? 'orden is-open' : 'orden'}>
      <div
        className="orden-boton"
        role="combobox"
        tabIndex={0}
        aria-labelledby={rotuloId}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={listaId}
        aria-activedescendant={abierto ? idDe(activa) : undefined}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={alTeclear}
        onBlur={cerrar}
      >
        <span>{opciones[elegida][1]}</span>
        <svg className="orden-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M6 9.5l6 5.5 6-5.5" /></svg>
      </div>
      {/* Al pulsar una opcion el foco no se va del boton (preventDefault en
          pointerdown): si se fuera, onBlur cerraria antes del clic. */}
      <ul
        className="orden-lista"
        id={listaId}
        role="listbox"
        aria-labelledby={rotuloId}
        tabIndex={-1}
        onPointerDown={(e) => e.preventDefault()}
      >
        {opciones.map(([v, texto], i) => (
          <li
            key={v}
            id={idDe(i)}
            className={i === activa && abierto ? 'orden-opcion is-activa' : 'orden-opcion'}
            role="option"
            aria-selected={i === elegida}
            onPointerMove={(e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') setActiva(i); }}
            onClick={() => elegir(i)}
          >
            {i === elegida && (
              <m.span className="orden-pastilla" layoutId={`${base}-elegida`} transition={viaje} aria-hidden="true" />
            )}
            {abierto && i === activa && (
              <m.span
                className={i === elegida ? 'orden-mirada sobre-elegida' : 'orden-mirada'}
                layoutId={`${base}-mirada`}
                transition={viaje}
                aria-hidden="true"
              />
            )}
            {texto}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OrdenarPor;
