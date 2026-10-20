// ---- "Los mas pedidos" en #/ ----------------------------------------------
// El mostrador: los destacados que se pueden pedir hoy, en un carrusel de
// scroll-snap sobre una banda oscura (la madera del mostrador). Las fichas son
// las mismas de la tienda; el carrusel solo las pone de lado (useFila.js).
// Cada ficha se alcanza con Tab y el navegador la trae a la vista sola.
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { dinero } from '@raiz/js/comun/state.js';
import { catalogo } from '../servicios/catalogo.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { Chevron } from '../comun/iconos.jsx';
import FichaProducto from './FichaProducto.jsx';
import { useFila } from './useFila.js';

const { productos } = catalogo;
// Un escaparate: solo los mas pedidos y que se puedan pedir hoy. Si no
// hubiera ninguno marcado, salen todos.
const hayDestacados = productos.some((p) => p.destacado);
const DESTACADOS = productos.filter((p) => !hayDestacados || (p.destacado && p.disponible));

function MasPedidos() {
  const avisar = useAvisos();
  const gridRef = useRef(null);
  const avanceRef = useRef(null);
  const fila = useFila({ gridRef, avanceRef });
  // El tamano elegido de cada ficha, como en la tienda.
  const [elegidos, setElegidos] = useState({});
  const alElegir = useCallback((producto, i) => {
    setElegidos((antes) => ({ ...antes, [producto.nombre]: i }));
    const t = producto.tamanos[i];
    avisar(`${producto.nombre} ${t.valor}, ${dinero(t.precio)}.`);
  }, [avisar]);

  // aria-disabled y no disabled: una flecha que se apaga con el foco dentro
  // lo tiraria a body, y quien va con teclado perderia el sitio.
  const flecha = (ir, apagada, nombre, tip) => (
    <button
      className="fila-flecha"
      type="button"
      data-ir={ir}
      aria-disabled={apagada}
      aria-label={nombre}
      data-tip={tip}
      onClick={() => { if (!apagada) fila.irFlecha(ir); }}
    >
      <Chevron izquierda={ir < 0} />
    </button>
  );

  return (
    <section className="mostrador banda-oscura" aria-labelledby="mas-pedidos-titulo">
      <div className="container">
        <div className="fila-cabeza">
          <h2 id="mas-pedidos-titulo" className="fila-rotulo">Los más pedidos</h2>
          <Link className="fila-ver-todo" to="/tienda-catalogo" state={{ entrar: true }}>Ver toda la tienda</Link>
        </div>
        <p className="mostrador-dicho">
          Los {DESTACADOS.length} que más se llevan. En la tienda hay {productos.length}.
        </p>
        <div className="fila-zona">
          <div ref={gridRef} className="product-grid is-fila">
            {DESTACADOS.map((p) => (
              <FichaProducto
                key={p.nombre}
                producto={p}
                vista="fila"
                visible
                elegido={elegidos[p.nombre] ?? 0}
                onElegir={alElegir}
              />
            ))}
          </div>
          {/* En la computadora las flechas flotan a los lados de la fila; en
              el telefono bajan a este pie, con la barra de avance en medio. */}
          <div className="fila-pie" hidden={!fila.hayFlechas}>
            {flecha(-1, fila.alPrincipio, 'Ver los productos anteriores', 'Anterior')}
            {/* Es un dibujo de lo que ya cuentan las fichas y las flechas. */}
            <div className="fila-barra" aria-hidden="true"><span ref={avanceRef} className="fila-avance"></span></div>
            {flecha(1, fila.alFinal, 'Ver más productos', 'Siguiente')}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MasPedidos;
