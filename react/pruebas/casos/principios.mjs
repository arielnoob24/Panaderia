// Los principios de Nosotros a 320 px con el texto espaciado (WCAG 1.4.12):
// van en una columna y no se recorta ninguno. En los dos sitios (la regla es
// de styles.css). Y el pie de #/contacto sigue con sus contactos (3.2.6).
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'principios de Nosotros a 320 px con texto espaciado, y contactos en el pie de #/contacto';
export const limite = 60;

const ESPACIADO = '*:not(svg *){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}';

export default async function principios(t) {
  for (const [sitio, base, ruta] of [['react', t.REACT, '#/nosotros'], ['actual', t.ACTUAL, '']]) {
    const ctx = await t.contexto({ ...VENTANAS.m320, reducedMotion: 'reduce' }, { nombre: sitio });
    const p = await ctx.newPage();
    await p.goto(base + ruta);
    await p.waitForSelector('.principles > div');
    await p.addStyleTag({ content: ESPACIADO });
    await espera(300);
    const m = await p.evaluate(() => {
      const caja = document.querySelector('.principles');
      const c = caja.getBoundingClientRect();
      const tarjetas = [...caja.children].map((d) => {
        const r = d.getBoundingClientRect();
        const desborda = [...d.querySelectorAll('h3, p')].some((e) => e.scrollWidth > e.clientWidth + 1);
        return { izq: r.left, der: r.right, desborda };
      });
      return { columnas: getComputedStyle(caja).gridTemplateColumns.split(' ').length, ancho: [c.left, c.right], tarjetas, pagina: document.documentElement.scrollWidth };
    });
    t.ok(m.columnas === 1, `[${sitio}] los principios van en ${m.columnas} columnas a 320 px`);
    m.tarjetas.forEach((x, i) => {
      t.ok(x.izq >= 0 && x.der <= 320, `[${sitio}] el principio ${i + 1} se sale: ${Math.round(x.izq)}..${Math.round(x.der)}`);
      t.ok(!x.desborda, `[${sitio}] el texto del principio ${i + 1} no cabe`);
    });
    t.ok(m.pagina <= 320, `[${sitio}] la pagina mide ${m.pagina} px de ancho`);
    await ctx.close();
  }

  // El pie de #/contacto: lo mismo que en las demas vistas.
  const ctx = await t.contexto(VENTANAS.escritorio, { nombre: 'pie' });
  const p = await ctx.newPage();
  await p.goto(t.REACT + '#/contacto');
  await p.waitForSelector('.pie-corto');
  const pie = await p.evaluate(() => ({
    contactos: document.querySelectorAll('.pie-corto .pie-corto-contacto a').length,
    estado: Boolean(document.querySelector('.pie-corto .pie-corto-estado')),
    actual: document.querySelector('.pie-corto-horario')?.getAttribute('aria-current'),
  }));
  t.ok(pie.contactos >= 2 && pie.estado, `el pie de #/contacto no trae contactos (${pie.contactos}) o el estado`);
  t.ok(pie.actual === 'page', 'el enlace al horario del pie no dice que es la vista en la que se esta');
  // Pulsarlo lleva arriba, al titulo.
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.click('.pie-corto-horario');
  await espera(900);
  const fin = await p.evaluate(() => ({ y: Math.round(window.scrollY), foco: document.activeElement.tagName, hash: location.hash }));
  t.ok(fin.y === 0 && fin.foco === 'H1' && fin.hash === '#/contacto', `"Horario y como llegar" en #/contacto deja ${JSON.stringify(fin)}`);
  await ctx.close();
}
