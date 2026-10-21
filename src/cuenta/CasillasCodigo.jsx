// El codigo en 6 casillas (seccion 15 del plan, "Movimiento de la cuenta",
// punto 3). Una cifra por casilla y todo el teclado de un campo de codigo:
//   - al escribir una cifra el foco salta solo a la siguiente;
//   - Retroceso en una casilla vacia vuelve a la anterior y la borra;
//   - las flechas (e Inicio y Fin) se mueven entre ellas;
//   - pegar el codigo, en cualquier casilla, lo reparte entero; lo que el
//     telefono rellena solo en la primera (autocomplete one-time-code) tambien;
//   - Enter comprueba.
// Lo que no es cifra no entra. Al enfocar una casilla se selecciona lo que
// tiene, para escribir encima sin borrar antes.
//
// Quien lo usa lleva las cifras (un array de 6) y recibe onCambio(cifras,
// comprobar): comprobar es true al llenar la sexta, o al quedar todas llenas
// de golpe (pegando). Corregir una del medio con todas llenas no comprueba:
// el foco no tiene que saltar mientras se corrige; para eso esta Enter.
const N = 6;
const llenas = (cifras) => cifras.every(Boolean);
const nada = () => {};

function CasillasCodigo({ cifras, onCambio, onEnter, casillasRef, idError, mal }) {
  const enfocar = (i) => {
    const c = casillasRef.current[Math.max(0, Math.min(N - 1, i))];
    c?.focus();
  };

  // Reparte desde la casilla 'desde' (o desde la primera si viene el codigo
  // entero) y deja el foco despues de la ultima cifra puesta.
  const repartir = (desde, digitos) => {
    const inicio = digitos.length >= N ? 0 : desde;
    const nuevo = [...cifras];
    const trozo = digitos.slice(0, N - inicio);
    [...trozo].forEach((d, k) => { nuevo[inicio + k] = d; });
    // El foco antes que el aviso: si al comprobar falla, quien lo usa lo
    // manda a la primera y eso tiene que ser lo ultimo.
    enfocar(inicio + trozo.length);
    onCambio(nuevo, llenas(nuevo));
  };

  const alCambiar = (i) => (e) => {
    const digitos = e.target.value.replace(/\D/g, '');
    const antes = cifras[i];
    if (!digitos) {
      const nuevo = [...cifras];
      nuevo[i] = '';
      onCambio(nuevo, false);
      return;
    }
    let cifra = null;
    if (digitos.length === 1) cifra = digitos;
    // Se escribio al lado de la que ya habia (sin seleccionarla): vale la nueva.
    else if (digitos.length === 2 && antes && digitos.includes(antes)) cifra = digitos.replace(antes, '');
    if (cifra === null) { repartir(i, digitos); return; }
    const nuevo = [...cifras];
    nuevo[i] = cifra;
    if (i < N - 1) enfocar(i + 1);
    onCambio(nuevo, llenas(nuevo) && (i === N - 1 || !llenas(cifras)));
  };

  const alPegar = (i) => (e) => {
    const digitos = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
    e.preventDefault();
    if (digitos) repartir(i, digitos);
  };

  const alTeclear = (i) => (e) => {
    if (e.key === 'Backspace' && !cifras[i] && i > 0) {
      e.preventDefault();
      const nuevo = [...cifras];
      nuevo[i - 1] = '';
      onCambio(nuevo, false);
      enfocar(i - 1);
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); enfocar(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); enfocar(i + 1); }
    else if (e.key === 'Home') { e.preventDefault(); enfocar(0); }
    else if (e.key === 'End') { e.preventDefault(); enfocar(N - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); onEnter(); }
  };

  return (
    <fieldset className="codigo-casillas">
      <legend className="codigo-leyenda">Código de 6 cifras</legend>
      <div className="codigo-fila">
        {cifras.map((cifra, i) => (
          <input
            // Las casillas no cambian de sitio ni de numero: el indice es su nombre.
            key={i}
            ref={(el) => { casillasRef.current[i] = el; }}
            className={['codigo-casilla', cifra && 'is-llena', mal && 'is-mal'].filter(Boolean).join(' ')}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Cifra ${i + 1} de ${N}`}
            aria-describedby={idError}
            aria-invalid={mal}
            value={cifra}
            // onInput y no onChange: escribir encima la misma cifra que ya
            // habia no cambia el valor, y React no da onChange; el foco se
            // quedaba en la casilla. El evento input del navegador si llega,
            // tambien con el teclado del telefono y al rellenar el codigo
            // solo. onChange queda vacio porque React lo pide en un campo
            // controlado.
            onInput={alCambiar(i)}
            onChange={nada}
            onPaste={alPegar(i)}
            onKeyDown={alTeclear(i)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
    </fieldset>
  );
}

export default CasillasCodigo;
