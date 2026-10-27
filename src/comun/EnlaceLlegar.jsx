// ---- El enlace con su icono y la ola (L1, seccion 10 del plan) -------------
// "Cómo llegar" de la portada y "Conoce nuestro local" de #/nosotros, que
// llevan a #/contacto, y WhatsApp e Instagram de #/contacto, que salen del
// sitio: un enlace y no un boton, en Fraunces cursiva con su icono y un
// filete horno. Con el puntero las letras saltan una tras otra (TextoOla)
// sin cambiar el nombre accesible.
//
// Sin href va a #/contacto, y entrar con el es llegar a la vista de cero
// (state entrar), como desde el menu; el icono es el pin. Con href es un
// enlace de fuera: se abre en otra pestana y el lector de pantalla lo oye
// en el nombre. El icono lo pone quien lo usa (icono), con la clase "ico".
// prefijo va delante en el nombre y no se ve ("WhatsApp: "): el numero solo
// no dice a donde lleva el enlace.
import { Link } from 'react-router-dom';
import { clases } from './useCargaImagen.js';
import { IconoPin } from './iconos.jsx';
import TextoOla from './TextoOla.jsx';

function EnlaceLlegar({ className, children, href, prefijo, icono = <IconoPin clase="ico" grosor="1.8" /> }) {
  if (href) {
    return (
      <a className={clases('enlace-llegar', className)} href={href} target="_blank" rel="noopener">
        {icono}
        {prefijo && <span className="sr-only">{prefijo}</span>}
        <TextoOla>{children}</TextoOla>
        <span className="sr-only"> (abre en una pestaña nueva)</span>
      </a>
    );
  }
  return (
    <Link className={clases('enlace-llegar', className)} to="/contacto" state={{ entrar: true }}>
      {icono}
      <TextoOla>{children}</TextoOla>
    </Link>
  );
}

export default EnlaceLlegar;
