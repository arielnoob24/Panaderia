// Lo de la revision visual del 21 de octubre de 2026 (secciones 4 y 10 del
// plan), en escritorio y en el telefono (390 px, tactil):
// - la barra de arriba es horno y opaca desde que carga, y sobre lo oscuro
//   (en #/ ya solo el pie) gana la linea ambar;
// - el carrusel lleva las flechas y la barra de avance en el pie, debajo de
//   las fichas, sin la barra del navegador, y sin hueco entre nombre y precio;
// - el nombre de la ficha va en Fraunces y los sellos con 11 px de letra o mas;
// - el h1 que recibe el foco al cambiar de vista no pinta recuadro;
// - los efectos de pasar por encima solo con raton (html.con-puntero);
// - en la computadora, Siguiente desplaza con movimiento de escena, que
//   se para si se tabula a una ficha o se teclea en la fila (no con Enter
//   en la propia flecha);
// - el anillo de la canasta se ve en la barra y flotando sobre lo claro;
// - una ficha agotada no se levanta, y con menos movimiento las flechas del
//   carrusel no cambian de tamano, ni agregar suelta "+1";
// - el estilo editorial (seccion 10 del plan), en los dos: Fraunces servida
//   desde el sitio, la cabecera de periodico con la fecha y el estado (solo
//   esos dos en el telefono), Inicio en el menu con aria-current, la cinta
//   que enlaza a cada categoria, enlaces de letras sueltas con su nombre
//   entero, fichas de esquinas rectas, y el control que se estira y suelta
//   un "+1" por toque.
import { VENTANAS, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'barra horno opaca, carrusel con flechas en el pie, fichas, h1 sin recuadro, hover solo con raton, anillo de la canasta, agotadas y flechas con menos movimiento, y el estilo editorial (Fraunces, periodico, Inicio, cinta, +1)';
export const limite = 150;

const HORNO = 'rgb(58, 40, 34)';
const AMBAR = 'rgb(215, 155, 74)';
const PAPEL = 'rgb(255, 253, 248)';

export default async function aspecto(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.mostrador .product-card');
    await espera(400);

    // La barra, arriba del todo.
    const arriba = await p.evaluate(() => {
      const h = document.querySelector('.site-header');
      const e = getComputedStyle(h);
      return {
        y: window.scrollY,
        fondo: e.backgroundColor,
        texto: e.color,
        logo: getComputedStyle(h.querySelector('.brand-logo')).filter,
      };
    });
    t.ok(arriba.y === 0, `[${nombre}] la pagina no abre arriba (${arriba.y})`);
    t.ok(arriba.fondo === HORNO, `[${nombre}] la barra arriba del todo es ${arriba.fondo}, no horno opaco`);
    t.ok(arriba.texto === 'rgb(238, 228, 216)', `[${nombre}] el texto de la barra es ${arriba.texto}, no --sobre-horno`);
    t.ok(arriba.logo.includes('invert'), `[${nombre}] el logo no va invertido (${arriba.logo})`);

    // Sobre una banda oscura sigue horno y gana la linea ambar. En #/ ya no
    // hay ninguna ("Los mas pedidos" va sobre la masa), asi que se mira con
    // la cabeza oscura de la tienda.
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.vista-cabeza.banda-oscura');
    await p.evaluate(() => {
      const banda = document.querySelector('.vista-cabeza.banda-oscura');
      window.scrollTo(0, banda.getBoundingClientRect().top + window.scrollY - 40);
    });
    const sobre = await esperaQue(() => p.evaluate(() => document.querySelector('.site-header').classList.contains('is-sobre-oscuro')));
    // La linea llega con una transicion corta: se espera a que acabe.
    await esperaQue(() => p.evaluate((ambar) => getComputedStyle(document.querySelector('.site-header')).boxShadow.startsWith(ambar), AMBAR));
    const sombra = await p.evaluate(() => getComputedStyle(document.querySelector('.site-header')).boxShadow);
    const fondoOscuro = await p.evaluate(() => getComputedStyle(document.querySelector('.site-header')).backgroundColor);
    t.ok(sobre, `[${nombre}] la barra no se entera de que tiene debajo una banda oscura`);
    t.ok(fondoOscuro === HORNO, `[${nombre}] sobre la banda oscura la barra es ${fondoOscuro}, no horno`);
    t.ok(sombra.includes(AMBAR) && sombra.includes('inset'), `[${nombre}] sobre la banda oscura no hay linea ambar (${sombra})`);
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.mostrador .product-card');
    await espera(400);

    // El carrusel: flechas y barra de avance debajo de las fichas.
    const fila = await p.evaluate(() => {
      const grid = document.querySelector('.mostrador .product-grid.is-fila');
      const pie = document.querySelector('.mostrador .fila-pie');
      const g = grid.getBoundingClientRect();
      const fotos = [...grid.querySelectorAll('.product-image')].map((f) => f.getBoundingClientRect());
      const flechas = [...pie.querySelectorAll('.fila-flecha')].map((b) => b.getBoundingClientRect());
      const caja = grid.getBoundingClientRect();
      const vistas = [...grid.querySelectorAll('.product-card')].filter((c) => {
        const r = c.getBoundingClientRect();
        return r.right > caja.left + 1 && r.left < caja.right - 1;
      });
      // El hueco entre lo ultimo de encima del pie (nombre o tamanos) y el pie.
      const huecos = vistas.map((c) => {
        const pieFicha = c.querySelector('.product-bottom');
        return pieFicha.getBoundingClientRect().top - pieFicha.previousElementSibling.getBoundingClientRect().bottom;
      });
      const h3 = grid.querySelector('.product-info h3');
      const sellos = [...grid.querySelectorAll('.product-tag')].map((s) => parseFloat(getComputedStyle(s).fontSize));
      return {
        pieVisible: getComputedStyle(pie).display !== 'none' && !pie.hidden,
        flechas: flechas.length,
        flechasDebajo: flechas.every((r) => r.top >= Math.max(...fotos.map((f) => f.bottom))),
        barraAvance: getComputedStyle(pie.querySelector('.fila-barra')).display,
        barraNavegador: grid.offsetHeight - grid.clientHeight,
        anchoBarra: getComputedStyle(grid).scrollbarWidth,
        mascara: getComputedStyle(grid).maskImage || getComputedStyle(grid).webkitMaskImage,
        huecoMax: Math.max(...huecos),
        letraNombre: getComputedStyle(h3).fontFamily,
        selloMin: Math.min(...sellos),
        anchoGrid: g.width,
      };
    });
    t.ok(fila.pieVisible && fila.flechas === 2, `[${nombre}] el pie del carrusel no se ve con sus dos flechas`);
    t.ok(fila.flechasDebajo, `[${nombre}] alguna flecha del carrusel esta encima de las fotos`);
    t.ok(fila.barraAvance !== 'none', `[${nombre}] no se ve la barra de avance del carrusel`);
    t.ok(fila.barraNavegador === 0 && fila.anchoBarra === 'none', `[${nombre}] se ve la barra de desplazamiento del navegador (${fila.barraNavegador} px, ${fila.anchoBarra})`);
    t.ok(/gradient/.test(fila.mascara), `[${nombre}] el borde del carrusel no se desvanece (${fila.mascara})`);
    t.ok(fila.huecoMax < 40, `[${nombre}] hay un hueco de ${Math.round(fila.huecoMax)} px entre el nombre y el precio`);
    t.ok(/^"?Fraunces Variable/.test(fila.letraNombre),`[${nombre}] el nombre de la ficha va en ${fila.letraNombre}`);
    t.ok(fila.selloMin >= 11, `[${nombre}] un sello lleva letra de ${fila.selloMin} px`);

    // Hover solo con raton: en el telefono, tocar no enciende con-puntero.
    if (nombre === 'escritorio') {
      await p.mouse.move(200, 200);
      await p.mouse.move(260, 240);
    } else {
      await p.tap('.mostrador-dicho');
    }
    const conPuntero = await p.evaluate(() => document.documentElement.classList.contains('con-puntero'));
    t.ok(conPuntero === (nombre === 'escritorio'), `[${nombre}] html.con-puntero es ${conPuntero}`);

    // Siguiente desplaza con movimiento de escena (unos 560 ms), no de golpe.
    if (nombre === 'escritorio') {
      await p.evaluate(() => document.querySelector('.mostrador .fila-flecha[data-ir="1"]').scrollIntoView({ block: 'center' }));
      await espera(200);
      await p.click('.mostrador .fila-flecha[data-ir="1"]');
      await espera(120);
      const aMedias = await p.evaluate(() => document.querySelector('.mostrador .product-grid.is-fila').scrollLeft);
      await espera(900);
      const alFinal = await p.evaluate(() => {
        const g = document.querySelector('.mostrador .product-grid.is-fila');
        return { x: g.scrollLeft, avanzada: g.classList.contains('is-avanzada'), encaje: g.style.scrollSnapType };
      });
      t.ok(alFinal.x > 100, `[${nombre}] Siguiente no avanzo el carrusel (${alFinal.x})`);
      t.ok(aMedias > 0 && aMedias < alFinal.x - 10, `[${nombre}] Siguiente no se mueve como escena: a los 120 ms iba en ${Math.round(aMedias)} de ${Math.round(alFinal.x)}`);
      t.ok(alFinal.avanzada, `[${nombre}] tras avanzar, el borde izquierdo no se desvanece`);
      t.ok(alFinal.encaje === '', `[${nombre}] el encaje del carrusel no se devolvio al acabar (${alFinal.encaje})`);

      // Enter en la flecha (fuera de la fila) no para su propio salto.
      const fila = '.mostrador .product-grid.is-fila';
      const encaje = () => p.evaluate((sel) => document.querySelector(sel).style.scrollSnapType, fila);
      const posicion = () => p.evaluate((sel) => document.querySelector(sel).scrollLeft, fila);
      const antesEnter = await posicion();
      await p.focus('.mostrador .fila-flecha[data-ir="1"]');
      await p.keyboard.press('Enter');
      await espera(120);
      const enterAMedias = await encaje();
      await espera(800);
      const trasEnter = await posicion();
      t.ok(enterAMedias === 'none' && trasEnter > antesEnter + 100, `[${nombre}] Enter en Siguiente no hizo su salto entero (a medias: "${enterAMedias}", ${Math.round(antesEnter)} -> ${Math.round(trasEnter)})`);

      // Tabular a una ficha a medio salto lo para y devuelve el encaje.
      await p.click('.mostrador .fila-flecha[data-ir="-1"]');
      await espera(100);
      const saltando = await encaje();
      await p.focus(`${fila} .product-card .card-mas`);
      await espera(50);
      const trasFoco = await encaje();
      t.ok(saltando === 'none' && trasFoco === '', `[${nombre}] el foco en una ficha no para el salto (antes "${saltando}", despues "${trasFoco}")`);
      await espera(700);

      // Una tecla dentro de la fila tambien lo para.
      await p.click('.mostrador .fila-flecha[data-ir="1"]');
      await espera(100);
      const saltando2 = await encaje();
      await p.evaluate((sel) => document.querySelector(sel).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })), fila);
      await espera(50);
      const trasTecla = await encaje();
      t.ok(saltando2 === 'none' && trasTecla === '', `[${nombre}] una tecla en la fila no para el salto (antes "${saltando2}", despues "${trasTecla}")`);
      await espera(700);
    }

    // Al cambiar de vista el h1 recibe el foco, sin recuadro.
    await p.evaluate(() => window.scrollTo(0, 0));
    if (nombre === 'movil') {
      await p.tap('.menu-toggle');
      await espera(300);
      await p.tap('#main-nav a[href="#/nosotros"]');
    } else {
      await p.click('#main-nav a[href="#/nosotros"]');
    }
    await esperaQue(() => p.evaluate(() => document.activeElement?.tagName === 'H1'));
    const titulo = await p.evaluate(() => {
      const h = document.activeElement;
      const e = getComputedStyle(h);
      return { tag: h.tagName, contorno: e.outlineStyle, ancho: e.outlineWidth };
    });
    t.ok(titulo.tag === 'H1', `[${nombre}] al llegar a Nosotros el foco esta en ${titulo.tag}`);
    t.ok(titulo.contorno === 'none' || titulo.ancho === '0px', `[${nombre}] el h1 con el foco pinta recuadro (${titulo.contorno} ${titulo.ancho})`);
    // Tambien cuando se llega con el teclado: el foco visible del enlace pasa al h1.
    if (nombre === 'escritorio') {
      await p.focus('#main-nav a[href="#/contacto"]');
      await p.keyboard.press('Enter');
      await esperaQue(() => p.evaluate(() => document.activeElement?.id === 'contacto-titulo'));
      const conTeclado = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
      t.ok(conTeclado === 'none', `[${nombre}] llegando con el teclado, el h1 de Contacto pinta recuadro (${conTeclado})`);
    }

    // El anillo de la canasta: papel en la barra (computadora), horno cuando
    // flota sobre la pagina clara (telefono). Se llega con el teclado.
    await p.keyboard.press('Shift');
    await p.focus('.floating-whatsapp.is-canasta');
    const anillo = await p.evaluate(() => {
      const b = document.querySelector('.floating-whatsapp.is-canasta');
      return { visible: b.matches(':focus-visible'), color: getComputedStyle(b).outlineColor };
    });
    const esperado = nombre === 'escritorio' ? PAPEL : HORNO;
    t.ok(anillo.visible && anillo.color === esperado, `[${nombre}] el anillo de la canasta es ${anillo.color} (visible: ${anillo.visible}), se esperaba ${esperado}`);
    await ctx.close();
  }

  // Una ficha agotada no se levanta con el raton (no hay nada que tocar).
  {
    const ctx = await t.contexto(VENTANAS.escritorio, { nombre: 'agotada' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card[data-available="false"]');
    await p.evaluate(() => document.querySelector('.product-card[data-available="false"]').scrollIntoView({ block: 'center' }));
    await espera(300);
    await p.hover('.product-card[data-available="false"] .product-info');
    await espera(800);
    const agotada = await p.evaluate(() => {
      const c = document.querySelector('.product-card[data-available="false"]');
      return {
        puntero: document.documentElement.classList.contains('con-puntero'),
        ficha: getComputedStyle(c).transform,
        sombra: getComputedStyle(c, '::after').opacity,
      };
    });
    t.ok(agotada.puntero, '[agotada] el raton no encendio con-puntero');
    t.ok(agotada.ficha === 'none' && agotada.sombra === '0', `[agotada] la ficha agotada se levanta con el raton (${agotada.ficha}, sombra ${agotada.sombra})`);
    await ctx.close();
  }

  // Con menos movimiento, las flechas del carrusel no cambian de tamano.
  {
    const ctx = await t.contexto({ ...VENTANAS.escritorio, reducedMotion: 'reduce' }, { nombre: 'reducido' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.mostrador .fila-flecha[data-ir="1"]');
    await p.evaluate(() => document.querySelector('.mostrador .fila-flecha[data-ir="1"]').scrollIntoView({ block: 'center' }));
    await espera(300);
    await p.hover('.mostrador .fila-flecha[data-ir="1"]');
    await espera(400);
    const encima = await p.evaluate(() => getComputedStyle(document.querySelector('.mostrador .fila-flecha[data-ir="1"]')).transform);
    await p.mouse.down();
    await espera(250);
    const pulsada = await p.evaluate(() => getComputedStyle(document.querySelector('.mostrador .fila-flecha[data-ir="1"]')).transform);
    await p.mouse.up();
    t.ok(encima === 'none', `[reducido] la flecha crece bajo el raton (${encima})`);
    t.ok(pulsada === 'none', `[reducido] la flecha se hunde al pulsarla (${pulsada})`);

    // Y agregar no suelta ningun "+1": el numero cambia sin mas.
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card:not([hidden]) .card-mas');
    const mas = p.locator('.product-card:not([hidden])').filter({ has: p.locator('.card-mas') }).first().locator('.card-mas');
    await mas.click();
    await mas.click();
    await espera(150);
    const golpes = await p.locator('.card-golpe').count();
    t.ok(golpes === 0, `[reducido] agregar solto ${golpes} "+1"`);
    await ctx.close();
  }

  await editorial(t);
}

// ---- El estilo editorial (seccion 10 del plan), en la computadora y en el
// telefono --------------------------------------------------------------------
const FECHA = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
const ES_FRAUNCES = /^"?Fraunces Variable/;

async function editorial(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre: `editorial-${nombre}` });
    const p = await ctx.newPage();
    // Lo que se pide fuera del sitio: la letra no puede venir de Google.
    const fuera = [];
    p.on('request', (r) => { if (!r.url().startsWith(t.REACT) && !r.url().startsWith('data:')) fuera.push(r.url()); });
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.periodico');
    await p.evaluate(() => document.fonts.ready);
    await espera(300);

    // Fraunces cargada, en los titulos de la portada; el texto, en Arial.
    const letra = await p.evaluate(() => ({
      cargada: [...document.fonts].some((f) => f.family.includes('Fraunces') && f.status === 'loaded'),
      h1: getComputedStyle(document.querySelector('h1')).fontFamily,
      h2: getComputedStyle(document.querySelector('#mas-pedidos-titulo')).fontFamily,
      texto: getComputedStyle(document.querySelector('.mostrador-dicho')).fontFamily,
    }));
    t.ok(letra.cargada, `[${nombre}] Fraunces no esta cargada`);
    t.ok(ES_FRAUNCES.test(letra.h1) && ES_FRAUNCES.test(letra.h2), `[${nombre}] los titulos de la portada van en ${letra.h1} / ${letra.h2}`);
    t.ok(/^Arial/.test(letra.texto), `[${nombre}] el texto corrido de la portada va en ${letra.texto}`);
    t.ok(!fuera.some((u) => /fonts\.(googleapis|gstatic)\.com/.test(u)), `[${nombre}] la letra se pidio fuera del sitio: ${fuera.join(', ')}`);

    // La cabecera de periodico: la fecha de hoy y si esta abierto. En el
    // telefono, solo esas dos cosas. La nota del horno ya no esta.
    const hoy = FECHA.format(new Date());
    const periodico = await p.evaluate(() => {
      const ve = (el) => Boolean(el) && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
      const c = document.querySelector('.periodico');
      return {
        fecha: c.querySelector('.periodico-fecha').textContent.trim(),
        fechaVe: ve(c.querySelector('.periodico-fecha')),
        estado: c.querySelector('.periodico-estado').textContent.trim(),
        estadoVe: ve(c.querySelector('.periodico-estado')),
        oficioVe: ve(c.querySelector('.periodico-oficio')),
        doblesVen: [...c.querySelectorAll('.periodico-doble')].filter(ve).length,
        nota: document.querySelectorAll('.hero-note').length,
        horneando: document.body.textContent.includes('Horneando ahora mismo'),
      };
    });
    t.ok(periodico.fecha.toLowerCase() === hoy.toLowerCase() && periodico.fecha[0] === periodico.fecha[0].toUpperCase(), `[${nombre}] la cabecera dice "${periodico.fecha}" y hoy es "${hoy}"`);
    t.ok(/^(Abierto · hasta las \d\d:\d\d|Cerrado · .+)$/.test(periodico.estado), `[${nombre}] el estado de la cabecera dice "${periodico.estado}"`);
    t.ok(periodico.fechaVe && periodico.estadoVe, `[${nombre}] no se ven la fecha y el estado en la cabecera de periodico`);
    if (nombre === 'escritorio') {
      t.ok(periodico.oficioVe && periodico.doblesVen === 2, `[${nombre}] la cabecera de periodico no lleva el oficio entre sus dos filetes`);
    } else {
      t.ok(!periodico.oficioVe && periodico.doblesVen === 0, `[${nombre}] en el telefono la cabecera de periodico ensena mas que la fecha y el estado`);
    }
    t.ok(periodico.nota === 0 && !periodico.horneando, `[${nombre}] la portada todavia lleva la nota "Horneando ahora mismo"`);

    // Los enlaces de letras sueltas conservan su nombre entero.
    for (const texto of ['Cómo llegar', 'Toda la tienda', 'Nuestros panes']) {
      const n = await p.getByRole('link', { name: texto, exact: true }).count();
      t.ok(n === 1, `[${nombre}] hay ${n} enlaces que se llamen "${texto}" para el lector`);
    }

    // La cinta: las tres categorias, cada una enlazada a su vista.
    const cinta = p.getByRole('navigation', { name: 'Comprar por categoría' });
    const enlaces = await cinta.getByRole('link').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    t.ok(JSON.stringify(enlaces) === JSON.stringify(['#/tienda-panes', '#/tienda-dulces', '#/tienda-bebidas-frias']), `[${nombre}] la cinta enlaza a ${enlaces.join(', ')}`);
    t.ok(await cinta.getByRole('link', { name: 'Dulces y pasteles', exact: true }).count() === 1, `[${nombre}] el enlace de la cinta no se llama "Dulces y pasteles"`);

    // Inicio, lo primero del menu de arriba (en el telefono, dentro del
    // menu), con aria-current solo en #/.
    const inicio = p.locator('#main-nav a[href="#/"]');
    const primero = await p.evaluate(() => document.querySelector('#main-nav a')?.getAttribute('href'));
    t.ok(await inicio.count() === 1 && (await inicio.textContent()).trim() === 'Inicio' && primero === '#/', `[${nombre}] el menu no empieza por Inicio (empieza por ${primero})`);
    t.ok(await inicio.getAttribute('aria-current') === 'page', `[${nombre}] Inicio no lleva aria-current en #/`);

    // Una ficha: esquinas rectas y borde fino horno.
    const ficha = await p.evaluate(() => {
      const c = getComputedStyle(document.querySelector('.mostrador .product-card'));
      return { radio: c.borderTopLeftRadius, borde: c.borderTopColor, ancho: c.borderTopWidth };
    });
    t.ok(ficha.radio === '0px' && ficha.borde === HORNO && ficha.ancho === '1px', `[${nombre}] la ficha no es de esquinas rectas con borde horno (${JSON.stringify(ficha)})`);

    // El control: el + solo, que al primer toque se estira en "− n +", y
    // cada toque suelta un "+1" escondido al lector; con prisa, varios.
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card:not([hidden]) .card-mas');
    const tarjeta = p.locator('.product-card:not([hidden])').filter({ has: p.locator('.card-mas') }).first();
    await tarjeta.scrollIntoViewIfNeeded();
    const cerrado = await tarjeta.locator('.card-cantidad').evaluate((c) => ({ lleno: c.classList.contains('is-lleno'), menos: c.querySelector('.card-menos').hidden }));
    t.ok(!cerrado.lleno && cerrado.menos, `[${nombre}] sin nada pedido el control no es el + solo`);
    const pulsar = (sel) => (nombre === 'movil' ? tarjeta.locator(sel).tap() : tarjeta.locator(sel).click());
    await pulsar('.card-mas');
    await espera(60);
    const abierto = await tarjeta.locator('.card-cantidad').evaluate((c) => ({
      lleno: c.classList.contains('is-lleno'),
      menos: !c.querySelector('.card-menos').hidden,
      numero: c.querySelector('.card-numero').value,
      estira: getComputedStyle(c, '::before').animationName,
      golpes: [...c.querySelectorAll('.card-golpe')].map((g) => g.textContent),
      escondido: c.querySelector('.card-golpes').getAttribute('aria-hidden'),
    }));
    t.ok(abierto.lleno && abierto.menos && abierto.numero === '1', `[${nombre}] tras el primer toque el control no es "− 1 +" (${JSON.stringify(abierto)})`);
    t.ok(abierto.estira === 'cantidad-estira', `[${nombre}] el control no se estira al abrirse (${abierto.estira})`);
    t.ok(abierto.golpes.includes('+1') && abierto.escondido === 'true', `[${nombre}] el toque no solto un "+1" escondido al lector (${JSON.stringify(abierto)})`);
    // Con prisa: dos toques seguidos, sin la espera que mete el navegador de
    // pruebas entre un toque y otro.
    await tarjeta.locator('.card-mas').evaluate((b) => { b.click(); b.click(); });
    const seguidos = await tarjeta.locator('.card-golpe').count();
    t.ok(seguidos >= 2, `[${nombre}] con prisa solo hay ${seguidos} "+1" a la vez`);
    await pulsar('.card-menos');
    const menos = await tarjeta.locator('.card-golpe').evaluateAll((gs) => gs.map((g) => g.textContent));
    t.ok(menos.includes('−1'), `[${nombre}] quitar uno no solto un "−1" (${menos.join(', ')})`);
    await espera(1100);
    t.ok(await tarjeta.locator('.card-golpe').count() === 0, `[${nombre}] los "+1" no se borran al acabar`);
    t.ok((await tarjeta.locator('.card-numero').inputValue()) === '2', `[${nombre}] tras tres + y un − el numero no dice 2`);

    // La cinta lleva a su categoria.
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.cinta');
    const dulces = p.getByRole('navigation', { name: 'Comprar por categoría' }).getByRole('link', { name: 'Dulces y pasteles', exact: true });
    if (nombre === 'movil') await dulces.tap(); else await dulces.click();
    await esperaQue(() => p.evaluate(() => location.hash === '#/tienda-dulces' && Boolean(document.querySelector('h1')?.textContent.includes('Dulces y pasteles'))));
    const llegada = await p.evaluate(() => ({ hash: location.hash, h1: document.querySelector('h1')?.textContent.trim() }));
    t.ok(llegada.hash === '#/tienda-dulces' && llegada.h1 === 'Dulces y pasteles', `[${nombre}] la cinta llevo a ${llegada.hash} ("${llegada.h1}")`);
    t.ok(await p.locator('#main-nav a[href="#/"]').getAttribute('aria-current') === null, `[${nombre}] Inicio sigue con aria-current fuera de #/`);
    await ctx.close();
  }
}
