// Lo que se ve mientras una seccion del panel espera a la API, o si falla.
function Cargando({ carga, que, alReintentar }) {
  if (carga.fase === 'cargando') return <p className="admin-vacio" role="status">Cargando {que}…</p>;
  return (
    <div className="admin-fallo" role="alert">
      <p>{carga.texto}</p>
      <button className="cuenta-pedido-otra" type="button" onClick={alReintentar}>Intentar otra vez</button>
    </div>
  );
}

export default Cargando;
