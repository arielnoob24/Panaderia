// ---- Un Supabase de mentira para las pruebas ---------------------------
// Las pruebas no salen a internet, asi que la cuenta no puede hablar con el
// Supabase de verdad. Esto contesta en su lugar a lo que usa la pagina:
//   - Auth (/auth/v1/...): signup, verify, token (contrasena y renovar),
//     resend, recover, user (leer y cambiar) y logout, con las mismas formas
//     de respuesta y de error que GoTrue;
//   - la API (/functions/v1/api/cuenta): GET, POST y PUT, con las mismas
//     reglas que supabase/functions/api/index.ts, y /pedidos (GET y POST)
//     con las de FN_PEDIDOS_REGISTRAR, y /admin/... (el panel) con los permisos
//     de cada rol.
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

// ---- El panel (/functions/v1/api/admin/...) --------------------------------
// Los permisos de cada rol (ROLES_PERMISOS) y las reglas de FN_ADMIN_* de
// bd/BD_EL_TRADICIONAL.sql. El rol de cada cuenta es 'Cliente' hasta que un
// caso lo cambia con ponerRol(). Los pedidos son los de todas las cuentas de
// esa ventana; los productos, el catalogo de data/productos.json.
const PERMISOS = {
  Administrador: ['pedidos.ver_todos', 'pedidos.cambiar_estado', 'productos.gestionar', 'reportes.ver', 'inventario.ver', 'compras.aprobar'],
  Empleado: ['pedidos.ver_todos', 'pedidos.cambiar_estado', 'inventario.ver'],
  Cliente: [],
};
const ponerRol = (correo, rol) => {
  const c = String(correo).toLowerCase();
  const sv = [...servidores].reverse().find((x) => x.cuentas.has(c));
  if (sv) sv.cuentas.get(c).rol = rol;
};
const NOMBRE_CATEGORIA = { panes: 'Panes', dulces: 'Dulces', 'bebidas-frias': 'Bebidas frías' };
const productosDe = (sv) => {
  if (!sv.productos) {
    sv.productos = CATALOGO.map((p, i) => ({
      codigo: `PRO${String(i + 1).padStart(3, '0')}`, nombre: p.nombre, categoria: NOMBRE_CATEGORIA[p.categoria] || p.categoria,
      disponible: p.disponible !== false, destacado: Boolean(p.destacado),
      tamanos: (p.tamanos?.length ? p.tamanos : [{ valor: 'Único', precio: p.precio }])
        .map((t, j) => ({ codigo: t.valor === 'Único' ? 'TAM001' : `TAM${String(j + 2).padStart(3, '0')}`, nombre: t.valor, precio: t.precio })),
    }));
  }
  return sv.productos;
};
const SIGUE_FINAL = ['Entregado', 'Cancelado'];
// Los proveedores del panel: empiezan sin ninguno y cada ventana guarda los suyos.
const MATERIALES_COMPRA = [
  { codigo: 'MAT001', nombre: 'Harina de trigo', unidad: 'qq' },
  { codigo: 'MAT002', nombre: 'Azúcar', unidad: 'qq' },
  { codigo: 'MAT003', nombre: 'Huevos', unidad: 'cubeta' },
];
const CANTONES = [{ codigo: '1501', nombre: 'Tena' }, { codigo: '1503', nombre: 'Archidona' }];
const proveedoresDe = (sv) => (sv.proveedores ||= []);

async function admin(sv, route) {
  const req = route.request();
  if (req.method() === 'OPTIONS') return contestar(route, 200, {});
  const c = quienPorToken(sv, req);
  if (!c || !c.confirmada) return contestar(route, 401, { error: 'Inicia sesión otra vez.' });
  const permisos = PERMISOS[c.rol || 'Cliente'];
  const sin = () => contestar(route, 403, { error: 'No tienes permiso para esto.' });
  const ruta = new URL(req.url()).pathname.replace(/^.*\/api\/admin/, '');
  if (ruta === '/yo') return contestar(route, 200, { rol: c.rol || 'Cliente', permisos: c.rol ? permisos : ['pedidos.crear', 'pedidos.ver_propios'] });
  if (ruta === '/pedidos' && req.method() === 'GET') {
    if (!permisos.includes('pedidos.ver_todos')) return sin();
    const todos = [...sv.cuentas.values()].flatMap((x) => (x.pedidos || []).map((p) => ({ ...p, cliente: aCuenta(x).nombre, celular: `0${aCuenta(x).telefono}` })));
    return contestar(route, 200, { pedidos: todos.sort((a, b) => b.fecha.localeCompare(a.fecha)) });
  }
  const pedido = ruta.match(/^\/pedidos\/(ET-[A-Z0-9]{4})$/);
  if (pedido && req.method() === 'PUT') {
    if (!permisos.includes('pedidos.cambiar_estado')) return sin();
    const p = [...sv.cuentas.values()].flatMap((x) => x.pedidos || []).find((x) => x.numero === pedido[1]);
    const { estado } = req.postDataJSON?.() || {};
    if (!p) return contestar(route, 400, { error: 'Ese pedido no existe.' });
    if (SIGUE_FINAL.includes(p.estado)) return contestar(route, 400, { error: `Un pedido ${p.estado.toLowerCase()} ya no cambia.` });
    if (estado === 'Listo para retirar' && p.modo === 'domicilio') return contestar(route, 400, { error: 'Un pedido a domicilio no se retira: va "En camino".' });
    if (estado === 'En camino' && p.modo !== 'domicilio') return contestar(route, 400, { error: 'Un pedido para retirar no va "En camino": va "Listo para retirar".' });
    p.estado = estado;
    return contestar(route, 200, p);
  }
  if (ruta === '/productos' && req.method() === 'GET') {
    return permisos.includes('productos.gestionar') ? contestar(route, 200, { productos: productosDe(sv) }) : sin();
  }
  const producto = ruta.match(/^\/productos\/(PRO\d{3})$/);
  if (producto && req.method() === 'PUT') {
    if (!permisos.includes('productos.gestionar')) return sin();
    const p = productosDe(sv).find((x) => x.codigo === producto[1]);
    const d = req.postDataJSON?.() || {};
    if (!p) return contestar(route, 400, { error: 'Ese producto no existe.' });
    for (const v of Object.values(d.precios || {})) {
      if (!(v > 0 && v < 1000)) return contestar(route, 400, { error: 'El precio tiene que ser mayor que 0 y menor que 1000.' });
    }
    p.disponible = d.disponible;
    p.destacado = d.destacado;
    for (const t of p.tamanos) if (d.precios?.[t.codigo] !== undefined) t.precio = d.precios[t.codigo];
    return contestar(route, 200, p);
  }
  if (ruta === '/inventario' && req.method() === 'GET') {
    if (!permisos.includes('inventario.ver')) return sin();
    const costos = permisos.includes('reportes.ver');
    const mats = [
      { codigo: 'MAT001', nombre: 'Harina de trigo', existencia: 12.5, unidad: 'kg', existenciaCompra: 0.25, unidadCompra: 'qq', minimo: 45, bajoMinimo: true, valor: 18.4 },
      { codigo: 'MAT002', nombre: 'Azúcar', existencia: 80, unidad: 'kg', existenciaCompra: 1.6, unidadCompra: 'qq', minimo: 20, bajoMinimo: false, valor: 70 },
      { codigo: 'MAT003', nombre: 'Huevos', existencia: 0, unidad: 'u', existenciaCompra: 0, unidadCompra: 'cubeta', minimo: 30, bajoMinimo: true, valor: 0 },
    ].map((m) => ({ ...m, valor: costos ? m.valor : null }));
    return contestar(route, 200, {
      costos, materiales: mats,
      caducan: [{ lote: 'LMA0000001', material: 'Huevos', unidad: 'u', saldo: 6, caduca: '2026-11-02', caducado: false }],
      productos: [{ nombre: 'Pan redondo', tamano: 'Único', producido: 0, vendido: 4, existencia: -4, costo: costos ? 0.1 : null, precio: 0.25 }],
    });
  }
  const kardex = ruta.match(/^\/inventario\/(MAT\d{3})$/);
  if (kardex && req.method() === 'GET') {
    if (!permisos.includes('inventario.ver')) return sin();
    const costos = permisos.includes('reportes.ver');
    return contestar(route, 200, { movimientos: kardex[1] === 'MAT001' ? [
      { fecha: new Date().toISOString(), tipo: 'Producción', documento: 'ORP0000001', cantidad: -5, saldo: 12.5, valor: costos ? -7.35 : null },
      { fecha: new Date(Date.now() - 864e5).toISOString(), tipo: 'Compra', documento: 'RCP0000001', cantidad: 17.5, saldo: 17.5, valor: costos ? 25.75 : null },
    ] : [] });
  }
  if (ruta.startsWith('/proveedores')) {
    if (!permisos.includes('compras.aprobar')) return sin();
    const lista = proveedoresDe(sv);
    const malo = (error) => contestar(route, 400, { error });
    if (ruta === '/proveedores' && req.method() === 'GET') {
      return contestar(route, 200, { proveedores: lista, cantones: CANTONES, materiales: MATERIALES_COMPRA });
    }
    if (ruta === '/proveedores' && req.method() === 'POST') {
      const d = req.postDataJSON?.() || {};
      if (!String(d.razonSocial || '').trim()) return malo('Escribe el nombre o razón social (hasta 150 letras).');
      if (!/^\d{10}(\d{3})?$/.test(d.identificacion || '')) return malo('La cédula o el RUC no es válido.');
      if (lista.some((x) => x.identificacion === d.identificacion)) return malo('Ya hay un proveedor con esa cédula o RUC.');
      if (!/^\S+@\S+\.\S+$/.test(d.correo || '')) return malo('El correo no es válido.');
      if (!String(d.direccion || '').trim()) return malo('Escribe la dirección (hasta 200 letras).');
      const nuevo = {
        codigo: `PVD${String(lista.length + 1).padStart(7, '0')}`, razonSocial: d.razonSocial.trim(), tipo: d.tipo === '04' ? 'RUC' : 'Cédula',
        identificacion: d.identificacion, correo: d.correo.toLowerCase(), celular: d.celular || null, telefono: d.telefono || null,
        direccion: d.direccion.trim(), canton: CANTONES.find((c) => c.codigo === d.canton)?.nombre || 'Tena', activo: true, materiales: [],
      };
      lista.push(nuevo);
      return contestar(route, 201, nuevo);
    }
    const prov = ruta.match(/^\/proveedores\/(PVD\d{7})(?:\/materiales\/(MAT\d{3})(\/quitar)?)?$/);
    const p = prov && lista.find((x) => x.codigo === prov[1]);
    if (!p) return malo('Ese proveedor no existe.');
    const d = req.postDataJSON?.() || {};
    if (!prov[2] && req.method() === 'PUT') { p.activo = d.activo; return contestar(route, 200, p); }
    const m = MATERIALES_COMPRA.find((x) => x.codigo === prov[2]);
    if (prov[3]) {
      if (!p.materiales.some((x) => x.codigo === prov[2])) return malo('Ese proveedor no vende ese material.');
      p.materiales = p.materiales.filter((x) => x.codigo !== prov[2]);
      return contestar(route, 200, p);
    }
    if (!(d.precio > 0 && d.precio < 10000)) return malo('El precio tiene que ser mayor que 0 y menor que 10000.');
    const hay = p.materiales.find((x) => x.codigo === prov[2]);
    if (hay) { hay.precio = d.precio; hay.dias = d.dias; } else p.materiales.push({ codigo: m.codigo, nombre: m.nombre, unidad: m.unidad, precio: d.precio, dias: d.dias });
    return contestar(route, 200, p);
  }
  if (ruta === '/resumen') {
    if (!permisos.includes('reportes.ver')) return sin();
    const todos = [...sv.cuentas.values()].flatMap((x) => x.pedidos || []).filter((p) => p.estado !== 'Cancelado');
    const suma = (l) => ({ pedidos: l.length, ventas: centavos(l.reduce((s, p) => s + p.total, 0)) });
    const cuenta = new Map();
    for (const p of todos) for (const l of p.lineas) cuenta.set(l.nombre, (cuenta.get(l.nombre) || 0) + l.cantidad);
    return contestar(route, 200, {
      hoy: suma(todos), mes: suma(todos), pendientes: todos.filter((p) => !SIGUE_FINAL.includes(p.estado)).length,
      masVendidos: [...cuenta].map(([nombre, unidades]) => ({ nombre, unidades })).sort((a, b) => b.unidades - a.unidades).slice(0, 5),
    });
  }
  return contestar(route, 404, { error: 'Ruta no encontrada' });
}

// Se instala en cada ventana (probar.mjs, despues del corte de internet:
// Playwright mira primero la ruta registrada la ultima).
const instalar = async (ctx) => {
  const sv = nuevo();
  servidores.push(sv);
  ctx.supabaseFalso = sv;
  await ctx.route(`${PROYECTO}/auth/v1/**`, (r) => auth(sv, r));
  await ctx.route(`${PROYECTO}/functions/v1/api/cuenta`, (r) => api(sv, r));
  await ctx.route(`${PROYECTO}/functions/v1/api/pedidos`, (r) => pedidos(sv, r));
  await ctx.route(`${PROYECTO}/functions/v1/api/admin/**`, (r) => admin(sv, r));
};

export { instalar, reiniciar, codigoDe, claveDe, pedidosDe, ponerRol, quebrar };
