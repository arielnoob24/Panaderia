// Lo que comparten #/confirmar y #/comprobante, como verVista() y
// cerrarCheckout() de cart.js: son vistas propias dentro de <main>, no
// dialogos, asi que no atrapan el foco.
//
// Al entrar: body.is-checkout (styles.css aparta lo de la portada y el boton
// flotante de la canasta), el titulo de la pestana, arriba de golpe (es otra
// pagina, no un salto dentro de la misma) y el foco en el h1.
// Al salir por "Volver a la tienda" o "Listo, cerrar": a la portada, con su
// entrada en el historial, y el foco al boton de la canasta. Con Atras no se
// toca el foco: lo pone el navegador o la vista a la que se vuelve.
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanasta } from './CanastaProvider.jsx';

function useVistaPedido(titulo) {
  const tituloRef = useRef(null);
  const saliendo = useRef(false);
  const { botonRef } = useCanasta();
  const navegar = useNavigate();

  useEffect(() => {
    document.body.classList.add('is-checkout');
    window.scrollTo({ top: 0, behavior: 'auto' });
    tituloRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.classList.remove('is-checkout');
      // Ya sin is-checkout el boton vuelve a verse, y se le puede dar el foco.
      if (saliendo.current) botonRef.current?.focus();
    };
  }, [botonRef]);

  useEffect(() => { document.title = `${titulo} | El Tradicional`; }, [titulo]);

  const salir = () => {
    saliendo.current = true;
    navegar('/');
  };

  return { tituloRef, salir };
}

export { useVistaPedido };
