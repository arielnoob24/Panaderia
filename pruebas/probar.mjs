// ---- Pruebas de navegador del sitio -------------------------------------
// Corre los casos de pruebas/casos/ uno tras otro contra dist/ (lo que deja
// npm run build), con un solo navegador y un servidor propio en un puerto
// libre.
//
// Uso, en la raiz del repo y despues de npm run build:
//   npm run probar              todos
//   npm run probar -- humo      uno (o varios: -- humo cuenta)
//   npm run probar -- --lista   los nombres y que comprueba cada uno
// Sale con codigo 1 si algun caso falla, con un resumen al final.
//
// El navegador: Edge en Windows, Chrome en lo demas; NAVEGADOR=chrome (o
// msedge, chromium) lo cambia. playwright-core vive fuera del repo
// (arranque.mjs) y no entra en package.json.
//
// Un caso es un modulo de casos/ que exporta:
//   export const descripcion = 'que comprueba';
//   export const limite = 120;            // segundos, opcional (90 si no)
//   export default async function (t) { ... }
// y t trae REACT (la direccion del sitio), RAIZ (la carpeta del repo),
// contexto(ventana, { nombre, correo }) para abrir una ventana con lo de
// siempre (limites de espera, EmailJS cortado, errores de pagina recogidos),
// ok(condicion, que), fallo(que) y apunte(texto).
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DIST, RAIZ, opcionesNavegador, paqueteFuera, servir } from './arranque.mjs';
import * as supabaseFalso from './supabaseFalso.mjs';

const CASOS_DIR = join(RAIZ, 'pruebas', 'casos');
// Primero el de humo (si eso falla, lo demas no dice nada nuevo); luego por nombre.
const todos = readdirSync(CASOS_DIR).filter((f) => f.endsWith('.mjs')).map((f) => f.slice(0, -4))
  .sort((a, b) => (a === 'humo' ? -1 : b === 'humo' ? 1 : a.localeCompare(b)));

const pedidos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (process.argv.includes('--lista')) {
  for (const n of todos) {
    const m = await import(pathToFileURL(join(CASOS_DIR, n + '.mjs')).href);
    console.log(`${n.padEnd(24)} ${m.descripcion || ''}`);
  }
  process.exit(0);
}
const desconocidos = pedidos.filter((n) => !todos.includes(n));
if (desconocidos.length) {
  console.error(`No hay ningun caso llamado ${desconocidos.join(', ')}. Hay: ${todos.join(', ')}.`);
  process.exit(1);
}
const elegidos = pedidos.length ? pedidos : todos;

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('No hay dist/: corre npm run build antes.');
  process.exit(1);
}
// Si src/ es mas nuevo que lo construido, se prueba lo de antes: se avisa.
const masNuevo = (carpeta) => readdirSync(carpeta, { withFileTypes: true }).reduce((max, e) => {
  const ruta = join(carpeta, e.name);
  return Math.max(max, e.isDirectory() ? masNuevo(ruta) : statSync(ruta).mtimeMs);
}, 0);
if (masNuevo(join(RAIZ, 'src')) > statSync(join(DIST, 'index.html')).mtimeMs) {
  console.log('Aviso: hay cambios en src/ posteriores a dist/. Se prueba lo construido; corre npm run build si quieres lo nuevo.');
}

const { chromium } = paqueteFuera('playwright-core', '^1.64.0');

// ---- Levantar y cerrar todo -----------------------------------------------
let react = null; let navegador = null;
let cerrado = false;
// Se prueba una copia de dist/: si alguien construye a la vez (otro agente,
// npm run dev...), los archivos con huella cambian a mitad de la prueba.
const copia = mkdtempSync(join(tmpdir(), 'panaderia-dist-'));
// Espera a una promesa como mucho ms milisegundos; dice si llego.
const aTiempo = (promesa, ms) => new Promise((listo) => {
  const reloj = setTimeout(() => listo(false), ms);
  Promise.resolve(promesa).then(() => listo(true), () => listo(true)).finally(() => clearTimeout(reloj));
});
async function cerrarTodo() {
  if (cerrado) return;
  cerrado = true;
  await aTiempo(Promise.allSettled([navegador?.close(), react?.cerrar()]), 15000);
  rmSync(copia, { recursive: true, force: true });
}
for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, async () => { console.error(`\nCortado (${senal}): cerrando el navegador y los servidores.`); await cerrarTodo(); process.exit(130); });
}

const resultados = [];
const inicio = Date.now();
try {
  cpSync(DIST, copia, { recursive: true });
  react = await servir(copia);
  const opciones = opcionesNavegador();
  const abrirNavegador = async () => {
    try {
      navegador = await chromium.launch({ ...opciones, timeout: 30000 });
    } catch (e) {
      throw new Error(`No se pudo abrir el navegador (${JSON.stringify(opciones)}). Con NAVEGADOR=chrome|msedge|chromium o NAVEGADOR_RUTA se elige otro.\n${e.message.split('\n')[0]}`);
    }
  };
  await abrirNavegador();
  console.log(`${navegador.browserType().name()} ${navegador.version()} (${opciones.channel || opciones.executablePath || 'chromium'}); sitio en ${react.url}`);

  for (const nombre of elegidos) {
    const modulo = await import(pathToFileURL(join(CASOS_DIR, nombre + '.mjs')).href);
    const limite = (modulo.limite || 90) * 1000;
    const fallos = []; let bien = 0;
    const abiertos = new Set();
    let cortado = false;
    // Cada caso empieza sin cuentas en el Supabase de mentira.
    supabaseFalso.reiniciar();
    const t = {
      REACT: react.url, RAIZ,
      ok: (condicion, que) => { if (condicion) bien += 1; else fallos.push(que); },
      fallo: (que) => fallos.push(que),
      apunte: (texto) => console.log(`    ${texto}`),
      async contexto(ventana, { nombre: etiqueta = '', correo } = {}) {
        // Un caso cortado por tiempo sigue corriendo de fondo: que no abra nada mas.
        if (cortado) throw new Error('el caso ya se corto');
        const ctx = await navegador.newContext(ventana);
        abiertos.add(ctx);
        ctx.on('close', () => abiertos.delete(ctx));
        ctx.setDefaultTimeout(8000);
        ctx.setDefaultNavigationTimeout(15000);
        // Nada sale a internet (el mapa, las fuentes): las pruebas no dependen
        // de la red. EmailJS, cortado salvo que el caso diga que hacer con el.
        // Playwright mira primero la ruta registrada la ultima.
        await ctx.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, (r) => r.abort());
        await ctx.route('https://api.emailjs.com/**', correo || ((r) => r.abort()));
        // La cuenta habla con un Supabase de mentira (pruebas/supabaseFalso.mjs).
        await supabaseFalso.instalar(ctx);
        const pre = etiqueta ? `[${etiqueta}] ` : '';
        ctx.on('page', (p) => {
          p.on('pageerror', (e) => fallos.push(`${pre}error de pagina: ${e.message.split('\n')[0]}`));
          p.on('console', (m) => {
            // Lo que se corto a proposito (EmailJS, el mapa) sale como ERR_FAILED;
            // un archivo propio que falta se dice abajo, con su direccion.
            if (m.type() === 'error' && !/emailjs|ERR_FAILED|^Failed to load resource/i.test(m.text())) fallos.push(`${pre}consola: ${m.text().split('\n')[0]}`);
          });
          p.on('response', (r) => {
            if (r.status() >= 400 && r.url().startsWith('http://127.0.0.1')) fallos.push(`${pre}${r.status()} en ${r.url()}`);
          });
        });
        return ctx;
      },
    };
    console.log(`\n-- ${nombre}${modulo.descripcion ? ': ' + modulo.descripcion : ''}`);
    const desde = Date.now();
    let reloj;
    try {
      await Promise.race([
        modulo.default(t),
        new Promise((_, mal) => { reloj = setTimeout(() => mal(new Error(`se paso de ${limite / 1000} s`)), limite); }),
      ]);
    } catch (e) {
      cortado = true;
      fallos.push(`se corto: ${e.message.split('\n')[0]}`);
    } finally {
      clearTimeout(reloj);
    }
    // Lo que el caso dejo abierto (tambien si se corto a medias). Si se corto o
    // no se deja cerrar (una pagina colgada), el siguiente empieza con otro
    // navegador, para que no herede nada.
    const cerro = await aTiempo(Promise.allSettled([...abiertos].map((c) => c.close())), 10000);
    if (!cerro) fallos.push('no se pudo cerrar lo que abrio en 10 s');
    if (!cerro || cortado) {
      await aTiempo(navegador.close(), 10000);
      await abrirNavegador();
    }
    const segundos = (Date.now() - desde) / 1000;
    resultados.push({ nombre, bien, fallos, segundos });
    for (const f of fallos) console.log(`    FALLA ${f}`);
    console.log(`   ${fallos.length ? 'MAL' : 'bien'}: ${bien} comprobaciones bien, ${fallos.length} fallo(s), ${segundos.toFixed(1)} s`);
  }
} catch (e) {
  console.error(`\n${e.message}`);
  resultados.push({ nombre: '(arranque)', bien: 0, fallos: [e.message], segundos: 0 });
} finally {
  await cerrarTodo();
}

// ---- Resumen --------------------------------------------------------------
console.log('\nResumen:');
for (const r of resultados) {
  console.log(`  ${r.fallos.length ? 'MAL ' : 'bien'}  ${r.nombre.padEnd(24)} ${String(r.bien).padStart(4)} bien  ${String(r.fallos.length).padStart(3)} fallo(s)  ${r.segundos.toFixed(1).padStart(6)} s`);
}
const malos = resultados.filter((r) => r.fallos.length);
console.log(`\n${resultados.length - malos.length} de ${resultados.length} en orden, en ${((Date.now() - inicio) / 1000).toFixed(1)} s.`);
process.exit(malos.length ? 1 : 0);
