// ---- El control de cantidad de cada ficha -------------------------------
// El "− cantidad +" que montarControlesDeFicha() de cart.js pone en las
// fichas, con el mismo HTML y las mismas clases. Mientras no hay nada pedido
// solo se ve el mas; al usarlo se abre en quitar, la cuenta y sumar.
//
// Lo que viene en varios tamanos no tiene nombre ni precio fijos: los dicta el
// tamano elegido, y como el nombre que se guarda lleva el tamano dentro, cada
// uno es su propia linea de la canasta.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MAX_UNIDADES, idDe } from '../servicios/state.js';
import { usePedido } from '../estado/PedidoProvider.jsx';
import {
  cantidadDe, unidades, productos, enTope, avisoTope, consejoTope,
} from '../estado/pedido.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCanasta } from './CanastaProvider.jsx';
import { Basurero } from './iconosPedido.jsx';

const cuantosQuedan = (estado) => `${productos(unidades(estado.lineas))} en la canasta.`;

// nombre y precio son los del tamano elegido; imagenRef, la foto de la ficha,
// de donde sale la que vuela a la canasta.
function ControlCantidad({ nombre, precio, imagenRef }) {
  const { lineas, hacer } = usePedido();
  const { volar, registrarFicha } = useCanasta();
  const avisar = useAvisos();
  const id = idDe(nombre);
  const n = cantidadDe(lineas, id);

  const masRef = useRef(null);
  const campoRef = useRef(null);
  // La cuenta es un campo, no un letrero: para llevarse veinte panes nadie
  // quiere pulsar veinte veces. Lo que se esta tecleando vive aparte y no se
  // pisa hasta que se sale del campo; corregirlo al vuelo impediria escribir
  // un 12 (al pasar por el 1 ya seria valido).
  const [tecleado, setTecleado] = useState(null);
  const descartar = useRef(false);

  // Esta ficha se apunta para que deshacer y la barra que se va sola puedan
  // devolverle el foco a su "mas". El id cambia con el tamano, por eso va por ref.
  const idAhora = useRef(id);
  useLayoutEffect(() => { idAhora.current = id; }, [id]);
  useEffect(() => registrarFicha({ coincide: (otro) => idAhora.current === otro, boton: masRef }), [registrarFicha]);

  const tope = enTope(n);

  const alMas = () => {
    // En el tope el mas no suma: dice por que y no vuela nada a la canasta.
    if (tope) { avisar(avisoTope(nombre)); return; }
    const despues = hacer({ tipo: 'agregar', id, nombre, precio });
    volar(imagenRef?.current);
    avisar(`${nombre} añadido. ${cuantosQuedan(despues)}`);
  };

  const alMenos = () => {
    const seVa = n <= 1;
    const despues = hacer({ tipo: 'cambiar', id, nombre, precio, cantidad: n - 1 });
    avisar(seVa ? `${nombre} quitado. ${cuantosQuedan(despues)}` : `Una unidad menos de ${nombre}. ${cuantosQuedan(despues)}`);
    // El boton recien usado desaparece; el foco pasa al mas para no perderse.
    if (seVa) masRef.current?.focus();
  };

  // Al salir del campo o con Enter se asienta: se recorta al tope y, si quedo
  // en cero o en blanco, el producto sale de la canasta, que es lo que un cero
  // dice (y el foco pasa al mas, porque el campo se esconde). Devuelve la
  // cantidad en que queda.
  const asentar = (texto) => {
    const escrito = parseInt(texto, 10) || 0;
    const pedida = Math.min(escrito, MAX_UNIDADES);
    if (pedida === n) return n;
    if (pedida <= 0) {
      const despues = hacer({ tipo: 'quitar', id });
      avisar(`${nombre} quitado. ${cuantosQuedan(despues)}`);
      masRef.current?.focus();
      return 0;
    }
    const despues = hacer({ tipo: 'cambiar', id, nombre, precio, cantidad: pedida });
    avisar(escrito > MAX_UNIDADES
      ? `El máximo es ${MAX_UNIDADES} por producto, así que quedaron ${MAX_UNIDADES} de ${nombre}. ${cuantosQuedan(despues)}`
      : `${pedida} de ${nombre}. ${cuantosQuedan(despues)}`);
    return pedida;
  };

  const alSalir = () => {
    const texto = descartar.current ? String(n) : (tecleado ?? String(n));
    descartar.current = false;
    setTecleado(null);
    asentar(texto);
  };

  // Mientras teclea solo se limpia lo que no son cifras.
  const alEscribir = (e) => setTecleado(e.target.value.replace(/[^0-9]/g, '').slice(0, 3));

  const alTeclear = (e) => {
    // Enter asienta lo escrito y Escape lo descarta, los dos sin sacar el foco
    // del campo: quien corrige un numero suele querer corregirlo otra vez.
    if (e.key === 'Enter') {
      e.preventDefault();
      // Si queda en cero el foco pasa al mas, y ese blur no tiene que volver a
      // asentar lo mismo (descartar hace que asiente lo que ya hay).
      descartar.current = true;
      const queda = asentar(tecleado ?? String(n));
      descartar.current = false;
      // Lo que se ve es lo que quedo (un 150 se queda en 100); con cero el
      // campo se esconde y vuelve a ensenar la cantidad cuando reaparezca.
      setTecleado(queda ? String(queda) : null);
      return;
    }
    if (e.key === 'Escape') { setTecleado(String(n)); return; }
    // Las flechas suben y bajan de uno sin tener que borrar y reescribir.
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const ahora = Math.min(parseInt(tecleado ?? String(n), 10) || 0, MAX_UNIDADES);
    const paso = e.key === 'ArrowUp' ? 1 : -1;
    setTecleado(String(Math.max(0, Math.min(ahora + paso, MAX_UNIDADES))));
  };

  const lleno = n > 0;
  return (
    <div className={lleno ? 'card-cantidad is-lleno' : 'card-cantidad'}>
      <button
        className="card-menos"
        type="button"
        hidden={!lleno}
        aria-label={n === 1 ? `Quitar ${nombre} de la canasta` : `Quitar uno de ${nombre}`}
        data-tip={n === 1 ? 'Quitar de la canasta' : 'Uno menos'}
        onClick={alMenos}
      >
        {n === 1 ? <Basurero /> : <span aria-hidden="true">−</span>}
      </button>
      <input
        ref={campoRef}
        className="card-numero"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={3}
        value={tecleado ?? String(n)}
        hidden={!lleno}
        aria-label={`Cantidad de ${nombre}`}
        data-tip={`Escribe cuántos quieres, hasta ${MAX_UNIDADES}`}
        onFocus={() => setTecleado(String(n))}
        onChange={alEscribir}
        onKeyDown={alTeclear}
        onBlur={alSalir}
      />
      <button
        ref={masRef}
        className="card-mas"
        type="button"
        aria-label={n ? `Añadir otro de ${nombre}` : `Añadir ${nombre} a la canasta`}
        aria-disabled={tope || undefined}
        data-tip={tope ? consejoTope : (n ? 'Uno más' : 'Añadir a la canasta')}
        onClick={alMas}
      >
        +
      </button>
    </div>
  );
}

export default ControlCantidad;
