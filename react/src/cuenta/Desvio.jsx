// Una vista de la cuenta que no corresponde (entrar con la sesion abierta,
// Mis datos sin ella...) lleva a la que si, con replace: Atras no vuelve a
// una direccion que solo rebota (tabla de la fase 5 en la seccion 15 del
// plan). Se lleva si se venia de pagar, y si es la direccion con que se abrio
// la pagina, para que useVista no mueva el foco.
//
// Cada vista lo mira al llegar y no a cada pintado, como #/confirmar: React
// Router cambia de direccion dentro de una transicion, que se pinta despues
// que el cambio de la sesion. Si la vista lo mirara siempre, al cerrar la
// sesion en Mis datos se pintaria un instante "sin sesion" en #/cuenta y su
// desvio a entrar ganaria a la portada; al entrar viniendo de pagar, el
// desvio a #/cuenta ganaria a #/confirmar.
import { Navigate, useLocation } from 'react-router-dom';

function Desvio({ a }) {
  const location = useLocation();
  const state = {
    alAbrir: location.key === 'default' || Boolean(location.state?.alAbrir),
    pagar: Boolean(location.state?.pagar),
  };
  return <Navigate to={a} replace state={state} />;
}

// Si se llego a la cuenta desde "Ir a pagar": al terminar se va a pagar.
const vieneDePagar = (location) => Boolean(location.state?.pagar);

export { Desvio, vieneDePagar };
