// ---- Capturas del sitio para la revision visual -------------------------
// Abre lo construido (dist/, de npm run build) en Edge y saca capturas de
// cada vista en los cortes del plan (1440, 900, 680 y 390 px): arriba del
// todo, a media pagina (la barra pegada) y la pagina entera. Ademas, en
// escritorio, una ficha con el puntero encima, la canasta abierta y una
// tira de fotogramas del cambio de vista para ver como se mueve.
//
// Uso, desde la raiz del repo y despues de npm run build:
//   node .claude/herramientas/capturas.mjs [carpeta]
// Sin carpeta, las deja en %TEMP%/panaderia-capturas (nunca en el repo).
// Imprime la lista de archivos para leerlos despues.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';

const RAIZ = process.cwd();
if (!existsSync(join(RAIZ, 'index.html')) || !existsSync(join(RAIZ, 'package.json'))) {
  console.error('Correlo desde la raiz del repo de la panaderia.');
  process.exit(1);
}

// Las dependencias viven fuera del repo, junto a las de npm run probar.
const CACHE = join(process.env.LOCALAPPDATA || join(process.env.HOME || '.', '.cache'), 'panaderia-herramientas');
const carpetaDe = (paquete, version) => {
  const carpeta = join(CACHE, 'node_modules', paquete);
  if (!existsSync(join(carpeta, 'package.json'))) {
    console.error(`Instalando ${paquete} en ${CACHE} (solo la primera vez)...`);
    mkdirSync(CACHE, { recursive: true });
    if (!existsSync(join(CACHE, 'package.json'))) writeFileSync(join(CACHE, 'package.json'), '{"private":true}');
    execSync(`npm install --silent ${paquete}@${version}`, { cwd: CACHE, stdio: 'inherit' });
  }
  return carpeta;
};
const playwright = createRequire(join(CACHE, 'package.json'))(carpetaDe('playwright-core', '^1.64.0'));

const DIST = join(RAIZ, 'dist');
if (!existsSync(join(DIST, 'index.html'))) {
  console.error('No hay dist/: corre npm run build antes.');
  process.exit(1);
}
const SALIDA = resolve(process.argv[2] || join(tmpdir(), 'panaderia-capturas'));
if (SALIDA === RAIZ || SALIDA.startsWith(RAIZ + sep)) {
  console.error('Las capturas no van dentro del repo.');
  process.exit(1);
}
rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

// Servidor estatico minimo, sin salirse de su carpeta.
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.woff2': 'font/woff2',
};
const base = resolve(DIST);
const servidor = createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const archivo = resolve(base, '.' + (ruta.endsWith('/') ? ruta + 'index.html' : ruta));
  if ((archivo !== base && !archivo.startsWith(base + sep)) || !existsSync(archivo) || !statSync(archivo).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream' });
  res.end(readFileSync(archivo));
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const URL_SITIO = `http://127.0.0.1:${servidor.address().port}/`;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const VENTANAS = [
  { nombre: '1440', viewport: { width: 1440, height: 900 } },
  { nombre: '900', viewport: { width: 900, height: 1000 } },
  { nombre: '680', viewport: { width: 680, height: 1000 }, hasTouch: true },
  { nombre: '390', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
];
const VISTAS = [
  ['inicio', '#/'],
  ['tienda', '#/tienda-catalogo'],
  ['nosotros', '#/nosotros'],
  ['contacto', '#/contacto'],
  ['entrar', '#/cuenta/entrar'],
];
const hechas = [];
const foto = async (p, nombre, opciones = {}) => {
  const archivo = join(SALIDA, `${nombre}.png`);
  await p.screenshot({ path: archivo, ...opciones });
  hechas.push(archivo);
};
// Como un enlace de la aplicacion (pushState + popstate).
const llegar = (p, hash) => p.evaluate((h) => {
  history.pushState({ usr: null, key: 'k' + Math.random().toString(36).slice(2, 8), idx: (history.state?.idx ?? 0) + 1 }, '', h);
  window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
}, hash);

const navegador = await playwright.chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : 'chrome' });
try {
  for (const v of VENTANAS) {
    const ctx = await navegador.newContext(v);
    await ctx.route('https://api.emailjs.com/**', (r) => r.abort());
    const p = await ctx.newPage();
    await p.goto(URL_SITIO + '#/');
    await p.waitForSelector('.product-card', { timeout: 10000 }).catch(() => {});
    for (const [nombre, hash] of VISTAS) {
      await llegar(p, hash);
      await espera(1200);
      await p.evaluate(() => window.scrollTo(0, 0));
      await espera(500);
      await foto(p, `${v.nombre}-${nombre}-arriba`);
      // A media pagina: la barra pegada sobre lo que haya debajo.
      await p.evaluate(() => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.4)));
      await espera(700);
      await foto(p, `${v.nombre}-${nombre}-medio`);
      await p.evaluate(() => window.scrollTo(0, 0));
      await espera(400);
      await foto(p, `${v.nombre}-${nombre}-entera`, { fullPage: true });
    }
    if (v.nombre === '1440') {
      // Una ficha con el puntero encima.
      await llegar(p, '#/tienda-catalogo');
      await espera(1200);
      const ficha = p.locator('.product-card').first();
      await ficha.scrollIntoViewIfNeeded();
      await ficha.hover();
      await espera(600);
      await foto(p, '1440-ficha-hover', { clip: await ficha.boundingBox().then((b) => ({ x: b.x - 20, y: b.y - 20, width: b.width + 40, height: b.height + 40 })) });
      // La canasta abierta con un producto.
      const agregar = p.locator('.product-card button:has-text("+"), .product-card [aria-label*="Agregar"], .product-card [aria-label*="Sumar"]').first();
      await agregar.click().catch(() => {});
      await espera(1000);
      await p.locator('.site-header [aria-label*="anasta"], .site-header button:has-text("Canasta")').first().click().catch(() => {});
      await espera(900);
      await foto(p, '1440-canasta-abierta');
      await p.keyboard.press('Escape');
      await espera(600);
      // Fotogramas del cambio de vista: cada 70 ms desde que se pulsa.
      await llegar(p, '#/');
      await espera(1200);
      await llegar(p, '#/nosotros');
      for (let i = 0; i < 8; i++) {
        await foto(p, `1440-transicion-${String(i * 70).padStart(3, '0')}ms`, { clip: { x: 0, y: 0, width: 1440, height: 600 } });
        await espera(70);
      }
    }
    await ctx.close();
  }
} finally {
  await navegador.close();
  servidor.closeAllConnections();
  servidor.close();
}
console.log(`${hechas.length} capturas en ${SALIDA}`);
for (const h of hechas) console.log(h);
