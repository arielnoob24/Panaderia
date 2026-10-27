// ---- Lo que comparten las pruebas de navegador -------------------------
// probar.mjs lo usa para levantar todo una sola vez (servidores, navegador)
// y los casos de casos/ para lo que repiten (ventanas, crear una cuenta,
// meter pedidos en IndexedDB...).
//
// playwright-core vive fuera del repo, como en verificar-sitio: en Windows,
// %LOCALAPPDATA%/panaderia-herramientas; en otro sistema, ~/.cache/...; o la
// carpeta que diga PANADERIA_HERRAMIENTAS (la usa el CI). La primera vez se
// instala solo.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigoDe } from './supabaseFalso.mjs';

// La raiz del repo, sacada de donde esta este archivo, y lo construido.
export const RAIZ = fileURLToPath(new URL('..', import.meta.url));
export const DIST = join(RAIZ, 'dist');

export const CACHE = process.env.PANADERIA_HERRAMIENTAS
  || join(process.env.LOCALAPPDATA || join(homedir(), '.cache'), 'panaderia-herramientas');

// Instala un paquete en CACHE si no esta. Se mira la carpeta y no se prueba
// con require: Node recuerda que no lo encontro y, recien instalado, seguiria
// sin encontrarlo.
export function paqueteFuera(paquete, version) {
  const carpeta = join(CACHE, 'node_modules', paquete);
  if (!existsSync(join(carpeta, 'package.json'))) {
    console.log(`Instalando ${paquete} en ${CACHE} (solo la primera vez)...`);
    mkdirSync(CACHE, { recursive: true });
    if (!existsSync(join(CACHE, 'package.json'))) writeFileSync(join(CACHE, 'package.json'), '{"private":true}');
    execSync(`npm install --silent --no-audit --no-fund ${paquete}@${version}`, { cwd: CACHE, stdio: 'inherit', timeout: 180000 });
  }
  return createRequire(join(CACHE, 'package.json'))(carpeta);
}

// Que navegador se abre. NAVEGADOR=msedge|chrome|chromium lo fija; si no, en
// Windows Edge (viene con el sistema) y en lo demas Chrome (el del runner de
// GitHub). NAVEGADOR_RUTA apunta a un ejecutable concreto.
export function opcionesNavegador() {
  if (process.env.NAVEGADOR_RUTA) return { executablePath: process.env.NAVEGADOR_RUTA };
  const canal = process.env.NAVEGADOR || (process.platform === 'win32' ? 'msedge' : 'chrome');
  return canal === 'chromium' ? {} : { channel: canal };
}

// Servidor estatico minimo, sin salirse de su carpeta. Un archivo que no
// existe da 404 (no el index): asi un import roto se ve como error.
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2',
};
export async function servir(carpeta) {
  const base = resolve(carpeta);
  const servidor = createServer((req, res) => {
    let ruta;
    try { ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); res.end(); return; }
    const archivo = resolve(base, '.' + (ruta.endsWith('/') ? ruta + 'index.html' : ruta));
    if ((archivo !== base && !archivo.startsWith(base + sep)) || !existsSync(archivo) || !statSync(archivo).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(readFileSync(archivo));
  });
  await new Promise((ok, mal) => { servidor.once('error', mal); servidor.listen(0, '127.0.0.1', ok); });
  return {
    url: `http://127.0.0.1:${servidor.address().port}/`,
    // Las conexiones que el navegador deja abiertas no deben tener vivo el proceso.
    cerrar: () => new Promise((ok) => { servidor.closeAllConnections(); servidor.close(() => ok()); }),
  };
}

// ---- Para los casos --------------------------------------------------------
export const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export const VENTANAS = {
  escritorio: { viewport: { width: 1280, height: 900 } },
  movil: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
  m320: { viewport: { width: 320, height: 700 }, hasTouch: true, isMobile: true },
};

// Repite f hasta que de verdad o se acaben las vueltas (100 ms cada una).
export async function esperaQue(f, vueltas = 30) {
  for (let k = 0; k < vueltas; k += 1) {
    if (await f()) return true;
    await espera(100);
  }
  return Boolean(await f());
}

export const hashDe = (p) => p.evaluate(() => location.hash);

// Como un enlace de la aplicacion: pushState con clave propia y popstate
// (location.hash a pelo llega sin clave y React Router lo toma por la
// direccion de abrir la pagina, que no mueve el foco).
export async function llegar(p, hash) {
  await p.evaluate((h) => {
    const idx = (history.state?.idx ?? 0) + 1;
    history.pushState({ usr: null, key: 'k' + Math.random().toString(36).slice(2, 8), idx }, '', h);
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
  }, hash);
  await espera(250);
}

// Crea y verifica una cuenta por la interfaz de React, con el codigo que
// "llego" al correo (pruebas/supabaseFalso.mjs). Deja la pagina en #/cuenta.
export const ANA = { nombre: 'Ana María Pérez', correo: 'ana@correo.com', telefono: '991234567', clave: 'Clave123' };
export async function crearCuenta(p, react, datos = ANA) {
  await p.goto(react + '#/cuenta/crear');
  await p.reload();
  await p.waitForSelector('#cuenta-nombre');
  await p.fill('#cuenta-nombre', datos.nombre);
  await p.fill('#cuenta-correo', datos.correo);
  await p.fill('#cuenta-telefono', datos.telefono);
  await p.fill('#cuenta-clave', datos.clave);
  await p.fill('#cuenta-repite', datos.clave);
  await p.click('.cuenta-crear');
  await p.waitForSelector('.codigo-casilla');
  const codigo = codigoDe(datos.correo);
  await p.click('.codigo-casilla >> nth=0');
  await p.keyboard.type(codigo);
  await p.waitForSelector('.cuenta-vista-datos');
  await espera(400);
}

// Mete pedidos pagados en IndexedDB (eltradicional/pedidos), con el formato
// que deja el pago. haceMs: cuanto antes de ahora es su fecha.
export const meterPedidos = (p, pedidos) => p.evaluate((lista) => new Promise((listo, mal) => {
  const r = indexedDB.open('eltradicional');
  r.onupgradeneeded = () => r.result.createObjectStore('pedidos', { keyPath: 'numero' });
  r.onsuccess = () => {
    const t = r.result.transaction('pedidos', 'readwrite');
    const s = t.objectStore('pedidos');
    for (const { haceMs = 0, ...pedido } of lista) s.put({ ...pedido, fecha: new Date(Date.now() - haceMs).toISOString() });
    t.oncomplete = () => { r.result.close(); listo(); };
    t.onerror = mal;
  };
  r.onerror = mal;
}), pedidos);

export const PEDIDO_EJEMPLO = {
  numero: 'ET-7KQ2', total: 6.5, subtotal: 5, envio: 1.5, modo: 'domicilio', direccion: 'Calle 1 y Calle 2', metodo: 'Efectivo',
  lineas: [{ nombre: 'Pan de yuca', cantidad: 2, precio: 1.25 }, { nombre: 'Torta de chocolate', cantidad: 1, precio: 2.5 }],
};
