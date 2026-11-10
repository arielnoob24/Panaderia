// ---- #/cuenta/favoritos: Mis favoritos -------------------------------------
// Los productos que la cuenta guardo con el corazon, cada uno con "Agregar" a
// la canasta y "Quitar". Es solo una lista de gustos: la canasta que se pide
// de una vez es otra cosa (#/cuenta/canasta). Sin sesion, a entrar (Desvio).
//
// Lo que entra a la canasta lo decide pedido/pedirOtraVez.js, la misma regla
// de "Pedir otra vez": solo lo disponible, con el precio de hoy, una unidad (en
// su primer tamano, si trae varios), sumado a lo que ya hubiera. Lo que ya no esta se dice por su nombre. Un
// favorito que ya no existe en el catalogo se muestra aparte, para poder
// quitarlo. Clases: cuenta-favoritos, cuenta-favorito...
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dinero } from '../servicios/state.js';
import { catalogo } from '../servicios/catalogo.js';
import { useSesion } from '../estado/SesionProvider.jsx';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { useFavoritos } from '../estado/FavoritosProvider.jsx';
import { useCanasta } from '../pedido/CanastaProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { pedirOtraVez } from '../pedido/pedirOtraVez.js';
import MarcoCuenta from './MarcoCuenta.jsx';
import { Desvio } from './Desvio.jsx';

function MisFavoritos() {
  // Se mira al llegar y no despues (vease Desvio.jsx).
  const [conSesion] = useState(useSesion().dentro);
  if (!conSesion) return <Desvio a="/cuenta/entrar" />;
  return <Lista />;
}

// El primer tamano es el de la ficha al abrir la tienda: lo que se pide si
// nadie eligio otro.
const lineaDe = (p) => (p.tamanos.length ? `${p.nombre} ${p.tamanos[0].valor}` : p.nombre);
const precioDe = (p) => (p.tamanos.length ? p.tamanos[0].precio : p.precio);

function Lista() {
  const { favoritos, alternar } = useFavoritos();
  const { lineas: enCanasta, hacer } = usePedido();
  const { abrir } = useCanasta();
  const avisar = useAvisos();
  const [nota, setNota] = useState('');

  const porNombre = new Map(catalogo.productos.map((p) => [p.nombre, p]));
  const vivos = favoritos.filter((n) => porNombre.has(n));
  const idos = favoritos.filter((n) => !porNombre.has(n));

  // pedirOtraVez ya sabe sumar lo disponible y decir lo demas: se le da una
  // lista con una unidad de cada favorito, como si fuera un pedido guardado.
  const agregar = (nombres) => {
    const pedido = { lineas: nombres.map((n) => ({ nombre: porNombre.has(n) ? lineaDe(porNombre.get(n)) : n, cantidad: 1 })) };
    const r = pedirOtraVez(pedido, catalogo.productos, enCanasta);
    if (r.entro) {
      hacer({ tipo: 'sumar', lineas: r.lineas });
      abrir();
    }
    avisar(r.aviso);
    setNota(r.aviso);
  };

  return (
    <MarcoCuenta paso="favoritos" titulo="Mis favoritos" pestana="Mis favoritos">
      {favoritos.length === 0 ? (
        <div className="cuenta-favoritos-vacio">
          <p>Aún no tienes favoritos. Toca el corazón de un producto en la tienda y lo verás aquí.</p>
          <Link className="button button-yellow" to="/tienda-catalogo">Ir a la tienda</Link>
        </div>
      ) : (
        <div className="cuenta-favoritos">
          {nota ? <p className="cuenta-favoritos-nota">{nota}</p> : null}
          <ul className="cuenta-favoritos-lista">
            {vivos.map((n) => {
              const p = porNombre.get(n);
              return (
                <li key={n} className="cuenta-favorito">
                  <div className="cuenta-favorito-datos">
                    <strong>{p.nombre}</strong>
                    <span>
                      {p.disponible
                        ? `${p.tamanos.length ? `${p.tamanos[0].valor} · ` : ''}${dinero(precioDe(p))}`
                        : 'Agotado, vuelve mañana'}
                    </span>
                  </div>
                  <button className="cuenta-favorito-agregar" type="button" disabled={!p.disponible} onClick={() => agregar([n])} aria-label={`Agregar ${p.nombre} a la canasta`}>
                    Agregar
                  </button>
                  <button className="cuenta-favorito-quitar" type="button" onClick={() => alternar(n)} aria-label={`Quitar ${p.nombre} de favoritos`}>
                    Quitar
                  </button>
                </li>
              );
            })}
            {idos.map((n) => (
              <li key={n} className="cuenta-favorito is-ido">
                <div className="cuenta-favorito-datos">
                  <strong>{n}</strong>
                  <span>Ya no lo tenemos</span>
                </div>
                <button className="cuenta-favorito-quitar" type="button" onClick={() => alternar(n)} aria-label={`Quitar ${n} de favoritos`}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </MarcoCuenta>
  );
}

export default MisFavoritos;
