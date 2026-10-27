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
// Si una tabla apunta dos veces a la misma, la que se repite agrega su papel
// al nombre de la PK (umi_codigocompra -> umi_codigo).
const aLaMisma = (f) => fks.filter(g => g.t === f.t && g.padre === f.padre).length > 1;
const fkRenombradas = fks.filter(f => f.cols.join() !== f.refs.join()
  && !(aLaMisma(f) && f.cols.every((c, i) => c.startsWith(f.refs[i]))));
ok(fkRenombradas.length === 0, 'Cada FK conserva el nombre de la PK que referencia (o le agrega su papel) '
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
const abiertas = (await q(`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND ((c.relkind = 'r' AND NOT c.relrowsecurity)
     OR (c.relkind = 'v' AND NOT coalesce(c.reloptions, '{}') @> '{security_invoker=true}'))`)).map(r => r.relname);
ok(abiertas.length === 0, `Tablas con RLS y vistas con security_invoker (para la API de Supabase)${abiertas.length ? ': faltan ' + abiertas.join(', ') : ''}`);
const sinRuta = (await q(`SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND NOT coalesce(p.proconfig, '{}') @> '{search_path=public}'`)).map(r => r.proname);
ok(sinRuta.length === 0, `Funciones con search_path fijo${sinRuta.length ? ': faltan ' + sinRuta.join(', ') : ''}`);

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
  `INSERT INTO usuarios (rol_codigo, usu_nombres, usu_apellidos, usu_correo, usu_celular, usu_codigoauth)
   VALUES ($1, 'Ana', 'Pérez', $2, $3, gen_random_uuid())
   RETURNING usu_codigo`, [rolCliente, correo, celular]);
const ana = await nuevoUsuario('ana@correo.ec', '0991234567');
const luis = await nuevoUsuario('luis@correo.ec', '0997654321');
ok(/^USU[0-9]{7}$/.test(ana), `Codigo con prefijo: ${ana}`);
await debeFallar(`INSERT INTO usuarios (rol_codigo, usu_nombres, usu_apellidos, usu_correo, usu_celular, usu_codigoauth)
  VALUES ('${rolCliente}', 'X', 'Y', 'Ana@correo.ec', '0991234567', gen_random_uuid())`, 'Correo con mayusculas');
await debeFallar(`INSERT INTO usuarios (rol_codigo, usu_nombres, usu_apellidos, usu_correo, usu_celular, usu_codigoauth)
  VALUES ('${rolCliente}', 'X', 'Y', 'x@correo.ec', '991234567', gen_random_uuid())`, 'Celular de 9 cifras');

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
const asientosVenta = await q(`SELECT asi_debe::text d, asi_cuadra c FROM vw_asientos WHERE asi_origen = 'VEN' ORDER BY asi_codigo`);
ok(asientosVenta.length === 3 && asientosVenta.every(a => a.c && a.d === '6.50'),
  `Cada factura y su anulacion dejan un asiento que cuadra (${asientosVenta.map(a => a.d).join(', ')})`);

titulo('Talento humano');
const cargo = (nombre) => unValor(`SELECT car_codigo FROM cargos WHERE car_nombre = $1`, [nombre]);
const insertEmpleado = `INSERT INTO empleados (can_codigo, car_codigo, emp_cedula, emp_primerapellido, emp_primernombre,
                          emp_fechanacimiento, emp_sexo, emp_correo, emp_celular, emp_direccion, emp_sueldo)`;
const nuevoEmpleado = async (cedula, nombre, correo, cargoNombre, sueldo) => unValor(
  `${insertEmpleado}
   VALUES ('1501', $1, $2, 'Grefa', $3, '1990-05-04', 'H', $4, '0981112233', 'Barrio Bellavista, Tena', $5)
   RETURNING emp_codigo`, [await cargo(cargoNombre), cedula, nombre, correo, sueldo]);
const panadero = await nuevoEmpleado('1501234569', 'Carlos', 'carlos@eltradicional.ec', 'Panadero', 600);
const contador = await nuevoEmpleado('1507654323', 'Rosa', 'rosa@eltradicional.ec', 'Contador', 900);
const pastelero = await cargo('Pastelero');
await debeFallar(`${insertEmpleado} VALUES ('1501', '${pastelero}', '1501234560', 'X', 'Y', '1990-01-01', 'H', 'x@x.ec', '0981112233', 'Tena', 500)`,
  'Empleado con cedula invalida');
await debeFallar(`${insertEmpleado} VALUES ('1501', '${pastelero}', '1704567898', 'X', 'Y', CURRENT_DATE - 3650, 'H', 'x@x.ec', '0981112233', 'Tena', 500)`,
  'Empleado de 10 anios');
await debeFallar(`${insertEmpleado} VALUES ('1501', '${pastelero}', '1704567898', 'X', 'Y', '1990-01-01', 'H', 'x@x.ec', '0981112233', 'Tena', 0)`,
  'Empleado sin sueldo');
await debeFallar(`${insertEmpleado} VALUES ('1501', 'CAR999', '1704567898', 'X', 'Y', '1990-01-01', 'H', 'x@x.ec', '0981112233', 'Tena', 500)`,
  'Empleado con un cargo que no existe');
const fila = (await q(`SELECT car_nombre, emp_sueldo::text s FROM vw_empleados WHERE emp_codigo = $1`, [panadero]))[0];
ok(fila.car_nombre === 'Panadero' && fila.s === '600.00', `La vista da su cargo y su sueldo (${fila.car_nombre}, ${fila.s})`);

titulo('Compras y recepcion');
const mat = (nombre) => unValor(`SELECT mat_codigo FROM materiales WHERE mat_nombre = $1`, [nombre]);
const harina = await mat('Harina de trigo');
const huevos = await mat('Huevos');
const chispas = await mat('Chispas de chocolate');
const sal = await mat('Sal');
const pvd = await unValor(`INSERT INTO proveedores (tid_codigo, can_codigo, pvd_identificacion, pvd_razonsocial, pvd_correo, pvd_direccion)
  VALUES ('04', '1501', '1790012345001', 'Molinos del Oriente S.A.', 'ventas@molinos.ec', 'Av. Jumandy, Tena') RETURNING pvd_codigo`);
await debeFallar(`INSERT INTO proveedores (tid_codigo, can_codigo, pvd_identificacion, pvd_razonsocial, pvd_correo, pvd_direccion)
  VALUES ('07', '1501', '9999999999999', 'X', 'x@x.ec', 'Tena')`, 'Proveedor como consumidor final');
await q(`INSERT INTO proveedores_materiales (pvd_codigo, mat_codigo, pma_precioreferencia) VALUES ($1, $2, 36.50), ($1, $3, 4.50), ($1, $4, 8.00)`,
  [pvd, harina, huevos, chispas]);
const oco = await unValor(`INSERT INTO ordenes_compra (pvd_codigo, emp_codigo, oco_fechaentrega) VALUES ($1, $2, CURRENT_DATE + 2) RETURNING oco_codigo`, [pvd, panadero]);
await q(`INSERT INTO detalles_orden_compra (oco_codigo, mat_codigo, doc_cantidad) VALUES ($1, $2, 2), ($1, $3, 1), ($1, $4, 1)`,
  [oco, harina, huevos, chispas]);
await debeFallar(`INSERT INTO detalles_orden_compra (oco_codigo, mat_codigo, doc_cantidad) VALUES ('${oco}', '${sal}', 1)`, 'Material que el proveedor no vende');
const totOc = (await q(`SELECT oco_subtotal::text s, oco_iva::text i, oco_total::text t FROM vw_ordenes_compra_totales WHERE oco_codigo = $1`, [oco]))[0];
ok(totOc.s === '85.50' && totOc.i === '1.20' && totOc.t === '86.70', `Precio del proveedor e IVA del material: ${JSON.stringify(totOc)}`);
await debeFallar(`INSERT INTO recepciones (oco_codigo) VALUES ('${oco}')`, 'Recepcion de una orden sin aprobar');
await q(`UPDATE ordenes_compra SET oco_estado = 'APR' WHERE oco_codigo = $1`, [oco]);
const rcp = await unValor(`SELECT rcp_codigo FROM recepciones WHERE oco_codigo = $1 AND rcp_estado = 'PEN'`, [oco]);
ok(!!rcp, 'Aprobar la orden crea su recepcion pendiente');
const asiCompra = (await q(`SELECT asi_codigo, asi_estado, asi_debe::text d, asi_cuadra c FROM vw_asientos WHERE asi_referencia = $1`, [oco]))[0];
ok(asiCompra?.asi_estado === 'PEN' && asiCompra.d === '86.70' && asiCompra.c, 'Y su asiento pendiente, que cuadra (86.70)');
await debeFallar(`UPDATE detalles_orden_compra SET doc_cantidad = 5 WHERE oco_codigo = '${oco}' AND mat_codigo = '${harina}'`, 'Cambiar una linea de una orden aprobada');
await debeFallar(`UPDATE ordenes_compra SET oco_estado = 'ANU' WHERE oco_codigo = '${oco}'`, 'Anular una orden ya aprobada');

const lote = (material, recibida, extra = '') => unValor(
  `INSERT INTO lotes_material (mat_codigo, rcp_codigo, oco_codigo, lma_cantidadrecibida ${extra ? ', lma_fechacaducidad' : ''})
   VALUES ($1, $2, $3, $4 ${extra ? ', ' + extra : ''}) RETURNING lma_codigo`, [material, rcp, oco, recibida]);
const loteHarina = await lote(harina, 2, 'CURRENT_DATE + 30');
await lote(huevos, 1);
const ingreso = (await q(`SELECT lma_cantidadinicial::text c, lma_costounitario::float8 u, lma_fechacaducidad - CURRENT_DATE d
                            FROM lotes_material WHERE lma_codigo = $1`, [loteHarina]))[0];
ok(ingreso.c === '90718.400' && Math.abs(ingreso.u - 36.5 / 45359.2) < 1e-6, `2 qq de harina = ${ingreso.c} g a ${ingreso.u.toFixed(6)} el gramo`);
const loteHuevos = (await q(`SELECT lma_cantidadinicial::text c, lma_fechacaducidad - CURRENT_DATE d FROM lotes_material WHERE mat_codigo = $1`, [huevos]))[0];
ok(loteHuevos.c === '30.000' && loteHuevos.d === 21, 'Una cubeta = 30 huevos, y caduca en 21 dias por su vida util');
await debeFallar(`INSERT INTO lotes_material (mat_codigo, rcp_codigo, oco_codigo, lma_cantidadrecibida) VALUES ('${sal}', '${rcp}', '${oco}', 1)`, 'Lote de algo que la orden no pidio');
const disponible = async (l) => (await q(`SELECT lma_disponible d FROM vw_lotes_saldo WHERE lma_codigo = $1`, [l]))[0].d;
ok(await disponible(loteHarina) === false, 'Un lote de una recepcion pendiente todavia no se puede usar');
await debeFallar(`UPDATE recepciones SET rcp_estado = 'REC' WHERE rcp_codigo = '${rcp}'`, 'Recibir sin decir quien recibe');
await q(`UPDATE recepciones SET rcp_estado = 'REC', emp_codigo = $1, rcp_observacion = 'Las chispas no llegaron' WHERE rcp_codigo = $2`, [panadero, rcp]);
ok(await disponible(loteHarina) === true, 'Recibida, el lote ya se puede usar');
const faltan = await q(`SELECT mat_nombre, doc_diferencia::text d FROM vw_ordenes_compra_recibido WHERE oco_codigo = $1 AND doc_diferencia <> 0`, [oco]);
ok(faltan.length === 1 && faltan[0].mat_nombre === 'Chispas de chocolate' && faltan[0].d === '1.00', 'La diferencia muestra lo que no llego');
await debeFallar(`INSERT INTO lotes_material (mat_codigo, rcp_codigo, oco_codigo, lma_cantidadrecibida) VALUES ('${chispas}', '${rcp}', '${oco}', 1)`, 'Agregar un lote a una recepcion ya recibida');

titulo('Produccion por lotes (FEFO y promedio)');
// Inventario inicial: harina que entro antes pero caduca despues, harina
// caducada, y dos lotes de sal (PROM) a distinto costo.
// La caducidad va en dias desde hoy y la calcula la base: con la fecha de
// Node (UTC) el lote "de ayer" caducaba hoy en Ecuador despues de las 19:00.
const inicial = (material, recibida, costo, ingreso, caducaEnDias) => unValor(
  `INSERT INTO lotes_material (mat_codigo, lma_cantidadrecibida, lma_costounitario, lma_fechaingreso, lma_fechacaducidad)
   VALUES ($1, $2, $3, $4, CURRENT_DATE + $5::int) RETURNING lma_codigo`, [material, recibida, costo, ingreso, caducaEnDias]);
const hace = (dias) => new Date(Date.now() - dias * 864e5).toISOString();
const harinaVieja = await inicial(harina, 1, 0.0007, hace(10), 100);
const harinaCaducada = await inicial(harina, 1, 0.0005, hace(200), -1);
await inicial(sal, 1, 0.001, hace(5), null);
await inicial(sal, 1, 0.002, hace(4), null);
for (const [nombre, costo] of [['Azúcar', 0.0012], ['Levadura fresca', 0.004], ['Mantequilla', 0.006]]) {
  await inicial(await mat(nombre), 1, costo, hace(1), null);
}
const pan = await unValor(`SELECT pro_codigo FROM productos WHERE pro_nombre = 'Pan redondo'`);
const unico = await unValor(`SELECT tam_codigo FROM tamanos WHERE tam_descripcion = 'Único'`);
const orden = (cantidad) => unValor(`INSERT INTO ordenes_produccion (pro_codigo, tam_codigo, emp_codigo, orp_cantidad)
  VALUES ($1, $2, $3, $4) RETURNING orp_codigo`, [pan, unico, panadero, cantidad]);
const orp = await orden(100);
await q(`UPDATE ordenes_produccion SET orp_estado = 'APR' WHERE orp_codigo = $1`, [orp]);
const consumos = await q(`SELECT m.mat_nombre, c.lma_codigo, c.cpr_cantidad::text n, c.cpr_costounitario::float8 u
                            FROM consumos_produccion c JOIN lotes_material l USING (lma_codigo) JOIN materiales m USING (mat_codigo)
                           WHERE c.orp_codigo = $1`, [orp]);
const deHarina = consumos.filter(c => c.mat_nombre === 'Harina de trigo');
ok(deHarina.length === 1 && deHarina[0].lma_codigo === loteHarina && deHarina[0].n === '6000.000',
  'FEFO: los 6000 g de harina salen del lote que caduca antes, no del que entro antes ni del caducado');
const deSal = consumos.find(c => c.mat_nombre === 'Sal');
ok(deSal && Math.abs(deSal.u - 0.0015) < 1e-9, `PROM: la sal se cuesta al promedio de sus lotes (${deSal?.u})`);
ok(consumos.length === 6, `Se consumieron los 6 materiales de la receta (${consumos.length})`);
const costo = (await q(`SELECT orp_costototal::text t, orp_costounitario::text u FROM vw_costo_produccion WHERE orp_codigo = $1`, [orp]))[0];
ok(!!costo && Number(costo.t) > 0, `Costo de la tanda: ${costo?.t} (${costo?.u} por pan)`);
const asiProd = (await q(`SELECT asi_debe::text d, asi_cuadra c FROM vw_asientos WHERE asi_referencia = $1`, [orp]))[0];
ok(asiProd?.c && asiProd.d === costo?.t, 'El asiento de produccion pasa ese costo de materia prima a productos terminados');
const grande = await orden(100000);
await debeFallar(`UPDATE ordenes_produccion SET orp_estado = 'APR' WHERE orp_codigo = '${grande}'`, 'Producir sin material suficiente');
ok((await unValor(`SELECT count(*)::int FROM consumos_produccion WHERE orp_codigo = $1`, [grande])) === 0, 'Y no queda nada consumido a medias');
const existencia = (await q(`SELECT pta_producido::int p, pta_vendido::int v, pta_existencia::int e FROM vw_existencias_productos WHERE pro_codigo = $1`, [pan]))[0];
ok(existencia.p === 100 && existencia.v === 10 && existencia.e === 90, `Pan redondo: 100 hechos, 10 vendidos, quedan ${existencia.e}`);

titulo('Ajustes y kardex');
const aju = await unValor(`INSERT INTO ajustes_inventario (emp_codigo, aju_motivo) VALUES ($1, 'Funda de harina rota') RETURNING aju_codigo`, [panadero]);
await q(`INSERT INTO detalles_ajuste (aju_codigo, lma_codigo, daj_cantidad) VALUES ($1, $2, -1000)`, [aju, loteHarina]);
await debeFallar(`UPDATE ajustes_inventario SET aju_estado = 'APR' WHERE aju_codigo = '${aju}'`, 'Aprobar un ajuste sin quien lo autorice');
await debeFallar(`UPDATE ajustes_inventario SET emp_codigoautoriza = '${panadero}' WHERE aju_codigo = '${aju}'`, 'Que lo autorice el mismo que lo hizo');
const ajuGrande = await unValor(`INSERT INTO ajustes_inventario (emp_codigo, aju_motivo) VALUES ($1, 'Conteo') RETURNING aju_codigo`, [panadero]);
await q(`INSERT INTO detalles_ajuste (aju_codigo, lma_codigo, daj_cantidad) VALUES ($1, $2, -999999)`, [ajuGrande, loteHarina]);
await debeFallar(`UPDATE ajustes_inventario SET aju_estado = 'APR', emp_codigoautoriza = '${contador}' WHERE aju_codigo = '${ajuGrande}'`, 'Ajuste que deja el lote en negativo');
await q(`UPDATE ajustes_inventario SET aju_estado = 'APR', emp_codigoautoriza = $1 WHERE aju_codigo = $2`, [contador, aju]);
const saldo = (await q(`SELECT lma_saldo::text s FROM vw_lotes_saldo WHERE lma_codigo = $1`, [loteHarina]))[0].s;
ok(saldo === '83718.400', `Saldo del lote: 90718,4 - 6000 producidos - 1000 de la funda rota = ${saldo}`);
const exist = (await q(`SELECT mat_existencia::text e, mat_existenciacompra::text c FROM vw_existencias_materiales WHERE mat_codigo = $1`, [harina]))[0];
const kardex = await q(`SELECT kar_tipo, kar_saldo::text s FROM vw_kardex WHERE mat_codigo = $1 ORDER BY kar_fecha, kar_documento, lma_codigo`, [harina]);
ok(exist.e === '129077.600' && exist.c === '2.85', `Existencia de harina sin el lote caducado: ${exist.e} g = ${exist.c} qq`);
// 90718,4 + 45359,2 + 45359,2 (caducado, sigue en libros) - 6000 - 1000
ok(kardex.length === 5 && kardex.at(-1).s === '174436.800',
  `Kardex de harina: ${kardex.map(k => k.kar_tipo).join(', ')}; saldo final ${kardex.at(-1)?.s}`);
ok((await disponible(harinaVieja)) && !(await disponible(harinaCaducada)), 'El lote caducado no esta disponible');

titulo('Nomina y contabilidad');
const nom = await unValor(`INSERT INTO nominas (emp_codigo, nom_anio, nom_mes) VALUES ($1, 2026, 10) RETURNING nom_codigo`, [panadero]);
const extra = await unValor(`SELECT cno_codigo FROM conceptos_nomina WHERE cno_numero = '1010'`);
await q(`INSERT INTO detalles_nomina (nom_codigo, cno_codigo, dno_cantidad, dno_valor) VALUES ($1, $2, 5, 25)`, [nom, extra]);
const rol = (await q(`SELECT nom_ingresos::text i, nom_descuentos::text d, nom_neto::text n FROM vw_nominas WHERE nom_codigo = $1`, [nom]))[0];
ok(rol.i === '625.00' && rol.d === '56.70' && rol.n === '568.30', `Rol: sueldo 600 + 25 de horas extra - 56,70 de IESS = ${rol.n}`);
await debeFallar(`INSERT INTO nominas (emp_codigo, nom_anio, nom_mes) VALUES ('${panadero}', 2026, 10)`, 'Dos roles del mismo mes');
await q(`UPDATE nominas SET nom_estado = 'APR' WHERE nom_codigo = $1`, [nom]);
const asiNom = (await q(`SELECT asi_codigo, asi_debe::text d, asi_cuadra c FROM vw_asientos WHERE asi_referencia = $1`, [nom]))[0];
ok(asiNom?.c && asiNom.d === '625.00', 'El asiento del rol cuadra: 625 al DEBE, IESS y bancos al HABER');

await debeFallar(`UPDATE asientos SET asi_estado = 'APR' WHERE asi_codigo = '${asiCompra.asi_codigo}'`, 'Aprobar un asiento sin el contador');
await q(`UPDATE asientos SET asi_estado = 'APR', emp_codigo = $1 WHERE asi_codigo = $2`, [contador, asiCompra.asi_codigo]);
ok((await unValor(`SELECT asi_estado FROM asientos WHERE asi_codigo = $1`, [asiCompra.asi_codigo])) === 'APR', 'Un asiento que cuadra se aprueba');
const manual = await unValor(`INSERT INTO asientos (asi_descripcion) VALUES ('Aporte de capital') RETURNING asi_codigo`);
const cuenta = (numero) => unValor(`SELECT cue_codigo FROM cuentas_contables WHERE cue_numero = $1`, [numero]);
await q(`INSERT INTO detalles_asiento (asi_codigo, cue_codigo, das_debe) VALUES ($1, $2, 1000)`, [manual, await cuenta('1.1.01.02')]);
await q(`INSERT INTO detalles_asiento (asi_codigo, cue_codigo, das_haber) VALUES ($1, $2, 900)`, [manual, await cuenta('3.1.01')]);
await debeFallar(`INSERT INTO detalles_asiento (asi_codigo, cue_codigo, das_haber) VALUES ('${manual}', '${await cuenta('1.1')}', 100)`, 'Valor en una cuenta de mayor');
await debeFallar(`INSERT INTO detalles_asiento (asi_codigo, cue_codigo, das_debe, das_haber) VALUES ('${manual}', '${await cuenta('5.2.01')}', 10, 10)`, 'DEBE y HABER en la misma linea');
await q(`UPDATE asientos SET asi_estado = 'APR', emp_codigo = $1 WHERE asi_codigo = $2`, [contador, manual]);
ok((await unValor(`SELECT asi_estado FROM asientos WHERE asi_codigo = $1`, [manual])) === 'ERR', 'Uno que no cuadra (1000 contra 900) queda en ERR');
await q(`UPDATE detalles_asiento SET das_haber = 1000 WHERE asi_codigo = $1 AND das_haber > 0`, [manual]);
await q(`UPDATE asientos SET asi_estado = 'APR' WHERE asi_codigo = $1`, [manual]);
ok((await unValor(`SELECT asi_estado FROM asientos WHERE asi_codigo = $1`, [manual])) === 'APR', 'Corregido, se aprueba');
await debeFallar(`UPDATE detalles_asiento SET das_debe = 1 WHERE asi_codigo = '${manual}'`, 'Cambiar un asiento aprobado');
await debeFallar(`INSERT INTO cuentas_contables (cue_numero, cue_nombre, cue_tipo) VALUES ('1.1.09.01', 'Sin madre', 'DET')`, 'Cuenta sin cuenta madre');
const bancos = (await q(`SELECT cue_saldo::text s FROM vw_saldos_cuentas WHERE cue_numero = '1.1.01.02'`))[0].s;
ok(bancos === '1000.00', `El mayor de bancos solo cuenta asientos aprobados: ${bancos}`);

titulo('Accesos y auditoria');
const acceso = (usu, exitoso, motivo) => unValor(
  `INSERT INTO accesos (usu_codigo, acc_exitoso, acc_motivo) VALUES ($1, $2, $3) RETURNING acc_motivo`, [usu, exitoso, motivo]);
await acceso(luis, true, null);
await debeFallar(`INSERT INTO accesos (usu_codigo, acc_exitoso, acc_motivo) VALUES ('${luis}', true, 'CLA')`, 'Acceso bueno con motivo de fallo');
await debeFallar(`INSERT INTO accesos (usu_codigo, acc_exitoso) VALUES ('${luis}', false)`, 'Acceso fallido sin motivo');
for (let i = 0; i < 4; i++) await acceso(luis, false, 'CLA');
ok(await acceso(luis, true, null) === null, 'Con 4 fallos todavia entra');
for (let i = 0; i < 5; i++) await acceso(luis, false, 'CLA');
ok(await acceso(luis, true, null) === 'BLO', 'Con 5 fallos seguidos, la clave buena queda bloqueada');
ok(await unValor(`SELECT usu_bloqueado FROM vw_usuarios WHERE usu_codigo = $1`, [luis]) === true, 'La vista dice que la cuenta esta bloqueada');
await debeFallar(`DELETE FROM accesos WHERE usu_codigo = '${luis}'`, 'Borrar el log de accesos');

const audCarga = await unValor(`SELECT count(*)::int FROM auditorias WHERE aud_tabla = 'PRODUCTOS' AND usu_codigo IS NULL AND aud_operacion = 'I'`);
ok(audCarga === 17, `La carga inicial queda auditada sin usuario (${audCarga} productos)`);
await q(`SELECT set_config('app.usuario', $1, false)`, [ana]);
const pt = (await q(`SELECT pro_codigo, tam_codigo, pta_precio::text p FROM productos_tamanos ORDER BY pro_codigo, tam_codigo LIMIT 1`))[0];
await q(`UPDATE productos_tamanos SET pta_precio = pta_precio + 0.05 WHERE pro_codigo = $1 AND tam_codigo = $2`, [pt.pro_codigo, pt.tam_codigo]);
const cambio = (await q(`SELECT usu_codigo, aud_operacion, aud_clave, aud_antes ->> 'pta_precio' antes, aud_despues ->> 'pta_precio' despues
  FROM auditorias WHERE aud_tabla = 'PRODUCTOS_TAMANOS' ORDER BY aud_codigo DESC LIMIT 1`))[0];
ok(cambio.usu_codigo === ana && cambio.aud_operacion === 'U' && cambio.aud_clave === pt.pro_codigo + '|' + pt.tam_codigo
  && Number(cambio.antes) === Number(pt.p) && Math.abs(Number(cambio.despues) - Number(pt.p) - 0.05) < 1e-9,
  `Cambio de precio auditado con quien, la llave compuesta, antes y despues (${cambio.antes} -> ${cambio.despues})`);
const antes = await unValor(`SELECT count(*)::int FROM auditorias`);
await q(`UPDATE productos_tamanos SET pta_precio = pta_precio WHERE pro_codigo = $1 AND tam_codigo = $2`, [pt.pro_codigo, pt.tam_codigo]);
ok(await unValor(`SELECT count(*)::int FROM auditorias`) === antes, 'Un UPDATE que no cambia nada no se anota');
await q(`UPDATE usuarios SET usu_celular = '0990000000' WHERE usu_codigo = $1`, [luis]);
const filaUsu = (await q(`SELECT aud_antes, aud_despues FROM auditorias WHERE aud_tabla = 'USUARIOS' ORDER BY aud_codigo DESC LIMIT 1`))[0];
ok(filaUsu.aud_antes.usu_celular === '0997654321' && filaUsu.aud_despues.usu_celular === '0990000000',
  'La auditoria de usuarios anota el antes y el despues');
await debeFallar(`UPDATE auditorias SET usu_codigo = NULL`, 'Cambiar la auditoria');
await q(`SELECT set_config('app.usuario', '', false)`);

const cuentaTrabajo = await nuevoUsuario('carlos@eltradicional.ec', '0981112233');
const cuentaPersonal = await nuevoUsuario('carlos.grefa@correo.ec', '0981112233');
await q(`UPDATE usuarios SET emp_codigo = $1 WHERE usu_codigo IN ($2, $3)`, [panadero, cuentaTrabajo, cuentaPersonal]);
ok(await unValor(`SELECT count(*)::int FROM usuarios WHERE emp_codigo = $1`, [panadero]) === 2, 'Un empleado puede tener dos cuentas (1:N)');
await debeFallar(`UPDATE usuarios SET emp_codigo = 'EMP9999999' WHERE usu_codigo = '${cuentaTrabajo}'`, 'Cuenta de un empleado que no existe');
await q(`SELECT set_config('app.usuario', $1, false)`, [cuentaTrabajo]);
await q(`UPDATE empleados SET emp_sueldo = 610 WHERE emp_codigo = $1`, [contador]);
const quien = await unValor(`SELECT e.emp_primernombre FROM auditorias a JOIN usuarios u ON u.usu_codigo = a.usu_codigo
  JOIN empleados e ON e.emp_codigo = u.emp_codigo WHERE a.aud_tabla = 'EMPLEADOS' ORDER BY a.aud_codigo DESC LIMIT 1`);
ok(quien === 'Carlos', `La auditoria llega al empleado que hizo el cambio por su cuenta (${quien})`);
await q(`SELECT set_config('app.usuario', '', false)`);

titulo('Pedidos del sitio (FN_PEDIDOS_REGISTRAR, lo que llama la API)');
const authAna = await unValor(`SELECT usu_codigoauth::text FROM usuarios WHERE usu_codigo = $1`, [ana]);
const registrar = async (pedido, auth = authAna) => (await q(`SELECT FN_PEDIDOS_REGISTRAR($1::uuid, $2::jsonb) r`, [auth, JSON.stringify(pedido)]))[0].r;
const facturasAntes = await unValor(`SELECT count(*)::int FROM facturas`);
const web = await registrar({
  lineas: [{ nombre: 'Pan redondo', cantidad: 10 }, { nombre: 'coca-cola 1 L', cantidad: 2 }],
  modo: 'domicilio', direccion: 'Av. 15 de Noviembre y Tarqui', piso: 'Piso 2', referencia: 'Frente al parque', notas: 'Llamar al llegar',
  metodo: 'tarjeta', ultimos: '4242', factura: { aOtro: true, nombre: 'Ana Pérez', ident: '1710034065', correo: 'ANA@correo.ec' },
});
ok(/^ET-[2-9A-HJ-NP-Z]{4}$/.test(web.numero) && web.modo === 'domicilio' && web.estado === 'Pagado',
  `Pedido con tarjeta a domicilio: ${web.numero}, ${web.estado}`);
// El de hoy: la auditoria de arriba le subio 5 centavos al pan.
const deHoy = Number(await unValor(`SELECT sum(c * pta_precio)::text FROM (VALUES ('Pan redondo', 'Único', 10), ('Coca-Cola', '1 L', 2)) v (n, t, c)
  JOIN productos p ON p.pro_nombre = v.n JOIN tamanos ta ON ta.tam_descripcion = v.t
  JOIN productos_tamanos pt ON pt.pro_codigo = p.pro_codigo AND pt.tam_codigo = ta.tam_codigo`));
ok(Number(web.subtotal) === deHoy && Number(web.envio) === 1.5 && Number(web.total) === deHoy + 1.5 && web.lineas.length === 2,
  `La base pone los precios de hoy y el total (${web.subtotal} + ${web.envio} = ${web.total})`);
ok(web.direccion === 'Av. 15 de Noviembre y Tarqui · Piso 2 · Frente al parque' && web.metodo === 'Tarjeta terminada en 4242',
  `Direccion y metodo como los ensena el sitio (${web.direccion}; ${web.metodo})`);
const pedWeb = await unValor(`SELECT ped_codigo FROM pedidos WHERE ped_numero = $1`, [web.numero]);
ok(await unValor(`SELECT count(*)::int FROM facturas WHERE ped_codigo = $1`, [pedWeb]) === 1
  && await unValor(`SELECT c.cli_identificacion FROM facturas f JOIN clientes c USING (cli_codigo) WHERE f.ped_codigo = $1`, [pedWeb]) === '1710034065',
  'La factura sale a nombre del cliente que ya existia (por su cedula)');
ok(await unValor(`SELECT pag_aprobado::text FROM pagos WHERE ped_codigo = $1`, [pedWeb]) === 'true', 'El pago con tarjeta queda aprobado');
ok(await unValor(`SELECT count(*)::int FROM auditorias WHERE aud_tabla = 'ASIENTOS' AND usu_codigo = $1`, [ana]) >= 1,
  'El asiento de la venta queda auditado con quien hizo el pedido');
const efectivo = await registrar({ lineas: [{ nombre: 'Galletas', cantidad: 1 }], modo: 'retiro', metodo: 'efectivo', factura: { aOtro: false } });
ok(efectivo.estado === 'Pendiente de pago' && efectivo.metodo === 'Efectivo al retirar' && Number(efectivo.envio) === 0,
  `En efectivo y para retirar: ${efectivo.estado}, ${efectivo.metodo}`);
ok(await unValor(`SELECT c.tid_codigo FROM facturas f JOIN clientes c USING (cli_codigo) JOIN pedidos p USING (ped_codigo) WHERE p.ped_numero = $1`, [efectivo.numero]) === '07',
  'Sin otra persona, la factura va a consumidor final');
const dirs = await unValor(`SELECT count(*)::int FROM direcciones WHERE usu_codigo = $1`, [ana]);
await registrar({ lineas: [{ nombre: 'Pan redondo', cantidad: 1 }], modo: 'domicilio', direccion: 'Av. 15 de Noviembre y Tarqui', piso: 'Piso 2', referencia: 'Frente al parque', metodo: 'efectivo' });
ok(await unValor(`SELECT count(*)::int FROM direcciones WHERE usu_codigo = $1`, [ana]) === dirs, 'La misma direccion se reusa');
const pedidosAntes = await unValor(`SELECT count(*)::int FROM pedidos`);
const fallaWeb = async (pedido, texto, msg, auth) => {
  try { await registrar(pedido, auth); ok(false, `${msg}: entro`); } catch (e) { ok(e.code === '22023' && e.message.includes(texto), `${msg}: ${e.message}`); }
};
await fallaWeb({ lineas: [{ nombre: 'Palanqueta', cantidad: 1 }], modo: 'retiro', metodo: 'efectivo' }, 'Ya no tenemos Palanqueta', 'Producto agotado');
await fallaWeb({ lineas: [{ nombre: 'Pan redondo', cantidad: 1 }, { nombre: 'Pan de nada', cantidad: 1 }], modo: 'retiro', metodo: 'efectivo' }, 'Ya no tenemos Pan de nada', 'Producto que no existe, tras uno bueno');
await fallaWeb({ lineas: [{ nombre: 'Pan redondo', cantidad: 101 }], modo: 'retiro', metodo: 'efectivo' }, 'de 1 a 100', 'Cantidad 101');
await fallaWeb({ lineas: [], modo: 'retiro', metodo: 'efectivo' }, 'vacía', 'Canasta vacia');
await fallaWeb({ lineas: [{ nombre: 'Pan redondo', cantidad: 1 }], modo: 'domicilio', direccion: ' ', metodo: 'efectivo' }, 'dirección', 'A domicilio sin direccion');
await fallaWeb({ lineas: [{ nombre: 'Pan redondo', cantidad: 1 }], modo: 'retiro', metodo: 'tarjeta' }, 'tarjeta', 'Tarjeta sin sus numeros');
await fallaWeb({ lineas: [{ nombre: 'Pan redondo', cantidad: 1 }], modo: 'retiro', metodo: 'efectivo', factura: { aOtro: true, nombre: 'X', ident: '1710034066' } }, 'no es válido', 'Factura con cedula invalida');
await fallaWeb({ lineas: [{ nombre: 'Pan redondo', cantidad: 1 }], modo: 'retiro', metodo: 'efectivo' }, 'no tiene datos', 'Cuenta de Auth sin fila en USUARIOS', '00000000-0000-0000-0000-000000000000');
ok(await unValor(`SELECT count(*)::int FROM pedidos`) === pedidosAntes, 'Un pedido que falla no deja nada a medias');
ok(await unValor(`SELECT count(*)::int FROM facturas`) === facturasAntes + 3, 'Tres pedidos, tres facturas');
const deAna = (await q(`SELECT FN_PEDIDOS_DE($1::uuid) r`, [authAna]))[0].r;
const authLuis = await unValor(`SELECT usu_codigoauth::text FROM usuarios WHERE usu_codigo = $1`, [luis]);
const deLuis = (await q(`SELECT FN_PEDIDOS_DE($1::uuid) r`, [authLuis]))[0].r;
ok(deAna.length === 4 && deAna.some((x) => x.numero === web.numero) && deLuis.length === 0,
  `Cada cuenta ve solo sus pedidos (Ana ${deAna.length}, Luis ${deLuis.length})`);

console.log(fallos ? `\n${fallos} comprobacion(es) fallaron` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
