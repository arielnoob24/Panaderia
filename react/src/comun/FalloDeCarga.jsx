// ---- Si una vista aparte no llega ------------------------------------------
// La cuenta y el pago vienen en su propio archivo (comun/cargaPorPartes.js).
// Si no llega (sin red, o un archivo viejo que ya no esta tras publicar), la
// pagina no se queda en blanco: en el sitio de la vista sale un aviso corto
// con "Reintentar". La cabecera, la canasta y el pie siguen funcionando, y
// navegar a otra vista quita el aviso.
//
// "Reintentar" vuelve a cargar la pagina, en la misma direccion. No basta con
// volver a pedir el archivo: Chrome y Edge recuerdan que un modulo fallo y no
// lo vuelven a bajar mientras dure la pagina (lo mismo aconseja Vite para
// estos fallos). La canasta y la sesion estan guardadas, y lo de la vista que
// no llego no se habia empezado a escribir.
//
// Es una clase porque un limite de errores de React solo se puede escribir
// asi (getDerivedStateFromError).
import { Component, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useVista } from './useVista.js';

const reintentar = () => window.location.reload();

// El aviso es una vista como las demas: su titulo de pestana y su h1 con el
// foco al llegar navegando, asi el lector de pantalla dice lo que paso.
function AvisoFallo() {
  const tituloRef = useRef(null);
  useVista('No se pudo abrir | El Tradicional', tituloRef);
  return (
    <div className="vista vista-fallo">
      <div className="container vista-fallo-hoja">
        <h1 ref={tituloRef} tabIndex={-1}>No se pudo abrir esta parte</h1>
        <p>Revisa tu conexión a internet y vuelve a intentarlo. Tu canasta sigue tal como estaba.</p>
        <div className="vista-fallo-acciones">
          <button className="button button-yellow" type="button" onClick={reintentar}>Reintentar</button>
          <Link className="text-link" to="/">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

class FalloDeCarga extends Component {
  constructor(props) {
    super(props);
    this.state = { error: false, ruta: props.ruta };
  }

  static getDerivedStateFromError() {
    return { error: true };
  }

  // Otra entrada del historial (un enlace, Atras) es otra vista: el aviso
  // era de la anterior.
  static getDerivedStateFromProps(props, state) {
    if (props.ruta === state.ruta) return null;
    return { error: false, ruta: props.ruta };
  }

  render() {
    return this.state.error ? <AvisoFallo /> : this.props.children;
  }
}

export default FalloDeCarga;
