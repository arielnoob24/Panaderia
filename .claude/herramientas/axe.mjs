// ---- Pasar axe-core por los estados del sitio -------------------------
// La parte automatica de la revision WCAG: abre la pagina en Edge, la lleva
// a cada estado que importa y en cada uno corre axe-core con las reglas de
// WCAG 2.0, 2.1 y 2.2, niveles A y AA (y las buenas practicas).
//   - Sitio actual: portada, categoria, canasta, menu y panel de la cuenta,
//     y la portada en el telefono.
//   - React (react/dist, de npm run build), a 1280 y a 390 px: cada vista
//     (inicio, nosotros, contacto, tienda), la canasta y la hoja de pagar,
//     cada paso de la cuenta (vacio, con errores, el recuadro del codigo, la
//     ficha de la cabecera, Mis pedidos abierto), confirmar (retiro y
//     domicilio con tarjeta y factura, con errores), el comprobante y los
//     tres pasos de recuperar.
//
// Uso, desde la raiz del repo:
//   node .claude/herramientas/axe.mjs            -> los dos sitios, resumen legible
//   node .claude/herramientas/axe.mjs --actual   -> solo el sitio actual
//   node .claude/herramientas/axe.mjs --react    -> solo React
//   node .claude/herramientas/axe.mjs --json     -> todo, para procesarlo
//
// axe solo encuentra lo que se puede medir (contraste, nombres, roles...):
// alrededor del 40% de WCAG. El resto lo revisa una persona.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

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

const soloActual = process.argv.includes('--actual');
const soloReact = process.argv.includes('--react');
const conActual = soloActual || !soloReact;
const conReact = soloReact || !soloActual;
const DIST = join(RAIZ, 'react', 'dist');
if (conReact && !existsSync(join(DIST, 'index.html'))) {
  console.error('No hay react/dist: corre npm run build dentro de react/ (o usa --actual).');
  process.exit(1);
}

// Servidor estatico minimo, sin salirse de su carpeta.
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.woff2': 'font/woff2',
};
async function servir(carpeta) {
  const base = resolve(carpeta);
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
  return { url: `http://127.0.0.1:${servidor.address().port}/`, cerrar: () => { servidor.closeAllConnections(); servidor.close(); } };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const clic = (p, sel) => p.locator(sel).first().evaluate((b) => b.click());
const ESCRITORIO = { viewport: { width: 1280, height: 900 } };
const MOVIL = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

const resultados = [];
const resumir = (v) => ({
  regla: v.id, impacto: v.impact, ayuda: v.help,
  wcag: v.tags.filter((t) => /^wcag\d{3,}$/.test(t)).map((t) => t.slice(4).split('').join('.')),
  practica: v.tags.includes('best-practice'),
  nodos: v.nodes.map((n) => ({ selector: n.target.join(' '), html: n.html.slice(0, 160), por_que: n.failureSummary?.split('\n').slice(1).join(' ').trim() })),
});
// Corre axe en la pagina tal como esta y apunta el resultado.
async function medir(pagina, estado, error) {
  // Se deja terminar las transiciones: a mitad de un fundido el contraste miente.
  await pagina.waitForTimeout(900);
  if (!(await pagina.evaluate(() => Boolean(window.axe)))) await pagina.addScriptTag({ content: AXE });
  const r = await pagina.evaluate(() => window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    resultTypes: ['violations', 'incomplete'],
    // El mapa de #/contacto es de otro origen: axe no puede entrar y se
    // quedaria esperando su respuesta.
    iframes: false,
  }));
  resultados.push({ estado, error_al_llegar: error, fallos: r.violations.map(resumir), revisar_a_mano: r.incomplete.map(resumir) });
}

// ---- El sitio actual -------------------------------------------------------
// Cada estado: como se llega desde la portada recien cargada.
const ESTADOS = [
  { nombre: 'portada', ventana: ESCRITORIO, ir: async () => {} },
  { nombre: 'categoria (#tienda-dulces)', ventana: ESCRITORIO, ir: async (p) => { await p.evaluate(() => { location.hash = '#tienda-dulces'; }); } },
  { nombre: 'canasta abierta con un producto', ventana: ESCRITORIO, ir: async (p) => { await clic(p, '.product-card .card-mas'); await clic(p, '.floating-whatsapp'); } },
  { nombre: 'menu de la cuenta', ventana: ESCRITORIO, ir: async (p) => { await clic(p, '.nav-cuenta'); } },
  { nombre: 'panel de la cuenta (entrar)', ventana: ESCRITORIO, ir: async (p) => { await clic(p, '.nav-cuenta'); await p.waitForTimeout(200); await clic(p, '.cuenta-menu [data-va="entrar"]'); } },
  { nombre: 'portada en el telefono', ventana: MOVIL, ir: async () => {} },
];
async function sitioActual(navegador, url) {
  for (const estado of ESTADOS) {
    const pagina = await navegador.newPage(estado.ventana);
    await pagina.goto(url);
    await pagina.waitForSelector('.product-card', { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(500);
    let error = null;
    try { await estado.ir(pagina); } catch (e) { error = e.message.split('\n')[0]; }
    await medir(pagina, `actual: ${estado.nombre}`, error);
    await pagina.close();
  }
}

// ---- React -----------------------------------------------------------------
// Un solo recorrido por ventana, en orden, como lo haria alguien: cada paso
// deja la pagina en un estado y ahi se mide. Si un paso no llega, se dice y
// se sigue con el siguiente.
async function react(navegador, url, nombreVentana, ventana) {
  const ctx = await navegador.newContext(ventana);
  ctx.setDefaultTimeout(8000);
  // EmailJS: cortado (sale el recuadro con el codigo) hasta recuperar, que
  // necesita que el correo salga; de lo enviado se saca el codigo.
  let correoSale = false; let ultimo = null;
  await ctx.route('https://api.emailjs.com/**', (r) => {
    if (!correoSale) return r.abort();
    const tp = JSON.parse(r.request().postData() || '{}').template_params || {};
    ultimo = (String(tp.cuerpo || '').match(/\d{6}/) || [])[0];
    return r.fulfill({ status: 200, body: 'OK' });
  });
  const p = await ctx.newPage();
  // Como un enlace de la aplicacion (pushState + popstate).
  const llegar = async (hash) => {
    await p.evaluate((h) => {
      history.pushState({ usr: null, key: 'k' + Math.random().toString(36).slice(2, 8), idx: (history.state?.idx ?? 0) + 1 }, '', h);
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    }, hash);
    await espera(300);
  };
  // Los radios van escondidos tras su dibujo: se pulsan como lo haria la etiqueta.
  const marcar = async (sel) => { await p.locator(sel).evaluate((i) => i.click()); await espera(150); };
  const paso = async (nombre, ir) => {
    let error = null;
    try { await ir(); } catch (e) { error = e.message.split('\n')[0]; }
    await medir(p, `react ${nombreVentana}: ${nombre}`, error);
  };
  try {
    await p.goto(url + '#/');
    await p.waitForSelector('.product-card', { timeout: 8000 }).catch(() => {});
    await paso('inicio', async () => {});
    await paso('nosotros', () => llegar('#/nosotros'));
    await paso('contacto', () => llegar('#/contacto'));
    await paso('tienda entera', () => llegar('#/tienda-catalogo'));
    await paso('tienda con una categoria (dulces)', () => llegar('#/tienda-dulces'));
    await paso('canasta abierta con un producto', async () => {
      await p.locator('.product-card .card-mas:visible').first().click();
      await p.click('.floating-whatsapp.is-canasta');
      await p.waitForSelector('.canasta-panel.is-open');
    });
    await paso('hoja de pagar sin cuenta', async () => { await p.click('.canasta-enviar'); await p.waitForSelector('.pide-cuenta'); });
    await paso('iniciar sesion', async () => {
      await p.click('.pide-cuenta-volver'); await espera(200);
      await p.keyboard.press('Escape'); await espera(300);
      await llegar('#/cuenta/entrar'); await p.waitForSelector('#cuenta-entrar-correo');
    });
    await paso('iniciar sesion con errores', () => p.click('.cuenta-entrar'));
    await paso('crear cuenta', async () => { await llegar('#/cuenta/crear'); await p.waitForSelector('#cuenta-nombre'); });
    await paso('crear cuenta con errores', () => p.click('.cuenta-crear'));
    await paso('verificar, con el recuadro del codigo', async () => {
      await p.fill('#cuenta-nombre', 'Ana María Pérez');
      await p.fill('#cuenta-correo', 'ana@correo.com');
      await p.fill('#cuenta-telefono', '991234567');
      await p.fill('#cuenta-clave', 'Clave123');
      await p.fill('#cuenta-repite', 'Clave123');
      await p.click('.cuenta-crear');
      await p.waitForSelector('.codigo-falso');
    });
    const codigo = (await p.textContent('.codigo-valor', { timeout: 3000 }).catch(() => '')).trim();
    await paso('verificar con un codigo malo', async () => {
      await p.click('.codigo-casilla >> nth=0');
      await p.keyboard.type(codigo === '111111' ? '222222' : '111111');
    });
    await paso('mis datos', async () => {
      await p.focus('.codigo-casilla >> nth=5');
      for (let i = 0; i < 6; i += 1) await p.keyboard.press('Backspace');
      await p.keyboard.type(codigo);
      await p.waitForSelector('.cuenta-vista-datos');
    });
    await paso('mis datos con un error', async () => { await p.fill('#cuenta-editar-telefono', '12'); await p.locator('#cuenta-editar-telefono').blur(); });
    await paso('ficha de la cuenta abierta', async () => {
      await p.fill('#cuenta-editar-telefono', '991234567');
      await p.click('.nav-cuenta');
      await p.waitForSelector('#cuenta-menu .cuenta-menu-opcion');
    });
    await paso('mis pedidos, con uno abierto', async () => {
      await p.keyboard.press('Escape');
      await p.evaluate(() => new Promise((listo, mal) => {
        const r = indexedDB.open('eltradicional');
        r.onupgradeneeded = () => r.result.createObjectStore('pedidos', { keyPath: 'numero' });
        r.onsuccess = () => {
          const t = r.result.transaction('pedidos', 'readwrite');
          t.objectStore('pedidos').put({ numero: 'ET-7KQ2', fecha: new Date().toISOString(), correo: 'ana@correo.com', total: 6.5, subtotal: 5, envio: 1.5, modo: 'domicilio', direccion: 'Calle 1 y Calle 2', metodo: 'Efectivo', lineas: [{ nombre: 'Pan de yuca', cantidad: 2, precio: 1.25 }, { nombre: 'Torta de chocolate', cantidad: 1, precio: 2.5 }] });
          t.oncomplete = () => { r.result.close(); listo(); }; t.onerror = mal;
        };
        r.onerror = mal;
      }));
      await llegar('#/cuenta/pedidos');
      await p.waitForSelector('details.cuenta-pedido');
      await p.click('.cuenta-pedido summary');
    });
    await paso('confirmar (retiro, efectivo)', async () => {
      await p.click('.floating-whatsapp.is-canasta');
      await p.waitForSelector('.canasta-panel.is-open');
      await p.click('.canasta-enviar');
      await p.waitForFunction(() => location.hash === '#/confirmar', null, { timeout: 5000 });
    });
    await paso('confirmar (domicilio, tarjeta, factura a otra persona) con errores', async () => {
      await marcar('input[name="canasta-entrega"][value="domicilio"]');
      await marcar('input[name="canasta-metodo"][value="tarjeta"]');
      await marcar('input[name="canasta-factura"][value="otro"]');
      await p.click('.canasta-pagar');
    });
    await paso('comprobante', async () => {
      await marcar('input[name="canasta-entrega"][value="retiro"]');
      await marcar('input[name="canasta-metodo"][value="efectivo"]');
      await marcar('input[name="canasta-factura"][value="mi"]');
      await p.click('.canasta-pagar');
      await p.waitForFunction(() => location.hash === '#/comprobante', null, { timeout: 8000 });
    });
    await paso('recuperar: el correo', async () => {
      await llegar('#/cuenta');
      await p.click('.cuenta-salir'); await espera(300);
      await llegar('#/cuenta/recuperar');
      await p.waitForSelector('#cuenta-recuperar-correo');
    });
    await paso('recuperar: el codigo', async () => {
      correoSale = true;
      await p.fill('#cuenta-recuperar-correo', 'ana@correo.com');
      await p.click('.cuenta-recuperar');
      await p.waitForSelector('.recuperar-paso-codigo .codigo-casilla');
    });
    await paso('recuperar: la contrasena nueva', async () => {
      await p.click('.codigo-casilla >> nth=0');
      await p.keyboard.type(ultimo || '');
      await p.waitForSelector('#cuenta-recuperar-clave');
    });
  } finally {
    await ctx.close();
  }
}

const servidores = [];
const navegador = await playwright.chromium.launch({ channel: 'msedge', timeout: 30000 });
try {
  if (conActual) {
    const actual = await servir(RAIZ); servidores.push(actual);
    await sitioActual(navegador, actual.url);
  }
  if (conReact) {
    const dist = await servir(DIST); servidores.push(dist);
    await react(navegador, dist.url, '1280', ESCRITORIO);
    await react(navegador, dist.url, '390', MOVIL);
  }
} finally {
  await navegador.close();
  for (const s of servidores) s.cerrar();
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
  const conFallos = resultados.filter((r) => r.fallos.length).length;
  const sinLlegar = resultados.filter((r) => r.error_al_llegar).length;
  console.log(`
${resultados.length} estados medidos: ${conFallos} con fallos automaticos${sinLlegar ? `, ${sinLlegar} a los que no se pudo llegar` : ''}.`);
}
