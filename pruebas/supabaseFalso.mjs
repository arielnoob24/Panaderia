// ---- Un Supabase de mentira para las pruebas ---------------------------
// Las pruebas no salen a internet, asi que la cuenta no puede hablar con el
// Supabase de verdad. Esto contesta en su lugar a lo que usa la pagina:
//   - Auth (/auth/v1/...): signup, verify, token (contrasena y renovar),
//     resend, recover, user (leer y cambiar) y logout, con las mismas formas
//     de respuesta y de error que GoTrue;
//   - la API (/functions/v1/api/cuenta): GET, POST y PUT, con las mismas
//     reglas que supabase/functions/api/index.ts, y /pedidos (GET y POST)
//     con las de FN_PEDIDOS_REGISTRAR.
// El codigo de 6 cifras que "se manda" queda apuntado: codigoDe() se lo da a
// la prueba, que lo escribe como lo haria quien lo lee en su correo.
// Cada ventana de prueba (contexto) tiene su propio servidor, vacio: un caso
// que repite el recorrido en escritorio y en el telefono crea la misma
// cuenta dos veces sin chocar.
// /functions/v1/api/productos no se toca: sigue cortado y la tienda usa su
// respaldo (eso lo prueba catalogo-api.mjs).

import { readFileSync } from 'node:fs';

const PROYECTO = 'https://ugscqizansixnsuzljtu.supabase.co';

// Un servidor: cuentas (correo -> { id, correo, clave, confirmada, metadata,
// fila, codigos }), tokens (token -> correo) y quiebra ({ ruta, estado },
// para simular que Auth o la API fallan).
const nuevo = () => ({ cuentas: new Map(), tokens: new Map(), quiebra: null });
let servidores = [];
const reiniciar = () => { servidores = []; };

// El ultimo codigo de cada tipo que "llego" a ese correo ('email' para
// verificar, 'recovery' para cambiar la contrasena), o ''. Lo busca en el
// servidor mas nuevo que tenga ese correo.
const codigoDe = (correo, tipo = 'email') => {
  const c = String(correo).toLowerCase();
  const sv = [...servidores].reverse().find((x) => x.cuentas.has(c));
  return sv?.cuentas.get(c).codigos[tipo] || '';
};
// La contrasena que Auth tiene guardada para ese correo (o ''): para ver si
// un cambio de contrasena llego o no.
const claveDe = (correo) => {
  const c = String(correo).toLowerCase();
  const sv = [...servidores].reverse().find((x) => x.cuentas.has(c));
  return sv?.cuentas.get(c).clave || '';
};
// Para un caso que quiera ver como se porta la pagina si algo falla: en el
// servidor de esa ventana.
// Con { despues: true } la ruta hace su trabajo y es la respuesta la que se
// pierde (el pedido queda hecho y la pagina no se entera).
const quebrar = (ctx, ruta, estado = 500, { despues = false } = {}) => {
  ctx.supabaseFalso.quiebra = ruta ? { ruta, estado, despues } : null;
};

const seis = () => String(100000 + Math.floor(Math.random() * 900000));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
// Un JWT con forma de JWT (supabase-js lee su exp); la firma no importa.
const nuevoToken = (sv, c) => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const t = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: c.id, email: c.correo, exp, role: 'authenticated', aud: 'authenticated' })}.x${Math.random().toString(36).slice(2)}`;
  sv.tokens.set(t, c.correo);
  return t;
};

const usuario = (c) => ({
  id: c.id, aud: 'authenticated', role: 'authenticated', email: c.correo,
  email_confirmed_at: c.confirmada ? new Date().toISOString() : null,
  user_metadata: c.metadata, app_metadata: { provider: 'email', providers: ['email'] },
  identities: [{ id: c.id, provider: 'email', identity_data: { email: c.correo } }],
  created_at: new Date().toISOString(),
});
const sesion = (sv, c) => {
  const access = nuevoToken(sv, c);
  return {
    access_token: access, token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: `r-${access.slice(-12)}`, user: usuario(c),
  };
};

const cors = (req) => ({
  'Access-Control-Allow-Origin': req.headers().origin || '*',
  'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
});
const contestar = (route, estado, cuerpo) => route.fulfill({
  status: estado, headers: cors(route.request()), body: cuerpo === undefined ? '' : JSON.stringify(cuerpo),
});
// Un error como los de GoTrue: code y error_code, msg y message.
const errorAuth = (route, estado, code, msg) => contestar(route, estado, { code, error_code: code, msg, message: msg });

const quienPorToken = (sv, req) => {
  const t = (req.headers().authorization || '').replace(/^Bearer\s+/i, '');
  const correo = sv.tokens.get(t);
  return correo ? sv.cuentas.get(correo) : null;
};

async function auth(sv, route) {
  const { cuentas, quiebra } = sv;
  const req = route.request();
  if (req.method() === 'OPTIONS') return contestar(route, 200, {});
  const url = new URL(req.url());
  const ruta = url.pathname.replace('/auth/v1', '');
  if (quiebra && ruta.startsWith(quiebra.ruta)) return errorAuth(route, quiebra.estado, 'unexpected_failure', 'falla a proposito');
  const cuerpo = req.postDataJSON?.() || {};
  const correo = String(cuerpo.email || '').toLowerCase();

  if (ruta === '/signup') {
    const hay = cuentas.get(correo);
    if (hay?.confirmada) return contestar(route, 200, { ...usuario(hay), identities: [] });
    const c = hay || { id: crypto.randomUUID(), correo, codigos: {} };
    Object.assign(c, { clave: cuerpo.password, confirmada: false, metadata: cuerpo.data || {}, fila: null });
    c.codigos.email = seis();
    cuentas.set(correo, c);
    return contestar(route, 200, usuario(c));
  }
  if (ruta === '/resend') {
    const c = cuentas.get(correo);
    if (c && !c.confirmada) c.codigos.email = seis();
    return contestar(route, 200, {});
  }
  if (ruta === '/recover') {
    const c = cuentas.get(correo);
    if (c?.confirmada) c.codigos.recovery = seis();
    return contestar(route, 200, {});
  }
  if (ruta === '/verify') {
    const c = cuentas.get(correo);
    const tipo = cuerpo.type === 'recovery' ? 'recovery' : 'email';
    if (!c || !c.codigos[tipo] || c.codigos[tipo] !== cuerpo.token) {
      return errorAuth(route, 403, 'otp_expired', 'Token has expired or is invalid');
    }
    c.codigos[tipo] = '';
    c.confirmada = true;
    return contestar(route, 200, sesion(sv, c));
  }
  if (ruta === '/token') {
    if (url.searchParams.get('grant_type') === 'refresh_token') {
      const c = [...cuentas.values()].find((x) => x.confirmada);
      return c ? contestar(route, 200, sesion(sv, c)) : errorAuth(route, 400, 'refresh_token_not_found', 'Invalid Refresh Token');
    }
    const c = cuentas.get(correo);
    if (!c || c.clave !== cuerpo.password) return errorAuth(route, 400, 'invalid_credentials', 'Invalid login credentials');
    if (!c.confirmada) return errorAuth(route, 400, 'email_not_confirmed', 'Email not confirmed');
    return contestar(route, 200, sesion(sv, c));
  }
  if (ruta === '/user') {
    const c = quienPorToken(sv, req);
    if (!c) return errorAuth(route, 401, 'bad_jwt', 'invalid JWT');
    if (req.method() === 'PUT') {
      if (cuerpo.password) {
        if (cuerpo.password === c.clave) return errorAuth(route, 422, 'same_password', 'New password should be different from the old password.');
        c.clave = cuerpo.password;
      }
      if (cuerpo.data) c.metadata = { ...c.metadata, ...cuerpo.data };
    }
    return contestar(route, 200, usuario(c));
  }
  if (ruta === '/logout') return contestar(route, 204);
  return errorAuth(route, 404, 'not_found', `ruta de Auth sin falsear: ${ruta}`);
}

// Las reglas de la API de verdad (fallosCuenta y partirNombre de index.ts).
const fallaDatos = (d) => {
  const nombre = String(d?.nombre ?? '').trim().replace(/\s+/g, ' ');
  if (nombre.length < 3 || nombre.length > 120 || !nombre.includes(' ')) return 'El nombre lleva nombre y apellido.';
  if (!/^9\d{8}$/.test(String(d?.telefono ?? ''))) return 'El teléfono son 9 números después del +593, empezando por 9.';
  if (String(d?.direccion ?? '').trim().length > 80) return 'La dirección es demasiado larga.';
  return '';
};
const aCuenta = (c) => ({
  nombre: c.fila.nombre, correo: c.correo, telefono: c.fila.telefono,
  direccion: c.metadata.direccion ?? '', metodo: c.metadata.metodo === 'tarjeta' ? 'tarjeta' : 'efectivo',
});

async function api(sv, route) {
  const { quiebra } = sv;
  const req = route.request();
  if (req.method() === 'OPTIONS') return contestar(route, 200, {});
  if (quiebra && '/cuenta'.startsWith(quiebra.ruta)) return contestar(route, quiebra.estado, { error: 'falla a proposito' });
  const c = quienPorToken(sv, req);
  if (!c || !c.confirmada) return contestar(route, 401, { error: 'Inicia sesión otra vez.' });
  if (req.method() === 'GET') {
    return c.fila ? contestar(route, 200, aCuenta(c)) : contestar(route, 404, { error: 'Esta cuenta todavía no tiene datos.' });
  }
  const d = req.postDataJSON?.() || {};
  const mal = fallaDatos(d);
  if (mal) return contestar(route, 400, { error: mal });
  c.metadata = { ...c.metadata, direccion: String(d.direccion ?? '').trim(), metodo: d.metodo === 'tarjeta' ? 'tarjeta' : 'efectivo' };
  const fila = { nombre: String(d.nombre).trim().replace(/\s+/g, ' '), telefono: d.telefono };
  if (req.method() === 'POST') {
    if (!c.fila) c.fila = fila;
    return contestar(route, c.fila === fila ? 201 : 200, aCuenta(c));
  }
  if (!c.fila) return contestar(route, 404, { error: 'Esta cuenta todavía no tiene datos.' });
  c.fila = fila;
  return contestar(route, 200, aCuenta(c));
}

// ---- Los pedidos (/functions/v1/api/pedidos) -------------------------------
// Las reglas de FN_PEDIDOS_REGISTRAR (bd/BD_EL_TRADICIONAL.sql) con el
// catalogo de data/productos.json: el precio lo pone el servidor, lo
// agotado no entra y la respuesta es el registro que ensena el sitio.
const CATALOGO = JSON.parse(readFileSync(new URL('../data/productos.json', import.meta.url), 'utf8')).productos;
const OFERTA = new Map(CATALOGO.filter((p) => p.disponible !== false).flatMap((p) => (p.tamanos?.length
  ? p.tamanos.map((t) => [`${p.nombre} ${t.valor}`.toLowerCase(), { nombre: `${p.nombre} ${t.valor}`, precio: t.precio }])
  : [[p.nombre.toLowerCase(), { nombre: p.nombre, precio: p.precio }]])));
const LETRAS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const numeroNuevo = () => 'ET-' + Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
const centavos = (n) => Math.round(n * 100) / 100;

const registrar = (c, d) => {
  // El mismo intento otra vez: el pedido que ya se hizo.
  const ya = d.clave && (c.pedidos || []).find((x) => x.clave === d.clave);
  if (ya) return ya;
  if (!Array.isArray(d.lineas) || !d.lineas.length) return 'Tu canasta está vacía.';
  const domicilio = d.modo === 'domicilio';
  if (domicilio && !String(d.direccion || '').trim()) return 'Escribe la dirección para poder llevarlo.';
  if (d.metodo === 'tarjeta' && !/^\d{4}$/.test(d.ultimos || '')) return 'Faltan los números de la tarjeta.';
  const lineas = [];
  for (const l of d.lineas) {
    const hoy = OFERTA.get(String(l.nombre || '').trim().toLowerCase());
    if (!hoy) return `Ya no tenemos ${l.nombre}. Quítalo de la canasta para seguir.`;
    if (!(l.cantidad >= 1 && l.cantidad <= 100)) return `De ${l.nombre} se pueden pedir de 1 a 100.`;
    lineas.push({ nombre: hoy.nombre, precio: hoy.precio, cantidad: l.cantidad });
  }
  const subtotal = centavos(lineas.reduce((s, l) => s + l.precio * l.cantidad, 0));
  const envio = domicilio ? 1.5 : 0;
  const pedido = {
    numero: numeroNuevo(), fecha: new Date().toISOString(),
    estado: d.metodo === 'tarjeta' ? 'Pagado' : 'Pendiente de pago',
    modo: domicilio ? 'domicilio' : 'retiro',
    direccion: domicilio ? [d.direccion, d.piso, d.referencia].map((x) => String(x || '').trim()).filter(Boolean).join(' · ') : '',
    metodo: d.metodo === 'tarjeta' ? `Tarjeta terminada en ${d.ultimos}` : domicilio ? 'Efectivo al recibir' : 'Efectivo al retirar',
    subtotal, envio, total: centavos(subtotal + envio), lineas,
  };
  Object.defineProperty(pedido, 'clave', { value: d.clave, enumerable: false });
  c.pedidos = [pedido, ...(c.pedidos || [])];
  return pedido;
};

async function pedidos(sv, route) {
  const { quiebra } = sv;
  const req = route.request();
  if (req.method() === 'OPTIONS') return contestar(route, 200, {});
  const falla = quiebra && '/pedidos'.startsWith(quiebra.ruta);
  if (falla && !quiebra.despues) return contestar(route, quiebra.estado, { error: 'falla a proposito' });
  const c = quienPorToken(sv, req);
  if (!c || !c.confirmada) return contestar(route, 401, { error: 'Inicia sesión otra vez.' });
  if (req.method() === 'GET') return contestar(route, 200, { pedidos: c.pedidos || [] });
  const r = registrar(c, req.postDataJSON?.() || {});
  if (falla) return contestar(route, quiebra.estado, { error: 'se perdio la respuesta' });
  return typeof r === 'string' ? contestar(route, 400, { error: r }) : contestar(route, 201, r);
}

// Los pedidos que la base tiene de ese correo (para que un caso los mire).
const pedidosDe = (correo) => {
  const c = String(correo).toLowerCase();
  const sv = [...servidores].reverse().find((x) => x.cuentas.has(c));
  return sv?.cuentas.get(c).pedidos || [];
};

// Se instala en cada ventana (probar.mjs, despues del corte de internet:
// Playwright mira primero la ruta registrada la ultima).
const instalar = async (ctx) => {
  const sv = nuevo();
  servidores.push(sv);
  ctx.supabaseFalso = sv;
  await ctx.route(`${PROYECTO}/auth/v1/**`, (r) => auth(sv, r));
  await ctx.route(`${PROYECTO}/functions/v1/api/cuenta`, (r) => api(sv, r));
  await ctx.route(`${PROYECTO}/functions/v1/api/pedidos`, (r) => pedidos(sv, r));
};

export { instalar, reiniciar, codigoDe, claveDe, pedidosDe, quebrar };
