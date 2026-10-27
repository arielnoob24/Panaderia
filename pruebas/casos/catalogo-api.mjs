// El catalogo sale de la API (supabase/functions/api, GET /productos) y, si
// la API no contesta, del respaldo data/productos.json (seccion 8 del plan,
// "La API"):
// - con la API cortada, la tienda trae las 17 fichas igual y la consola avisa
//   de que se uso el respaldo;
// - con la API de verdad, la pagina la pide y, si contesta, no usa el
//   respaldo. Si no hay red hasta Supabase (o el proyecto esta en pausa) se
//   dice y no se cuenta como fallo: lo que se prueba es la pagina, no Supabase.
import { VENTANAS } from '../arranque.mjs';

export const descripcion = 'Catalogo desde la API de Supabase, y con la API cortada desde el respaldo data/productos.json';
export const limite = 60;

const API = 'https://ugscqizansixnsuzljtu.supabase.co/functions/v1/api/productos';
const respaldo = (await import('../../data/productos.json', { with: { type: 'json' } })).default.productos;

const abrir = async (t, nombre, cortar) => {
  const ctx = await t.contexto(VENTANAS.escritorio, { nombre });
  const p = await ctx.newPage();
  // Las pruebas cortan todo lo que sale del 127.0.0.1 (probar.mjs); aqui se
  // deja pasar la API, o se corta a proposito.
  await p.route(API, (r) => (cortar ? r.abort() : r.continue()));
  const avisos = [];
  p.on('console', (m) => { if (m.type() === 'warning') avisos.push(m.text()); });
  let respuesta = null;
  p.on('response', (r) => { if (r.url() === API && r.request().method() === 'GET') respuesta = r.status(); });
  await p.goto(t.REACT + '#/tienda-catalogo');
  await p.waitForSelector('.product-card', { timeout: 10000 });
  const fichas = await p.evaluate(() => document.querySelectorAll('.product-card').length);
  const usoRespaldo = avisos.some((a) => a.includes('se usa data/productos.json'));
  return { ctx, fichas, usoRespaldo, respuesta };
};

export default async function catalogoApi(t) {
  const cortada = await abrir(t, 'api-cortada', true);
  t.ok(cortada.fichas === respaldo.length, `con la API cortada la tienda trae ${cortada.fichas} fichas, no ${respaldo.length}`);
  t.ok(cortada.usoRespaldo, 'con la API cortada no se avisa de que se uso el respaldo');
  await cortada.ctx.close();

  const viva = await abrir(t, 'api-viva', false);
  t.ok(viva.fichas >= 1, 'con la API la tienda no trae fichas');
  if (viva.respuesta === 200) {
    t.ok(!viva.usoRespaldo, 'la API contesto 200 pero la pagina uso el respaldo (CORS o datos que no pasan revisar)');
  } else {
    console.log(`    aviso: la API no contesto 200 (${viva.respuesta ?? 'sin respuesta'}); no se comprueba que se use`);
  }
  await viva.ctx.close();
}
