// El boton de la canasta, con su contador. Es el mismo elemento que cart.js
// hace con el flotante de WhatsApp: las clases floating-whatsapp e is-canasta
// son las que styles.css usa para dejarlo en la cabecera en la computadora y
// flotando abajo en el telefono. Va dentro de .nav-acciones, delante del menu.
//
// Es un <a> con role="button", como en el sitio actual, y no un <button>: la
// hoja de estilos esta hecha para el enlace (un boton traeria su borde).
import { usePedido } from '../estado/PedidoProvider.jsx';
import { productos } from '../estado/pedido.js';
import { useCanasta } from './CanastaProvider.jsx';
import { IconoCanasta } from './iconosPedido.jsx';

function BotonCanasta() {
  const { unidades: n } = usePedido();
  const { abrir, botonRef } = useCanasta();
  const alTeclear = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    abrir();
  };
  return (
    <a
      ref={botonRef}
      className="floating-whatsapp is-canasta"
      role="button"
      tabIndex={0}
      data-tip="Tu canasta"
      aria-label={n ? `Ver la canasta, ${productos(n)}` : 'Ver la canasta, vacía'}
      onClick={abrir}
      onKeyDown={alTeclear}
    >
      <IconoCanasta />
      <span className="canasta-cuenta" hidden={n === 0}>{n}</span>
    </a>
  );
}

export default BotonCanasta;
