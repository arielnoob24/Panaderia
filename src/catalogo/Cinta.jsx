// ---- La cinta cobriza de #/ (seccion 10 del plan) ---------------------------
// Debajo de la portada, en lugar de la franja de espigas: las tres
// categorias de la tienda, cada una con su icono y enlazada a su vista, como
// las del menu Tienda (entrar con el enlace limpia orden, Mostrar y
// busqueda). Con el raton se encienden como el menu de arriba (vistas.css).
// Las estrellas que las separan son adorno.
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIAS } from './categorias.js';
import { IconoBotella, IconoGalleta, IconoHogaza } from '../comun/iconos.jsx';
import TextoOla from '../comun/TextoOla.jsx';

// Si se anade una categoria sin dibujo, sale con la hogaza: mejor que sin nada.
const ICONOS = { panes: IconoHogaza, dulces: IconoGalleta, 'bebidas-frias': IconoBotella };

function Cinta() {
  return (
    <nav className="cinta" aria-label="Comprar por categoría">
      <div className="container cinta-dentro">
        {CATEGORIAS.map((c, i) => {
          const Icono = ICONOS[c.id] || IconoHogaza;
          return (
            <Fragment key={c.id}>
              {i > 0 && <span className="cinta-estrella" aria-hidden="true">✦</span>}
              <Link className={`cinta-enlace cinta-enlace-${c.id}`} to={`/tienda-${c.id}`} state={{ entrar: true }}>
                <Icono />
                <TextoOla>{c.nombre}</TextoOla>
              </Link>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}

export default Cinta;
