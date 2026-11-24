// El corazon de la ficha: guarda o quita el producto de los favoritos. Es un
// boton de alternar (aria-pressed). Sin sesion no guarda: abre la hoja que
// pide iniciar sesion (estado/FavoritosProvider.jsx).
import { useFavoritos } from '../estado/FavoritosProvider.jsx';
import { IconoCorazon } from '../comun/iconos.jsx';

function BotonFavorito({ nombre }) {
  const { esFavorito, alternar } = useFavoritos();
  const es = esFavorito(nombre);
  return (
    <button
      className={es ? 'boton-favorito is-activo' : 'boton-favorito'}
      type="button"
      aria-pressed={es}
      aria-label={`Favorito: ${nombre}`}
      data-tip={es ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      onClick={(e) => alternar(nombre, e.currentTarget)}
    >
      <IconoCorazon />
    </button>
  );
}

export default BotonFavorito;
