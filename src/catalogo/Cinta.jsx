// ---- La cinta cobriza de #/ (seccion 10 del plan) ---------------------------
// Debajo de la portada, en lugar de la franja de espigas: las tres
// categorias de la tienda, cada una con su icono y enlazada a su vista, como
// las del menu Tienda (entrar con el enlace limpia orden, Mostrar y
// busqueda). Con el raton se encienden como el menu de arriba (vistas.css).
// Las estrellas que las separan son adorno.
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIAS } from './categorias.js';
import { IconoCategoria } from '../comun/iconos.jsx';
import TextoOla from '../comun/TextoOla.jsx';

function Cinta() {
  return (
    <nav className="cinta" aria-label="Comprar por categoría">
      <div className="container cinta-dentro">
        {CATEGORIAS.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && <span className="cinta-estrella" aria-hidden="true">✦</span>}
            <Link className={`cinta-enlace cinta-enlace-${c.id}`} to={`/tienda-${c.id}`} state={{ entrar: true }}>
              <IconoCategoria id={c.id} />
              <TextoOla>{c.nombre}</TextoOla>
            </Link>
          </Fragment>
        ))}
      </div>
    </nav>
  );
}

export default Cinta;
