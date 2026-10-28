// ---- Panel, Productos: precio, agotado y recomendado -----------------------
// Cada producto con lo que se cambia a diario: si hay (Disponible), si sale
// en "Recomendados" y el precio de cada tamaño (con IVA, como lo ve el
// cliente). Se guarda producto por producto. El sitio de los clientes lee el
// catalogo con un minuto de memoria, asi que un cambio tarda hasta ese
// tiempo en verse alla.
import { useState } from 'react';
import { pedirApi } from '../servicios/api.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Cargando from './Cargando.jsx';

// "1,5" y "1.50" valen lo mismo. NaN si no es un precio de la tienda.
const aPrecio = (texto) => {
  const t = String(texto).trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return NaN;
  const n = Number(t);
  return n > 0 && n < 1000 ? n : NaN;
};

function Producto({ p, alGuardar }) {
  const avisar = useAvisos();
  const [disponible, setDisponible] = useState(p.disponible);
  const [destacado, setDestacado] = useState(p.destacado);
  const [precios, setPrecios] = useState(() => Object.fromEntries(p.tamanos.map((t) => [t.codigo, Number(t.precio).toFixed(2)])));
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');

  const malos = p.tamanos.filter((t) => Number.isNaN(aPrecio(precios[t.codigo])));
  const cambiaron = p.tamanos.filter((t) => aPrecio(precios[t.codigo]) !== Number(t.precio));
  const sucio = disponible !== p.disponible || destacado !== p.destacado || cambiaron.length > 0;

  const guardar = async (e) => {
    e.preventDefault();
    if (malos.length) { setError('El precio va entre 0,01 y 999,99, con hasta dos decimales.'); return; }
    setTrabajando(true);
    setError('');
    try {
      const nuevo = await pedirApi(`/admin/productos/${p.codigo}`, {
        metodo: 'PUT', sesion: true, espera: 10000,
        cuerpo: { disponible, destacado, precios: Object.fromEntries(cambiaron.map((t) => [t.codigo, aPrecio(precios[t.codigo])])) },
      });
      alGuardar(nuevo);
      avisar(`Guardaste ${p.nombre}.`);
    } catch (err) {
      setError(textoDeFallo(err));
    }
    setTrabajando(false);
  };

  return (
    <li className="admin-producto">
      <form onSubmit={guardar} noValidate>
        <div className="admin-producto-cabeza">
          <strong>{p.nombre}</strong>
          <span className="admin-producto-cat">{p.categoria}</span>
        </div>
        <div className="admin-producto-campos">
          <label className="admin-casilla"><input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} /> Disponible</label>
          <label className="admin-casilla"><input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} /> Recomendado</label>
          {p.tamanos.map((t) => (
            <label key={t.codigo} className="admin-precio">
              <span>{t.nombre === 'Único' ? 'Precio' : `Precio ${t.nombre}`}</span>
              <span className="admin-precio-caja">
                <span aria-hidden="true">$</span>
                <input
                  type="text" inputMode="decimal" value={precios[t.codigo]}
                  aria-invalid={Number.isNaN(aPrecio(precios[t.codigo])) || undefined}
                  onChange={(e) => setPrecios((x) => ({ ...x, [t.codigo]: e.target.value }))}
                />
              </span>
            </label>
          ))}
          <button className="cuenta-pedido-otra admin-guardar" type="submit" disabled={!sucio || trabajando}>
            {trabajando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
      </form>
    </li>
  );
}

function Productos() {
  const carga = useCarga('/admin/productos', 'productos');
  if (carga.fase !== 'listo') return <Cargando carga={carga} que="los productos" />;
  const guardado = (nuevo) => carga.ponerDatos(carga.datos.map((p) => (p.codigo === nuevo.codigo ? nuevo : p)));
  return (
    <section aria-labelledby="admin-productos-titulo">
      <h2 id="admin-productos-titulo" className="admin-titulo">Productos</h2>
      <p className="admin-nota">Un producto sin «Disponible» sale agotado en la tienda y no se puede pedir.</p>
      <ul className="admin-productos">
        {/* La clave lleva lo guardado: al guardar, el formulario parte de lo nuevo. */}
        {carga.datos.map((p) => <Producto key={`${p.codigo}-${p.disponible}-${p.destacado}-${p.tamanos.map((t) => t.precio).join()}`} p={p} alGuardar={guardado} />)}
      </ul>
    </section>
  );
}

export default Productos;
