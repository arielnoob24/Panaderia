// ---- El enlace a #/contacto con el pin y la ola (L1, seccion 10 del plan) --
// "Cómo llegar" de la portada y "Conoce nuestro local" de #/nosotros: un
// enlace y no un boton, en Fraunces cursiva con el pin y un filete corteza.
// Con el puntero las letras saltan una tras otra (TextoOla) sin cambiar el
// nombre accesible. Entrar con el enlace es llegar a la vista de cero
// (state entrar), como desde el menu.
import { Link } from 'react-router-dom';
import { clases } from './useCargaImagen.js';
import { IconoPin } from './iconos.jsx';
import TextoOla from './TextoOla.jsx';

function EnlaceLlegar({ className, children }) {
  return (
    <Link className={clases('enlace-llegar', className)} to="/contacto" state={{ entrar: true }}>
      <IconoPin clase="ico" grosor="1.8" />
      <TextoOla>{children}</TextoOla>
    </Link>
  );
}

export default EnlaceLlegar;
