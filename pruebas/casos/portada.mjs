// La portada (#/) en el telefono, lo que reviso ux-accesibilidad el 24 de
// octubre (seccion 10 del plan, "Portada en el telefono"):
// - el sello "Hecho a mano · Pan de la casa" no tapa el pie de la foto
//   ("Miga abierta, corteza tostada") con poca altura (390x700, 390x640,
//   320x640), ni el pie ni "Dulces y pasteles" de la cinta a 320x640 con
//   el espaciado de texto de WCAG 1.4.12; y no se sale de la pantalla;
// - la portada sigue sin desplazarse en esos tamanos y en 1440x900 y 390x844;
// - el estampado de espigas va tenue (opacidad .2 o menos) para que el texto
//   encima tenga contraste (seccion 11);
// - en la cinta a 390 px, "Dulces y pasteles" se lee con sus espacios: cada
//   espacio ocupa sitio, la linea se parte entre palabras y no dentro de una,
//   y el lector de pantalla oye la frase entera en el nombre del enlace.
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'Portada en el telefono: el sello no tapa el pie ni la cinta con poca altura ni con espaciado de texto, sin scroll, espigas tenues, Dulces y pasteles con sus espacios en la cinta';
export const limite = 90;

// WCAG 1.4.12: lo que tiene que aguantar el texto sin cortarse ni pisarse.
const ESPACIADO = '*:not(svg *) { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }';

// El sello es un circulo girado: se mira su circulo (centro y radio sin el
// giro) contra las cajas de cada linea de texto de lo que no debe tapar.
const solapes = (p) => p.evaluate(() => {
  const sello = document.querySelector('.portada-sello');
  const r = sello.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const radio = sello.offsetWidth / 2;
  const lineas = (el) => {
    const rango = document.createRange();
    rango.selectNodeContents(el);
    return [...rango.getClientRects()].filter((c) => c.width > 0 && c.height > 0);
  };
  const toca = (c) => {
    const x = Math.max(c.left, Math.min(cx, c.right));
    const y = Math.max(c.top, Math.min(cy, c.bottom));
    return Math.hypot(cx - x, cy - y) < radio - 1;
  };
  const dulces = [...document.querySelectorAll('.cinta-enlace')].find((a) => a.querySelector('.sr-only')?.textContent === 'Dulces y pasteles');
  return {
    pie: lineas(document.querySelector('.portada-foto figcaption')).some(toca),
    cinta: lineas(dulces.querySelector('.letras')).some(toca),
    fuera: Math.round(cx - radio) < 0 || Math.round(cx + radio) > document.documentElement.clientWidth,
    alto: document.documentElement.scrollHeight,
    ventana: innerHeight,
  };
});

export default async function portada(t) {
  {
    const ctx = await t.contexto({ ...VENTANAS.movil, reducedMotion: 'reduce' }, { nombre: 'portada' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.portada-sello');
    await espera(300);

    const opacidad = await p.evaluate(() => Number(getComputedStyle(document.querySelector('.fondo-inicio')).opacity));
    t.ok(opacidad <= 0.2, `el estampado de espigas de la portada va al ${opacidad} (seccion 11: .2 o menos)`);

    for (const [ancho, alto] of [[1440, 900], [390, 844], [390, 700], [390, 640], [320, 640]]) {
      await p.setViewportSize({ width: ancho, height: alto });
      await espera(200);
      const d = await solapes(p);
      t.ok(d.alto <= d.ventana, `[${ancho}x${alto}] la portada se desplaza (${d.alto} de ${d.ventana})`);
      if (ancho > 680) continue;
      t.ok(!d.pie, `[${ancho}x${alto}] el sello tapa el pie de la foto`);
      t.ok(!d.cinta, `[${ancho}x${alto}] el sello tapa "Dulces y pasteles" en la cinta`);
      t.ok(!d.fuera, `[${ancho}x${alto}] el sello se sale de la pantalla`);
    }

    // Con el espaciado de texto de WCAG 1.4.12 a 320x640.
    await p.setViewportSize({ width: 320, height: 640 });
    await p.addStyleTag({ content: ESPACIADO });
    await espera(200);
    const d = await solapes(p);
    t.ok(!d.pie && !d.cinta && !d.fuera, `[320x640 con espaciado] el sello tapa el pie o la cinta, o se sale (${JSON.stringify(d)})`);
    await ctx.close();
  }

  // "Dulces y pasteles" en la cinta a 390 px, en el telefono.
  {
    const ctx = await t.contexto({ ...VENTANAS.movil, reducedMotion: 'reduce' }, { nombre: 'cinta' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta-enlace .letras');
    await espera(300);
    const c = await p.evaluate(() => {
      const enlace = [...document.querySelectorAll('.cinta-enlace')].find((a) => a.querySelector('.sr-only')?.textContent === 'Dulces y pasteles');
      const letras = enlace.querySelector('.letras');
      const spans = [...letras.children];
      const espacios = spans.filter((s) => s.textContent === ' ');
      // Las palabras, cada una con la fila (top) de cada letra.
      const palabras = [];
      let actual = [];
      for (const s of spans) {
        if (s.textContent === ' ') { palabras.push(actual); actual = []; } else actual.push(Math.round(s.getBoundingClientRect().top));
      }
      palabras.push(actual);
      return {
        oculto: letras.getAttribute('aria-hidden'),
        texto: spans.map((s) => s.textContent).join(''),
        espacios: espacios.length,
        conClase: espacios.every((s) => s.classList.contains('ola-espacio')),
        anchos: espacios.map((s) => {
          const r = document.createRange();
          r.selectNodeContents(s);
          return Math.round(r.getBoundingClientRect().width * 10) / 10;
        }),
        partidas: palabras.filter((filas) => new Set(filas).size > 1).length,
      };
    });
    t.ok(c.texto === 'Dulces y pasteles' && c.oculto === 'true', `[390] las letras de la ola cambiaron (${JSON.stringify(c)})`);
    t.ok(c.espacios === 2 && c.conClase, `[390] los espacios de "Dulces y pasteles" no llevan su clase (${JSON.stringify(c)})`);
    // Si el espacio cae al final de una linea puede no tener ancho; al menos
    // uno tiene que verse entre dos palabras de la misma linea.
    t.ok(c.anchos.some((a) => a > 0), `[390] los espacios de "Dulces y pasteles" no ocupan sitio (${c.anchos.join(', ')})`);
    t.ok(c.partidas === 0, `[390] la cinta parte ${c.partidas} palabra(s) de "Dulces y pasteles" por dentro`);
    const nombres = await p.getByRole('link', { name: 'Dulces y pasteles', exact: true }).count();
    t.ok(nombres === 1, `[390] el lector de pantalla no oye "Dulces y pasteles" como una frase (${nombres} enlaces con ese nombre)`);
    await ctx.close();
  }
}
