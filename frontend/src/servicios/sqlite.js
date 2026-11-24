// ---- Mis pedidos en SQLite (sql.js) ------------------------------------
// SQLite compilado a WebAssembly, corriendo dentro del navegador: sin
// servidor y sin instalar nada. Con los pedidos de la cuenta se arma una
// base en memoria de dos tablas (PEDIDOS 1:N LINEAS) y con SQL se saca el
// resumen de Mis pedidos: cuantos, cuanto se ha gastado y lo que mas se pide.
// La misma base se puede descargar como archivo .sqlite, que abre cualquier
// programa de SQLite (DB Browser for SQLite, la extension de VS Code...).
//
// sql.js pesa (el .wasm, unos 670 kB): se carga solo cuando se pide, con
// import() y no al abrir la pagina.

let motor = null;

// El motor, una sola vez por pagina. Vite deja el .wasm en dist/ con su
// huella; ?url da su direccion para que sql.js lo pida.
const cargarMotor = () => {
  if (!motor) {
    motor = Promise.all([import('sql.js'), import('sql.js/dist/sql-wasm-browser.wasm?url')])
      .then(([sql, wasm]) => (sql.default || sql)({ locateFile: () => wasm.default }))
      .catch((e) => { motor = null; throw e; });
  }
  return motor;
};

const ESQUEMA = `
  CREATE TABLE pedidos (
    numero   TEXT PRIMARY KEY,
    fecha    TEXT NOT NULL,
    estado   TEXT,
    modo     TEXT NOT NULL CHECK (modo IN ('domicilio', 'retiro')),
    total    REAL NOT NULL CHECK (total >= 0)
  );
  CREATE TABLE lineas (
    numero   TEXT NOT NULL REFERENCES pedidos (numero),
    nombre   TEXT NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio   REAL NOT NULL CHECK (precio >= 0)
  );
`;

// Llena una base nueva con los pedidos. Va en una transaccion y con
// sentencias preparadas (los ? los rellena sql.js): un nombre con comillas
// no rompe el SQL.
const armarBase = (SQL, pedidos) => {
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  db.run(ESQUEMA);
  const pedido = db.prepare('INSERT INTO pedidos (numero, fecha, estado, modo, total) VALUES (?, ?, ?, ?, ?)');
  const linea = db.prepare('INSERT INTO lineas (numero, nombre, cantidad, precio) VALUES (?, ?, ?, ?)');
  db.run('BEGIN');
  try {
    for (const p of pedidos) {
      pedido.run([p.numero, String(p.fecha || ''), p.estado || null, p.modo === 'domicilio' ? 'domicilio' : 'retiro', Number(p.total) || 0]);
      for (const l of Array.isArray(p.lineas) ? p.lineas : []) {
        if ((Number(l.cantidad) || 0) > 0) linea.run([p.numero, String(l.nombre), Number(l.cantidad), Number(l.precio) || 0]);
      }
    }
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    db.close();
    throw e;
  } finally {
    pedido.free();
    linea.free();
  }
  return db;
};

// Las filas de una consulta como objetos { columna: valor }.
const filas = (db, sql) => {
  const [r] = db.exec(sql);
  return r ? r.values.map((v) => Object.fromEntries(r.columns.map((c, i) => [c, v[i]]))) : [];
};

// El resumen de Mis pedidos, todo con SQL.
const resumenDePedidos = async (pedidos) => {
  const SQL = await cargarMotor();
  const db = armarBase(SQL, pedidos);
  try {
    const [totales] = filas(db, `
      SELECT COUNT(*) AS pedidos, ROUND(COALESCE(SUM(total), 0), 2) AS gastado,
             ROUND(COALESCE(AVG(total), 0), 2) AS promedio
      FROM pedidos`);
    // Lo que mas se pide: las lineas unidas a su pedido (JOIN), sumadas por
    // producto (GROUP BY) y de mas a menos unidades.
    const masPedidos = filas(db, `
      SELECT l.nombre AS nombre, SUM(l.cantidad) AS unidades, COUNT(DISTINCT p.numero) AS veces
      FROM lineas l JOIN pedidos p ON p.numero = l.numero
      GROUP BY l.nombre
      ORDER BY unidades DESC, l.nombre ASC
      LIMIT 3`);
    return { ...totales, masPedidos };
  } finally {
    db.close();
  }
};

// La base entera como archivo .sqlite (los bytes, para descargarlos).
const baseComoArchivo = async (pedidos) => {
  const SQL = await cargarMotor();
  const db = armarBase(SQL, pedidos);
  try {
    return db.export();
  } finally {
    db.close();
  }
};

export { resumenDePedidos, baseComoArchivo };
