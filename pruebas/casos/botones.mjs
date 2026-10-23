// Los botones en ticket (P2, G3 y C1), "Como llegar" como enlace, el menu y
// la cinta que se encienden en su sitio (M2), seccion 10 del plan, en
// escritorio y en el telefono (390 px, tactil):
// - todo .button (portada, canasta, hoja de pagar, iniciar sesion, crear
//   cuenta, contacto) es ticket: la forma mordida va en la mascara de sus
//   capas (::before el papel, ::after la sombra dura) y no en el boton, en
//   Arial y no en Georgia, de 44 px de alto o mas y sin texto que se salga;
// - con el foco del teclado, el anillo de 3 px es el outline del boton, que
//   no lleva mascara, y la sombra dura sustituye al halo;
// - "Ir a pagar" y el boton final de pagar son horno con texto papel y
//   sombra ambar, a todo lo ancho; el secundario es hueco (filete en anillo)
//   y se rellena de masa con el raton;
// - "Como llegar" es un enlace en Fraunces cursiva, sin caja ni raya;
// - el menu: con el raton la pastilla ambar aparece sobre el enlace que hay
//   debajo (no viaja: las demas siguen apagadas), Tienda se enciende entera
//   y sigue asi en su desplegable, la pagina actual lleva el aro ambar y no
//   raya, el teclado no enciende nada y con el dedo no hay pastilla; el aro
//   tambien en el menu del telefono;
// - la cinta se enciende igual con el raton;
// - entre 681 y 900 px logo, menu y botones de la derecha no se pisan;
// - un .button apagado (aria-disabled) se ve apagado, sin sombra, y no se
//   levanta.
import { VENTANAS, espera, esperaQue, crearCuenta } from '../arranque.mjs';

export const descripcion = 'botones en ticket (mascara, sombra, foco fuera de la mascara, pagar en horno, hueco, Arial, 44 px), Como llegar como enlace, menu y cinta que se encienden en su sitio con aro en la pagina actual (raton si, dedo no)';
export const limite = 180;

const HORNO = 'rgb(58, 40, 34)';
const AMBAR = 'rgb(215, 155, 74)';
const AMBAR_CLARO = 'rgb(242, 202, 104)';
const PAPEL = 'rgb(255, 253, 248)';
const MASA = 'rgb(247, 241, 231)';
const CORRIDA = 'matrix(1, 0, 0, 1, 4, 4)';

// Mide los .button que se ven en la pagina.
const medirBotones = (p) => p.evaluate(() => [...document.querySelectorAll('.button')]
  .filter((b) => b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden')
  .map((b) => {
    const c = getComputedStyle(b);
    const antes = getComputedStyle(b, '::before');
    return {
      texto: b.textContent.trim().slice(0, 30),
      mascaraCapa: antes.maskImage || antes.webkitMaskImage,
      mascaraBoton: c.maskImage || c.webkitMaskImage,
      letra: c.fontFamily,
      alto: Math.round(b.getBoundingClientRect().height),
      // La sombra corre 4 px (6 con el raton) y cuenta en scrollWidth.
      sale: b.scrollWidth > b.clientWidth + 8,
      derecha: b.getBoundingClientRect().right,
      ancho: window.innerWidth,
    };
  }));

function revisar(t, nombre, donde, botones, minimo = 1) {
  t.ok(botones.length >= minimo, `[${nombre}] en ${donde} hay ${botones.length} botones .button, se esperaban ${minimo} o mas`);
  for (const b of botones) {
    t.ok(b.mascaraCapa.includes('radial-gradient') && b.mascaraBoton === 'none', `[${nombre}] "${b.texto}" (${donde}) no es ticket: mascara de la capa ${b.mascaraCapa}, del boton ${b.mascaraBoton}`);
    t.ok(/^Arial/.test(b.letra) && !b.letra.includes('Georgia'), `[${nombre}] "${b.texto}" (${donde}) va en ${b.letra}`);
    t.ok(b.alto >= 44, `[${nombre}] "${b.texto}" (${donde}) mide ${b.alto} px de alto`);
    t.ok(!b.sale && b.derecha <= b.ancho, `[${nombre}] "${b.texto}" (${donde}) se sale de su sitio`);
  }
}

// El papel, la sombra y el texto de un ticket.
const capas = (p, sel) => p.locator(sel).first().evaluate((b) => {
  const c = getComputedStyle(b);
  const antes = getComputedStyle(b, '::before');
  const despues = getComputedStyle(b, '::after');
  return {
    texto: c.color,
    papel: antes.backgroundColor,
    sombra: despues.backgroundColor,
    corrida: despues.transform,
    opacidadSombra: despues.opacity,
    capasMascara: (antes.maskImage || antes.webkitMaskImage).split('radial-gradient').length - 1,
    composicion: antes.maskComposite || antes.webkitMaskComposite,
    ancho: Math.round(b.getBoundingClientRect().width),
    anchoPadre: Math.round(b.parentElement.clientWidth - parseFloat(getComputedStyle(b.parentElement).paddingLeft) - parseFloat(getComputedStyle(b.parentElement).paddingRight)),
  };
});

export default async function botones(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre: `botones-${nombre}` });
    const p = await ctx.newPage();
    const pulsar = (sel) => (nombre === 'movil' ? p.locator(sel).first().tap() : p.locator(sel).first().click());

    // La portada: "Nuestros panes" es el ticket ambar con sombra horno, y
    // "Como llegar" un enlace sin caja.
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await espera(300);
    revisar(t, nombre, 'la portada', await medirBotones(p));
    const principal = await capas(p, '.portada-acciones .button-yellow');
    t.ok(principal.papel === AMBAR && principal.sombra === HORNO && principal.corrida === CORRIDA, `[${nombre}] "Nuestros panes" no es el ticket ambar con sombra dura horno (${JSON.stringify(principal)})`);
    const llegar = await p.locator('.portada-llegar').evaluate((a) => {
      const c = getComputedStyle(a);
      return {
        texto: a.textContent.trim(), letra: c.fontFamily, estilo: c.fontStyle, borde: c.borderTopStyle,
        fondo: c.backgroundColor, raya: c.textDecorationLine, rayaDespues: getComputedStyle(a, '::after').content,
        pin: Boolean(a.querySelector('svg')), alto: a.getBoundingClientRect().height,
      };
    });
    t.ok(llegar.texto === 'Cómo llegar' && /^"?Fraunces/.test(llegar.letra) && llegar.estilo === 'italic' && llegar.pin, `[${nombre}] "Como llegar" no es el enlace en Fraunces cursiva con el pin (${JSON.stringify(llegar)})`);
    t.ok(llegar.borde === 'none' && llegar.fondo === 'rgba(0, 0, 0, 0)' && llegar.raya === 'none' && llegar.rayaDespues === 'none' && llegar.alto >= 24, `[${nombre}] "Como llegar" lleva caja o raya, o mide menos de 24 px (${JSON.stringify(llegar)})`);
    t.ok(await p.locator('.h-imprenta, .h-ola, .boton-duro, .nav-pastilla').count() === 0, `[${nombre}] quedan piezas viejas (h-imprenta, h-ola, boton-duro o nav-pastilla)`);

    // Con el raton, "Como llegar" pasa a corteza oscura y el pin salta.
    if (nombre === 'escritorio') {
      await p.mouse.move(10, 400);
      await p.mouse.move(14, 404);
      await p.hover('.portada-llegar');
      await esperaQue(() => p.locator('.portada-llegar').evaluate((a) => getComputedStyle(a).color === 'rgb(122, 64, 48)'));
      const encima = await p.locator('.portada-llegar').evaluate((a) => ({ color: getComputedStyle(a).color, pin: getComputedStyle(a.querySelector('svg')).transform }));
      t.ok(encima.color === 'rgb(122, 64, 48)' && encima.pin !== 'none', `[${nombre}] con el raton "Como llegar" no cambia a corteza oscura o el pin no salta (${JSON.stringify(encima)})`);

      // Con el foco del teclado: el anillo de 3 px es el outline del boton
      // (fuera de la mascara) y la sombra dura se queda en lugar del halo.
      await p.mouse.move(700, 200);
      await p.keyboard.press('Shift');
      await p.focus('.portada-acciones .button-yellow');
      const foco = await p.locator('.portada-acciones .button-yellow').evaluate((b) => {
        const c = getComputedStyle(b);
        return {
          visible: b.matches(':focus-visible'), anillo: `${c.outlineStyle} ${c.outlineWidth}`, color: c.outlineColor,
          halo: c.boxShadow, mascara: c.maskImage || c.webkitMaskImage, sombra: getComputedStyle(b, '::after').transform,
        };
      });
      t.ok(foco.visible && foco.anillo === 'solid 3px' && foco.color === HORNO && foco.mascara === 'none', `[${nombre}] el foco de "Nuestros panes" no es un anillo horno de 3 px fuera de la mascara (${JSON.stringify(foco)})`);
      t.ok(foco.halo === 'none' && foco.sombra === CORRIDA, `[${nombre}] con el foco "Nuestros panes" no cambia el halo por la sombra dura (${JSON.stringify(foco)})`);
    }

    // La canasta con "Ir a pagar" en horno, a todo lo ancho, y el guardado
    // debajo; la hoja de pagar con el principal y el hueco.
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card:not([hidden]) .card-mas');
    await pulsar('.product-card:not([hidden]) .card-mas');
    await espera(200);
    await pulsar('.floating-whatsapp.is-canasta');
    await p.waitForSelector('.canasta-panel.is-open .canasta-enviar');
    await espera(500);
    revisar(t, nombre, 'la canasta', await medirBotones(p));
    const pagar = await capas(p, '.canasta-enviar');
    t.ok(pagar.papel === HORNO && pagar.texto === PAPEL && pagar.sombra === AMBAR, `[${nombre}] "Ir a pagar" no es el ticket horno con texto papel y sombra ambar (${JSON.stringify(pagar)})`);
    t.ok(Math.abs(pagar.ancho - pagar.anchoPadre) <= 1, `[${nombre}] "Ir a pagar" mide ${pagar.ancho} px y su pie ${pagar.anchoPadre}: no va a todo lo ancho`);
    await pulsar('.canasta-enviar');
    await p.waitForSelector('.pide-cuenta:not([hidden]) .pide-cuenta-otra');
    await espera(700);
    // El raton que pulso "Ir a pagar" puede quedar encima del secundario.
    if (nombre === 'escritorio') { await p.mouse.move(5, 5); await espera(300); }
    revisar(t, nombre, 'la hoja de pagar', await medirBotones(p), 2);
    const otro = await capas(p, '.pide-cuenta-otra');
    t.ok(otro.papel === HORNO && otro.capasMascara === 2 && /exclude|xor/.test(otro.composicion), `[${nombre}] el secundario no es el ticket hueco con el filete en anillo (${JSON.stringify(otro)})`);
    t.ok(otro.sombra === MASA && otro.opacidadSombra === '0', `[${nombre}] el secundario lleva relleno o sombra sin el raton (${JSON.stringify(otro)})`);
    if (nombre === 'escritorio') {
      await p.hover('.pide-cuenta-otra');
      await esperaQue(async () => (await capas(p, '.pide-cuenta-otra')).opacidadSombra === '1');
      t.ok((await capas(p, '.pide-cuenta-otra')).opacidadSombra === '1', `[${nombre}] con el raton el secundario no se rellena de masa`);
    }

    // Iniciar sesion, crear la cuenta y contacto (se recarga: la canasta se
    // queda abierta al cambiar solo el hash).
    for (const [donde, hash, sel] of [['Iniciar sesion', '#/cuenta/entrar', '.cuenta-entrar'], ['Crear cuenta', '#/cuenta/crear', '.cuenta-crear'], ['Contacto', '#/contacto', '.contacto-mapa-enlace']]) {
      await p.goto(t.REACT + 'index.html' + hash);
      await p.reload();
      await p.waitForSelector(sel);
      await espera(300);
      revisar(t, nombre, donde, await medirBotones(p));
    }

    // El boton final de pagar, con cuenta y algo en la canasta.
    await crearCuenta(p, t.REACT);
    await p.goto(t.REACT + 'index.html#/confirmar');
    await p.waitForSelector('.canasta-pagar');
    await espera(400);
    revisar(t, nombre, 'confirmar el pedido', await medirBotones(p));
    const final = await capas(p, '.canasta-pagar');
    t.ok(final.papel === HORNO && final.texto === PAPEL && final.sombra === AMBAR && Math.abs(final.ancho - final.anchoPadre) <= 1, `[${nombre}] el boton final de pagar no es el ticket horno a todo lo ancho (${JSON.stringify(final)})`);
    await ctx.close();
  }

  await menu(t);
  await cinta(t);
  await barraSinPisarse(t);
  await apagado(t);
}

// ---- La barra entre 681 y 900 px ---------------------------------------------
async function barraSinPisarse(t) {
  const ctx = await t.contexto(VENTANAS.escritorio, { nombre: 'barra-anchos' });
  const p = await ctx.newPage();
  await p.goto(t.REACT + '#/');
  await p.waitForSelector('.cinta');
  for (const ancho of [681, 720, 780, 900]) {
    await p.setViewportSize({ width: ancho, height: 800 });
    await espera(150);
    const b = await p.evaluate(() => {
      const caja = (s) => document.querySelector(s).getBoundingClientRect();
      const opciones = [...document.querySelectorAll('#main-nav > a, #main-nav > .nav-grupo')].map((e) => e.getBoundingClientRect());
      return {
        marca: Math.max(caja('.brand').right, caja('.brand-logo').right),
        menuIzq: Math.min(...opciones.map((r) => r.left)),
        menuDer: Math.max(...opciones.map((r) => r.right)),
        acciones: caja('.nav-acciones').left,
        ventana: window.innerWidth,
        barra: document.documentElement.scrollWidth,
      };
    });
    t.ok(b.marca <= b.menuIzq && b.menuDer <= b.acciones && b.barra <= b.ventana, `[${ancho} px] la barra se pisa: logo hasta ${Math.round(b.marca)}, menu de ${Math.round(b.menuIzq)} a ${Math.round(b.menuDer)}, botones desde ${Math.round(b.acciones)} (ancho de pagina ${b.barra})`);
  }
  await ctx.close();
}

// ---- Un .button apagado --------------------------------------------------------
// "Ir a pagar" con la canasta vacia esta apagado (aria-disabled); se mira con
// el raton encima, que no debe levantarlo ni darle sombra.
async function apagado(t) {
  const ctx = await t.contexto(VENTANAS.escritorio, { nombre: 'apagado' });
  const p = await ctx.newPage();
  await p.goto(t.REACT + '#/tienda-catalogo');
  await p.waitForSelector('.product-card:not([hidden]) .card-mas');
  await p.mouse.move(300, 300);
  await p.locator('.floating-whatsapp.is-canasta').click();
  await p.waitForSelector('.canasta-panel.is-open .canasta-enviar[aria-disabled="true"]');
  await espera(500);
  await p.hover('.canasta-enviar', { force: true });
  await espera(600);
  const b = await p.locator('.canasta-enviar').evaluate((e) => {
    const c = getComputedStyle(e);
    return { opacidad: c.opacity, cursor: c.cursor, transform: c.transform, sombra: getComputedStyle(e, '::after').opacity };
  });
  t.ok(Number(b.opacidad) <= 0.5 && b.cursor === 'not-allowed' && b.transform === 'none' && b.sombra === '0', `[apagado] "Ir a pagar" apagado no se ve apagado, lleva sombra o se levanta con el raton (${JSON.stringify(b)})`);
  await ctx.close();
}

// ---- El menu de arriba (M2) ----------------------------------------------------
// Como esta cada opcion: su pastilla (::before), su aro (::after), su color y
// su raya.
const estadoMenu = (p) => p.evaluate(() => [...document.querySelectorAll('#main-nav > a, #main-nav > .nav-grupo')].map((o) => {
  const texto = o.matches('a') ? o : o.querySelector('.nav-grupo-enlace');
  const antes = getComputedStyle(o, '::before');
  const despues = getComputedStyle(o, '::after');
  return {
    nombre: texto.textContent.trim(),
    pastilla: antes.content !== 'none' && antes.content !== 'normal' ? antes.opacity : 'sin',
    pastillaColor: antes.backgroundColor,
    aro: despues.content !== 'none' && despues.content !== 'normal' ? despues.boxShadow : 'sin',
    color: getComputedStyle(texto).color,
    raya: getComputedStyle(texto).textDecorationLine,
  };
}));
const opcion = (estado, nombre) => estado.find((o) => o.nombre.startsWith(nombre));
const encendidas = (estado) => estado.filter((o) => o.pastilla === '1').map((o) => o.nombre);

async function menu(t) {
  // Con raton.
  {
    const ctx = await t.contexto(VENTANAS.escritorio, { nombre: 'menu-raton' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await espera(300);
    await p.mouse.move(640, 600);
    await p.mouse.move(644, 604);
    await espera(250);

    // La pagina actual: aro ambar de 1,5 px, texto ambar claro, sin raya.
    const quieto = await estadoMenu(p);
    const inicio = opcion(quieto, 'Inicio');
    t.ok(inicio.aro.includes(AMBAR) && inicio.aro.includes('1.5px') && inicio.aro.includes('inset'), `[raton] Inicio, la pagina actual, no lleva el aro ambar (${JSON.stringify(inicio)})`);
    t.ok(inicio.color === AMBAR_CLARO && inicio.raya === 'none', `[raton] Inicio no va en ambar claro sin raya (${JSON.stringify(inicio)})`);
    t.ok(quieto.filter((o) => o.aro !== 'sin').length === 1, `[raton] hay mas de un aro en el menu (${JSON.stringify(quieto)})`);
    t.ok(encendidas(quieto).length === 0, `[raton] hay opciones encendidas sin el raton encima (${encendidas(quieto).join(', ')})`);

    // Sobre Nosotros se enciende Nosotros y nada mas: no viaja.
    await p.hover('#main-nav a[href="#/nosotros"]');
    await esperaQue(async () => opcion(await estadoMenu(p), 'Nosotros').pastilla === '1');
    const nosotros = await estadoMenu(p);
    t.ok(encendidas(nosotros).join() === 'Nosotros' && opcion(nosotros, 'Nosotros').pastillaColor === AMBAR, `[raton] con el raton en Nosotros no se enciende solo Nosotros en ambar (${JSON.stringify(nosotros)})`);
    await esperaQue(async () => opcion(await estadoMenu(p), 'Nosotros').color === HORNO);
    t.ok(opcion(await estadoMenu(p), 'Nosotros').color === HORNO, '[raton] Nosotros encendido no pasa a horno');

    // Sobre la pagina actual el aro se rellena.
    await p.hover('#main-nav a[href="#/"]');
    await esperaQue(async () => opcion(await estadoMenu(p), 'Inicio').pastilla === '1');
    await esperaQue(async () => opcion(await estadoMenu(p), 'Inicio').color === HORNO);
    const sobreActual = opcion(await estadoMenu(p), 'Inicio');
    t.ok(sobreActual.pastilla === '1' && sobreActual.color === HORNO, `[raton] con el raton en la pagina actual no se rellena (${JSON.stringify(sobreActual)})`);

    // Tienda se enciende entera, abre su desplegable y sigue encendida en el.
    await p.hover('#main-nav .nav-grupo-enlace');
    await esperaQue(async () => opcion(await estadoMenu(p), 'Tienda').pastilla === '1');
    await esperaQue(() => p.evaluate(() => document.querySelector('.nav-grupo').classList.contains('is-open')));
    const tienda = await estadoMenu(p);
    t.ok(encendidas(tienda).join() === 'Tienda', `[raton] con el raton en Tienda no se enciende solo Tienda (${JSON.stringify(tienda)})`);
    t.ok(await p.evaluate(() => document.querySelector('.nav-grupo').classList.contains('is-open')), '[raton] con el raton en Tienda el desplegable no se abre');
    const flecha = await p.locator('.nav-grupo-boton').evaluate((b) => getComputedStyle(b).color);
    await p.hover('#nav-tienda a[data-filtro="dulces"]');
    await espera(250);
    t.ok(encendidas(await estadoMenu(p)).join() === 'Tienda', '[raton] al bajar a las categorias Tienda se apaga');
    t.ok(flecha === HORNO, `[raton] la flecha de Tienda encendida es ${flecha}, no horno`);

    // Al salir se apaga todo; el teclado no enciende nada.
    await p.mouse.move(640, 600);
    await esperaQue(async () => encendidas(await estadoMenu(p)).length === 0);
    t.ok(encendidas(await estadoMenu(p)).length === 0, '[raton] al salir del menu queda una opcion encendida');
    await p.focus('#main-nav a[href="#/contacto"]');
    await espera(300);
    t.ok(encendidas(await estadoMenu(p)).length === 0, '[raton] el foco del teclado enciende una opcion');

    // En otra vista el aro se va con ella.
    await p.click('#main-nav a[href="#/nosotros"]');
    await esperaQue(() => p.evaluate(() => location.hash === '#/nosotros'));
    await p.mouse.move(640, 600);
    await espera(300);
    const otra = await estadoMenu(p);
    t.ok(opcion(otra, 'Nosotros').aro.includes(AMBAR) && opcion(otra, 'Inicio').aro === 'sin', `[raton] en #/nosotros el aro no pasa a Nosotros (${JSON.stringify(otra)})`);
    await p.goto(t.REACT + '#/tienda-dulces');
    await p.waitForSelector('.product-card:not([hidden])');
    await espera(300);
    t.ok(opcion(await estadoMenu(p), 'Tienda').aro.includes(AMBAR), '[raton] en una categoria de la tienda Tienda no lleva el aro');
    await ctx.close();
  }

  // Con el dedo, en el telefono: no hay pastilla, y el aro sigue en el menu.
  {
    const ctx = await t.contexto(VENTANAS.movil, { nombre: 'menu-dedo' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await p.tap('.menu-toggle');
    await espera(300);
    await p.tap('#main-nav a[href="#/nosotros"]');
    await esperaQue(() => p.evaluate(() => location.hash === '#/nosotros'));
    await espera(300);
    await p.tap('.menu-toggle');
    await espera(400);
    const dedo = await estadoMenu(p);
    t.ok(dedo.every((o) => o.pastilla === 'sin'), `[dedo] hay pastilla en el menu sin raton (${JSON.stringify(dedo)})`);
    const nosotros = opcion(dedo, 'Nosotros');
    t.ok(nosotros.aro.includes(AMBAR) && nosotros.color === AMBAR_CLARO && nosotros.raya === 'none', `[dedo] en el menu del telefono la pagina actual no lleva el aro (${JSON.stringify(nosotros)})`);
    // En la tienda, el aro de Tienda abraza su renglon (palabra y flecha, el
    // texto centrado dentro) y la flecha va del mismo ambar claro.
    await p.tap('.menu-toggle');
    await p.goto(t.REACT + '#/tienda-panes');
    await p.waitForSelector('.product-card:not([hidden])');
    await p.tap('.menu-toggle');
    await espera(400);
    const tienda = await p.locator('#main-nav .nav-grupo').evaluate((g) => {
      const caja = g.getBoundingClientRect();
      const aro = getComputedStyle(g, '::after');
      const arriba = caja.top + parseFloat(aro.top);
      const texto = g.querySelector('.nav-grupo-enlace').getBoundingClientRect();
      return {
        flecha: getComputedStyle(g.querySelector('.nav-grupo-boton')).color,
        aro: aro.boxShadow,
        descentrado: Math.abs((arriba + parseFloat(aro.height) / 2) - (texto.top + texto.height / 2)),
      };
    });
    t.ok(tienda.aro.includes(AMBAR) && tienda.flecha === AMBAR_CLARO, `[dedo] en la tienda la flecha de Tienda no va en ambar claro o falta el aro (${JSON.stringify(tienda)})`);
    t.ok(tienda.descentrado <= 3, `[dedo] el aro de Tienda no esta centrado en su renglon (${Math.round(tienda.descentrado)} px)`);
    await ctx.close();
  }
}

// ---- La cinta ----------------------------------------------------------------
async function cinta(t) {
  const estado = (p) => p.locator('.cinta-enlace').evaluateAll((as) => as.map((a) => ({
    pastilla: getComputedStyle(a, '::before').opacity, color: getComputedStyle(a).color,
  })));
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre: `cinta-${nombre}` });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await espera(300);
    if (nombre === 'escritorio') {
      await p.mouse.move(640, 300);
      await p.hover('.cinta-enlace >> nth=1');
      await esperaQue(async () => (await estado(p))[1].pastilla === '1' && (await estado(p))[1].color === HORNO);
      const e = await estado(p);
      t.ok(e[1].pastilla === '1' && e[1].color === HORNO && e[0].pastilla === '0' && e[2].pastilla === '0', `[${nombre}] con el raton la cinta no enciende solo su enlace en ambar con texto horno (${JSON.stringify(e)})`);
    } else {
      await p.tap('.portada-frase');
      const e = await estado(p);
      t.ok(e.every((x) => x.pastilla === '0' && x.color === PAPEL), `[${nombre}] la cinta se enciende sin raton (${JSON.stringify(e)})`);
    }
    await ctx.close();
  }
}
