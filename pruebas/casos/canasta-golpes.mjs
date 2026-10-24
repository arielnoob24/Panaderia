// Las lineas de la canasta se mueven igual que las fichas (seccion 4 del
// plan, 23 de octubre de 2026), en escritorio y en el telefono (390 px,
// tactil):
// - el + de la linea suelta un "+1", pinta la pastilla de horno un momento
//   (is-destello, con el − y el numero en claro) y el numero entra
//   deslizandose; la canasta de arriba no brinca;
// - en ningun instante del destello el − y el numero bajan de 4,5:1 contra
//   la pastilla (se pausa y se recorre), ni el anillo del + de 3:1 si tiene
//   el foco del teclado, que se queda en el + mientras dura;
// - al acabar se quita is-destello y la pastilla vuelve al papel;
// - el − suelta un "−1" y no destella;
// - con menos movimiento no hay "+1", ni destello, ni numero que entra, y
//   el numero cambia igual.
import { VENTANAS, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'lineas de la canasta: +1, destello en horno (4,5:1 en todo momento), numero que entra y foco en el +; −1 sin destello; la canasta no brinca; con menos movimiento nada';
export const limite = 120;

const PAPEL = 'rgb(255, 253, 248)';
const rgb = (texto) => (texto.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
const oscuro = (texto) => rgb(texto).every((v) => v < 150);

// Agrega un producto desde la ficha y abre la canasta con su linea.
async function abrirConUna(p, t, tactil) {
  await p.goto(t.REACT + '#/tienda-catalogo');
  await p.waitForSelector('.product-card:not([hidden]) .card-mas');
  const mas = p.locator('.product-card:not([hidden]) .card-mas').first();
  if (tactil) await mas.tap(); else await mas.click();
  await espera(300);
  const canasta = p.locator('.floating-whatsapp.is-canasta');
  if (tactil) await canasta.tap(); else await canasta.click();
  await p.waitForSelector('.canasta-panel.is-open .canasta-linea .canasta-cantidad');
  // Que acaben la entrada de la linea y el brinco del primer agregar.
  await espera(900);
}

// Pulsa un boton de la linea desde la pagina y mira el control en el cuadro
// siguiente, sin la espera que mete el navegador de pruebas.
const pulsarYMirar = (p, sel) => p.locator('.canasta-linea').first().evaluate(async (li, cual) => {
  li.querySelector(cual).click();
  await new Promise((r) => requestAnimationFrame(() => r()));
  const c = li.querySelector('.canasta-cantidad');
  const numero = c.querySelector('output');
  return {
    destello: c.classList.contains('is-destello'),
    fondo: getComputedStyle(c).backgroundColor,
    menos: getComputedStyle(c.querySelector('[data-menos]')).color,
    golpes: [...c.querySelectorAll('.card-golpe')].map((g) => g.textContent),
    corriendo: c.getAnimations({ subtree: true }).filter((x) => x.animationName === 'cantidad-destello' && x.playState === 'running').length,
    // El numero que entra va con element.animate(), no con CSS.
    entra: numero.getAnimations().filter((x) => !x.animationName && x.effect.getKeyframes().some((k) => k.transform && k.transform !== 'none')).length,
    numero: numero.textContent,
    // is-latido se queda puesta desde el agregar de la ficha: cuenta el brinco que corre.
    brinca: document.querySelector('.floating-whatsapp.is-canasta').getAnimations().some((x) => x.animationName === 'canasta-salta' && x.playState === 'running'),
    foco: document.activeElement === li.querySelector(cual),
  };
}, sel);

// Pausa el destello de la linea y lo recorre de 5 en 5 ms midiendo el
// contraste del −, del numero y (si tiene el foco) del anillo del + contra la
// pastilla. Devuelve el peor.
const barrer = (p) => p.locator('.canasta-linea').first().evaluate((li) => {
  const c = li.querySelector('.canasta-cantidad');
  const nombres = ['cantidad-destello', 'cantidad-destello-texto', 'cantidad-destello-foco'];
  const anims = c.getAnimations({ subtree: true }).filter((a) => nombres.includes(a.animationName));
  anims.forEach((a) => a.pause());
  const luz = (texto) => {
    const n = (texto.match(/-?\d*\.?\d+(e-?\d+)?/g) || []).slice(0, 3).map(Number);
    let lineal;
    if (texto.startsWith('oklab(')) {
      const [L, a, b] = n;
      const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
      const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
      const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
      lineal = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
      ];
    } else {
      const unos = texto.startsWith('color(') ? n : n.map((v) => v / 255);
      lineal = unos.map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    }
    const [r, g, b] = lineal.map((v) => Math.min(1, Math.max(0, v)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contraste = (a, b) => {
    const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const mas = c.querySelector('[data-mas]');
  const conAnillo = mas.matches(':focus-visible');
  const peor = { menos: 99, numero: 99, anillo: 99, donde: {} };
  const duracion = Math.max(...anims.map((a) => a.effect.getComputedTiming().duration));
  for (let ms = 0; ms <= duracion; ms += 5) {
    anims.forEach((a) => { a.currentTime = ms; });
    const fondo = getComputedStyle(c).backgroundColor;
    const menos = contraste(getComputedStyle(c.querySelector('[data-menos]')).color, fondo);
    const numero = contraste(getComputedStyle(c.querySelector('output')).color, fondo);
    if (menos < peor.menos) { peor.menos = menos; peor.donde.menos = { ms, fondo }; }
    if (numero < peor.numero) { peor.numero = numero; peor.donde.numero = { ms, fondo }; }
    if (conAnillo) {
      const anillo = contraste(getComputedStyle(mas).outlineColor, fondo);
      if (anillo < peor.anillo) { peor.anillo = anillo; peor.donde.anillo = { ms, fondo, color: getComputedStyle(mas).outlineColor }; }
    }
  }
  anims.forEach((a) => a.finish());
  return { cuantas: anims.length, conAnillo, ...peor };
});

export default async function canastaGolpes(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const tactil = nombre === 'movil';
    const ctx = await t.contexto(ventana, { nombre: `canasta-golpes-${nombre}` });
    const p = await ctx.newPage();
    await abrirConUna(p, t, tactil);

    // El + de la linea, como lo da la persona.
    const linea = p.locator('.canasta-linea').first();
    if (tactil) await linea.locator('[data-mas]').tap(); else await linea.locator('[data-mas]').click();
    const primero = await linea.evaluate((li) => ({
      golpes: [...li.querySelectorAll('.card-golpe')].map((g) => g.textContent),
      escondidos: li.querySelector('.card-golpes').getAttribute('aria-hidden'),
      brinca: document.querySelector('.floating-whatsapp.is-canasta').getAnimations().some((x) => x.animationName === 'canasta-salta' && x.playState === 'running'),
      numero: li.querySelector('output').textContent,
    }));
    t.ok(primero.golpes.includes('+1') && primero.escondidos === 'true', `[${nombre}] el + de la linea no suelta un "+1" escondido al lector (${JSON.stringify(primero)})`);
    t.ok(!primero.brinca, `[${nombre}] la canasta de arriba brinca al agregar desde su linea`);
    t.ok(primero.numero === '2', `[${nombre}] tras el + la linea no dice 2 (${primero.numero})`);
    await espera(900);

    // Otro: oscura justo despues, con el − en claro, y el numero entrando.
    const segundo = await pulsarYMirar(p, '[data-mas]');
    t.ok(segundo.destello && oscuro(segundo.fondo), `[${nombre}] justo despues de agregar en la linea la pastilla es ${segundo.fondo}, no horno`);
    t.ok(rgb(segundo.menos).every((v) => v > 150), `[${nombre}] durante el destello el − de la linea es ${segundo.menos}, no claro`);
    t.ok(segundo.entra === 1 && segundo.numero === '3', `[${nombre}] el numero de la linea no entra deslizandose (${JSON.stringify(segundo)})`);
    t.ok(!segundo.brinca, `[${nombre}] la canasta de arriba brinca con el + de la linea`);
    await espera(900);
    const vuelta = await linea.evaluate((li) => {
      const c = li.querySelector('.canasta-cantidad');
      return { fondo: getComputedStyle(c).backgroundColor, clase: c.classList.contains('is-destello'), golpes: li.querySelectorAll('.card-golpe').length };
    });
    t.ok(vuelta.fondo === PAPEL && !vuelta.clase, `[${nombre}] la pastilla de la linea no vuelve al papel o se queda con is-destello (${JSON.stringify(vuelta)})`);
    t.ok(vuelta.golpes === 0, `[${nombre}] los "+1" no se borran al acabar (${vuelta.golpes})`);

    // A mitad del fundido el texto no se pierde contra el fondo.
    await linea.locator('[data-mas]').evaluate((b) => b.click());
    await espera(30);
    const mitad = await barrer(p);
    t.ok(mitad.cuantas >= 3, `[${nombre}] no se encontraron las animaciones del destello en la linea (${mitad.cuantas})`);
    t.ok(mitad.menos >= 4.5 && mitad.numero >= 4.5, `[${nombre}] a mitad del destello de la linea el texto baja de 4,5:1 (${JSON.stringify(mitad)})`);
    await espera(300);

    // El − suelta su "−1" y no destella.
    const quitar = await pulsarYMirar(p, '[data-menos]');
    t.ok(quitar.golpes.includes('−1') && quitar.corriendo === 0 && quitar.fondo === PAPEL && !quitar.destello, `[${nombre}] el − de la linea no suelta "−1" o destella (${JSON.stringify(quitar)})`);

    // Con el teclado: el foco se queda en el + y su anillo pasa a papel
    // mientras dura el destello, sin bajar de 3:1.
    if (!tactil) {
      await espera(900);
      await p.keyboard.press('Shift');
      await linea.locator('[data-menos]').focus();
      await p.keyboard.press('Tab');
      await p.keyboard.press('Enter');
      const foco = await linea.locator('[data-mas]').evaluate((b) => ({
        enfocado: document.activeElement === b && b.matches(':focus-visible'),
        animacion: getComputedStyle(b).animationName,
      }));
      t.ok(foco.enfocado && foco.animacion === 'cantidad-destello-foco', `[${nombre}] con el teclado el foco no se queda en el + o su anillo no destella (${JSON.stringify(foco)})`);
      const anillo = await barrer(p);
      t.ok(anillo.conAnillo && anillo.anillo >= 3, `[${nombre}] a mitad del destello el anillo del + de la linea baja de 3:1 (${JSON.stringify(anillo)})`);
      t.ok(anillo.menos >= 4.5 && anillo.numero >= 4.5, `[${nombre}] con el foco en el + de la linea, el texto baja de 4,5:1 (${JSON.stringify(anillo)})`);
      await esperaQue(() => linea.locator('.canasta-cantidad').evaluate((c) => !c.classList.contains('is-destello')));
      const despues = await linea.locator('[data-mas]').evaluate((b) => ({ enfocado: document.activeElement === b, animacion: getComputedStyle(b).animationName }));
      t.ok(despues.enfocado && despues.animacion === 'none', `[${nombre}] al acabar el destello el + pierde el foco o sigue animado (${JSON.stringify(despues)})`);
    }
    await ctx.close();
  }

  // Con menos movimiento: ni "+1", ni destello, ni numero que entra.
  for (const [nombre, ventana] of [['reducido', VENTANAS.escritorio], ['reducido-movil', VENTANAS.movil]]) {
    const ctx = await t.contexto({ ...ventana, reducedMotion: 'reduce' }, { nombre: `canasta-golpes-${nombre}` });
    const p = await ctx.newPage();
    await abrirConUna(p, t, nombre === 'reducido-movil');
    const mas = await pulsarYMirar(p, '[data-mas]');
    t.ok(!mas.destello && mas.corriendo === 0 && mas.fondo === PAPEL, `[${nombre}] con menos movimiento la linea destella (${JSON.stringify(mas)})`);
    t.ok(mas.golpes.length === 0 && mas.entra === 0, `[${nombre}] con menos movimiento sale un "+1" o el numero se desliza (${JSON.stringify(mas)})`);
    t.ok(mas.numero === '2', `[${nombre}] tras el + la linea no dice 2 (${mas.numero})`);
    const menos = await pulsarYMirar(p, '[data-menos]');
    t.ok(menos.golpes.length === 0 && menos.numero === '1', `[${nombre}] con menos movimiento el − suelta un "−1" o no quita (${JSON.stringify(menos)})`);
    await ctx.close();
  }
}
