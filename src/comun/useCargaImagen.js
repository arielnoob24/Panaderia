// Lo que hacia vigilarImagenes() de ui.js del sitio presentado con cada
// imagen: mientras
// llega, su hueco lleva is-loading (styles.css lo hace latir o deja la foto
// transparente); al llegar, la imagen gana is-loaded; si no llega, se esconde y
// el hueco pasa a image-unavailable, en vez de ensenar el icono roto.
import { useState } from 'react';

const CLASE_HUECO = { cargando: 'is-loading', fallo: 'image-unavailable' };

function useCargaImagen() {
  const [estado, setEstado] = useState('cargando');
  return {
    // La clase que se le suma al contenedor de la imagen ('' si ninguna).
    hueco: CLASE_HUECO[estado] || '',
    imagen: {
      className: estado === 'lista' ? 'is-loaded' : undefined,
      hidden: estado === 'fallo',
      onLoad: () => setEstado('lista'),
      onError: () => setEstado('fallo'),
    },
  };
}

// Junta clases sin dejar espacios de mas ni "undefined" por el camino.
const clases = (...lista) => lista.filter(Boolean).join(' ');

export { useCargaImagen, clases };
