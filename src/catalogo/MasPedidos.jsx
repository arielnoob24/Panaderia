// ---- "Los mas pedidos" en #/ ----------------------------------------------
// El mostrador: los destacados que se pueden pedir hoy, en un carrusel de
// scroll-snap sobre la masa clara (seccion 10 del plan, "Estilo"). Encima,
// la cabeza de seccion de periodico: rotulo, titulo, "Toda la tienda" y un
// filete que se dibuja la primera vez que se ve (useAparecer). Las fichas
// son las mismas de la tienda; el carrusel solo las pone de lado
// (useFila.js). Cada ficha se alcanza con Tab y el navegador la trae a la
// vista sola.
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, useReducedMotion } from 'motion/react';
import { dinero } from '../servicios/state.js';
import { catalogo } from '../servicios/catalogo.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { Chevron, IconoFlecha } from '../comun/iconos.jsx';
import TextoOla from '../comun/TextoOla.jsx';
import { useAparecer } from '../comun/useAparecer.js';
import FondoDibujo from '../comun/FondoDibujo.jsx';
import { PULSAR } from '../comun/movimiento.js';
import FichaProducto from './FichaProducto.jsx';
import { useFila } from './useFila.js';

const { productos } = catalogo;
// La flecha bajo el raton (respuesta).
const CRECE = { scale: 1.06 };
// Un escaparate: solo los mas pedidos y que se puedan pedir hoy. Si no
// hubiera ninguno marcado, salen todos.
const hayDestacados = productos.some((p) => p.destacado);
const DESTACADOS = productos.filter((p) => !hayDestacados || (p.destacado && p.disponible));

function MasPedidos() {
  const avisar = useAvisos();
  const reducido = useReducedMotion();
  const gridRef = useRef(null);
  const avanceRef = useRef(null);
  const fila = useFila({ gridRef, avanceRef });
  const cabeza = useAparecer('seccion-cabeza');
  // El tamano elegido de cada ficha, como en la tienda.
  const [elegidos, setElegidos] = useState({});
  const alElegir = useCallback((producto, i) => {
    setElegidos((antes) => ({ ...antes, [producto.nombre]: i }));
    const t = producto.tamanos[i];
    avisar(`${producto.nombre} ${t.valor}, ${dinero(t.precio)}.`);
  }, [avisar]);

  // aria-disabled y no disabled: una flecha que se apaga con el foco dentro
  // lo tiraria a body, y quien va con teclado perderia el sitio.
  // Encendida, crece un poco bajo el raton y se hunde al pulsarla (Motion);
  // apagada no responde. Con menos movimiento no cambia de tamano: MotionConfig
  // quita la animacion pero dejaria la escala final, asi que ni se pide.
  const flecha = (ir, apagada, nombre, tip) => (
    <m.button
      className="fila-flecha"
      type="button"
      data-ir={ir}
      aria-disabled={apagada}
      aria-label={nombre}
      data-tip={tip}
      whileHover={apagada || reducido ? undefined : CRECE}
      whileTap={apagada || reducido ? undefined : PULSAR}
      onClick={() => { if (!apagada) fila.irFlecha(ir); }}
    >
      <Chevron izquierda={ir < 0} />
    </m.button>
  );

  return (
    <section className="mostrador con-fondo" aria-labelledby="mas-pedidos-titulo">
      <FondoDibujo vista="inicio" />
      <div className="container">
        <div ref={cabeza.ref} className={cabeza.className} data-motion={cabeza['data-motion']}>
          <div>
            <p className="rotulo">De nuestro mostrador</p>
            <h2 id="mas-pedidos-titulo" className="fila-rotulo">Los más pedidos</h2>
          </div>
          <Link className="h-imprenta h-ola" to="/tienda-catalogo" state={{ entrar: true }}>
            <TextoOla>Toda la tienda</TextoOla>
            <IconoFlecha />
          </Link>
          <span className="seccion-filete" aria-hidden="true"></span>
        </div>
        <p className="mostrador-dicho">
          Los {DESTACADOS.length} que más se llevan. En la tienda hay {productos.length}.
        </p>
        <div className="fila-zona">
          {/* is-avanzada e is-al-final dicen que borde se desvanece (styles.css). */}
          <div
            ref={gridRef}
            className={['product-grid is-fila', !fila.alPrincipio && 'is-avanzada', fila.alFinal && 'is-al-final'].filter(Boolean).join(' ')}
          >
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
          {/* Las flechas van en el pie de la fila, en todos los anchos, con la
              barra de avance en medio: encima de las fotos tapaban fichas. */}
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
