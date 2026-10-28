// Lo que pide a la API cada seccion del panel: la lista al llegar, con su
// estado ('cargando', 'listo' o 'fallo') y el texto del fallo. recargar()
// la vuelve a pedir; ponerDatos() cambia lo que se ve sin volver a pedirla
// (un pedido o un producto recien guardado).
import { useCallback, useEffect, useState } from 'react';
import { pedirApi } from '../servicios/api.js';

const SIN_RED = 'No pudimos conectar con el servidor. Revisa tu internet e inténtalo otra vez.';

// Lo que se le dice a quien llama por un fallo de la API.
const textoDeFallo = (e) => {
  if (!e.estado) return SIN_RED;
  if (e.estado === 401) return 'Tu sesión caducó. Vuelve a iniciar sesión.';
  if (e.estado === 403) return 'Tu rol no tiene permiso para esto.';
  return e.message || 'Algo falló en el servidor. Inténtalo otra vez en un momento.';
};

function useCarga(ruta, clave) {
  const [estado, setEstado] = useState({ fase: 'cargando', datos: null, texto: '' });
  const [vez, setVez] = useState(0);
  useEffect(() => {
    let vigente = true;
    pedirApi(ruta, { sesion: true, espera: 10000 }).then(
      (r) => { if (vigente) setEstado({ fase: 'listo', datos: r[clave] ?? r, texto: '' }); },
      (e) => { if (vigente) setEstado({ fase: 'fallo', datos: null, texto: textoDeFallo(e) }); },
    );
    return () => { vigente = false; };
  }, [ruta, clave, vez]);
  const recargar = useCallback(() => { setEstado({ fase: 'cargando', datos: null, texto: '' }); setVez((v) => v + 1); }, []);
  const ponerDatos = useCallback((datos) => setEstado((e) => ({ ...e, datos })), []);
  return { ...estado, recargar, ponerDatos };
}

export { useCarga, textoDeFallo };
