// ---- Pasar axe-core por los estados del sitio -------------------------
// La parte automatica de la revision WCAG: abre la pagina en Edge, la lleva
// a cada estado que importa (portada, categoria, canasta, menu y panel de la
// cuenta, y la portada en el telefono) y en cada uno corre axe-core con las
// reglas de WCAG 2.0, 2.1 y 2.2, niveles A y AA.
//
// Uso, desde la raiz del repo:
//   node .claude/herramientas/axe.mjs            -> resumen legible
//   node .claude/herramientas/axe.mjs --json     -> todo, para procesarlo
//
// axe solo encuentra lo que se puede medir (contraste, nombres, roles...):
// alrededor del 40% de WCAG. El resto lo revisa una persona.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const RAIZ = process.cwd();
if (!existsSync(join(RAIZ, 'index.html'))) {
  console.error('Correlo desde la raiz del repo de la panaderia.');
  process.exit(1);
}

// Las dependencias viven fuera del repo, junto a las de verificar-sitio.
const CACHE = join(process.env.LOCALAPPDATA || join(process.env.HOME || '.', '.cache'), 'panaderia-herramientas');
const pedir = createRequire(join(CACHE, 'package.json'));
// Se mira la carpeta y no se prueba con require: Node recuerda que no lo
// encontro y, recien instalado, seguiria sin encontrarlo.
const cargar = (paquete, version) => {
  const carpeta = join(CACHE, 'node_modules', paquete);
  if (!existsSync(join(carpeta, 'package.json'))) {
    console.error(`Instalando ${paquete} en ${CACHE} (solo la primera vez)...`);
    mkdirSync(CACHE, { recursive: true });
    if (!existsSync(join(CACHE, 'package.json'))) writeFileSync(join(CACHE, 'package.json'), '{"private":true}');
    execSync(`npm install --silent ${paquete}@${version}`, { cwd: CACHE, stdio: 'inherit' });
  }
  return carpeta;
};
const playwright = pedir(cargar('playwright-core', '^1.64.0'));
const AXE = readFileSync(join(cargar('axe-core', '^4.10.0'), 'axe.min.js'), 'utf8');

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
const URL_SITIO = `http://127.0.0.1:${servidor.address().port}/`;

const clic = (p, sel) => p.locator(sel).first().evaluate((b) => b.click());
const ESCRITORIO = { viewport: { width: 1280, height: 900 } };
const MOVIL = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

// Cada estado: como se llega desde la portada recien cargada.
const ESTADOS = [
  { nombre: 'portada', ventana: ESCRITORIO, ir: async () => {} },
  { nombre: 'categoria (#tienda-dulces)', ventana: ESCRITORIO, ir: async (p) => { await p.evaluate(() => { location.hash = '#tienda-dulces'; }); } },
  { nombre: 'canasta abierta con un producto', ventana: ESCRITORIO, ir: async (p) => { await clic(p, '.product-card .card-mas'); await clic(p, '.floating-whatsapp'); } },
  { nombre: 'menu de la cuenta', ventana: ESCRITORIO, ir: async (p) => { await clic(p, '.nav-cuenta'); } },
  { nombre: 'panel de la cuenta (entrar)', ventana: ESCRITORIO, ir: async (p) => { await clic(p, '.nav-cuenta'); await p.waitForTimeout(200); await clic(p, '.cuenta-menu [data-va="entrar"]'); } },
  { nombre: 'portada en el telefono', ventana: MOVIL, ir: async () => {} },
];

const navegador = await playwright.chromium.launch({ channel: 'msedge' });
const resultados = [];
try {
  for (const estado of ESTADOS) {
    const pagina = await navegador.newPage(estado.ventana);
    await pagina.goto(URL_SITIO);
    await pagina.waitForSelector('.product-card', { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(500);
    let error = null;
    try { await estado.ir(pagina); } catch (e) { error = e.message.split('\n')[0]; }
    // Se deja terminar las transiciones: a mitad de un fundido el contraste miente.
    await pagina.waitForTimeout(900);
    await pagina.addScriptTag({ content: AXE });
    const r = await pagina.evaluate(() => window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      resultTypes: ['violations', 'incomplete'],
    }));
    const resumir = (v) => ({
      regla: v.id, impacto: v.impact, ayuda: v.help,
      wcag: v.tags.filter((t) => /^wcag\d{3,}$/.test(t)).map((t) => t.slice(4).split('').join('.')),
      practica: v.tags.includes('best-practice'),
      nodos: v.nodes.map((n) => ({ selector: n.target.join(' '), html: n.html.slice(0, 160), por_que: n.failureSummary?.split('\n').slice(1).join(' ').trim() })),
    });
    resultados.push({ estado: estado.nombre, error_al_llegar: error, fallos: r.violations.map(resumir), revisar_a_mano: r.incomplete.map(resumir) });
    await pagina.close();
  }
} finally {
  await navegador.close();
  servidor.close();
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(resultados, null, 2));
} else {
  for (const r of resultados) {
    console.log(`\n== ${r.estado}${r.error_al_llegar ? `  (NO SE PUDO LLEGAR: ${r.error_al_llegar})` : ''}`);
    if (!r.fallos.length) console.log('  sin fallos automaticos');
    for (const f of r.fallos) {
      console.log(`  [${f.impacto}] ${f.regla} (${f.wcag.join(', ') || (f.practica ? 'buena practica' : '-')}): ${f.ayuda}`);
      for (const n of f.nodos.slice(0, 4)) console.log(`      ${n.selector}${n.por_que ? '  -> ' + n.por_que : ''}`);
      if (f.nodos.length > 4) console.log(`      ... y ${f.nodos.length - 4} mas`);
    }
    if (r.revisar_a_mano.length) console.log(`  a revisar a mano: ${r.revisar_a_mano.map((f) => `${f.regla} (${f.nodos.length})`).join(', ')}`);
  }
}
