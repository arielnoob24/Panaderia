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
  Administrador: ['pedidos.ver_todos', 'pedidos.cambiar_estado', 'productos.gestionar', 'reportes.ver', 'inventario.ver', 'compras.aprobar', 'bodega.recibir', 'produccion.registrar', 'inventario.reportar', 'inventario.ajustar', 'usuarios.gestionar', 'facturas.anular', 'nomina.aprobar', 'contabilidad.aprobar'],
  Empleado: ['pedidos.ver_todos', 'pedidos.cambiar_estado', 'inventario.ver', 'bodega.recibir', 'produccion.registrar', 'inventario.reportar'],
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
const ordenesDe = (sv) => (sv.ordenes ||= []);
// Los asientos de la prueba: dos pendientes (una venta y un rol) y un saldo.
const asientosDe = (sv) => (sv.asientos ||= [
  { codigo: 'ASI0000002', fecha: '2026-10-27T10:00:00Z', descripcion: 'Rol de pagos 9/2026 del empleado EMP0000003', origen: 'Nómina', estado: 'Pendiente', debe: '470.00', haber: '470.00', cuadra: true, aprobo: null,
    lineas: [{ cuenta: '1.1.01.02', nombre: 'Bancos', debe: '0.00', haber: '425.58' }, { cuenta: '2.1.03.01', nombre: 'IESS por pagar', debe: '0.00', haber: '44.42' }, { cuenta: '5.2.01', nombre: 'Sueldos', debe: '470.00', haber: '0.00' }] },
  { codigo: 'ASI0000001', fecha: '2026-10-26T10:00:00Z', descripcion: 'Venta, factura 001-001-000000001', origen: 'Ventas', estado: 'Pendiente', debe: '12.50', haber: '12.50', cuadra: true, aprobo: null,
    lineas: [{ cuenta: '1.1.01.01', nombre: 'Caja', debe: '12.50', haber: '0.00' }, { cuenta: '4.1.01', nombre: 'Ventas', debe: '0.00', haber: '12.50' }] },
]);
// Los roles de pago de la prueba: ninguno al empezar. Sueldo 470 y IESS 44.42 como los pone la base.
const nominasDe = (sv) => (sv.nominas ||= []);
const rolNeto = (r) => {
  const ing = r.lineas.filter((l) => l.tipo === 'ING').reduce((t, l) => t + Number(l.valor), 0);
  const des = r.lineas.filter((l) => l.tipo === 'DES').reduce((t, l) => t + Number(l.valor), 0);
  r.ingresos = ing.toFixed(2); r.descuentos = des.toFixed(2); r.neto = (ing - des).toFixed(2);
  return r;
};
// Las facturas de la prueba: una vigente de 12.50 y otra de 4.00.
const facturasDe = (sv) => (sv.facturas ||= [
  { codigo: 'FAC0000002', numero: '001-001-000000002', pedido: 'ET-B2B2', cliente: 'Panadería Hermanos Cruz', ident: '1790012345001', fecha: '2026-10-27T10:00:00Z', total: '4.00', anulada: null },
  { codigo: 'FAC0000001', numero: '001-001-000000001', pedido: 'ET-A1A1', cliente: 'CONSUMIDOR FINAL', ident: '9999999999999', fecha: '2026-10-26T10:00:00Z', total: '12.50', anulada: null },
]);
// El equipo empieza con el dueño (EMP0000003), con la cuenta de quien mira ligada.
const equipoDe = (sv, correo) => (sv.equipo ||= [{
  codigo: 'EMP0000003', nombre: 'Ariel Antonio Escobar Orna', cedula: '1501107609', cargo: 'Administrador', cargoCodigo: 'CAR001', contrato: 'Permanente',
  sueldo: 470, correo: 'ariel@correo.ec', celular: '0960868821', ingreso: '2026-10-28', activo: true, cuentas: [{ correo, rol: 'Administrador', activa: true }],
}]);
const tandasDe = (sv) => (sv.tandas ||= []);
const ajustesDe = (sv) => (sv.ajustes ||= []);
const recepcionesDe = (sv) => (sv.recepciones ||= { pendientes: [], recibidas: [] });

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
  if (ruta === '/ordenes' || ruta.startsWith('/ordenes/')) {
    if (!permisos.includes('compras.aprobar')) return sin();
    const malo = (error) => contestar(route, 400, { error });
    const lista = ordenesDe(sv);
    if (ruta === '/ordenes' && req.method() === 'GET') return contestar(route, 200, { ordenes: [...lista].reverse() });
    const d = req.postDataJSON?.() || {};
    if (ruta === '/ordenes' && req.method() === 'POST') {
      const prov = proveedoresDe(sv).find((x) => x.codigo === d.proveedor && x.activo);
      if (!prov) return malo('Elige un proveedor activo.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.entrega || '')) return malo('La fecha de entrega va de hoy a un año.');
      if (!d.lineas?.length) return malo('Agrega al menos un material a la orden.');
      const lineas = [];
      for (const l of d.lineas) {
        const m = prov.materiales.find((x) => x.codigo === l.material);
        if (!m) return malo('Ese proveedor no vende uno de los materiales.');
        if (!(Number(l.cantidad) > 0)) return malo(`La cantidad de ${m.nombre} tiene que ser mayor que 0 (hasta 2 decimales).`);
        lineas.push({ codigo: m.codigo, nombre: m.nombre, unidad: m.unidad, cantidad: Number(l.cantidad), precio: m.precio, iva: 15, recibido: 0 });
      }
      const subtotal = centavos(lineas.reduce((s, l) => s + l.cantidad * l.precio, 0));
      const iva = centavos(subtotal * 0.15);
      const nueva = {
        codigo: `OCO${String(lista.length + 1).padStart(7, '0')}`, proveedorCodigo: prov.codigo, proveedor: prov.razonSocial,
        fecha: new Date().toISOString(), entrega: d.entrega, estado: 'Abierta', observacion: d.observacion || null,
        subtotal, iva, total: centavos(subtotal + iva), recepcion: null, lineas,
      };
      lista.push(nueva);
      return contestar(route, 201, nueva);
    }
    const oc = ruta.match(/^\/ordenes\/(OCO\d{7})$/);
    const o = oc && lista.find((x) => x.codigo === oc[1]);
    if (!o) return malo('Esa orden no existe.');
    if (!['Aprobada', 'Anulada'].includes(d.estado)) return malo('Una orden se aprueba o se anula.');
    if (o.estado !== 'Abierta') return malo(`Esa orden ya está ${o.estado.toLowerCase()}, y ya no cambia.`);
    o.estado = d.estado;
    if (d.estado === 'Aprobada') {
      const rcp = recepcionesDe(sv);
      const codigo = `RCP${String(rcp.pendientes.length + rcp.recibidas.length + 1).padStart(7, '0')}`;
      o.recepcion = { codigo, estado: 'Pendiente' };
      rcp.pendientes.push({
        codigo, orden: o.codigo, proveedor: o.proveedor, entrega: o.entrega,
        lineas: o.lineas.map((l) => ({ codigo: l.codigo, nombre: l.nombre, unidad: l.unidad, pedido: l.cantidad, falta: l.cantidad, perecible: l.codigo === 'MAT003', diasVida: l.codigo === 'MAT003' ? 15 : null })),
      });
    }
    return contestar(route, 200, o);
  }
  if (ruta === '/recepciones' || ruta.startsWith('/recepciones/')) {
    if (!permisos.includes('bodega.recibir')) return sin();
    const rcp = recepcionesDe(sv);
    if (ruta === '/recepciones' && req.method() === 'GET') return contestar(route, 200, { pendientes: rcp.pendientes, recibidas: [...rcp.recibidas].reverse() });
    const malo = (error) => contestar(route, 400, { error });
    const m = ruta.match(/^\/recepciones\/(RCP\d{7})$/);
    const r = m && rcp.pendientes.find((x) => x.codigo === m[1]);
    if (!r) return malo('Esa recepción ya no está pendiente.');
    const d = req.postDataJSON?.() || {};
    const lotes = [];
    for (const l of d.lineas || []) {
      const linea = r.lineas.find((x) => x.codigo === l.material);
      const cant = Number(l.cantidad);
      if (!linea) return malo('La orden no pidió uno de los materiales.');
      if (cant > linea.falta) return malo(`De ${linea.nombre} no puede llegar más de lo que falta (${linea.falta}).`);
      if (cant > 0) lotes.push({ lote: `LMA${String(lotes.length + 1).padStart(7, '0')}`, nombre: linea.nombre, unidad: linea.unidad, cantidad: cant, caduca: l.caducidad || null });
    }
    if (!lotes.length) return malo('Pon cuánto llegó de al menos un material.');
    const corto = r.lineas.some((x) => lotes.reduce((s, l) => (l.nombre === x.nombre ? s + l.cantidad : s), 0) < x.falta);
    if (corto && !String(d.observacion || '').trim()) return malo('Llegó menos de lo pedido: escribe el motivo.');
    rcp.pendientes = rcp.pendientes.filter((x) => x !== r);
    rcp.recibidas.push({ codigo: r.codigo, orden: r.orden, proveedor: r.proveedor, fecha: new Date().toISOString(), observacion: String(d.observacion || '').trim() || null, lotes });
    const o = ordenesDe(sv).find((x) => x.codigo === r.orden);
    o.recepcion.estado = 'Recibida';
    for (const l of o.lineas) l.recibido = lotes.filter((x) => x.nombre === l.nombre).reduce((s, x) => s + x.cantidad, 0);
    return contestar(route, 200, { codigo: r.codigo, orden: r.orden, lotes: lotes.length });
  }
  if (ruta === '/produccion') {
    if (!permisos.includes('produccion.registrar')) return sin();
    const costos = permisos.includes('reportes.ver');
    const lista = tandasDe(sv);
    if (req.method() === 'GET') {
      return contestar(route, 200, {
        costos, productos: [{ producto: 'PRO001', tamano: 'TAM001', nombre: 'Pan redondo' }, { producto: 'PRO002', tamano: 'TAM001', nombre: 'Pastel grande' }],
        ordenes: lista.map((o) => ({ ...o, costoTotal: costos ? o.cantidad * 0.1 : null, costoUnitario: costos ? 0.1 : null })).reverse(),
      });
    }
    const d = req.postDataJSON?.() || {};
    if (!(d.cantidad >= 1 && d.cantidad <= 9999)) return contestar(route, 400, { error: 'La cantidad va de 1 a 9999.' });
    if (d.cantidad > 100) return contestar(route, 400, { error: 'No alcanza Harina de trigo: faltan 5 kg' });
    lista.push({ codigo: `ORP${String(lista.length + 1).padStart(7, '0')}`, fecha: new Date().toISOString(), producto: d.producto === 'PRO002' ? 'Pastel grande' : 'Pan redondo', tamano: 'Único', cantidad: d.cantidad, estado: 'Producida', hizo: c.rol === 'Administrador' ? 'Dueño Prueba' : 'Ana Prueba' });
    return contestar(route, 201, { codigo: lista[lista.length - 1].codigo });
  }
  if (ruta === '/ajustes' || ruta.startsWith('/ajustes/')) {
    if (!permisos.includes('inventario.reportar')) return sin();
    const costos = permisos.includes('reportes.ver');
    const lista = ajustesDe(sv);
    const malo = (error) => contestar(route, 400, { error });
    const LOTES = [
      { codigo: 'LMA0000001', material: 'Harina de trigo', unidad: 'kg', saldo: 12.5, caduca: null },
      { codigo: 'LMA0000002', material: 'Huevos', unidad: 'u', saldo: 6, caduca: '2026-11-02' },
    ];
    if (ruta === '/ajustes' && req.method() === 'GET') return contestar(route, 200, { costos, lotes: LOTES, ajustes: [...lista].reverse().map(({ cuenta, rolQueLoHizo, ...a }) => a) });
    const d = req.postDataJSON?.() || {};
    if (ruta === '/ajustes' && req.method() === 'POST') {
      if (!String(d.motivo || '').trim()) return malo('Escribe el motivo (hasta 150 letras).');
      const l = d.lineas?.[0];
      const lote = LOTES.find((x) => x.codigo === l?.lote);
      if (!lote || !Number(l.cantidad)) return malo('La cantidad tiene que ser distinta de 0 (hasta 3 decimales).');
      if (lote.saldo + Number(l.cantidad) < 0) return malo(`Del lote de ${lote.material} solo quedan ${lote.saldo} y quieres sacar ${-Number(l.cantidad)}.`);
      lista.push({
        codigo: `AJU${String(lista.length + 1).padStart(7, '0')}`, fecha: new Date().toISOString(), motivo: d.motivo.trim(), estado: 'Abierto',
        hizo: c.rol === 'Administrador' ? 'Dueño Prueba' : 'Ana Prueba', autorizo: null, cuenta: c, rolQueLoHizo: c.rol,
        lineas: [{ lote: lote.codigo, material: lote.material, unidad: lote.unidad, cantidad: Number(l.cantidad), valor: costos ? Number(l.cantidad) * 0.5 : null }],
      });
      return contestar(route, 201, { codigo: lista[lista.length - 1].codigo });
    }
    const aj = ruta.match(/^\/ajustes\/(AJU\d{7})$/);
    const a = aj && lista.find((x) => x.codigo === aj[1]);
    if (!a) return malo('Ese ajuste no existe.');
    if (a.estado !== 'Abierto') return malo(`Ese ajuste ya está ${a.estado.toLowerCase()}, y ya no cambia.`);
    if (d.estado === 'Aprobado') {
      if (!permisos.includes('inventario.ajustar')) return sin();
      // En la prueba una misma cuenta cambia de rol: "el propio" es la misma cuenta con el mismo rol.
      if (a.cuenta === c && a.rolQueLoHizo === c.rol) return malo('Otra persona tiene que aprobar este ajuste: no se aprueba el propio.');
      a.estado = 'Aprobado';
      a.autorizo = 'Dueño Prueba';
    } else {
      if (!permisos.includes('inventario.ajustar')) return sin();
      a.estado = 'Anulado';
    }
    return contestar(route, 200, { codigo: a.codigo, estado: a.estado });
  }
  if (ruta === '/contabilidad' || ruta.startsWith('/contabilidad/')) {
    if (!permisos.includes('contabilidad.aprobar')) return sin();
    const lista = asientosDe(sv);
    if (ruta === '/contabilidad' && req.method() === 'GET') {
      const apr = lista.filter((a) => a.estado === 'Aprobado');
      const caja = apr.reduce((t, a) => t + a.lineas.filter((l) => l.cuenta === '1.1.01.01').reduce((u, l) => u + Number(l.debe), 0), 0);
      return contestar(route, 200, {
        asientos: lista,
        porAprobar: lista.filter((a) => ['Abierto', 'Pendiente', 'Con error'].includes(a.estado)).length,
        saldos: caja ? [{ cuenta: '1.1.01.01', nombre: 'Caja', debe: caja.toFixed(2), haber: '0.00', saldo: caja.toFixed(2) }] : [],
      });
    }
    const as = ruta.match(/^\/contabilidad\/(ASI\d{7})$/);
    const a = as && lista.find((x) => x.codigo === as[1]);
    if (!a) return contestar(route, 400, { error: 'Ese asiento no existe.' });
    if (!['Abierto', 'Pendiente', 'Con error'].includes(a.estado)) return contestar(route, 400, { error: `Ese asiento ya está ${a.estado.toLowerCase()}, y ya no cambia.` });
    const d = req.postDataJSON();
    a.estado = d.estado;
    if (d.estado === 'Aprobado') a.aprobo = 'Ariel Escobar';
    return contestar(route, 200, a);
  }
  if (ruta === '/nomina' || ruta.startsWith('/nomina/')) {
    if (!permisos.includes('nomina.aprobar')) return sin();
    const lista = nominasDe(sv);
    const malo = (error) => contestar(route, 400, { error });
    if (ruta === '/nomina' && req.method() === 'GET') {
      return contestar(route, 200, {
        nominas: lista,
        empleados: [{ codigo: 'EMP0000003', nombre: 'Ariel Escobar', sueldo: '470.00' }, { codigo: 'EMP0000004', nombre: 'Rosa Pérez', sueldo: '500.00' }],
        conceptos: [{ numero: '1010', nombre: 'Horas extra', tipo: 'ING' }, { numero: '1020', nombre: 'Fondo de reserva', tipo: 'ING' }, { numero: '2010', nombre: 'Préstamo de la empresa', tipo: 'DES' }, { numero: '2021', nombre: 'Impuesto a la renta', tipo: 'DES' }],
      });
    }
    if (ruta === '/nomina' && req.method() === 'POST') {
      const d = req.postDataJSON();
      if (lista.some((r) => r.empleado === d.empleado && r.anio === d.anio && r.mes === d.mes && r.estado !== 'Anulado')) return malo('Ese empleado ya tiene su rol de ese mes.');
      if (d.anio > 2026 || (d.anio === 2026 && d.mes > 10)) return malo('Ese mes todavía no llega.');
      const rol = rolNeto({
        codigo: `NOM000000${lista.length + 1}`, empleado: d.empleado, nombre: d.empleado === 'EMP0000003' ? 'Ariel Escobar' : 'Rosa Pérez',
        anio: d.anio, mes: d.mes, estado: 'Abierto', fechaPago: null,
        lineas: [
          { numero: '1000', nombre: 'Sueldo mensual', tipo: 'ING', cantidad: '30.00', valor: '470.00', fija: true },
          { numero: '2000', nombre: 'Aporte personal al IESS', tipo: 'DES', cantidad: '1.00', valor: '44.42', fija: true },
        ],
      });
      lista.unshift(rol);
      return contestar(route, 201, rol);
    }
    const no = ruta.match(/^\/nomina\/(NOM\d{7})(\/lineas(\/quitar)?)?$/);
    const r = no && lista.find((x) => x.codigo === no[1]);
    if (!r) return malo('Ese rol no existe.');
    const d = req.postDataJSON();
    if (r.estado !== 'Abierto') return malo(r.estado === 'Aprobado' && !no[2] ? 'Ese rol ya está aprobado, y ya no cambia.' : 'Ese rol ya no está abierto y no se cambia.');
    if (!no[2]) {
      r.estado = d.estado;
      if (d.estado === 'Aprobado') r.fechaPago = '2026-10-28';
      return contestar(route, 200, r);
    }
    if (no[3]) {
      const i = r.lineas.findIndex((l) => l.numero === d.concepto && !l.fija);
      if (i < 0) return malo('Ese rol no tiene esa línea.');
      r.lineas.splice(i, 1);
      return contestar(route, 200, rolNeto(r));
    }
    const nombres = { 1010: ['Horas extra', 'ING'], 1020: ['Fondo de reserva', 'ING'], 2010: ['Préstamo de la empresa', 'DES'], 2021: ['Impuesto a la renta', 'DES'] };
    const [nombre, tipo] = nombres[d.concepto] || [];
    if (!nombre) return malo('Ese concepto no se agrega a mano.');
    const linea = { numero: d.concepto, nombre, tipo, cantidad: String(d.cantidad), valor: Number(d.valor).toFixed(2), fija: false };
    const i = r.lineas.findIndex((l) => l.numero === d.concepto);
    if (i >= 0) r.lineas[i] = linea; else r.lineas.push(linea);
    return contestar(route, 200, rolNeto(r));
  }
  if (ruta === '/facturas' || ruta.startsWith('/facturas/')) {
    if (!permisos.includes('facturas.anular')) return sin();
    const lista = facturasDe(sv);
    if (ruta === '/facturas' && req.method() === 'GET') {
      return contestar(route, 200, {
        facturas: lista,
        clientes: [
          { codigo: 'CLI0000001', nombre: 'CONSUMIDOR FINAL', ident: '9999999999999', tipo: 'Consumidor final', correo: null, telefono: null, facturas: lista.filter((f) => !f.anulada).length, facturado: lista.filter((f) => !f.anulada).reduce((t, f) => t + Number(f.total), 0).toFixed(2) },
          { codigo: 'CLI0000002', nombre: 'Panadería Hermanos Cruz', ident: '1790012345001', tipo: 'RUC', correo: 'cruz@correo.ec', telefono: '0991112233', facturas: 0, facturado: '0.00' },
        ],
      });
    }
    const fa = ruta.match(/^\/facturas\/(FAC\d{7})\/anular$/);
    const f = fa && lista.find((x) => x.codigo === fa[1]);
    if (!f) return contestar(route, 400, { error: 'Esa factura no existe.' });
    if (f.anulada) return contestar(route, 400, { error: 'Esa factura ya estaba anulada.' });
    f.anulada = '2026-10-28T15:00:00Z';
    return contestar(route, 200, f);
  }
  if (ruta === '/equipo' || ruta.startsWith('/equipo/')) {
    if (!permisos.includes('usuarios.gestionar')) return sin();
    const malo = (error) => contestar(route, 400, { error });
    const miCorreo = [...sv.cuentas.entries()].find(([, v]) => v === c)?.[0];
    const lista = equipoDe(sv, miCorreo);
    const CARGOS = [{ codigo: 'CAR001', nombre: 'Administrador' }, { codigo: 'CAR002', nombre: 'Panadero' }];
    if (ruta === '/equipo' && req.method() === 'GET') return contestar(route, 200, { empleados: lista, cargos: CARGOS, cantones: CANTONES });
    const d = req.postDataJSON?.() || {};
    if (ruta === '/equipo' && req.method() === 'POST') {
      if (!/^\d{10}$/.test(d.cedula || '')) return malo('La cédula no es válida.');
      if (lista.some((x) => x.cedula === d.cedula)) return malo('Ya hay un empleado con esa cédula.');
      if (!String(d.primerNombre || '').trim() || !String(d.primerApellido || '').trim()) return malo('Escribe el primer nombre y el primer apellido (hasta 30 letras cada uno).');
      if (!(Number(d.sueldo) > 0)) return malo('El sueldo tiene que ser mayor que 0 y menor que 10000, con hasta 2 decimales.');
      const nuevo = {
        codigo: `EMP${String(lista.length + 3).padStart(7, '0')}`, nombre: `${d.primerNombre} ${d.primerApellido}`, cedula: d.cedula,
        cargo: CARGOS.find((x) => x.codigo === d.cargo)?.nombre || 'Panadero', cargoCodigo: d.cargo, contrato: 'Permanente', sueldo: Number(d.sueldo),
        correo: String(d.correo || '').toLowerCase(), celular: d.celular, ingreso: new Date().toISOString().slice(0, 10), activo: true, cuentas: [],
      };
      lista.push(nuevo);
      return contestar(route, 201, nuevo);
    }
    const eq = ruta.match(/^\/equipo\/(EMP\d{7})(\/cuenta(\/quitar)?)?$/);
    const e = eq && lista.find((x) => x.codigo === eq[1]);
    if (!e) return malo('Ese empleado no existe.');
    if (!eq[2] && req.method() === 'PUT') {
      if (d.sueldo !== undefined && !(Number(d.sueldo) > 0)) return malo('El sueldo tiene que ser mayor que 0 y menor que 10000, con hasta 2 decimales.');
      if (d.sueldo !== undefined) e.sueldo = Number(d.sueldo);
      if (d.cargo) { e.cargoCodigo = d.cargo; e.cargo = CARGOS.find((x) => x.codigo === d.cargo)?.nombre || e.cargo; }
      if (d.activo === false) {
        if (e.cuentas.some((x) => x.correo === miCorreo)) return malo('No puedes darte de baja a ti mismo.');
        e.activo = false;
        e.cuentas = [];
      }
      return contestar(route, 200, e);
    }
    const correo = String(d.correo || '').toLowerCase();
    if (eq[2] === '/cuenta' && req.method() === 'PUT') {
      if (correo === miCorreo) return malo('No puedes cambiar el acceso de tu propia cuenta.');
      if (!sv.cuentas.has(correo)) return malo('No hay una cuenta con ese correo. La persona tiene que crearla primero en el sitio.');
      sv.cuentas.get(correo).rol = d.rol;
      e.cuentas.push({ correo, rol: d.rol, activa: true });
      return contestar(route, 200, e);
    }
    if (eq[3]) {
      if (!e.cuentas.some((x) => x.correo === correo)) return malo('Esa cuenta no es de ese empleado.');
      if (correo === miCorreo) return malo('No puedes quitarte el acceso a ti mismo.');
      e.cuentas = e.cuentas.filter((x) => x.correo !== correo);
      if (sv.cuentas.has(correo)) sv.cuentas.get(correo).rol = 'Cliente';
      return contestar(route, 200, e);
    }
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
