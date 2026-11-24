// Agregar desde una ficha de la tienda (seccion 4 del plan, 22 de octubre de
// 2026), en escritorio y en el telefono (390 px, tactil):
// - ninguna foto vuela a la canasta (no hay .vuela-canasta);
// - la canasta de arriba brinca al instante;
// - la pastilla "− n +" se pinta de horno justo despues del toque y se funde
//   de vuelta al papel; el primer toque se estira y destella a la vez;
// - en ningun instante del destello el − y el numero bajan de 4,5:1 contra
//   la pastilla, ni el anillo del + de 3:1 (se pausa y se recorre);
// - al acabar se quita is-destello: enfocar luego el + con el teclado no
//   anima su anillo;
// - quitar uno no destella, y con el foco del teclado el anillo del + pasa
//   a papel mientras dura;
// - con menos movimiento no hay destello.
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'agregar sin foto que vuela: la canasta brinca y la pastilla destella en horno y vuelve; quitar no destella; con menos movimiento, nada';
export const limite = 90;

const PAPEL = 'rgb(255, 253, 248)';

// El fondo de la pastilla (su ::before) como [r, g, b].
const rgb = (texto) => (texto.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
// Oscuro como el horno (58, 40, 34) y no como el papel: con margen, porque
// el primer cuadro ya puede haber empezado a fundirse.
const oscuro = (texto) => rgb(texto).every((v) => v < 150);

// Pulsa el + desde la pagina y mira la pastilla en el cuadro siguiente: sin
// la espera que mete el navegador de pruebas entre un toque y la lectura.
const pulsarYMirar = (tarjeta, cual) => tarjeta.evaluate(async (el, sel) => {
  el.querySelector(sel).click();
  await new Promise((r) => requestAnimationFrame(() => r()));
  const c = el.querySelector('.card-cantidad');
  const antes = getComputedStyle(c, '::before');
  return {
    destello: c.classList.contains('is-destello'),
    fondo: antes.backgroundColor,
    animaciones: antes.animationName,
    menos: getComputedStyle(c.querySelector('.card-menos')).color,
    corriendo: c.getAnimations({ subtree: true }).filter((x) => x.animationName === 'cantidad-destello' && x.playState === 'running').length,
  };
}, cual);

// Pausa las animaciones del destello de la ficha y las recorre de 5 en 5 ms
// midiendo el contraste del −, del numero y (si tiene el foco) del anillo del
// + contra el fondo de la pastilla en cada instante. Devuelve el peor.
const barrer = (tarjeta) => tarjeta.evaluate((el) => {
  const c = el.querySelector('.card-cantidad');
  const nombres = ['cantidad-destello', 'cantidad-destello-texto', 'cantidad-destello-foco'];
  const anims = c.getAnimations({ subtree: true }).filter((a) => nombres.includes(a.animationName));
  anims.forEach((a) => a.pause());
  // La luminancia relativa (WCAG) de un color calculado: rgb(...),
  // color(srgb ...) u oklab(...), que es como el navegador da una mezcla
  // (color-mix) a medio animar.
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
  const mas = c.querySelector('.card-mas');
  const conAnillo = mas.matches(':focus-visible');
  const peor = { menos: 99, numero: 99, anillo: 99, sinFilo: 0, donde: {} };
  const duracion = Math.max(...anims.map((a) => a.effect.getComputedTiming().duration));
  for (let ms = 0; ms <= duracion; ms += 5) {
    anims.forEach((a) => { a.currentTime = ms; });
    const fondo = getComputedStyle(c, '::before').backgroundColor;
    const menos = contraste(getComputedStyle(c.querySelector('.card-menos')).color, fondo);
    const numero = contraste(getComputedStyle(c.querySelector('.card-numero')).color, fondo);
    if (menos < peor.menos) { peor.menos = menos; peor.donde.menos = { ms, fondo }; }
    if (numero < peor.numero) { peor.numero = numero; peor.donde.numero = { ms, fondo }; }
    if (conAnillo) {
      const e = getComputedStyle(mas);
      const anillo = contraste(e.outlineColor, fondo);
      if (anillo < peor.anillo) { peor.anillo = anillo; peor.donde.anillo = { ms, fondo, color: e.outlineColor }; }
      // Anillo papel: tiene que llevar su filo horno por fuera.
      if (luz(e.outlineColor) > 0.5 && !/7px/.test(e.boxShadow)) peor.sinFilo += 1;
    }
  }
  anims.forEach((a) => a.finish());
  return { cuantas: anims.length, conAnillo, ...peor };
});

export default async function destello(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card:not([hidden]) .card-mas');
    const tarjeta = p.locator('.product-card:not([hidden])').filter({ has: p.locator('.card-mas') }).first();
    await tarjeta.scrollIntoViewIfNeeded();
    await espera(300);

    // El primer toque, como lo da la persona (clic o dedo).
    if (nombre === 'movil') await tarjeta.locator('.card-mas').tap();
    else await tarjeta.locator('.card-mas').click();
    const primero = await tarjeta.locator('.card-cantidad').evaluate((c) => ({
      destello: c.classList.contains('is-destello'),
      animaciones: getComputedStyle(c, '::before').animationName,
      vuela: document.querySelectorAll('.vuela-canasta').length,
      brinca: document.querySelector('.floating-whatsapp.is-canasta').classList.contains('is-latido'),
      salto: getComputedStyle(document.querySelector('.floating-whatsapp.is-canasta')).animationName,
    }));
    t.ok(primero.vuela === 0, `[${nombre}] agregar todavia crea una foto que vuela (${primero.vuela})`);
    t.ok(primero.brinca && primero.salto === 'canasta-salta', `[${nombre}] la canasta no brinca al agregar (${JSON.stringify(primero)})`);
    t.ok(primero.destello && primero.animaciones === 'cantidad-estira, cantidad-destello', `[${nombre}] el primer toque no se estira y destella a la vez (${primero.animaciones})`);
    await espera(900);

    // Otro toque: oscura justo despues, con el − en claro; luego vuelve al papel.
    const segundo = await pulsarYMirar(tarjeta, '.card-mas');
    t.ok(segundo.destello && oscuro(segundo.fondo), `[${nombre}] justo despues de agregar la pastilla es ${segundo.fondo}, no horno`);
    t.ok(rgb(segundo.menos).every((v) => v > 150), `[${nombre}] durante el destello el − es ${segundo.menos}, no claro`);
    t.ok(await p.locator('.vuela-canasta').count() === 0, `[${nombre}] el segundo toque creo una foto que vuela`);
    await espera(900);
    const vuelta = await tarjeta.locator('.card-cantidad').evaluate((c) => getComputedStyle(c, '::before').backgroundColor);
    t.ok(vuelta === PAPEL, `[${nombre}] la pastilla no vuelve al papel (${vuelta})`);
    t.ok(!(await tarjeta.locator('.card-cantidad').evaluate((c) => c.classList.contains('is-destello'))), `[${nombre}] is-destello se queda puesta al acabar`);

    // A mitad del fundido el texto no se pierde contra el fondo.
    await tarjeta.locator('.card-mas').evaluate((b) => b.click());
    await espera(30);
    const mitad = await barrer(tarjeta);
    t.ok(mitad.cuantas >= 3, `[${nombre}] no se encontraron las animaciones del destello (${mitad.cuantas})`);
    t.ok(mitad.menos >= 4.5 && mitad.numero >= 4.5, `[${nombre}] a mitad del destello el texto baja de 4,5:1 (${JSON.stringify(mitad)})`);
    await espera(300);

    // Con prisa, cada toque lo reinicia: dos seguidos dejan uno solo, recien empezado.
    const prisa = await tarjeta.evaluate(async (el) => {
      const mas = el.querySelector('.card-mas');
      mas.click();
      await new Promise((r) => setTimeout(r, 200));
      mas.click();
      await new Promise((r) => requestAnimationFrame(() => r()));
      const anims = el.querySelector('.card-cantidad').getAnimations({ subtree: true })
        .filter((a) => a.animationName === 'cantidad-destello');
      return { cuantas: anims.length, tiempo: anims[0] ? anims[0].currentTime : -1 };
    });
    t.ok(prisa.cuantas === 1 && prisa.tiempo < 150, `[${nombre}] con prisa el destello no se reinicia (${JSON.stringify(prisa)})`);
    await espera(900);

    // Quitar uno no destella.
    const quitar = await pulsarYMirar(tarjeta, '.card-menos');
    t.ok(quitar.corriendo === 0 && quitar.fondo === PAPEL, `[${nombre}] quitar uno pinta la pastilla (${quitar.fondo}, ${quitar.corriendo} destellos)`);

    // Con el teclado: el anillo del + pasa a papel con su filo horno mientras dura.
    if (nombre === 'escritorio') {
      await espera(900);
      // Pasado el destello, llegar al + con Tab no anima su anillo.
      await p.keyboard.press('Shift');
      await tarjeta.locator('.card-numero').focus();
      await p.keyboard.press('Tab');
      const quieto = await tarjeta.locator('.card-mas').evaluate((b) => ({
        enfocado: document.activeElement === b && b.matches(':focus-visible'),
        animacion: getComputedStyle(b).animationName,
      }));
      t.ok(quieto.enfocado && quieto.animacion === 'none', `[${nombre}] enfocar el + sin agregar anima su anillo (${JSON.stringify(quieto)})`);
      await p.keyboard.press('Enter');
      const foco = await tarjeta.locator('.card-mas').evaluate((b) => ({
        visible: b.matches(':focus-visible'),
        animacion: getComputedStyle(b).animationName,
      }));
      t.ok(foco.visible && foco.animacion === 'cantidad-destello-foco', `[${nombre}] durante el destello el anillo del + no cambia (${JSON.stringify(foco)})`);
      const anillo = await barrer(tarjeta);
      t.ok(anillo.conAnillo && anillo.anillo >= 3 && anillo.sinFilo === 0, `[${nombre}] a mitad del destello el anillo del + baja de 3:1 o pierde su filo (${JSON.stringify(anillo)})`);
      t.ok(anillo.menos >= 4.5 && anillo.numero >= 4.5, `[${nombre}] con el foco en el +, el texto baja de 4,5:1 (${JSON.stringify(anillo)})`);
    }
    await ctx.close();
  }

  // Con menos movimiento: ni destello ni foto que vuela; el numero cambia sin mas.
  for (const [nombre, ventana] of [['reducido', VENTANAS.escritorio], ['reducido-movil', VENTANAS.movil]]) {
    const ctx = await t.contexto({ ...ventana, reducedMotion: 'reduce' }, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card:not([hidden]) .card-mas');
    const tarjeta = p.locator('.product-card:not([hidden])').filter({ has: p.locator('.card-mas') }).first();
    await tarjeta.scrollIntoViewIfNeeded();
    if (nombre === 'reducido-movil') await tarjeta.locator('.card-mas').tap();
    else await tarjeta.locator('.card-mas').click();
    await espera(100);
    const otro = await pulsarYMirar(tarjeta, '.card-mas');
    t.ok(!otro.destello && otro.corriendo === 0 && otro.fondo === PAPEL, `[${nombre}] con menos movimiento la pastilla destella (${JSON.stringify(otro)})`);
    t.ok(await p.locator('.vuela-canasta').count() === 0, `[${nombre}] con menos movimiento vuela una foto`);
    t.ok((await tarjeta.locator('.card-numero').inputValue()) === '2', `[${nombre}] tras dos + el numero no dice 2`);
    await ctx.close();
  }
}
