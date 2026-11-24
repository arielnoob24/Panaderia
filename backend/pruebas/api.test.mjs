// ---- Pruebas de la API (npm run probar) --------------------------------
// Sin Supabase y sin credenciales: la base es bd/BD_EL_TRADICIONAL.sql en
// PGlite (pruebas/baseLocal.mjs), con sus tablas, CHECK, triggers y
// funciones de verdad; Supabase Auth es un servidor de mentira que guarda los
// metadatos de cada cuenta; los tokens JWT se firman aqui con un secreto
// HS256 de prueba. La API se levanta en un puerto libre y se le habla con
// fetch, como lo haria la pagina.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { SignJWT } from 'jose';
import { levantarBase } from './baseLocal.mjs';

const SECRETO = 'secreto-solo-para-las-pruebas-de-el-tradicional';
const NETLIFY = 'https://el-tradicional-panaderia.netlify.app';
const CATALOGO = JSON.parse(readFileSync(new URL('../../frontend/data/productos.json', import.meta.url), 'utf8')).productos;

let base; let api; let auth; let URL_API;
const metadatos = new Map(); // id de Auth -> user_metadata

// Supabase Auth de mentira: GET y PUT /auth/v1/admin/users/:id, y pide la
// clave de servicio como la de verdad.
const fingirAuth = () => new Promise((listo) => {
  const s = createServer((req, res) => {
    const id = req.url.split('/').pop();
    if (req.headers.apikey !== 'clave-de-servicio-de-prueba') { res.writeHead(401); return res.end('{}'); }
    let cuerpo = '';
    req.on('data', (t) => { cuerpo += t; });
    req.on('end', () => {
      if (req.method === 'PUT') metadatos.set(id, JSON.parse(cuerpo).user_metadata);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id, user_metadata: metadatos.get(id) || {} }));
    });
  });
  s.listen(0, '127.0.0.1', () => listo(s));
});

// Un token como los de Supabase Auth: firmado, con aud "authenticated".
const token = ({ id = randomUUID(), correo, secreto = SECRETO, caduca = '1h' } = {}) => new SignJWT({
  email: correo, role: 'authenticated', user_metadata: { email_verified: true },
}).setProtectedHeader({ alg: 'HS256' }).setSubject(id).setAudience('authenticated')
  .setIssuedAt().setExpirationTime(caduca).sign(new TextEncoder().encode(secreto));

// Una peticion a la API; devuelve { estado, cuerpo, cabeceras }.
const pedir = async (ruta, { metodo = 'GET', cuerpo, jwt, cabeceras = {} } = {}) => {
  const r = await fetch(`${URL_API}${ruta}`, {
    method: metodo,
    headers: {
      ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...cabeceras,
    },
    body: cuerpo === undefined ? undefined : (typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)),
  });
  const texto = await r.text();
  return { estado: r.status, cuerpo: texto ? JSON.parse(texto) : null, cabeceras: r.headers };
};

// Una cuenta verificada con su fila en USUARIOS (POST /cuenta).
const ANA = { nombre: 'Ana María Pérez', telefono: '991234567', direccion: 'Calle 1 y Calle 2', metodo: 'efectivo' };
const crearCuenta = async (correo, datos = ANA) => {
  const id = randomUUID();
  const jwt = await token({ id, correo });
  const r = await pedir('/api/cuenta', { metodo: 'POST', jwt, cuerpo: datos });
  assert.equal(r.estado, 201, JSON.stringify(r.cuerpo));
  return { id, jwt };
};

before(async () => {
  base = await levantarBase();
  auth = await fingirAuth();
  process.env.DATABASE_URL = base.url;
  process.env.SUPABASE_URL = `http://127.0.0.1:${auth.address().port}`;
  process.env.SUPABASE_JWT_SECRET = SECRETO;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-de-servicio-de-prueba';
  process.env.ORIGENES_PERMITIDOS = `${NETLIFY},https://*--el-tradicional-panaderia.netlify.app`;
  // La app se carga despues de poner el entorno: config.js lo lee al cargarse.
  const { default: app } = await import('../src/app.js');
  api = await new Promise((listo) => { const s = app.listen(0, '127.0.0.1', () => listo(s)); });
  URL_API = `http://127.0.0.1:${api.address().port}`;
});

after(async () => {
  api?.close();
  auth?.close();
  const { prisma } = await import('../src/db.js');
  await prisma.$disconnect();
  await base?.cerrar();
});

describe('middlewares', () => {
  test('GET /api/salud responde 200 y un Correlation-ID nuevo', async () => {
    const r = await pedir('/api/salud');
    assert.equal(r.estado, 200);
    assert.deepEqual(r.cuerpo, { estado: 'bien' });
    assert.match(r.cabeceras.get('x-correlation-id'), /^[0-9a-f-]{36}$/);
  });

  test('devuelve el Correlation-ID que manda el cliente, y cambia uno con basura', async () => {
    assert.equal((await pedir('/api/salud', { cabeceras: { 'X-Correlation-ID': 'pedido-123' } })).cabeceras.get('x-correlation-id'), 'pedido-123');
    assert.notEqual((await pedir('/api/salud', { cabeceras: { 'X-Correlation-ID': 'a b<script>' } })).cabeceras.get('x-correlation-id'), 'a b<script>');
  });

  test('CORS: deja a Netlify, a sus vistas previas y a localhost; no a otro sitio', async () => {
    const origen = async (o) => (await pedir('/api/salud', { cabeceras: { Origin: o } })).cabeceras.get('access-control-allow-origin');
    assert.equal(await origen(NETLIFY), NETLIFY);
    assert.equal(await origen('https://efra--el-tradicional-panaderia.netlify.app'), 'https://efra--el-tradicional-panaderia.netlify.app');
    assert.equal(await origen('http://localhost:5173'), 'http://localhost:5173');
    assert.equal(await origen('https://el-tradicional-panaderia.netlify.app.malo.com'), null);
  });

  test('CORS: la pregunta previa permite PATCH y DELETE con Authorization', async () => {
    const r = await fetch(`${URL_API}/api/productos/PRO001`, {
      method: 'OPTIONS',
      headers: { Origin: NETLIFY, 'Access-Control-Request-Method': 'DELETE', 'Access-Control-Request-Headers': 'authorization' },
    });
    assert.equal(r.status, 204);
    assert.match(r.headers.get('access-control-allow-methods'), /PATCH/);
    assert.match(r.headers.get('access-control-allow-methods'), /DELETE/);
  });

  test('una ruta que no existe es 404 en JSON', async () => {
    const r = await pedir('/api/no-existe');
    assert.equal(r.estado, 404);
    assert.match(r.cuerpo.error, /No existe GET \/api\/no-existe/);
  });

  test('un cuerpo que no es JSON es 400', async () => {
    const { jwt } = await crearCuenta('cuerpo@correo.com');
    const r = await fetch(`${URL_API}/api/cuenta`, { method: 'PUT', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' }, body: '{nombre:' });
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error, 'El cuerpo no es JSON válido.');
  });

  test('un error inesperado es 500 sin detalles, con su Correlation-ID', async () => {
    const { manejarErrores } = await import('../src/middlewares/errores.js');
    const res = { estado: 0, cuerpo: null, status(e) { this.estado = e; return this; }, json(c) { this.cuerpo = c; return this; } };
    const antes = console.error; console.error = () => {};
    try { manejarErrores(new Error('detalle interno de la base'), { correlacion: 'abc' }, res, () => {}); } finally { console.error = antes; }
    assert.equal(res.estado, 500);
    assert.deepEqual(res.cuerpo, { error: 'Algo falló en el servidor. Intenta otra vez.', correlacion: 'abc' });
  });
});

describe('autenticacion y autorizacion (JWT)', () => {
  const NUEVO = { nombre: 'Pan de prueba', categoria: 'panes', foto: 'assets/img/productos/pan-redondo', alt: 'Un pan de prueba', iva: '0', precio: 0.5 };

  test('sin token: 401', async () => {
    assert.equal((await pedir('/api/productos', { metodo: 'POST', cuerpo: NUEVO })).estado, 401);
    assert.equal((await pedir('/api/pedidos')).estado, 401);
  });

  test('token firmado con otro secreto o caducado: 401', async () => {
    assert.equal((await pedir('/api/pedidos', { jwt: await token({ correo: 'x@correo.com', secreto: 'otro-secreto-que-no-es-el-del-proyecto' }) })).estado, 401);
    assert.equal((await pedir('/api/pedidos', { jwt: await token({ correo: 'x@correo.com', caduca: '-1m' }) })).estado, 401);
    assert.equal((await pedir('/api/pedidos', { jwt: 'no.es.un-jwt' })).estado, 401);
  });

  test('una cuenta de Cliente no puede escribir productos: 403', async () => {
    const { jwt } = await crearCuenta('cliente@correo.com');
    const r = await pedir('/api/productos', { metodo: 'POST', jwt, cuerpo: NUEVO });
    assert.equal(r.estado, 403);
    assert.equal(r.cuerpo.error, 'Tu cuenta no tiene permiso para esto.');
  });

  test('con token pero sin fila en USUARIOS: 403 al escribir', async () => {
    assert.equal((await pedir('/api/productos', { metodo: 'POST', jwt: await token({ correo: 'nadie@correo.com' }), cuerpo: NUEVO })).estado, 403);
  });
});

describe('GET publicos: el catalogo y las categorias', () => {
  test('GET /api/productos: 200, el mismo catalogo que frontend/data/productos.json', async () => {
    const r = await pedir('/api/productos');
    assert.equal(r.estado, 200);
    assert.equal(r.cabeceras.get('cache-control'), 'public, max-age=60');
    assert.equal(r.cuerpo.productos.length, CATALOGO.length);
    for (const [i, p] of CATALOGO.entries()) {
      const q = r.cuerpo.productos[i];
      assert.equal(q.nombre, p.nombre);
      assert.equal(q.categoria, p.categoria);
      assert.equal(q.precio, p.precio, p.nombre);
      assert.equal(q.disponible, p.disponible !== false, p.nombre);
      assert.deepEqual(q.tamanos, p.tamanos, p.nombre);
      assert.match(q.codigo, /^PRO\d{3}$/);
    }
  });

  test('GET /api/productos?categoria=bebidas-frias&disponible=true filtra; un filtro mal es 400', async () => {
    const r = await pedir('/api/productos?categoria=bebidas-frias&disponible=true');
    assert.equal(r.estado, 200);
    assert.ok(r.cuerpo.productos.length > 0);
    assert.ok(r.cuerpo.productos.every((p) => p.categoria === 'bebidas-frias' && p.disponible));
    assert.equal((await pedir('/api/productos?disponible=quizas')).estado, 400);
  });

  test('GET /api/productos/:codigo: 200 el producto, 404 si no existe', async () => {
    const r = await pedir('/api/productos/PRO001');
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.nombre, CATALOGO[0].nombre);
    assert.equal((await pedir('/api/productos/PRO999')).estado, 404);
  });

  test('GET /api/categorias y /:slug: la relacion 1:N con productos', async () => {
    const todas = await pedir('/api/categorias');
    assert.equal(todas.estado, 200);
    assert.equal(todas.cuerpo.categorias.reduce((s, c) => s + c.productos, 0), CATALOGO.length);
    const panes = await pedir('/api/categorias/panes');
    assert.equal(panes.estado, 200);
    assert.equal(panes.cuerpo.productos.length, CATALOGO.filter((p) => p.categoria === 'panes').length);
    assert.equal((await pedir('/api/categorias/no-existe')).estado, 404);
  });
});

describe('/api/cuenta', () => {
  test('crear, leer y cambiar la cuenta; 404 y 400 donde toca', async () => {
    const id = randomUUID();
    const jwt = await token({ id, correo: 'luis@correo.com' });
    assert.equal((await pedir('/api/cuenta', { jwt })).estado, 404);
    assert.equal((await pedir('/api/cuenta', { metodo: 'PUT', jwt, cuerpo: ANA })).estado, 404);
    const mal = await pedir('/api/cuenta', { metodo: 'POST', jwt, cuerpo: { ...ANA, telefono: '12' } });
    assert.equal(mal.estado, 400);
    assert.match(mal.cuerpo.error, /teléfono/);

    const creada = await pedir('/api/cuenta', { metodo: 'POST', jwt, cuerpo: { ...ANA, nombre: 'Luis Andrés Mora Vega', metodo: 'tarjeta' } });
    assert.equal(creada.estado, 201);
    assert.deepEqual(creada.cuerpo, { nombre: 'Luis Andrés Mora Vega', correo: 'luis@correo.com', telefono: '991234567', direccion: 'Calle 1 y Calle 2', metodo: 'tarjeta' });
    // Verificada otra vez (otra pestana): 200 con la que ya habia.
    assert.equal((await pedir('/api/cuenta', { metodo: 'POST', jwt, cuerpo: ANA })).estado, 200);

    const cambiada = await pedir('/api/cuenta', { metodo: 'PUT', jwt, cuerpo: { ...ANA, nombre: 'Luis Mora', telefono: '987654321', direccion: 'Av. 15 de Noviembre' } });
    assert.equal(cambiada.estado, 200);
    const leida = await pedir('/api/cuenta', { jwt });
    assert.deepEqual(leida.cuerpo, { nombre: 'Luis Mora', correo: 'luis@correo.com', telefono: '987654321', direccion: 'Av. 15 de Noviembre', metodo: 'efectivo' });
  });
});

describe('/api/pedidos (la base registra todo en una transaccion)', () => {
  test('GET vacio, POST 201 con el total que pone la base, 400 con el texto de la base, GET con el pedido', async () => {
    const { jwt } = await crearCuenta('pedidos@correo.com');
    assert.deepEqual((await pedir('/api/pedidos', { jwt })).cuerpo, { pedidos: [] });

    const pedido = { clave: randomUUID(), lineas: [{ nombre: 'Pan redondo', cantidad: 4 }], modo: 'retiro', metodo: 'efectivo', ultimos: '', factura: { aOtro: false } };
    const hecho = await pedir('/api/pedidos', { metodo: 'POST', jwt, cuerpo: pedido });
    assert.equal(hecho.estado, 201, JSON.stringify(hecho.cuerpo));
    assert.match(hecho.cuerpo.numero, /^ET-[A-Z0-9]{4}$/);
    // 4 x $0.25: el precio lo puso la base, no la peticion.
    assert.equal(Number(hecho.cuerpo.total), 1);

    const vacio = await pedir('/api/pedidos', { metodo: 'POST', jwt, cuerpo: { ...pedido, clave: randomUUID(), lineas: [] } });
    assert.equal(vacio.estado, 400);
    assert.equal(vacio.cuerpo.error, 'Tu canasta está vacía.');
    assert.equal((await pedir('/api/pedidos', { metodo: 'POST', jwt, cuerpo: [1, 2] })).estado, 400);

    const lista = await pedir('/api/pedidos', { jwt });
    assert.equal(lista.cuerpo.pedidos.length, 1);
    assert.equal(lista.cuerpo.pedidos[0].numero, hecho.cuerpo.numero);
  });
});

describe('CRUD de /api/productos (rol Administrador)', () => {
  let jwt; let usuario;
  before(async () => {
    const c = await crearCuenta('admin@correo.com', { ...ANA, nombre: 'Rosa Admin' });
    jwt = c.jwt;
    // Se le da el rol Administrador directo en la base (como lo haria el dueno).
    const r = await base.db.query(`UPDATE usuarios SET rol_codigo = (SELECT rol_codigo FROM roles WHERE rol_nombre = 'Administrador')
      WHERE usu_correo = 'admin@correo.com' RETURNING usu_codigo`);
    usuario = r.rows[0].usu_codigo;
  });

  const NUEVO = { nombre: 'Jugo de naranja', categoria: 'bebidas-frias', foto: 'assets/img/productos/jugo-de-naranja', alt: 'Vaso de jugo de naranja recién exprimido', iva: '4', etiqueta: 'Recién hecho', tamanos: [{ valor: '300 ml', precio: 0.75 }, { valor: '500 ml', precio: 1.25 }] };
  let codigo;

  test('POST: 201 con Location; nombre repetido 409; datos mal 400', async () => {
    const r = await pedir('/api/productos', { metodo: 'POST', jwt, cuerpo: NUEVO });
    assert.equal(r.estado, 201, JSON.stringify(r.cuerpo));
    codigo = r.cuerpo.codigo;
    assert.equal(r.cabeceras.get('location'), `/api/productos/${codigo}`);
    assert.deepEqual(r.cuerpo.tamanos, NUEVO.tamanos);
    assert.equal(r.cuerpo.precio, 0.75);
    assert.equal(r.cuerpo.iva, '4');
    assert.equal(r.cuerpo.etiqueta?.texto, 'Recién hecho');

    assert.equal((await pedir('/api/productos', { metodo: 'POST', jwt, cuerpo: NUEVO })).estado, 409);
    for (const malo of [
      { ...NUEVO, nombre: 'Otro', iva: undefined },
      { ...NUEVO, nombre: 'Otro', tamanos: [{ valor: '1 L', precio: 0 }] },
      { ...NUEVO, nombre: 'Otro', tamanos: [{ valor: 'Gigante', precio: 1 }] },
      { ...NUEVO, nombre: 'Otro', categoria: 'no-existe' },
      { ...NUEVO, nombre: 'Otro', foto: 'pan.jpg' },
      { ...NUEVO, nombre: 'Otro', sobra: 1 },
    ]) {
      const m = await pedir('/api/productos', { metodo: 'POST', jwt, cuerpo: malo });
      assert.equal(m.estado, 400, JSON.stringify(malo));
      assert.ok(m.cuerpo.error);
    }
  });

  test('GET /:codigo lo trae como se creo', async () => {
    const r = await pedir(`/api/productos/${codigo}`);
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.nombre, 'Jugo de naranja');
  });

  test('PUT reemplaza todo (con sus tamanos); 404 si no existe; 400 si falta algo', async () => {
    const r = await pedir(`/api/productos/${codigo}`, { metodo: 'PUT', jwt, cuerpo: { ...NUEVO, nombre: 'Jugo de naranja natural', etiqueta: null, tamanos: [{ valor: '1 L', precio: 2 }, { valor: '500 ml', precio: 1.3 }] } });
    assert.equal(r.estado, 200, JSON.stringify(r.cuerpo));
    assert.equal(r.cuerpo.nombre, 'Jugo de naranja natural');
    assert.equal(r.cuerpo.etiqueta, undefined);
    assert.deepEqual(r.cuerpo.tamanos, [{ valor: '1 L', precio: 2 }, { valor: '500 ml', precio: 1.3 }]);
    assert.equal((await pedir('/api/productos/PRO999', { metodo: 'PUT', jwt, cuerpo: NUEVO })).estado, 404);
    assert.equal((await pedir(`/api/productos/${codigo}`, { metodo: 'PUT', jwt, cuerpo: { nombre: 'Solo el nombre' } })).estado, 400);
  });

  test('PATCH cambia solo lo que llega', async () => {
    const r = await pedir(`/api/productos/${codigo}`, { metodo: 'PATCH', jwt, cuerpo: { disponible: false, destacado: true } });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.disponible, false);
    assert.equal(r.cuerpo.destacado, true);
    assert.equal(r.cuerpo.nombre, 'Jugo de naranja natural');
    assert.equal((await pedir(`/api/productos/${codigo}`, { metodo: 'PATCH', jwt, cuerpo: {} })).estado, 400);
    // Con varios tamanos, "precio" solo no se sabe a cual va.
    assert.equal((await pedir(`/api/productos/${codigo}`, { metodo: 'PATCH', jwt, cuerpo: { precio: 2 } })).estado, 400);
    // Con un solo tamano, si (Pan redondo, PRO001, "Único").
    const p = await pedir('/api/productos/PRO001', { metodo: 'PATCH', jwt, cuerpo: { precio: 0.3 } });
    assert.equal(p.estado, 200);
    assert.equal(p.cuerpo.precio, 0.3);
    assert.equal(p.cuerpo.tamanos, undefined);
    assert.equal((await pedir('/api/productos/PRO999', { metodo: 'PATCH', jwt, cuerpo: { disponible: true } })).estado, 404);
  });

  test('PUT no puede quitar un tamano que ya se vendio: 400', async () => {
    // Pan redondo ya esta en un pedido (prueba de /api/pedidos): su "Único" no se borra.
    const actual = (await pedir('/api/productos/PRO001')).cuerpo;
    const r = await pedir('/api/productos/PRO001', { metodo: 'PUT', jwt, cuerpo: { nombre: actual.nombre, categoria: actual.categoria, foto: actual.foto, alt: actual.alt, iva: actual.iva, tamanos: [{ valor: '1 L', precio: 1 }] } });
    assert.equal(r.estado, 400);
    assert.match(r.cuerpo.error, /ya está en pedidos/);
    assert.equal((await pedir('/api/productos/PRO001')).cuerpo.precio, 0.3);
  });

  test('DELETE lo retira (agotado) sin romper el historial; 404 si no existe', async () => {
    const r = await pedir('/api/productos/PRO001', { metodo: 'DELETE', jwt });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.producto.disponible, false);
    assert.equal((await pedir('/api/productos/PRO001')).estado, 200);
    assert.equal((await pedir('/api/productos/PRO999', { metodo: 'DELETE', jwt })).estado, 404);
  });

  test('cada cambio queda en AUDITORIAS a nombre de quien lo hizo', async () => {
    const r = await base.db.query(`SELECT count(*)::int AS n FROM auditorias WHERE usu_codigo = $1 AND upper(aud_tabla) = 'PRODUCTOS'`, [usuario]);
    assert.ok(r.rows[0].n >= 4, `filas de auditoria: ${r.rows[0].n}`);
  });
});
