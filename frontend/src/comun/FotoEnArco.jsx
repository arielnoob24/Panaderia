// ---- La foto en arco con su pie y su sello (seccion 10 del plan) -----------
// La de la portada y la del amasado en #/nosotros: el arco con el marco fino
// a 10 px, el pie en cursiva debajo y el sello encima. Cada vista pone el
// tamano, la forma del arco y donde cae el sello con sus clases (className,
// arcoClase, selloClase); el resto de props va tal cual a la <img> (src,
// srcSet, sizes, alt, width, height, fetchPriority).
//
// Mientras la foto llega, el arco lleva is-loading; cuando llega, se
// descubre de abajo arriba (vistas.css, .arco).
import { useCargaImagen, clases } from './useCargaImagen.js';
import Sello from './Sello.jsx';

function FotoEnArco({ className, arcoClase, selloClase, pie, sello, ...imagen }) {
  const carga = useCargaImagen();
  return (
    <div className={clases('foto-arco', className)}>
      <figure>
        <div className={clases('arco', arcoClase, carga.hueco)}>
          <img {...imagen} {...carga.imagen} />
        </div>
        <figcaption>{pie}</figcaption>
      </figure>
      <Sello texto={sello} className={selloClase} />
    </div>
  );
}

export default FotoEnArco;
