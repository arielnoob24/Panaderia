// La pagina: cabecera y la vista que pide la direccion, sin pie (seccion 4
// del plan). Las
// vistas y sus direcciones estan en comun/vistas.js:
//   #/  #/nosotros  #/tienda-catalogo  #/tienda-<categoria>  #/contacto
//   #/confirmar  #/comprobante
//   #/cuenta/entrar  #/cuenta/crear  #/cuenta/verificar  #/cuenta/recuperar
//   #/cuenta  #/cuenta/pedidos
// HashRouter las escribe con una barra detras del '#'. Las de antes, sin la
// barra (#tienda-panes), siguen entrando: React Router le pone la barra al
// leer la direccion. Las de cuando todo era una pagina (#historia,
// #visitanos...) llevan a su vista con replace; lo demas, a #/.
import { Suspense, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, m, useIsPresent, useReducedMotion } from 'motion/react';
import Cabecera from './comun/Cabecera.jsx';
import Globo from './comun/Globo.jsx';
import { RegionAvisos } from './comun/Avisos.jsx';
import SaltoContenido from './comun/SaltoContenido.jsx';
import { VIEJAS, vistaDeRuta } from './comun/vistas.js';
import { todaviaAbriendo } from './comun/apertura.js';
import { CURVA, DURACION } from './comun/movimiento.js';
import Inicio from './vistas/Inicio.jsx';
import Nosotros from './vistas/Nosotros.jsx';
import Contacto from './vistas/Contacto.jsx';
import Catalogo from './catalogo/Catalogo.jsx';
import { categoriaDeRuta } from './catalogo/categorias.js';
import Canasta from './pedido/Canasta.jsx';
import BarraDeshacer from './pedido/BarraDeshacer.jsx';
// La cuenta (#/cuenta/*), #/confirmar y #/comprobante llegan en su propio
// archivo: comun/cargaPorPartes.js.
import { APARTE } from './comun/cargaPorPartes.js';
import FalloDeCarga from './comun/FalloDeCarga.jsx';

// La vista que toca. Las de la tienda son una sola: entre categorias el
// catalogo se queda montado y solo cambia "Filtrar por".
function Vista({ cual, pathname }) {
  if (cual === 'inicio') return <Inicio />;
  if (cual === 'nosotros') return <Nosotros />;
  if (cual === 'contacto') return <Contacto />;
  if (APARTE[cual]) {
    const { Componente } = APARTE[cual];
    return <Componente />;
  }
  return <Catalogo categoria={categoriaDeRuta(pathname)} />;
}

// Lo que ocupa la vista mientras llega su archivo, que solo se ve si se abre
// la pagina en ella (al navegar se sigue viendo la de antes): un hueco del
// alto de la ventana, para que la pagina no de un salto al llegar.
const CARGANDO = <div className="vista-cargando"></div>;

// La vista nueva entra con un fundido y sube un poco (seccion 4 del plan):
// es el unico movimiento de entrada de cada vista, y es escena (seccion 10). La de antes se va en el
// acto, sin salida animada: mientras saliera seguiria viva leyendo la
// direccion nueva (el comprobante, sin recibo, mandaria a #/ a medio camino).
const ENTRADA = { opacity: 0, y: 14 };
const QUIETA = { opacity: 1, x: 0, y: 0 };
const TRANSICION = { duration: DURACION.base, ease: CURVA.salida };

// El grupo de la vista: entre categorias de la tienda no hay fundido, porque
// no se cambia de vista (el catalogo anima sus fichas).
const grupoDe = (cual) => cual || 'cambiando';

// De crear la cuenta a verificar el correo ("Movimiento de la cuenta", punto
// 2): el formulario sale hacia la izquierda y el codigo entra por la derecha,
// para que se lea como el paso siguiente. Es la unica vista que se anima al
// salir, y por eso va aparte, en su propio AnimatePresence: crear no tiene
// nada que cambie con la direccion nueva mientras se va (su desvio se miro al
// llegar), cosa que no se puede decir de todas.
const DESDE_LA_DERECHA = { opacity: 0, x: 56 };
const AL_LADO = { duration: DURACION.base, ease: CURVA.salida };
const SALIDA = {
  // custom: a que vista se va, y si se pidio menos movimiento. A cualquier
  // otra que no sea verificar, crear se va en el acto, como las demas.
  sale: ({ siguiente, reducido }) => (siguiente === 'cuenta-verificar' && !reducido
    // Sale en la mitad de lo que tarda verificar en entrar.
    ? { opacity: 0, x: -56, transition: { duration: DURACION.rapida, ease: CURVA.salida } }
    : { opacity: 0, transition: { duration: 0 } }),
};

// Mientras se va queda encima de la vista nueva, fuera del flujo (is-saliendo)
// e inert: ni el foco ni el lector de pantalla entran en lo que ya se fue.
function VistaQueSale({ children, ...animacion }) {
  const presente = useIsPresent();
  return (
    <m.div className={presente ? 'vista-marco' : 'vista-marco is-saliendo'} inert={!presente} variants={SALIDA} exit="sale" {...animacion}>
      {children}
    </m.div>
  );
}

function App() {
  const location = useLocation();
  const reducido = useReducedMotion();
  const { pathname } = location;
  const cual = vistaDeRuta(pathname);
  // De que vista se viene: decide por donde entra la nueva. Se ajusta
  // mientras se pinta, para que la vista nueva ya nazca sabiendolo. Cada
  // llegada lleva su numero (vez), tambien la que vuelve con Atras.
  const [paso, setPaso] = useState({ antes: null, ahora: cual, vez: 0 });
  if (paso.ahora !== cual) setPaso({ antes: paso.ahora, ahora: cual, vez: paso.vez + 1 });
  const aVerificar = paso.antes === 'cuenta-crear' && cual === 'cuenta-verificar';

  // Una direccion vieja, o una que no existe: se cambia sin dejar rastro en
  // Atras y, si es la de abrir la pagina, sin mover el foco (useVista lo sabe
  // por comun/apertura.js).
  let entrada = ENTRADA;
  if (reducido || todaviaAbriendo()) entrada = false;
  else if (aVerificar) entrada = DESDE_LA_DERECHA;
  let vista;
  if (cual) vista = <Vista cual={cual} pathname={pathname} />;
  else vista = <Navigate to={VIEJAS[pathname] || '/'} replace />;

  return (
    <>
      <SaltoContenido />
      <Cabecera />
      <main id="contenido" tabIndex={-1}>
        {/* Suspense va por fuera de la vista y no dentro: React Router cambia
            de direccion en una transicion, y con un Suspense que ya se esta
            viendo React deja la vista de antes hasta que la nueva puede
            pintarse, en vez de ensenar el hueco. Asi la nueva llega entera,
            con su fundido. Uno nuevo por vista (dentro del m.div con su
            clave) ensenaria el hueco a cada cambio. */}
        <FalloDeCarga ruta={location.key}>
          <Suspense fallback={CARGANDO}>
            {/* Al abrir la pagina no hay fundido: la portada ya tiene su entrada
                propia, y con menos movimiento no se anima nada. */}
            {cual !== 'cuenta-crear' ? (
              <m.div
                key={grupoDe(cual)}
                className="vista-marco"
                initial={entrada}
                animate={QUIETA}
                transition={aVerificar ? AL_LADO : TRANSICION}
              >
                {vista}
              </m.div>
            ) : null}
            {/* Detras en el documento: lo que busque por clase encuentra antes
                la vista nueva que la que se va. */}
            <AnimatePresence custom={{ siguiente: cual, reducido }}>
              {cual === 'cuenta-crear' ? (
                // La clave es la de cada llegada: volver a crear mientras la
                // anterior todavia se va ("Cambiar el correo" o Atras desde
                // verificar) monta una hoja nueva, y no rescata la que salia
                // con las contrasenas escritas.
                <VistaQueSale key={`cuenta-crear-${paso.vez}`} initial={entrada} animate={QUIETA} transition={TRANSICION}>
                  {vista}
                </VistaQueSale>
              ) : null}
            </AnimatePresence>
          </Suspense>
        </FalloDeCarga>
      </main>
      {/* El boton de la canasta va en la cabecera; el panel y la barra de
          deshacer, fuera de la pagina, que queda inert detras del panel. */}
      <Canasta />
      <BarraDeshacer />
      <RegionAvisos />
      <Globo />
    </>
  );
}

export default App;
