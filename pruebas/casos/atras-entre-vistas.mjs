// Atras y Adelante: entre vistas, arriba del todo y con el foco en el h1
// (dentro de la ventana); entre categorias de la tienda, donde se estaba.
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'Atras y Adelante: entre vistas arriba y foco en el h1; en la tienda, donde se estaba';
export const limite = 150;

const PRUEBAS = {
  escritorio: VENTANAS.escritorio,
  movil: VENTANAS.movil,
  reducido: { ...VENTANAS.escritorio, reducedMotion: 'reduce' },
};

export default async function atrasEntreVistas(t) {
  for (const [nombre, ventana] of Object.entries(PRUEBAS)) {
    const ctx = await t.contexto(ventana, { nombre });
    const p = await ctx.newPage();
    const ir = (sel) => p.evaluate((s) => document.querySelector(s).click(), sel);
    const abrir = async (hash) => { await p.goto('about:blank'); await p.goto(t.REACT + hash); await espera(900); };
    const mira = async (que) => {
      const r = await p.evaluate(() => {
        const e = document.activeElement; const q = e.getBoundingClientRect();
        return { tag: e.tagName, id: e.id || String(e.className).slice(0, 20), top: Math.round(q.top), bottom: Math.round(q.bottom), alto: innerHeight, y: Math.round(scrollY), hash: location.hash };
      });
      t.ok(r.tag === 'H1' && r.bottom > 0 && r.top < r.alto && r.y === 0, `[${nombre}] ${que}: ${JSON.stringify(r)}`);
    };

    for (const inicio of ['#/', '#/tienda-catalogo', '#/contacto', '#/nosotros']) {
      await abrir(inicio);
      await p.mouse.wheel(0, 500); await espera(600);
      await ir('.nav-cuenta'); await espera(800);
      await p.mouse.wheel(0, 300); await espera(500);
      await p.goBack(); await espera(1200);
      await mira(`abierta en ${inicio}, cuenta, Atras`);
      await p.goForward(); await espera(1200);
      await mira(`abierta en ${inicio}, cuenta, Atras y Adelante`);
    }
    // De vista a vista con los enlaces de la cabecera.
    await abrir('#/nosotros');
    await p.mouse.wheel(0, 700); await espera(600);
    await ir('.site-header a[href$="contacto"]'); await espera(900);
    await p.mouse.wheel(0, 400); await espera(600);
    await p.goBack(); await espera(1200);
    await mira('contacto y Atras a nosotros');

    // En la tienda: otra categoria, bajar, otra categoria, Atras. Tienda ya
    // no tiene desplegable: se cambia la direccion, una entrada nueva.
    await abrir('#/tienda-catalogo');
    await p.evaluate(() => { location.hash = '#/tienda-panes'; }); await espera(900);
    await p.mouse.wheel(0, 600); await espera(700);
    const yPanes = await p.evaluate(() => Math.round(scrollY));
    await p.evaluate(() => { location.hash = '#/tienda-dulces'; }); await espera(1000);
    await p.goBack(); await espera(1400);
    const r = await p.evaluate(() => ({ hash: location.hash, y: Math.round(scrollY) }));
    t.ok(r.hash === '#/tienda-panes' && Math.abs(r.y - yPanes) <= 40, `[${nombre}] tienda: panes estaba en y=${yPanes} y Atras deja ${r.hash} en y=${r.y}`);
    await ctx.close();
  }
}
