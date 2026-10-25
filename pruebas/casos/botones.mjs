// Los botones en ticket (P2, G3 y C1), "Como llegar" como enlace con la ola
// (L1), el menu todo en blanco (W1 y S2) y la cinta en papel con ola, seccion
// 10 del plan, en escritorio y en el telefono (390 px, tactil):
// - todo .button (portada, canasta, hoja de pagar, iniciar sesion, crear
//   cuenta, contacto) es ticket: la forma mordida va en la mascara de sus
//   capas (::before el papel, ::after la sombra dura) y no en el boton, en
//   Arial y no en Georgia, de 44 px de alto o mas y sin texto que se salga;
// - con el foco del teclado, el anillo de 3 px es el outline del boton, que
//   no lleva mascara, y la sombra dura sustituye al halo;
// - "Ir a pagar" y el boton final de pagar son corteza con texto papel
//   (4,5:1 o mas, medido) y sombra horno, a todo lo ancho; el secundario es
//   hueco (filete en anillo) y se rellena de masa con el raton; mientras se
//   paga, el giro se ve;
// - "Como llegar" es un enlace en Fraunces cursiva 600 de unos 1.35rem, con
//   el pin corteza de 24 px, un filete fino y sin raya, y se llama "Cómo llegar"
//   aunque cada letra vaya en su span aria-hidden; con el raton las letras
//   saltan (salta) y con menos movimiento no;
// - el menu: con el raton el blanco tenue (papel al 16 %) aparece sobre el
//   enlace que hay debajo (no viaja: las demas siguen apagadas) y el texto
//   sigue claro, sin ambar; Tienda se enciende entera y sigue asi en su
//   desplegable; la pagina actual es la pastilla papel llena con el texto
//   horno (la flecha de Tienda tambien), sin raya ni aro, y se queda igual
//   con el raton encima; el anillo del foco se ve sobre ella; el teclado no
//   enciende nada y con el dedo no hay tenue; la pagina actual igual en el
//   menu del telefono;
// - la cinta con el raton se enciende en papel lleno con texto e icono horno,
//   sus letras saltan en secuencia y cada icono tiene su propio movimiento;
// - entre 681 y 900 px logo, menu y botones de la derecha no se pisan;
// - un .button apagado (aria-disabled) se ve apagado, sin sombra, y no se
//   levanta.
import { VENTANAS, espera, esperaQue, crearCuenta } from '../arranque.mjs';

export const descripcion = 'botones en ticket (mascara, sombra, foco fuera de la mascara, pagar en corteza con 4,5:1, hueco, Arial, 44 px), Como llegar con la ola y su nombre, menu en blanco (tenue con el raton, pagina actual papel con texto horno, tambien en el telefono) y cinta en papel con ola e iconos animados';
export const limite = 180;

const HORNO = 'rgb(58, 40, 34)';
const AMBAR = 'rgb(215, 155, 74)';
const AMBAR_CLARO = 'rgb(242, 202, 104)';
const PAPEL = 'rgb(255, 253, 248)';
const MASA = 'rgb(247, 241, 231)';
const CORTEZA = 'rgb(168, 95, 69)';
const CORRIDA = 'matrix(1, 0, 0, 1, 4, 4)';

// El contraste WCAG entre dos colores rgb(...).
const luz = (texto) => {
  const [r, g, b] = (texto.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map((v) => {
    const x = Number(v) / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
// El blanco tenue: papel con alfa .16 (el navegador lo da como rgba o como color(srgb ...)).
const esTenue = (c) => /^(rgba\(255, 253, 248, 0\.16\)|color\(srgb 1 0\.99\d* 0\.97\d* \/ 0\.16\))$/.test(c);

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
    // "Como llegar" es un enlace con un filete fino, no un boton relleno.
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await espera(300);
    if (nombre === 'escritorio') {
      for (const [selector, icono, control] of [
        ['.nav-cuenta', '.nav-cuenta-icono', 'cuenta'],
        ['.nav-acciones .floating-whatsapp.is-canasta', '.canasta-icono', 'canasta'],
      ]) {
        await p.mouse.move(5, 5);
        await p.hover(selector);
        const activo = await p.locator(selector).evaluate((b, sel) => getComputedStyle(b.querySelector(sel)).transform !== 'none', icono);
        t.ok(activo, `[${nombre}] el icono de ${control} no responde al pasar el cursor`);
      }
    }
    revisar(t, nombre, 'la portada', await medirBotones(p));
    const principal = await capas(p, '.portada-acciones .button-yellow');
    t.ok(principal.papel === AMBAR && principal.sombra === HORNO && principal.corrida === CORRIDA, `[${nombre}] "Nuestros panes" no es el ticket ambar con sombra dura horno (${JSON.stringify(principal)})`);
    const llegar = await p.locator('.portada-llegar').evaluate((a) => {
      const c = getComputedStyle(a);
      const pin = a.querySelector('svg');
      const letras = a.querySelector('.letras');
      return {
        letra: c.fontFamily, estilo: c.fontStyle, peso: c.fontWeight, tamano: parseFloat(c.fontSize), borde: c.borderTopStyle,
        bordeColor: c.borderTopColor, bordeAncho: c.borderTopWidth, radio: c.borderRadius,
        fondo: c.backgroundColor, raya: c.textDecorationLine, rayaDespues: getComputedStyle(a, '::after').content,
        pin: Boolean(pin), pinAncho: pin ? Math.round(pin.getBoundingClientRect().width) : 0, pinColor: pin ? getComputedStyle(pin).color : '',
        alto: a.getBoundingClientRect().height,
        letrasEscondidas: letras ? letras.getAttribute('aria-hidden') : null,
        letras: letras ? [...letras.children].map((s) => s.textContent).join('') : '',
        sueltas: letras ? letras.children.length : 0,
      };
    });
    // El nombre accesible es uno y entero, aunque las letras vayan sueltas.
    const conNombre = await p.getByRole('link', { name: 'Cómo llegar', exact: true }).count();
    t.ok(conNombre === 1 && llegar.letrasEscondidas === 'true' && llegar.letras === 'Cómo llegar' && llegar.sueltas === 11, `[${nombre}] "Como llegar" no se llama "Cómo llegar" con sus letras sueltas escondidas (${conNombre} enlaces con ese nombre, ${JSON.stringify(llegar)})`);
    const tamanoLlegar = nombre === 'movil' ? 16 : 21.6;
    t.ok(/^"?Fraunces/.test(llegar.letra) && llegar.estilo === 'italic' && llegar.peso === '600' && Math.abs(llegar.tamano - tamanoLlegar) < 0.5, `[${nombre}] "Como llegar" no tiene el tamano responsive Fraunces cursiva 600 (${JSON.stringify(llegar)})`);
    t.ok(llegar.pin && llegar.pinAncho === 24 && llegar.pinColor === CORTEZA, `[${nombre}] el pin de "Como llegar" no es corteza de 24 px (${JSON.stringify(llegar)})`);
    t.ok(llegar.borde === 'solid' && llegar.bordeColor === CORTEZA && llegar.bordeAncho === '1px' && llegar.radio === '12px' && llegar.fondo === 'rgba(0, 0, 0, 0)' && llegar.raya === 'none' && llegar.rayaDespues === 'none' && llegar.alto >= 24, `[${nombre}] "Como llegar" no tiene un filete fino sin relleno, lleva raya o mide menos de 24 px (${JSON.stringify(llegar)})`);
    t.ok(await p.locator('.h-imprenta, .h-ola, .boton-duro, .nav-pastilla').count() === 0, `[${nombre}] quedan piezas viejas (h-imprenta, h-ola, boton-duro o nav-pastilla)`);

    // Con el raton, "Como llegar" pasa a corteza oscura, el pin salta y las
    // letras saltan una tras otra.
    if (nombre === 'escritorio') {
      await p.mouse.move(10, 400);
      await p.mouse.move(14, 404);
      await p.hover('.portada-llegar');
      await esperaQue(() => p.locator('.portada-llegar').evaluate((a) => getComputedStyle(a).color === 'rgb(122, 64, 48)'));
      const encima = await p.locator('.portada-llegar').evaluate((a) => ({
        color: getComputedStyle(a).color,
        pin: getComputedStyle(a.querySelector('svg')).transform,
        ola: [...a.querySelectorAll('.letras span')].map((s) => getComputedStyle(s).animationName),
        turnos: [...a.querySelectorAll('.letras span')].map((s) => getComputedStyle(s).animationDelay),
      }));
      t.ok(encima.color === 'rgb(122, 64, 48)' && encima.pin !== 'none', `[${nombre}] con el raton "Como llegar" no cambia a corteza oscura o el pin no salta (${JSON.stringify(encima)})`);
      t.ok(encima.ola.length === 11 && encima.ola.every((n) => n === 'salta') && encima.turnos[0] !== encima.turnos[10], `[${nombre}] con el raton las letras de "Como llegar" no saltan en ola (${JSON.stringify(encima)})`);

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
    t.ok(pagar.papel === CORTEZA && pagar.texto === PAPEL && pagar.sombra === HORNO, `[${nombre}] "Ir a pagar" no es el ticket corteza con texto papel y sombra horno (${JSON.stringify(pagar)})`);
    t.ok(contraste(pagar.texto, pagar.papel) >= 4.5, `[${nombre}] el texto de "Ir a pagar" da ${contraste(pagar.texto, pagar.papel).toFixed(2)}:1 sobre su fondo`);
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
    t.ok(final.papel === CORTEZA && final.texto === PAPEL && final.sombra === HORNO && Math.abs(final.ancho - final.anchoPadre) <= 1, `[${nombre}] el boton final de pagar no es el ticket corteza a todo lo ancho (${JSON.stringify(final)})`);
    t.ok(contraste(final.texto, final.papel) >= 4.5, `[${nombre}] el texto del boton final de pagar da ${contraste(final.texto, final.papel).toFixed(2)}:1`);
    // Mientras se paga, el boton se queda entero y el giro papel se ve sobre
    // la corteza. Con retiro y efectivo basta pulsar.
    await p.locator('.canasta-pagar').evaluate((b) => b.click());
    await esperaQue(() => p.locator('.canasta-pagar .pago-girando').count().then((n) => n === 1), 15);
    const giro = await p.locator('.canasta-pagar').evaluate((b) => {
      const g = b.querySelector('.pago-girando');
      return g ? {
        opacidad: getComputedStyle(b).opacity, punta: getComputedStyle(g).borderTopColor,
        fondo: getComputedStyle(b, '::before').backgroundColor, ancho: g.getBoundingClientRect().width,
      } : null;
    });
    t.ok(giro && giro.opacidad === '1' && giro.punta === PAPEL && giro.ancho >= 12 && contraste(giro.punta, giro.fondo) >= 3, `[${nombre}] mientras se paga el giro no se ve (${JSON.stringify(giro)})`);
    await ctx.close();
  }

  await menu(t);
  await cinta(t);
  await barraSinPisarse(t);
  await apagado(t);
  await llegarQuieto(t);
}

// ---- "Como llegar" con menos movimiento ----------------------------------------
// Con el raton cambia de color, pero ni las letras ni el pin saltan.
async function llegarQuieto(t) {
  const ctx = await t.contexto({ ...VENTANAS.escritorio, reducedMotion: 'reduce' }, { nombre: 'llegar-quieto' });
  const p = await ctx.newPage();
  await p.goto(t.REACT + '#/');
  await p.waitForSelector('.cinta');
  await p.mouse.move(10, 400);
  await p.mouse.move(14, 404);
  await p.hover('.portada-llegar');
  await esperaQue(() => p.locator('.portada-llegar').evaluate((a) => getComputedStyle(a).color === 'rgb(122, 64, 48)'));
  const quieto = await p.locator('.portada-llegar').evaluate((a) => ({
    color: getComputedStyle(a).color,
    pin: getComputedStyle(a.querySelector('svg')).transform,
    ola: [...new Set([...a.querySelectorAll('.letras span')].map((s) => getComputedStyle(s).animationName))],
  }));
  t.ok(quieto.color === 'rgb(122, 64, 48)' && quieto.pin === 'none' && quieto.ola.join() === 'none', `[menos movimiento] "Como llegar" se mueve con el raton (${JSON.stringify(quieto)})`);
  await ctx.close();
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
      const opciones = [...document.querySelectorAll('#main-nav > a')].map((e) => e.getBoundingClientRect());
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

// ---- El menu de arriba (W1 y S2) ----------------------------------------------
// Como esta cada opcion: su blanco tenue (::before), la pastilla de la pagina
// actual (::after), su color y su raya.
const estadoMenu = (p) => p.evaluate(() => [...document.querySelectorAll('#main-nav > a')].map((o) => {
  const texto = o;
  const antes = getComputedStyle(o, '::before');
  const indicador = o.querySelector('.nav-indicador');
  return {
    nombre: texto.textContent.trim(),
    pastilla: antes.content !== 'none' && antes.content !== 'normal' ? antes.opacity : 'sin',
    pastillaColor: antes.backgroundColor,
    actual: indicador ? getComputedStyle(indicador).backgroundColor : 'sin',
    aro: indicador ? getComputedStyle(indicador).boxShadow : 'none',
    color: getComputedStyle(texto).color,
    raya: getComputedStyle(texto).textDecorationLine,
  };
}));
const opcion = (estado, nombre) => estado.find((o) => o.nombre.startsWith(nombre));
const encendidas = (estado) => estado.filter((o) => o.pastilla === '1').map((o) => o.nombre);

async function menu(t) {
  // Con raton.
  {
    const ctx = await t.contexto({ ...VENTANAS.escritorio, reducedMotion: 'no-preference' }, { nombre: 'menu-raton' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    await espera(300);
    await p.mouse.move(640, 600);
    await p.mouse.move(644, 604);
    await espera(250);

    // La pagina actual: pastilla papel llena, texto horno, sin raya ni aro.
    const quieto = await estadoMenu(p);
    const inicio = opcion(quieto, 'Inicio');
    t.ok(inicio.actual === PAPEL && inicio.aro === 'none', `[raton] Inicio, la pagina actual, no es la pastilla papel sin aro (${JSON.stringify(inicio)})`);
    t.ok(inicio.color === HORNO && inicio.raya === 'none', `[raton] Inicio no va en horno sin raya (${JSON.stringify(inicio)})`);
    t.ok(quieto.filter((o) => o.actual !== 'sin').length === 1, `[raton] hay mas de una pagina actual en el menu (${JSON.stringify(quieto)})`);
    t.ok(quieto.filter((o) => o.actual === 'sin').every((o) => o.color !== HORNO && contraste(o.color, HORNO) >= 4.5), `[raton] las demas opciones no van en claro sobre la barra (${JSON.stringify(quieto)})`);
    t.ok(encendidas(quieto).length === 0, `[raton] hay opciones encendidas sin el raton encima (${encendidas(quieto).join(', ')})`);
    t.ok(!JSON.stringify(quieto).includes(AMBAR) && !JSON.stringify(quieto).includes(AMBAR_CLARO), `[raton] queda ambar en el menu (${JSON.stringify(quieto)})`);

    // Sobre Nosotros se enciende el blanco tenue en Nosotros y nada mas (no
    // viaja), y el texto sigue claro.
    await p.hover('#main-nav a[href="#/nosotros"]');
    await esperaQue(async () => opcion(await estadoMenu(p), 'Nosotros').pastilla === '1');
    const nosotros = await estadoMenu(p);
    t.ok(encendidas(nosotros).join() === 'Nosotros' && esTenue(opcion(nosotros, 'Nosotros').pastillaColor), `[raton] con el raton en Nosotros no se enciende solo Nosotros en blanco tenue (${JSON.stringify(nosotros)})`);
    await esperaQue(async () => opcion(await estadoMenu(p), 'Nosotros').color === PAPEL);
    t.ok(opcion(await estadoMenu(p), 'Nosotros').color === PAPEL, `[raton] el texto de Nosotros encendido no sigue claro (${opcion(await estadoMenu(p), 'Nosotros').color})`);

    // Sobre la pagina actual se queda igual: papel lleno y texto horno.
    await p.hover('#main-nav a[href="#/"]');
    await espera(350);
    const sobreActual = opcion(await estadoMenu(p), 'Inicio');
    t.ok(sobreActual.actual === PAPEL && sobreActual.color === HORNO, `[raton] con el raton en la pagina actual cambia (${JSON.stringify(sobreActual)})`);

    // Tienda es un enlace simple (seccion 4 del plan): se enciende como las
    // demas y no abre ningun desplegable.
    await p.hover('#main-nav a[href$="tienda-catalogo"]');
    await esperaQue(async () => opcion(await estadoMenu(p), 'Tienda').pastilla === '1');
    const tienda = await estadoMenu(p);
    t.ok(encendidas(tienda).join() === 'Tienda' && esTenue(opcion(tienda, 'Tienda').pastillaColor), `[raton] con el raton en Tienda no se enciende solo Tienda en blanco tenue (${JSON.stringify(tienda)})`);
    t.ok(await p.evaluate(() => !document.querySelector('#main-nav [aria-expanded], .nav-grupo, .nav-submenu')), '[raton] Tienda sigue teniendo un desplegable');

    // Al salir se apaga todo; el teclado no enciende nada.
    await p.mouse.move(640, 600);
    await esperaQue(async () => encendidas(await estadoMenu(p)).length === 0);
    t.ok(encendidas(await estadoMenu(p)).length === 0, '[raton] al salir del menu queda una opcion encendida');
    await p.keyboard.press('Shift');
    await p.focus('#main-nav a[href="#/contacto"]');
    await espera(300);
    t.ok(encendidas(await estadoMenu(p)).length === 0, '[raton] el foco del teclado enciende una opcion');

    // El anillo del foco sobre la pagina actual: papel y por fuera de la
    // pastilla, donde la barra es horno.
    await p.focus('#main-nav a[href="#/"]');
    const focoInicio = await p.locator('#main-nav a[href="#/"]').evaluate((a) => {
      const c = getComputedStyle(a);
      return { visible: a.matches(':focus-visible'), color: c.outlineColor, ancho: c.outlineWidth, separa: parseFloat(c.outlineOffset) };
    });
    t.ok(focoInicio.visible && focoInicio.color === PAPEL && focoInicio.ancho === '3px' && focoInicio.separa >= 2, `[raton] el anillo del foco de la pagina actual no es papel por fuera de su pastilla (${JSON.stringify(focoInicio)})`);

    // En otra vista la pastilla se va con ella.
    await p.click('#main-nav a[href="#/nosotros"]');
    await esperaQue(() => p.evaluate(() => location.hash === '#/nosotros'));
    await p.mouse.move(640, 600);
    await espera(300);
    const otra = await estadoMenu(p);
    t.ok(opcion(otra, 'Nosotros').actual === PAPEL && opcion(otra, 'Nosotros').color === HORNO && opcion(otra, 'Inicio').actual === 'sin', `[raton] en #/nosotros la pastilla no pasa a Nosotros (${JSON.stringify(otra)})`);
    const origen = await p.locator('#main-nav .nav-indicador').boundingBox();
    const recorrido = await p.evaluate(() => new Promise((resolver) => {
      const posiciones = [];
      let cuadros = 0;
      document.querySelector('#main-nav a[href="#/contacto"]').click();
      const medir = () => {
        posiciones.push(document.querySelector('#main-nav .nav-indicador').getBoundingClientRect().x);
        cuadros += 1;
        if (cuadros === 18) resolver(posiciones);
        else requestAnimationFrame(medir);
      };
      requestAnimationFrame(medir);
    }));
    await esperaQue(() => p.evaluate(() => location.hash === '#/contacto'));
    const destino = await p.locator('#main-nav .nav-indicador').boundingBox();
    t.ok(origen && destino && recorrido.some((x) => x > origen.x + 1 && x < destino.x - 1), `[raton] la pastilla no recorre el menu hacia Contáctanos (${JSON.stringify({ origen, recorrido, destino })})`);
    await p.goto(t.REACT + '#/tienda-dulces');
    await p.waitForSelector('.product-card:not([hidden])');
    await espera(300);
    const enTienda = opcion(await estadoMenu(p), 'Tienda');
    t.ok(enTienda.actual === PAPEL && enTienda.color === HORNO, `[raton] en una categoria de la tienda Tienda no es la pastilla papel con el texto horno (${JSON.stringify(enTienda)})`);
    // Como cualquier opcion: el anillo papel, por fuera de su pastilla.
    await p.keyboard.press('Shift');
    await p.focus('#main-nav a[href$="tienda-catalogo"]');
    const focoTienda = await p.locator('#main-nav a[href$="tienda-catalogo"]').evaluate((a) => ({ visible: a.matches(':focus-visible'), color: getComputedStyle(a).outlineColor, separa: parseFloat(getComputedStyle(a).outlineOffset) }));
    t.ok(focoTienda.visible && focoTienda.color === PAPEL && focoTienda.separa >= 2, `[raton] el anillo del foco de Tienda, la pagina actual, no es papel por fuera de su pastilla (${JSON.stringify(focoTienda)})`);
    await ctx.close();
  }

  // Con el dedo, en el telefono: no hay blanco tenue, y la pagina actual
  // sigue en papel con el texto horno.
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
    t.ok(dedo.every((o) => o.pastilla === 'sin'), `[dedo] hay blanco tenue en el menu sin raton (${JSON.stringify(dedo)})`);
    const nosotros = opcion(dedo, 'Nosotros');
    t.ok(nosotros.actual === PAPEL && nosotros.color === HORNO && nosotros.raya === 'none' && nosotros.aro === 'none', `[dedo] en el menu del telefono la pagina actual no es la pastilla papel con texto horno (${JSON.stringify(nosotros)})`);
    t.ok(!JSON.stringify(dedo).includes(AMBAR) && !JSON.stringify(dedo).includes(AMBAR_CLARO), `[dedo] queda ambar en el menu del telefono (${JSON.stringify(dedo)})`);
    // En una categoria de la tienda, Tienda es la pagina actual: un enlace
    // simple, sin flecha ni desplegable, con su pastilla papel centrada.
    await p.tap('.menu-toggle');
    await p.goto(t.REACT + '#/tienda-panes');
    await p.waitForSelector('.product-card:not([hidden])');
    await p.tap('.menu-toggle');
    await espera(400);
    const tienda = await p.locator('#main-nav a[href$="tienda-catalogo"]').evaluate((a) => {
      const indicador = a.querySelector('.nav-indicador');
      const pastilla = indicador?.getBoundingClientRect();
      const texto = a.getBoundingClientRect();
      return {
        actual: a.getAttribute('aria-current'),
        botones: document.querySelectorAll('#main-nav button').length,
        pastilla: indicador && getComputedStyle(indicador).backgroundColor,
        color: getComputedStyle(a).color,
        descentrado: pastilla ? Math.abs((pastilla.top + pastilla.height / 2) - (texto.top + texto.height / 2)) : 99,
      };
    });
    t.ok(tienda.actual === 'page' && tienda.botones === 0 && tienda.pastilla === PAPEL && tienda.color === HORNO, `[dedo] en la tienda, Tienda no es un enlace simple con la pastilla papel y el texto horno (${JSON.stringify(tienda)})`);
    t.ok(tienda.descentrado <= 3, `[dedo] la pastilla de Tienda no esta centrada en su renglon (${Math.round(tienda.descentrado)} px)`);
    // Tocarlo lleva al catalogo entero y pliega el menu.
    await p.tap('#main-nav a[href$="tienda-catalogo"]');
    await esperaQue(() => p.evaluate(() => location.hash === '#/tienda-catalogo'));
    await espera(300);
    const tras = await p.evaluate(() => [location.hash, document.querySelector('#main-nav').classList.contains('is-open')]);
    t.ok(tras[0] === '#/tienda-catalogo' && tras[1] === false, `[dedo] tocar Tienda no lleva al catalogo o no pliega el menu (${tras})`);
    await ctx.close();
  }
}

// ---- La cinta ----------------------------------------------------------------
async function cinta(t) {
  const estado = (p) => p.locator('.cinta-enlace').evaluateAll((as) => as.map((a) => ({
    pastilla: getComputedStyle(a, '::before').opacity, fondo: getComputedStyle(a, '::before').backgroundColor,
    color: getComputedStyle(a).color, icono: getComputedStyle(a.querySelector('svg')).color,
    nombre: a.querySelector('.sr-only')?.textContent,
    letrasOcultas: a.querySelector('.letras')?.getAttribute('aria-hidden'),
    letras: a.querySelector('.letras') ? [...a.querySelector('.letras').children].map((s) => s.textContent).join('') : '',
    animacion: a.querySelector('.letras span') ? getComputedStyle(a.querySelector('.letras span')).animationName : '',
    animacionIcono: getComputedStyle(a.querySelector('.ico')).animationName,
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
      t.ok(e[1].pastilla === '1' && e[1].fondo === PAPEL && e[1].color === HORNO && e[1].icono === HORNO && e[0].pastilla === '0' && e[2].pastilla === '0', `[${nombre}] con el raton la cinta no enciende solo su enlace en papel con texto e icono horno (${JSON.stringify(e)})`);
      t.ok(contraste(e[1].color, e[1].fondo) >= 4.5, `[${nombre}] el texto de la cinta encendida da ${contraste(e[1].color, e[1].fondo).toFixed(2)}:1`);
      t.ok(e[1].animacion === 'salta' && e[0].animacion !== 'salta' && e[2].animacion !== 'salta', `[${nombre}] al pasar el raton las letras no saltan en ola solo en el enlace bajo el puntero (${JSON.stringify(e)})`);
      const iconos = [['panes', 'salta-hogaza'], ['dulces', 'salta-galleta'], ['bebidas-frias', 'baila-botella']];
      for (const [i, [categoria, animacion]] of iconos.entries()) {
        await p.hover(`.cinta-enlace-${categoria}`);
        await esperaQue(() => p.locator(`.cinta-enlace-${categoria} .ico`).evaluate((svg, nombre) => getComputedStyle(svg).animationName === nombre, animacion));
        t.ok((await estado(p))[i].animacionIcono === animacion, `[${nombre}] el icono de ${categoria} no tiene su animacion (${JSON.stringify(await estado(p))})`);
      }
      const galleta = await p.locator('.cinta-enlace-dulces .ico').evaluate((svg) => ({
        viewBox: svg.getAttribute('viewBox'),
        relleno: getComputedStyle(svg).fill,
        silueta: svg.querySelector('path')?.getAttribute('d'),
      }));
      t.ok(galleta.viewBox === '0 -960 960 960' && galleta.relleno !== 'none' && galleta.silueta?.startsWith('M480-80q-83 0-156'), `[${nombre}] la galleta no conserva la silueta rellena solicitada (${JSON.stringify(galleta)})`);
      for (const [i, etiqueta] of ['Panes', 'Dulces y pasteles', 'Bebidas'].entries()) {
        const enlace = e[i];
        t.ok(enlace.nombre === etiqueta && enlace.letrasOcultas === 'true' && enlace.letras === etiqueta, `[${nombre}] la categoria "${etiqueta}" no conserva un nombre accesible unico con letras decorativas (${JSON.stringify(enlace)})`);
      }
    } else {
      await p.tap('.portada-frase');
      const e = await estado(p);
      t.ok(e.every((x) => x.pastilla === '0' && x.color === PAPEL), `[${nombre}] la cinta se enciende sin raton (${JSON.stringify(e)})`);
      t.ok(e.every((x) => x.animacion === 'none' && x.animacionIcono === 'none' && x.nombre === x.letras && x.letrasOcultas === 'true'), `[${nombre}] la cinta tactil no conserva el texto accesible o aplica la ola sin raton (${JSON.stringify(e)})`);
    }
    await ctx.close();
  }
}
