// Los retoques visuales del 27 de octubre de 2026, en escritorio y en el
// telefono (390 px, tactil):
// - Nosotros: "Conoce nuestro local" es claro (papel) con borde y texto de
//   acento (AA) y flecha, y se rellena de ambar solo con el foco; los
//   principios no llevan "N.º" ni estrellas y se separan con una linea
//   vertical;
// - Inicio: Dulces y pasteles lleva un pastelito de linea, no la galleta;
// - Tienda: sin estrellas entre las categorias, los rotulos de los mandos
//   en horno y negrita, la ficha con una sola linea punteada (la del
//   precio), foto sobre crema con las esquinas de arriba redondas, titulos
//   de la misma altura y el + de 44 x 44 que pasa a una palomita al agregar
//   (menos movimiento: sin animacion);
// - Contacto: solo "Ver en el mapa" lleva relleno de ambar, el mapa no
//   recibe el puntero hasta hacer clic y se suelta al salir, y el horario y
//   Escribenos miden lo mismo.
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'retoques: Conoce nuestro local claro con flecha, principios sin numeros, pastelito, ficha con una linea y + de 44 con palomita, Contacto con un solo principal y mapa que no atrapa el scroll';
export const limite = 120;

const AMBAR = 'rgb(232, 168, 124)';
const TRANSPARENTE = 'rgba(0, 0, 0, 0)';

// Luminancia y contraste (WCAG) de dos colores rgb(...).
// (color-mix sale como color(srgb 0.5 0.4 0.3), con los canales de 0 a 1.)
const luz = (c) => {
  const [r, g, b] = (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map((v) => {
    const x = c.startsWith('color(') ? Number(v) : Number(v) / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

export default async function retoques(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const movil = nombre === 'movil';
    const ctx = await t.contexto(ventana, { nombre });
    const p = await ctx.newPage();

    // ---- Inicio: el pastelito
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta-enlace-dulces .ico');
    const pastel = await p.locator('.cinta-enlace-dulces .ico').evaluate((svg) => ({ trazo: svg.getAttribute('stroke'), relleno: getComputedStyle(svg).fill }));
    t.ok(pastel.trazo === 'currentColor' && pastel.relleno === 'none', `[${nombre}] Dulces y pasteles no lleva un icono de linea (${JSON.stringify(pastel)})`);

    // ---- Nosotros
    await p.goto(t.REACT + '#/nosotros');
    await p.waitForSelector('.nosotros-llegar');
    await espera(1500);
    const nos = await p.evaluate(() => {
      const e = document.querySelector('.nosotros-llegar');
      const c = getComputedStyle(e);
      return {
        fondo: c.backgroundColor, punteado: getComputedStyle(e, '::before').borderTopStyle, color: c.color, borde: c.borderTopColor, anchoBorde: c.borderTopWidth,
        flecha: Boolean(e.querySelector('.enlace-flecha')), pin: Boolean(e.querySelector('svg.ico')),
        numeros: document.querySelectorAll('.principio-numero').length,
        estrellas: [...document.querySelectorAll('.principio')].filter((li) => getComputedStyle(li, '::before').content.includes('✦')).length,
        aire: document.querySelector('.nosotros-principios').getBoundingClientRect().top - e.getBoundingClientRect().bottom,
      };
    });
    t.ok(nos.fondo === AMBAR && nos.punteado === 'dotted' && nos.color === 'rgb(58, 40, 34)' && nos.borde === nos.color && parseFloat(nos.anchoBorde) >= 1, `[${nombre}] "Conoce nuestro local" no es de ambar liso con filete punteado, borde y texto horno (${JSON.stringify(nos)})`);
    t.ok(contraste(nos.color, AMBAR) >= 4.5, `[${nombre}] el texto de "Conoce nuestro local" da ${contraste(nos.color, AMBAR).toFixed(2)}:1 sobre el ambar`);
    t.ok(!nos.flecha && nos.pin, `[${nombre}] "Conoce nuestro local" lleva flecha o no lleva el pin`);
    t.ok(nos.numeros === 0 && nos.estrellas === 0, `[${nombre}] los principios llevan numeros (${nos.numeros}) o estrellas (${nos.estrellas})`);
    if (!movil) t.ok(nos.aire >= 20, `[${nombre}] solo ${Math.round(nos.aire)} px entre el boton y el bloque de los principios`);
    // Con el foco del teclado sube y la sombra crece.
    await p.locator('.nosotros-llegar').focus();
    await p.keyboard.press('Shift+Tab');
    await p.keyboard.press('Tab');
    await espera(350);
    const foco = await p.locator('.nosotros-llegar').evaluate((e) => getComputedStyle(e).transform);
    t.ok(foco !== 'none', `[${nombre}] con el foco, "Conoce nuestro local" no se levanta (${foco})`);

    // ---- Tienda
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card:not([hidden])');
    await espera(1500);
    const tienda = await p.evaluate(() => {
      const rotulos = [...document.querySelectorAll('.vista-chips > .rotulo, .vista-mando > span:not(.sr-only)')].map((e) => {
        const c = getComputedStyle(e);
        return { color: c.color, peso: Number(c.fontWeight), tam: parseFloat(c.fontSize) };
      });
      const tarjetas = [...document.querySelectorAll('.product-card:not([hidden])')];
      const c = tarjetas[0];
      const imagen = getComputedStyle(c.querySelector('.product-image'));
      const pie = getComputedStyle(c.querySelector('.product-bottom'));
      return {
        estrellas: document.querySelectorAll('.chip-estrella').length,
        rotulos,
        imagen: { fondo: imagen.backgroundColor, radioArriba: imagen.borderTopLeftRadius, radioAbajo: imagen.borderBottomLeftRadius },
        divisoria: pie.borderTopWidth,
        puntos: tarjetas.filter((x) => getComputedStyle(x.querySelector('.product-puntos')).borderBottomStyle === 'dotted').length === tarjetas.length,
        alturaTitulo: [...new Set(tarjetas.map((x) => Math.round(x.querySelector('h3').getBoundingClientRect().height)))],
        // Fichas con tamanos aparte: sus titulos tambien miden lo mismo.
        precios: tarjetas.slice(0, 2).map((x) => Math.round(x.querySelector('.product-bottom').getBoundingClientRect().top - x.getBoundingClientRect().top)),
      };
    });
    t.ok(tienda.estrellas === 0, `[${nombre}] quedan ${tienda.estrellas} estrellas entre las categorias`);
    t.ok(tienda.rotulos.length === 3 && tienda.rotulos.every((r) => r.color === 'rgb(58, 40, 34)' && r.peso >= 700 && r.tam >= 12.5), `[${nombre}] los rotulos de los mandos no van en horno, negrita y de 12,5 px o mas (${JSON.stringify(tienda.rotulos)})`);
    t.ok(tienda.imagen.fondo !== TRANSPARENTE && parseFloat(tienda.imagen.radioArriba) > 0 && parseFloat(tienda.imagen.radioAbajo) === 0, `[${nombre}] la foto no va sobre crema con las esquinas de arriba redondeadas (${JSON.stringify(tienda.imagen)})`);
    t.ok(tienda.divisoria === '0px' && tienda.puntos, `[${nombre}] la ficha lleva la divisoria horizontal (${tienda.divisoria}) o le falta la linea punteada`);
    t.ok(tienda.alturaTitulo.length === 1 || tienda.alturaTitulo.every((h) => h >= 30), `[${nombre}] los titulos no tienen una altura minima (${tienda.alturaTitulo})`);

    // El + se toca en 44 x 44 y, al agregar, pasa a una palomita un instante.
    const tarjeta = p.locator('.product-card:not([hidden])').first();
    const mas = tarjeta.locator('.card-mas');
    await mas.scrollIntoViewIfNeeded();
    const zona = await mas.evaluate((b) => { const z = getComputedStyle(b, '::before'); return { ancho: parseFloat(z.width), alto: parseFloat(z.height) }; });
    t.ok(zona.ancho >= 44 && zona.alto >= 44, `[${nombre}] la zona del + mide ${zona.ancho} x ${zona.alto}`);
    if (movil) await mas.tap(); else await mas.click();
    await espera(150);
    const ahora = await mas.evaluate((b) => ({ palomita: Boolean(b.querySelector('.card-palomita')), texto: b.textContent.trim(), nombre: b.getAttribute('aria-label') }));
    t.ok(ahora.palomita && ahora.texto === '', `[${nombre}] al agregar el + no pasa a una palomita (${JSON.stringify(ahora)})`);
    await espera(1100);
    const despues = await mas.evaluate((b) => ({ palomita: Boolean(b.querySelector('.card-palomita')), texto: b.textContent.trim() }));
    t.ok(!despues.palomita && despues.texto === '+', `[${nombre}] la palomita no vuelve a ser un + (${JSON.stringify(despues)})`);
    await ctx.close();

    // Con menos movimiento la palomita sale sin animacion.
    const quieto = await t.contexto({ ...ventana, reducedMotion: 'reduce' }, { nombre: nombre + '-reducido' });
    const q = await quieto.newPage();
    await q.goto(t.REACT + '#/tienda-catalogo');
    await q.waitForSelector('.product-card:not([hidden]) .card-mas');
    const masQ = q.locator('.product-card:not([hidden]) .card-mas').first();
    await masQ.evaluate((b) => b.click());
    await espera(100);
    const anim = await masQ.locator('.card-palomita').evaluate((s) => getComputedStyle(s).animationName);
    t.ok(anim === 'none', `[${nombre}] con menos movimiento la palomita anima (${anim})`);
    await quieto.close();

    // ---- Contacto
    const ctx2 = await t.contexto(ventana, { nombre: nombre + '-contacto' });
    const c = await ctx2.newPage();
    await c.goto(t.REACT + '#/contacto');
    await c.waitForSelector('.contacto-mapa-marco iframe');
    await espera(1500);
    const con = await c.evaluate(() => {
      const rellenos = [...document.querySelectorAll('.vista-contacto :is(a, button)')]
        .filter((e) => getComputedStyle(e, '::before').backgroundColor === 'rgb(232, 168, 124)' || getComputedStyle(e).backgroundColor === 'rgb(232, 168, 124)')
        .map((e) => e.className);
      const h = document.querySelector('.contacto-horario').getBoundingClientRect();
      const e = document.querySelector('.contacto-escribir').getBoundingClientRect();
      return { rellenos, horario: h.height, escribir: e.height, vertical: Math.abs(document.querySelector(".contacto-horario").getBoundingClientRect().top - e.top) <= 1 };
    });
    t.ok(con.rellenos.length === 1 && /contacto-mapa-enlace/.test(con.rellenos[0]), `[${nombre}] en Contacto el unico relleno de ambar no es "Ver en el mapa" (${JSON.stringify(con.rellenos)})`);
    const enlaces = await c.evaluate(() => [...document.querySelectorAll('.contacto-escribir .enlace-llegar')].map((e) => ({ fondo: getComputedStyle(e).backgroundColor, borde: getComputedStyle(e).borderTopWidth })));
    t.ok(enlaces.length === 1 && enlaces.every((e) => e.fondo === TRANSPARENTE && parseFloat(e.borde) >= 1), `[${nombre}] WhatsApp no es secundarios con borde (${JSON.stringify(enlaces)})`);
    if (!movil) t.ok(Math.abs(con.horario - con.escribir) <= 1 && con.vertical, `[${nombre}] el horario (${con.horario}) y Escribenos (${con.escribir}) no miden lo mismo`);

    // El mapa: sin puntero hasta hacer clic; al salir se restablece.
    const evento = () => c.locator('.contacto-mapa-marco iframe').evaluate((f) => getComputedStyle(f).pointerEvents);
    t.ok((await evento()) === 'none', `[${nombre}] el mapa recibe el puntero sin hacer clic`);
    const marco = c.locator('.contacto-mapa-marco');
    if (movil) await marco.tap(); else await marco.click();
    await espera(150);
    t.ok((await evento()) === 'auto', `[${nombre}] tras el clic el mapa no recibe el puntero`);
    if (movil) {
      await c.mouse.click(5, 5); // tocar fuera
      await c.evaluate(() => document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    } else {
      await c.mouse.move(5, 400);
    }
    await espera(200);
    t.ok((await evento()) === 'none', `[${nombre}] al salir del mapa no se restablece el pointer-events`);
    await ctx2.close();
  }
}
