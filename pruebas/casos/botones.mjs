// Los botones en pastilla con sombra (B1), los enlaces sueltos en pastilla y
// la pastilla que se desliza por el menu (N3), seccion 10 del plan, en
// escritorio y en el telefono (390 px, tactil):
// - todo .button (portada, canasta, hoja de pagar, iniciar sesion, crear
//   cuenta, contacto) es pastilla, en Arial y no en Georgia, de 44 px de
//   alto o mas y sin texto que se salga; el principal con sombra dura, que
//   con el foco del teclado sustituye al halo (el anillo de 3 px se queda);
// - "Como llegar" y la cinta, en pastilla;
// - la pastilla del menu aparece con el raton, viaja a Tienda sin cerrar su
//   desplegable, se va al salir y no la mueve el teclado; con el dedo no
//   aparece; con menos movimiento aparece sin viajar;
// - entre 681 y 900 px logo, menu y botones de la derecha no se pisan (a
//   681 px "Inicio" se metia bajo el logo);
// - un .button apagado (aria-disabled) se ve apagado y no se levanta.
import { VENTANAS, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'botones B1 (pastilla, Arial, 44 px, sombra y foco), enlaces sueltos en pastilla y la pastilla del menu (raton si, dedo no, sin viajar con menos movimiento)';
export const limite = 150;

const PILDORA = '999px';
const SOMBRA = 'rgb(58, 40, 34) 4px 4px 0px 0px';

// Mide los .button que se ven en la pagina.
const medirBotones = (p) => p.evaluate(() => [...document.querySelectorAll('.button')]
  .filter((b) => b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden')
  .map((b) => {
    const c = getComputedStyle(b);
    return {
      texto: b.textContent.trim().slice(0, 30),
      radio: c.borderTopLeftRadius,
      letra: c.fontFamily,
      alto: Math.round(b.getBoundingClientRect().height),
      sale: b.scrollWidth > b.clientWidth + 1,
      derecha: b.getBoundingClientRect().right,
      ancho: window.innerWidth,
    };
  }));

function revisar(t, nombre, donde, botones, minimo = 1) {
  t.ok(botones.length >= minimo, `[${nombre}] en ${donde} hay ${botones.length} botones .button, se esperaban ${minimo} o mas`);
  for (const b of botones) {
    t.ok(b.radio === PILDORA, `[${nombre}] "${b.texto}" (${donde}) no es pastilla (${b.radio})`);
    t.ok(/^Arial/.test(b.letra) && !b.letra.includes('Georgia'), `[${nombre}] "${b.texto}" (${donde}) va en ${b.letra}`);
    t.ok(b.alto >= 44, `[${nombre}] "${b.texto}" (${donde}) mide ${b.alto} px de alto`);
    t.ok(!b.sale && b.derecha <= b.ancho, `[${nombre}] "${b.texto}" (${donde}) se sale de su sitio`);
  }
}

export default async function botones(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre: `botones-${nombre}` });
    const p = await ctx.newPage();
    const pulsar = (sel) => (nombre === 'movil' ? p.locator(sel).first().tap() : p.locator(sel).first().click());

    // La portada: "Nuestros panes" es un .button como los demas, y "Como
    // llegar" y la cinta van en pastilla.
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await espera(300);
    revisar(t, nombre, 'la portada', await medirBotones(p));
    const principal = await p.locator('.portada-acciones .button-yellow').evaluate((b) => ({
      texto: b.textContent.trim(), sombra: getComputedStyle(b).boxShadow,
    }));
    t.ok(principal.texto === 'Nuestros panes' && principal.sombra === SOMBRA, `[${nombre}] "Nuestros panes" no es el boton con sombra dura (${JSON.stringify(principal)})`);
    const enlaces = await p.evaluate(() => [...document.querySelectorAll('.h-imprenta')].map((a) => getComputedStyle(a).borderTopLeftRadius));
    t.ok(enlaces.length === 4 && enlaces.every((r) => r === '999px'), `[${nombre}] los enlaces sueltos no van en pastilla (${enlaces.join(', ')})`);
    t.ok(await p.locator('.boton-duro, .b-brillo').count() === 0, `[${nombre}] quedan botones con la clase vieja boton-duro`);

    // Con el foco del teclado: el anillo de 3 px y la sombra dura en lugar
    // del halo ambar.
    if (nombre === 'escritorio') {
      await p.keyboard.press('Shift');
      await p.focus('.portada-acciones .button-yellow');
      const foco = await p.locator('.portada-acciones .button-yellow').evaluate((b) => {
        const c = getComputedStyle(b);
        return { visible: b.matches(':focus-visible'), anillo: `${c.outlineStyle} ${c.outlineWidth}`, sombra: c.boxShadow };
      });
      t.ok(foco.visible && foco.anillo === 'solid 3px' && foco.sombra === SOMBRA, `[${nombre}] el foco de "Nuestros panes" no es anillo de 3 px con la sombra dura (${JSON.stringify(foco)})`);
    }

    // La canasta con "Ir a pagar" y la hoja de pagar con sus dos botones.
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card:not([hidden]) .card-mas');
    await pulsar('.product-card:not([hidden]) .card-mas');
    await espera(200);
    await pulsar('.floating-whatsapp.is-canasta');
    await p.waitForSelector('.canasta-panel.is-open .canasta-enviar');
    await espera(500);
    revisar(t, nombre, 'la canasta', await medirBotones(p));
    await pulsar('.canasta-enviar');
    await p.waitForSelector('.pide-cuenta:not([hidden]) .pide-cuenta-otra');
    await espera(700);
    const hoja = await medirBotones(p);
    revisar(t, nombre, 'la hoja de pagar', hoja, 2);
    const otro = await p.locator('.pide-cuenta-otra').evaluate((b) => ({ fondo: getComputedStyle(b).backgroundColor, sombra: getComputedStyle(b).boxShadow }));
    t.ok(otro.fondo === 'rgba(0, 0, 0, 0)' && otro.sombra === 'none', `[${nombre}] el boton secundario de la hoja no va sin relleno ni sombra (${JSON.stringify(otro)})`);

    // Iniciar sesion, crear la cuenta y contacto (se recarga: la canasta se
    // queda abierta al cambiar solo el hash).
    for (const [donde, hash, sel] of [['Iniciar sesion', '#/cuenta/entrar', '.cuenta-entrar'], ['Crear cuenta', '#/cuenta/crear', '.cuenta-crear'], ['Contacto', '#/contacto', '.contacto-mapa-enlace']]) {
      await p.goto(t.REACT + 'index.html' + hash);
      await p.reload();
      await p.waitForSelector(sel);
      await espera(300);
      revisar(t, nombre, donde, await medirBotones(p));
    }
    await ctx.close();
  }

  await pastilla(t);
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
    return { opacidad: c.opacity, cursor: c.cursor, transform: c.transform, sombra: c.boxShadow };
  });
  t.ok(Number(b.opacidad) <= 0.5 && b.cursor === 'not-allowed' && b.transform === 'none' && b.sombra === 'none', `[apagado] "Ir a pagar" apagado no se ve apagado o se levanta con el raton (${JSON.stringify(b)})`);
  await ctx.close();
}

// ---- La pastilla del menu ----------------------------------------------------
const estadoPastilla = (p) => p.evaluate(() => {
  const s = document.querySelector('.nav-pastilla');
  const c = getComputedStyle(s);
  return {
    display: c.display,
    opacidad: c.opacity,
    transicion: c.transitionProperty,
    ancho: Math.round(s.getBoundingClientRect().width),
    oculta: s.getAttribute('aria-hidden'),
    bajo: [...document.querySelectorAll('#main-nav [data-bajo]')].map((e) => e.textContent.trim()),
  };
});

async function pastilla(t) {
  // Con raton.
  {
    const ctx = await t.contexto(VENTANAS.escritorio, { nombre: 'pastilla-raton' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await espera(300);
    const antes = await estadoPastilla(p);
    t.ok((antes.display === 'none' || antes.opacidad === '0') && antes.oculta === 'true', `[raton] la pastilla se ve antes de pasar por el menu o no es aria-hidden (${JSON.stringify(antes)})`);

    await p.hover('#main-nav a[href="#/nosotros"]');
    await esperaQue(async () => (await estadoPastilla(p)).opacidad === '1');
    const nosotros = await estadoPastilla(p);
    const anchoNosotros = await p.locator('#main-nav a[href="#/nosotros"]').evaluate((a) => Math.round(a.getBoundingClientRect().width));
    const color = await p.locator('#main-nav a[href="#/nosotros"]').evaluate((a) => getComputedStyle(a).color);
    t.ok(nosotros.display === 'block' && nosotros.bajo.join() === 'Nosotros', `[raton] con el raton en Nosotros la pastilla no esta ahi (${JSON.stringify(nosotros)})`);
    t.ok(Math.abs(nosotros.ancho - anchoNosotros) <= 1, `[raton] la pastilla mide ${nosotros.ancho} px y Nosotros ${anchoNosotros}`);
    await esperaQue(async () => (await p.locator('#main-nav a[href="#/nosotros"]').evaluate((a) => getComputedStyle(a).color)) === 'rgb(58, 40, 34)');
    t.ok(await p.locator('#main-nav a[href="#/nosotros"]').evaluate((a) => getComputedStyle(a).color) === 'rgb(58, 40, 34)', `[raton] Nosotros bajo la pastilla es ${color}, no horno`);

    // A Tienda viaja (transicion de posicion) y el desplegable se abre igual.
    await p.hover('#main-nav .nav-grupo-enlace');
    const tienda = await estadoPastilla(p);
    t.ok(tienda.transicion.includes('transform') && tienda.bajo.length === 1 && tienda.bajo[0].startsWith('Tienda'), `[raton] la pastilla no viaja hasta Tienda (${JSON.stringify(tienda)})`);
    await esperaQue(() => p.evaluate(() => document.querySelector('.nav-grupo').classList.contains('is-open')));
    t.ok(await p.evaluate(() => document.querySelector('.nav-grupo').classList.contains('is-open')), '[raton] con la pastilla en Tienda el desplegable no se abre');
    // Bajar a las categorias no la saca de Tienda.
    await p.hover('#nav-tienda a[data-filtro="dulces"]');
    const enLista = await estadoPastilla(p);
    t.ok(enLista.opacidad === '1' && enLista.bajo[0]?.startsWith('Tienda'), `[raton] en el desplegable la pastilla deja Tienda (${JSON.stringify(enLista)})`);

    // Al salir del menu se desvanece.
    await p.mouse.move(640, 600);
    await esperaQue(async () => (await estadoPastilla(p)).opacidad === '0');
    const fuera = await estadoPastilla(p);
    t.ok(fuera.opacidad === '0' && fuera.bajo.length === 0, `[raton] al salir del menu la pastilla no se va (${JSON.stringify(fuera)})`);

    // El teclado no la mueve.
    await p.focus('#main-nav a[href="#/contacto"]');
    await espera(300);
    const teclado = await estadoPastilla(p);
    t.ok(teclado.opacidad === '0' && teclado.bajo.length === 0, `[raton] el foco del teclado movio la pastilla (${JSON.stringify(teclado)})`);
    await ctx.close();
  }

  // Con menos movimiento: aparece en su sitio y no viaja.
  {
    const ctx = await t.contexto({ ...VENTANAS.escritorio, reducedMotion: 'reduce' }, { nombre: 'pastilla-reducido' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await p.hover('#main-nav a[href="#/nosotros"]');
    await p.hover('#main-nav a[href="#/contacto"]');
    const quieta = await estadoPastilla(p);
    t.ok(!quieta.transicion.includes('transform') && quieta.bajo.join() === 'Contáctanos', `[reducido] la pastilla viaja con menos movimiento (${JSON.stringify(quieta)})`);
    await ctx.close();
  }

  // Con el dedo, en el telefono: no aparece.
  {
    const ctx = await t.contexto(VENTANAS.movil, { nombre: 'pastilla-dedo' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await p.tap('.menu-toggle');
    await espera(300);
    await p.tap('#main-nav a[href="#/nosotros"]');
    await esperaQue(() => p.evaluate(() => location.hash === '#/nosotros'));
    const dedo = await estadoPastilla(p);
    t.ok(dedo.display === 'none' && dedo.bajo.length === 0, `[dedo] la pastilla del menu aparece al tocar (${JSON.stringify(dedo)})`);
    await ctx.close();
  }
}
