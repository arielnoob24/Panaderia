// ---- #/cuenta/canasta: Mi canasta predeterminada ---------------------------
// La canasta que el usuario arma una vez y pide cuando quiere: productos y
// cantidades, guardados en su cuenta. Se arma aqui (elegir un producto y
// ajustar cantidades) o desde la canasta normal, con "Guardar como mi canasta
// predeterminada". "Pedir mi canasta" la suma a la canasta con el precio de
// hoy y la abre para revisar antes de pagar; lo agotado o quitado del
// catalogo se dice por su nombre (pedido/pedirOtraVez.js, la misma regla de
// "Pedir otra vez"). Sin sesion, a entrar (Desvio).
import { useState } from 'react';
import { MAX_UNIDADES, dinero, idDe } from '../servicios/state.js';
import { catalogo } from '../servicios/catalogo.js';
import { MAX_LINEAS } from '../servicios/canastaFija.js';
import { useSesion } from '../estado/SesionProvider.jsx';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { useCanastaFija } from '../estado/CanastaFijaProvider.jsx';
import { useCanasta } from '../pedido/CanastaProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { pedirOtraVez } from '../pedido/pedirOtraVez.js';
import MarcoCuenta from './MarcoCuenta.jsx';
import { Desvio } from './Desvio.jsx';

function MiCanastaFija() {
  // Se mira al llegar y no despues (vease Desvio.jsx).
  const [conSesion] = useState(useSesion().dentro);
  if (!conSesion) return <Desvio a="/cuenta/entrar" />;
  return <Editor />;
}

// Todo lo que se puede elegir hoy: una opcion por producto, o por tamano.
const opcionesDeHoy = () => catalogo.productos.flatMap((p) => (p.tamanos.length
  ? p.tamanos.map((t) => ({ nombre: `${p.nombre} ${t.valor}`, precio: t.precio, disponible: p.disponible }))
  : [{ nombre: p.nombre, precio: p.precio, disponible: p.disponible }]));

function Editor() {
  const { lineas, poner } = useCanastaFija();
  const { lineas: enCanasta, hacer } = usePedido();
  const { abrir } = useCanasta();
  const avisar = useAvisos();
  const [nota, setNota] = useState('');
  const [elegido, setElegido] = useState('');

  const opciones = opcionesDeHoy();
  const deHoy = new Map(opciones.map((o) => [idDe(o.nombre), o]));
  const disponibles = opciones.filter((o) => o.disponible && !lineas.some((l) => l.nombre === o.nombre));
  const decir = (texto) => { avisar(texto); setNota(texto); };

  const cambiar = (nombre, cantidad) => {
    if (cantidad < 1) { poner(lineas.filter((l) => l.nombre !== nombre)); decir(`${nombre} salió de tu canasta predeterminada.`); return; }
    poner(lineas.map((l) => (l.nombre === nombre ? { ...l, cantidad: Math.min(cantidad, MAX_UNIDADES) } : l)));
  };
  const agregar = () => {
    if (!elegido) return;
    if (lineas.length >= MAX_LINEAS) { decir(`Tu canasta predeterminada ya tiene ${MAX_LINEAS} productos, que es el máximo.`); return; }
    poner([...lineas, { nombre: elegido, cantidad: 1 }]);
    decir(`${elegido} entró en tu canasta predeterminada.`);
    setElegido('');
  };
  const pedir = () => {
    const r = pedirOtraVez({ lineas }, catalogo.productos, enCanasta);
    if (r.entro) {
      hacer({ tipo: 'sumar', lineas: r.lineas });
      abrir();
    }
    decir(r.aviso);
  };

  const total = lineas.reduce((s, l) => s + (deHoy.get(idDe(l.nombre))?.disponible ? deHoy.get(idDe(l.nombre)).precio * l.cantidad : 0), 0);

  return (
    <MarcoCuenta paso="canasta" titulo="Mi canasta predeterminada" pestana="Mi canasta predeterminada">
      <div className="cuenta-fija">
        <p className="cuenta-fija-dicho">
          Arma una vez lo que sueles pedir y pídelo cuando quieras. Se suma a tu canasta con los precios de hoy y
          puedes cambiarla antes de pagar.
        </p>

        <div className="cuenta-fija-agregar">
          <label htmlFor="fija-producto">Añadir un producto</label>
          <div className="cuenta-fija-agregar-fila">
            <select id="fija-producto" value={elegido} onChange={(e) => setElegido(e.target.value)}>
              <option value="">Elige un producto</option>
              {disponibles.map((o) => <option key={o.nombre} value={o.nombre}>{`${o.nombre} · ${dinero(o.precio)}`}</option>)}
            </select>
            <button className="cuenta-fija-boton" type="button" onClick={agregar} disabled={!elegido}>Añadir</button>
          </div>
        </div>

        {lineas.length === 0 ? (
          <p className="cuenta-fija-vacio">Aún no tienes una canasta predeterminada. Añade productos aquí, o arma tu canasta en la tienda y toca «Guardar como mi canasta predeterminada».</p>
        ) : (
          <>
            <ul className="cuenta-fija-lista">
              {lineas.map((l) => {
                const hoy = deHoy.get(idDe(l.nombre));
                const sirve = Boolean(hoy?.disponible);
                return (
                  <li key={l.nombre} className={sirve ? 'cuenta-fija-linea' : 'cuenta-fija-linea is-ido'}>
                    <div className="cuenta-fija-datos">
                      <strong>{l.nombre}</strong>
                      <span>{sirve ? dinero(hoy.precio) : (hoy ? 'Agotado hoy' : 'Ya no lo tenemos')}</span>
                    </div>
                    <div className="cuenta-fija-cantidad" role="group" aria-label={`Cantidad de ${l.nombre}`}>
                      <button type="button" onClick={() => cambiar(l.nombre, l.cantidad - 1)} aria-label={`Quitar una unidad de ${l.nombre}`}>−</button>
                      <output aria-live="polite">{l.cantidad}</output>
                      <button type="button" onClick={() => cambiar(l.nombre, l.cantidad + 1)} disabled={l.cantidad >= MAX_UNIDADES} aria-label={`Sumar una unidad de ${l.nombre}`}>+</button>
                    </div>
                    <button className="cuenta-fija-quitar" type="button" onClick={() => cambiar(l.nombre, 0)} aria-label={`Quitar ${l.nombre} de la canasta predeterminada`}>Quitar</button>
                  </li>
                );
              })}
            </ul>
            <p className="cuenta-fija-total">Con los precios de hoy: <strong>{dinero(total)}</strong></p>
            <p className="cuenta-fija-acciones">
              <button className="button button-yellow" type="button" onClick={pedir}>Pedir mi canasta</button>
            </p>
          </>
        )}
        {nota ? <p className="cuenta-fija-nota">{nota}</p> : null}
      </div>
    </MarcoCuenta>
  );
}

export default MiCanastaFija;
