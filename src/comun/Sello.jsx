// ---- El sello de tinta sobre la foto en arco (seccion 10 del plan) ---------
// El de la portada ("Hecho a mano · Pan de la casa") y el de #/nosotros
// ("Masa madre · Hecho despacio"): el mismo dibujo, el texto dando la vuelta
// al aro. Es dibujo: lo que dice ya lo dicen el titular y la foto, asi que va
// aria-hidden. Cae girando al entrar y solo se mueve con el puntero encima,
// nunca con el desplazamiento (vistas.css, .sello).
//
// El aro es un path con id al que apunta el textPath. Con dos sellos en la
// pagina a la vez (la vista que sale y la que entra) un id fijo se
// repetiria, y el texto de uno podria seguir el aro del otro: useId da uno
// distinto a cada sello.
import { useId } from 'react';

function Sello({ texto, className }) {
  const aro = useId();
  return (
    <div className={className ? `sello ${className}` : 'sello'} aria-hidden="true">
      <svg viewBox="0 0 150 150" focusable="false">
        <defs><path id={aro} d="M75,75 m-56,0 a56,56 0 1,1 112,0 a56,56 0 1,1 -112,0" /></defs>
        <circle cx="75" cy="75" r="72" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="75" cy="75" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
        <text className="sello-aro"><textPath href={`#${aro}`}>{texto}</textPath></text>
        <text className="sello-centro" x="75" y="84" textAnchor="middle">✦</text>
      </svg>
    </div>
  );
}

export default Sello;
