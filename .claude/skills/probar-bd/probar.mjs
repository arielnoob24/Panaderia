// Prueba bd/BD_EL_TRADICIONAL.sql en PGlite (PostgreSQL en WebAssembly).
// Uso (desde una carpeta del scratchpad con @electric-sql/pglite instalado):
//   node probar.mjs <ruta del .sql> <ruta de data/productos.json>
// Sale con codigo 1 si alguna comprobacion falla.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const [rutaSql, rutaJson] = process.argv.slice(2);
if (!rutaSql || !rutaJson) {
  console.error('Uso: node probar.mjs <BD_EL_TRADICIONAL.sql> <data/productos.json>');
  process.exit(2);
}

const sql = readFileSync(rutaSql, 'utf8');
const marca = sql.match(/^\\connect\s+\S+\s*$/m);
if (!marca) { console.error('El script no tiene la linea \\connect que separa el paso 1 del 2'); process.exit(2); }
const paso2 = sql.slice(marca.index + marca[0].length);

let fallos = 0;
const ok = (cond, msg) => { console.log((cond ? 'OK   ' : 'MAL  ') + msg); if (!cond) fallos++; };
const titulo = (t) => console.log('\n== ' + t);

titulo('El script');
ok(!/caf[eé]|cafeter|c[oó]ctel|cocktail/i.test(sql), 'Sin palabras que rechaza el CI (cafe, cafeteria, coctel)');
const db = new PGlite();
await db.exec(`SET timezone TO 'America/Guayaquil';`);
try { await db.exec(paso2); ok(true, 'El paso 2 se ejecuta sin errores'); }
catch (e) { ok(false, 'El paso 2 falla: ' + e.message); process.exit(1); }

const q = async (s, p) => (await db.query(s, p)).rows;
const debeFallar = async (s, msg) => {
  try { await db.exec(s); ok(false, msg + ' (no fallo)'); }
  catch (e) { ok(true, msg + ' -> ' + e.message.split('\n')[0]); }
};

// ---------------------------------------------------------------------------
// Reglas del modelo (seccion 8 del plan). Son genericas: leen el catalogo de
// PostgreSQL, asi que siguen sirviendo cuando se agregan tablas.
// ---------------------------------------------------------------------------
const tablas = (await q(`SELECT table_name t FROM information_schema.tables
                          WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY 1`)).map(r => r.t);
const columnas = await q(`SELECT table_name t, column_name c, column_default d FROM information_schema.columns
                           WHERE table_schema='public' ORDER BY table_name, ordinal_position`);
const restricciones = await q(`
  SELECT c.conname n, c.contype tipo, c.conrelid::regclass::text t, c.confrelid::regclass::text padre,
         (SELECT array_agg(a.attname ORDER BY k.i) FROM unnest(c.conkey) WITH ORDINALITY k(n, i)
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.n) cols,
         (SELECT array_agg(a.attname ORDER BY k.i) FROM unnest(c.confkey) WITH ORDINALITY k(n, i)
            JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.n) refs
    FROM pg_constraint c JOIN pg_namespace s ON s.oid = c.connamespace
   WHERE s.nspname = 'public' AND c.contype IN ('p', 'u', 'f')`);
const fks = restricciones.filter(r => r.tipo === 'f');
const pkDe = Object.fromEntries(restricciones.filter(r => r.tipo === 'p').map(r => [r.t, r.cols]));
const colsFk = (t) => new Set(fks.filter(f => f.t === t).flatMap(f => f.cols));
const ordenado = (a) => [...a].sort().join(',');

titulo(`Estructura (${tablas.length} tablas)`);
ok(tablas.every(t => pkDe[t]), 'Todas las tablas tienen PK');

// Nombres ENTIDAD / ENT_Atributo
const prefijo = {};
for (const t of tablas) {
  const propias = columnas.filter(c => c.t === t && !colsFk(t).has(c.c));
  const pre = new Set(propias.map(c => c.c.slice(0, 4)));
  const bien = propias.every(c => /^[a-z]{3}_[a-z0-9]+$/.test(c.c)) && pre.size <= 1;
  if (!bien) ok(false, `${t}: sus atributos no comparten un prefijo XXX_ (${propias.map(c => c.c).join(', ')})`);
  prefijo[t] = [...pre][0];
}
ok(tablas.every(t => /^[a-z]+(_[a-z]+)*$/.test(t)), 'Nombres de tabla en el formato ENTIDAD');
const usados = Object.values(prefijo).filter(Boolean);
ok(new Set(usados).size === usados.length, 'Ningun prefijo de atributos se repite entre tablas');
const fkRenombradas = fks.filter(f => f.cols.join() !== f.refs.join());
ok(fkRenombradas.length === 0, 'Cada FK conserva el nombre de la PK que referencia '
  + fkRenombradas.map(f => `${f.n}: ${f.cols} -> ${f.refs}`).join('; '));

// Fuertes y debiles
const debiles = tablas.filter(t => pkDe[t].every(c => colsFk(t).has(c)));
const fuertes = tablas.filter(t => !debiles.includes(t));
console.log(`     ${fuertes.length} fuertes, ${debiles.length} debiles: ${debiles.join(', ')}`);
for (const t of fuertes) {
  const pk = pkDe[t];
  ok(pk.length === 1 && pk[0] === `${prefijo[t]}codigo`, `${t}: la PK es ${prefijo[t]}codigo (${pk})`);
}
for (const t of debiles) {
  ok(ordenado(pkDe[t]) === ordenado(colsFk(t)), `${t}: PK (${pkDe[t]}) = union de sus FK (${[...colsFk(t)]})`);
  ok(new Set(fks.filter(f => f.t === t).map(f => f.padre)).size >= 2, `${t}: relaciona al menos dos tablas`);
}
const conCodigo = fuertes.filter(t => columnas.find(c => c.t === t && c.c === pkDe[t][0])?.d?.includes('nextval'));
console.log(`     Codigo por secuencia: ${conCodigo.length}; codigo oficial: ${fuertes.filter(t => !conCodigo.includes(t)).join(', ') || 'ninguna'}`);

// Sin 1:1 (ni herencia, que en tablas se ve como una FK que es a la vez la PK)
const unicos = restricciones.filter(r => r.tipo === 'p' || r.tipo === 'u');
const unoAUno = fks.filter(f => unicos.some(u => u.t === f.t && ordenado(u.cols) === ordenado(f.cols)));
ok(unoAUno.length === 0, 'Sin relaciones 1:1 ni herencia ' + unoAUno.map(f => f.n).join(', '));

// Todo conectado
const vecinos = Object.fromEntries(tablas.map(t => [t, new Set()]));
for (const f of fks) if (f.t !== f.padre) { vecinos[f.t].add(f.padre); vecinos[f.padre].add(f.t); }
const sueltas = tablas.filter(t => vecinos[t].size === 0);
ok(sueltas.length === 0, 'Cada tabla tiene al menos una relacion ' + sueltas.join(', '));
const grupos = [];
const vistas = new Set();
for (const t of tablas) {
  if (vistas.has(t)) continue;
  const grupo = []; const cola = [t]; vistas.add(t);
  while (cola.length) { const x = cola.shift(); grupo.push(x); for (const v of vecinos[x]) if (!vistas.has(v)) { vistas.add(v); cola.push(v); } }
  grupos.push(grupo);
}
ok(grupos.length === 1, grupos.length === 1 ? 'Todas las tablas en un solo grupo'
  : 'Hay grupos aislados: ' + grupos.map(g => '[' + g.join(', ') + ']').join(' '));

// Autenticacion y autorizacion: al menos 3 tablas (lo dijo el profesor)
const auth = ['roles', 'permisos', 'roles_permisos', 'usuarios', 'verificaciones'].filter(t => tablas.includes(t));
ok(auth.length >= 3, `Autenticacion y autorizacion con ${auth.length} tablas (minimo 3)`);

// ---------------------------------------------------------------------------
// Datos iniciales: el catalogo tiene que ser el de data/productos.json
// ---------------------------------------------------------------------------
titulo('Datos iniciales contra data/productos.json');
const json = JSON.parse(readFileSync(rutaJson, 'utf8')).productos;
const enBd = await q(`SELECT pro_nombre, cat_slug, tam_descripcion, pta_orden, pta_precio::float8 precio,
                             eti_texto, pro_disponible, pro_destacado, pro_foto, pro_textoalternativo
                        FROM vw_catalogo ORDER BY pro_nombre, pta_orden`);
ok(new Set(enBd.map(r => r.pro_nombre)).size === json.length, `${json.length} productos, como en el JSON`);
for (const p of json) {
  const filas = enBd.filter(r => r.pro_nombre === p.nombre);
  const tam = p.tamanos ?? [{ valor: 'Único', precio: p.precio }];
  const f = filas[0];
  const igual = f && f.cat_slug === p.categoria && f.pro_foto === p.foto && f.pro_textoalternativo === p.alt
    && f.pro_disponible === (p.disponible !== false) && f.pro_destacado === (p.destacado === true)
    && (f.eti_texto ?? null) === (p.etiqueta?.texto ?? null)
    && filas.length === tam.length
    && tam.every((x, i) => filas[i].tam_descripcion === x.valor && filas[i].precio === x.precio);
  if (!igual) ok(false, `"${p.nombre}" no coincide con el JSON`);
}
ok(true, 'Revisados nombre, categoria, foto, alt, disponible, destacado, sello, tamaños y precios');
ok((await q(`SELECT count(*)::int n FROM provincias`))[0].n === 24, '24 provincias');

// ---------------------------------------------------------------------------
// Pruebas del caso. Si cambias una tabla de aqui, ajusta su prueba.
// ---------------------------------------------------------------------------
titulo('Validaciones ecuatorianas');
const v = async (f, x) => (await q(`SELECT ${f}($1) v`, [x]))[0].v;
ok(await v('fn_cedula_valida', '1710034065') === true, 'Cedula valida');
ok(await v('fn_cedula_valida', '1710034066') === false, 'Cedula con verificador malo');
ok(await v('fn_cedula_valida', '2510034065') === false, 'Cedula de la provincia 25');
ok(await v('fn_ruc_valido', '1710034065001') === true, 'RUC de persona natural');
ok(await v('fn_ruc_valido', '1790012345001') === true, 'RUC de sociedad');
ok(await v('fn_ruc_valido', '1710034065000') === false, 'RUC con establecimiento 000');

titulo('Un pedido de principio a fin');
const unValor = async (s, p) => Object.values((await q(s, p))[0])[0];
const rolCliente = await unValor(`SELECT rol_codigo FROM roles WHERE rol_nombre = 'Cliente'`);
const nuevoUsuario = (correo, celular) => unValor(
  `INSERT INTO usuarios (rol_codigo, usu_nombres, usu_apellidos, usu_correo, usu_celular, usu_huellaclave, usu_sal)
   VALUES ($1, 'Ana', 'Pérez', $2, $3, decode(repeat('ab', 32), 'hex'), decode(repeat('cd', 16), 'hex'))
   RETURNING usu_codigo`, [rolCliente, correo, celular]);
const ana = await nuevoUsuario('ana@correo.ec', '0991234567');
const luis = await nuevoUsuario('luis@correo.ec', '0997654321');
ok(/^USU[0-9]{7}$/.test(ana), `Codigo con prefijo: ${ana}`);
await debeFallar(`INSERT INTO usuarios (rol_codigo, usu_nombres, usu_apellidos, usu_correo, usu_celular, usu_huellaclave, usu_sal)
  VALUES ('${rolCliente}', 'X', 'Y', 'Ana@correo.ec', '0991234567', decode(repeat('ab', 32), 'hex'), decode(repeat('cd', 16), 'hex'))`, 'Correo con mayusculas');
await debeFallar(`INSERT INTO usuarios (rol_codigo, usu_nombres, usu_apellidos, usu_correo, usu_celular, usu_huellaclave, usu_sal)
  VALUES ('${rolCliente}', 'X', 'Y', 'x@correo.ec', '991234567', decode(repeat('ab', 32), 'hex'), decode(repeat('cd', 16), 'hex'))`, 'Celular de 9 cifras');

await q(`INSERT INTO verificaciones (usu_codigo, ver_clave) VALUES ($1, '123456')`, [ana]);
const verificado = async () => (await q(`SELECT usu_correoverificado v FROM vw_usuarios WHERE usu_codigo = $1`, [ana]))[0].v;
ok(await verificado() === false, 'Sin usar el codigo, el correo no esta verificado');
await q(`UPDATE verificaciones SET ver_fechauso = ver_fechaenvio + INTERVAL '1 minute' WHERE usu_codigo = $1`, [ana]);
ok(await verificado() === true, 'Con el codigo usado, el correo queda verificado');

const dirAna = await unValor(`INSERT INTO direcciones (usu_codigo, can_codigo, dir_calleprincipal) VALUES ($1, '1501', 'Av. 15 de Noviembre') RETURNING dir_codigo`, [ana]);
const dirLuis = await unValor(`INSERT INTO direcciones (usu_codigo, can_codigo, dir_calleprincipal) VALUES ($1, '1501', 'Calle Augusto Rueda') RETURNING dir_codigo`, [luis]);
const dom = await unValor(`SELECT ten_codigo FROM tipos_entrega WHERE ten_pidedireccion`);
const ret = await unValor(`SELECT ten_codigo FROM tipos_entrega WHERE NOT ten_pidedireccion`);
const epe = await unValor(`SELECT epe_codigo FROM estados_pedido ORDER BY epe_orden LIMIT 1`);
const pedidoSql = (ten, dir, numero) => `INSERT INTO pedidos (usu_codigo, ten_codigo, dir_codigo, epe_codigo, ped_numero)
  VALUES ('${ana}', '${ten}', ${dir ? `'${dir}'` : 'NULL'}, '${epe}', '${numero}')`;
await debeFallar(pedidoSql(dom, null, 'ET-AB23'), 'A domicilio sin direccion');
await debeFallar(pedidoSql(ret, dirAna, 'ET-AB23'), 'Retiro con direccion');
await debeFallar(pedidoSql(dom, dirLuis, 'ET-AB23'), 'Direccion de otro usuario');
await debeFallar(pedidoSql(ret, null, 'ET-0000'), 'Numero con 0');
const ped = await unValor(pedidoSql(dom, dirAna, 'ET-AB23') + ' RETURNING ped_codigo');
ok((await unValor(`SELECT ped_costoenvio::text FROM pedidos WHERE ped_codigo = $1`, [ped])) === '1.50', 'El envio se copia del tipo de entrega (1.50)');

const linea = (producto, tamano, cantidad) => `INSERT INTO detalles_pedido (ped_codigo, pro_codigo, tam_codigo, dpe_cantidad)
  SELECT '${ped}', p.pro_codigo, t.tam_codigo, ${cantidad} FROM productos p, tamanos t
   WHERE p.pro_nombre = '${producto}' AND t.tam_descripcion = '${tamano}'`;
await db.exec(linea('Pan redondo', 'Único', 10));
await db.exec(linea('Coca-Cola', '1 L', 2));
await debeFallar(linea('Palanqueta', 'Único', 1), 'Producto agotado');
await debeFallar(linea('Galletas', 'Único', 101), 'Cantidad 101');
await debeFallar(linea('Pan redondo', '1 L', 1), 'Tamaño que el producto no tiene');

const mpa = await unValor(`SELECT mpa_codigo FROM metodos_pago WHERE mpa_usatarjeta LIMIT 1`);
await q(`INSERT INTO pagos (ped_codigo, mpa_codigo, pag_monto, pag_aprobado, pag_ultimosdigitos) VALUES ($1, $2, 6.50, TRUE, '4242')`, [ped, mpa]);
const tot = (await q(`SELECT ped_subtotal0::text s0, ped_subtotalgravado::text sg, ped_iva::text iva,
                             ped_total::text t, ped_pagado::text p FROM vw_pedidos_totales WHERE ped_codigo = $1`, [ped]))[0];
ok(tot.s0 === '2.50' && tot.sg === '2.17' && tot.iva === '0.33' && tot.t === '6.50' && tot.p === '6.50',
  `Totales de 10 panes (0%) + 2 Coca-Cola 1 L (15%) + envio: ${JSON.stringify(tot)}`);

titulo('Facturacion');
const cli = await unValor(`INSERT INTO clientes (tid_codigo, cli_identificacion, cli_razonsocial, cli_telefono)
                           VALUES ('05', '1710034065', 'Ana Pérez', '062886123') RETURNING cli_codigo`);
await debeFallar(`INSERT INTO clientes (tid_codigo, cli_identificacion, cli_razonsocial) VALUES ('05', '1710034066', 'X')`, 'Cliente con cedula invalida');
await debeFallar(`INSERT INTO clientes (tid_codigo, cli_identificacion, cli_razonsocial) VALUES ('04', '1710034065', 'X')`, 'Cedula puesta como RUC');
const cf = await unValor(`SELECT cli_codigo FROM clientes WHERE tid_codigo = '07'`);
await q(`INSERT INTO facturas (ped_codigo, cli_codigo) VALUES ($1, $2)`, [ped, cf]);
await debeFallar(`INSERT INTO facturas (ped_codigo, cli_codigo) VALUES ('${ped}', '${cli}')`, 'Segunda factura vigente del mismo pedido');
await q(`UPDATE facturas SET fac_fechaanulacion = now() + INTERVAL '1 hour' WHERE ped_codigo = $1`, [ped]);
await q(`INSERT INTO facturas (ped_codigo, cli_codigo) VALUES ($1, $2)`, [ped, cli]);
const numeros = (await q(`SELECT fac_establecimiento || '-' || fac_puntoemision || '-' || fac_secuencial n FROM facturas ORDER BY fac_codigo`)).map(r => r.n);
ok(numeros.join() === '001-001-000000001,001-001-000000002', `Anulada y reemitida sin saltos aunque un insert fallo: ${numeros.join(', ')}`);

console.log(fallos ? `\n${fallos} comprobacion(es) fallaron` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
