// ---- Verificar que la pagina arranca de verdad ------------------------
// node --check solo mira la sintaxis. Un const usado antes de declararse, un
// import con otra mayuscula o un modulo que revienta al evaluarse dejan la
// pagina sin JavaScript y el CI no lo ve. Aqui se abre en Edge (viene con
// Windows) por los dos caminos que tiene el sitio:
//   - por HTTP, que carga los modulos de js/ (lo que sirve GitHub Pages)
//   - con doble clic (file://), que carga js/sin-servidor.js
// y en los dos se comprueba que el DOM se armo y que la canasta responde.
//
// Uso, desde la raiz del repo:
//   node .claude/skills/verificar-sitio/verificar.mjs
// Sale con codigo 1 si algo falla.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const RAIZ = process.cwd();
if (!existsSync(join(RAIZ, 'index.html')) || !existsSync(join(RAIZ, 'data/productos.json'))) {
  console.error('Correlo desde la raiz del repo de la panaderia.');
  process.exit(1);
}

// playwright-core vive fuera del repo para no meter node_modules en Pages.
const CACHE = join(process.env.LOCALAPPDATA || join(process.env.HOME || '.', '.cache'), 'panaderia-herramientas');
const pedir = createRequire(join(CACHE, 'package.json'));
let playwright;
try {
  playwright = pedir('playwright-core');
} catch {
  console.log(`Instalando playwright-core en ${CACHE} (solo la primera vez)...`);
  mkdirSync(CACHE, { recursive: true });
  if (!existsSync(join(CACHE, 'package.json'))) writeFileSync(join(CACHE, 'package.json'), '{"private":true}');
  execSync('npm install --silent playwright-core@^1.64.0', { cwd: CACHE, stdio: 'inherit' });
  playwright = pedir('playwright-core');
}

const productos = JSON.parse(readFileSync(join(RAIZ, 'data/productos.json'), 'utf8')).productos;

// Servidor estatico minimo: lo justo para que los modulos carguen.
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
};
const servidor = createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const archivo = resolve(RAIZ, '.' + (ruta === '/' ? '/index.html' : ruta));
  if (!archivo.startsWith(RAIZ) || !existsSync(archivo)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream' });
  res.end(readFileSync(archivo));
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const HTTP = `http://127.0.0.1:${servidor.address().port}/`;

const navegador = await playwright.chromium.launch({ channel: 'msedge' });
const fallos = [];

const probar = async (nombre, url, ventana) => {
  const errores = [];
  const pagina = await navegador.newPage(ventana);
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push('consola: ' + m.text()); });
  await pagina.goto(url);
  await pagina.waitForSelector('.product-card', { timeout: 8000 }).catch(() => {});
  await pagina.waitForTimeout(600);

  const dom = await pagina.evaluate(() => {
    const n = (s) => document.querySelectorAll(s).length;
    const confirmar = document.querySelector('#contenido > #confirmar');
    return {
      fichas: n('.product-card'),
      canastaPaso: n('.canasta-panel .canasta-paso'),
      checkoutPasos: n('#confirmar .checkout-paso'),
      confirmarEscondido: confirmar ? confirmar.hidden : null,
      cuentaPasos: n('.cuenta-paso'),
      navCuenta: n('.nav-cuenta'),
    };
  });

  const revisar = (bien, que) => { if (!bien) fallos.push(`[${nombre}] ${que}`); };
  revisar(dom.fichas === productos.length, `${dom.fichas} fichas y el catalogo trae ${productos.length}`);
  revisar(dom.canastaPaso >= 1, 'no hay .canasta-paso dentro de .canasta-panel');
  revisar(dom.checkoutPasos === 2, `#confirmar tiene ${dom.checkoutPasos} .checkout-paso y deberian ser 2`);
  revisar(dom.confirmarEscondido === true, '#contenido > #confirmar no existe o no esta escondido al cargar');
  revisar(dom.cuentaPasos > 0, 'no se armo ningun .cuenta-paso');
  revisar(dom.navCuenta > 0, 'falta .nav-cuenta');

  // Anadir algo a la canasta tiene que dejar una linea.
  let lineas = 0;
  const mas = pagina.locator('.product-card .card-mas').first();
  if (await mas.count()) {
    await mas.evaluate((b) => b.click());
    await pagina.waitForTimeout(300);
    lineas = await pagina.locator('.canasta-linea').count();
  }
  revisar(lineas >= 1, 'pulsar el primer .card-mas no dejo ninguna .canasta-linea');

  // Entrar en una categoria y volver con el atras del navegador.
  const categoria = productos[0].categoria;
  await pagina.evaluate((c) => { location.hash = '#tienda-' + c; }, categoria);
  await pagina.waitForTimeout(300);
  await pagina.goBack();
  await pagina.waitForTimeout(300);
  const tras = await pagina.evaluate(() => ({ hash: location.hash, fichas: document.querySelectorAll('.product-card').length }));
  revisar(tras.hash === '' && tras.fichas === productos.length, `tras volver atras desde #tienda-${categoria}: hash "${tras.hash}", ${tras.fichas} fichas`);

  for (const e of errores) fallos.push(`[${nombre}] ${e}`);
  console.log(`${nombre}: ${dom.fichas} fichas, ${dom.cuentaPasos} pasos de cuenta, ${lineas} linea(s) en la canasta, ${errores.length} error(es)`);
  await pagina.close();
};

const ESCRITORIO = { viewport: { width: 1280, height: 900 } };
const MOVIL = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
try {
  await probar('http escritorio', HTTP, ESCRITORIO);
  await probar('http movil', HTTP, MOVIL);
  await probar('doble clic', pathToFileURL(join(RAIZ, 'index.html')).href, ESCRITORIO);
} finally {
  await navegador.close();
  servidor.close();
}

if (fallos.length) {
  console.error('\nFALLA:\n- ' + fallos.join('\n- '));
  process.exit(1);
}
console.log('\nTodo en orden.');
