// Lo de la revision visual del 21 de octubre de 2026 (secciones 4 y 10 del
// plan), en escritorio y en el telefono (390 px, tactil):
// - la barra de arriba es horno y opaca desde que carga, y sobre una banda
//   oscura gana la linea ambar;
// - el carrusel lleva las flechas y la barra de avance en el pie, debajo de
//   las fichas, sin la barra del navegador, y sin hueco entre nombre y precio;
// - el nombre de la ficha va en Georgia y los sellos con 11 px de letra o mas;
// - el h1 que recibe el foco al cambiar de vista no pinta recuadro;
// - los efectos de pasar por encima solo con raton (html.con-puntero);
// - en la computadora, Siguiente desplaza con movimiento de escena;
// - el anillo de la canasta se ve en la barra y flotando sobre lo claro;
// - una ficha agotada no se levanta, y con menos movimiento las flechas del
//   carrusel no cambian de tamano.
import { VENTANAS, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'barra horno opaca, carrusel con flechas en el pie, fichas, h1 sin recuadro, hover solo con raton, anillo de la canasta, agotadas y flechas con menos movimiento';
export const limite = 90;

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

    // Sobre la banda oscura del mostrador: sigue horno y gana la linea ambar.
    await p.evaluate(() => {
      const banda = document.querySelector('.mostrador');
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
    t.ok(/Georgia/.test(fila.letraNombre), `[${nombre}] el nombre de la ficha va en ${fila.letraNombre}`);
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
    await ctx.close();
  }
}
