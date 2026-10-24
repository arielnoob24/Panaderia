// #/nosotros con el estilo de la portada (seccion 10 del plan, "Nosotros con
// el estilo de la portada"), en escritorio y en el telefono (390 px, tactil):
// - la historia: rotulo con la espiga, h1 en Fraunces con la segunda linea
//   en cursiva corteza, la frase, el parrafo de la madrugada en Arial y
//   "Conoce nuestro local" con el aspecto y la ola de "Cómo llegar", que
//   lleva a #/contacto;
// - la foto en arco a la izquierda del texto (debajo en el telefono), con su
//   pie y el sello "Masa madre · Hecho despacio", cuyo texto sigue su propio
//   aro (el id no choca con el de la portada);
// - los principios sin banda oscura: tres en una lista, con N.º, icono y
//   nombre en Fraunces, en tres columnas (una en el telefono) separadas por
//   la estrella;
// - aparecen al llegar a ellos: escondidos solo con la marca del JS, y a la
//   vista despues de bajar; si se ven al abrir, entran con la escena;
// - con menos movimiento, todo visible y quieto desde el principio;
// - el icono de cada principio se mueve con el raton encima, no con el dedo.
// - entre 681 y 900 px el sello no roza el texto; la lista lleva role="list";
//   al imprimir sin haber bajado, los principios salen a la vista.
import { VENTANAS, espera, esperaQue, hashDe } from '../arranque.mjs';

export const descripcion = 'Nosotros con el estilo de la portada: arco a la izquierda, sello propio, Conoce nuestro local con la ola, principios entre lineas dobles que aparecen al llegar, quietos con menos movimiento';
export const limite = 120;

const ES_FRAUNCES = /^"?Fraunces Variable/;
const CORTEZA = 'rgb(168, 95, 69)';

// Lo que se ve de la historia y de los principios, en una sola lectura.
const mirar = (p) => p.evaluate(() => {
  const caja = (s) => document.querySelector(s)?.getBoundingClientRect();
  const estilo = (s) => getComputedStyle(document.querySelector(s));
  const vista = document.querySelector('.vista-nosotros');
  const enlace = document.querySelector('.nosotros-llegar');
  const sello = document.querySelector('.nosotros-sello');
  const camino = sello?.querySelector('textPath');
  const aro = camino && document.getElementById(camino.getAttribute('href').slice(1));
  const lista = document.querySelector('ol.principios');
  const items = [...lista.children];
  return {
    rotulo: document.querySelector('.nosotros-texto .rotulo-espiga')?.textContent.trim(),
    espiga: Boolean(document.querySelector('.nosotros-texto .rotulo-espiga svg')),
    h1: document.querySelector('.nosotros-texto h1').textContent.replace(/\s+/g, ' ').trim(),
    h1Letra: estilo('.nosotros-texto h1').fontFamily,
    emColor: estilo('.nosotros-texto h1 em').color,
    emCursiva: estilo('.nosotros-texto h1 em').fontStyle,
    frase: estilo('.nosotros-texto .frase').fontStyle,
    madrugada: estilo('.nosotros-madrugada').fontFamily,
    enlaceClases: enlace?.className,
    enlaceHref: enlace?.getAttribute('href'),
    enlaceNombre: enlace?.querySelector('.sr-only')?.textContent,
    enlaceLetras: enlace?.querySelector('.letras')?.getAttribute('aria-hidden'),
    enlaceLetra: enlace && getComputedStyle(enlace).fontFamily,
    pie: document.querySelector('.nosotros-foto figcaption')?.textContent,
    selloTexto: camino?.textContent,
    selloOculto: sello?.getAttribute('aria-hidden'),
    aroEnSuSello: Boolean(aro && sello.contains(aro)),
    foto: caja('.nosotros-foto .arco'),
    texto: caja('.nosotros-texto'),
    oscuras: vista.querySelectorAll('.banda-oscura, .fondo-principios').length,
    ultimo: vista.lastElementChild.className,
    numeros: items.map((li) => li.querySelector('.principio-numero')?.textContent),
    numerosOcultos: items.every((li) => li.querySelector('.principio-numero')?.getAttribute('aria-hidden') === 'true'),
    numeroColor: estilo('.principio-numero').color,
    iconos: items.filter((li) => li.querySelector('svg.principio-icono')).length,
    h3: items.map((li) => getComputedStyle(li.querySelector('h3')).fontFamily),
    columnas: getComputedStyle(lista).gridTemplateColumns.split(' ').length,
    estrella: getComputedStyle(items[1], '::before').content,
  };
});

// En que punto esta la aparicion de los principios.
const aparicion = (p) => p.evaluate(() => {
  const zona = document.querySelector('.nosotros-principios');
  return {
    marca: zona.getAttribute('data-aparece'),
    opacidades: [...zona.querySelectorAll('.principio')].map((li) => Number(getComputedStyle(li).opacity)),
    lineas: [...zona.querySelectorAll('.linea-doble')].map((l) => getComputedStyle(l).transform),
  };
});
const todoVisible = (a) => a.opacidades.every((o) => o === 1) && a.lineas.every((x) => x === 'none' || x === 'matrix(1, 0, 0, 1, 0, 0)');

export default async function nosotros(t) {
  // Escritorio bajo (los principios quedan por debajo al abrir) y telefono.
  const ventanas = [
    ['escritorio', { ...VENTANAS.escritorio, viewport: { width: 1280, height: 700 } }],
    ['movil', VENTANAS.movil],
  ];
  for (const [nombre, ventana] of ventanas) {
    const ctx = await t.contexto(ventana, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/nosotros');
    await p.waitForSelector('.nosotros-texto h1');
    await espera(300);

    // Antes de bajar: escondidos porque el JS lo marco.
    const antes = await aparicion(p);
    t.ok(antes.marca === 'espera' && antes.opacidades.every((o) => o === 0), `[${nombre}] los principios no esperan escondidos a que se llegue a ellos (${JSON.stringify(antes)})`);

    const m = await mirar(p);
    t.ok(m.rotulo === 'Nuestra historia' && m.espiga, `[${nombre}] falta el rotulo con la espiga ("${m.rotulo}")`);
    t.ok(m.h1 === 'El tiempo es nuestro ingrediente' && ES_FRAUNCES.test(m.h1Letra), `[${nombre}] el h1 no es el de la portada ("${m.h1}", ${m.h1Letra})`);
    t.ok(m.emColor === CORTEZA && m.emCursiva === 'italic', `[${nombre}] la segunda linea del h1 no va en cursiva corteza (${m.emColor}, ${m.emCursiva})`);
    t.ok(m.frase === 'italic', `[${nombre}] la frase no va en cursiva`);
    t.ok(/^Arial/.test(m.madrugada) && !m.madrugada.includes('Georgia'), `[${nombre}] el parrafo de la madrugada va en ${m.madrugada}`);
    t.ok(/\benlace-llegar\b/.test(m.enlaceClases) && m.enlaceHref === '#/contacto' && m.enlaceNombre === 'Conoce nuestro local' && m.enlaceLetras === 'true' && ES_FRAUNCES.test(m.enlaceLetra), `[${nombre}] "Conoce nuestro local" no es como "Cómo llegar" (${JSON.stringify([m.enlaceClases, m.enlaceHref, m.enlaceNombre, m.enlaceLetras, m.enlaceLetra])})`);
    t.ok(m.pie === 'Despacio sabe mejor', `[${nombre}] el pie de la foto dice "${m.pie}"`);
    t.ok(m.selloTexto?.startsWith('Masa madre · Hecho despacio') && m.selloOculto === 'true' && m.aroEnSuSello, `[${nombre}] el sello no dice lo suyo o su texto sigue otro aro (${JSON.stringify([m.selloTexto, m.selloOculto, m.aroEnSuSello])})`);
    if (nombre === 'escritorio') {
      t.ok(m.foto.right <= m.texto.left, `[${nombre}] la foto no va a la izquierda del texto (${Math.round(m.foto.right)} > ${Math.round(m.texto.left)})`);
    } else {
      t.ok(m.foto.top >= m.texto.bottom, `[${nombre}] en el telefono la foto no va debajo del texto`);
    }
    t.ok(m.oscuras === 0, `[${nombre}] Nosotros todavia lleva banda oscura o el fondo de los principios`);
    t.ok(/\bfranja-pie\b/.test(m.ultimo), `[${nombre}] Nosotros no termina en la franja (${m.ultimo})`);
    t.ok(m.numeros.join() === 'N.º 1,N.º 2,N.º 3' && m.numerosOcultos, `[${nombre}] los numeros de los principios son ${JSON.stringify(m.numeros)}`);
    t.ok(m.numeroColor === 'rgb(122, 64, 48)', `[${nombre}] el numero no va en corteza oscura (${m.numeroColor})`);
    t.ok(m.iconos === 3 && m.h3.every((f) => ES_FRAUNCES.test(f)), `[${nombre}] a los principios les falta el icono o el nombre en Fraunces`);
    t.ok(m.columnas === (nombre === 'escritorio' ? 3 : 1), `[${nombre}] los principios van en ${m.columnas} columnas`);
    t.ok(m.estrella.includes('✦'), `[${nombre}] no hay estrella entre los principios (${m.estrella})`);

    // Al bajar hasta ellos, aparecen.
    await p.evaluate(() => document.querySelector('.nosotros-principios').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await esperaQue(async () => todoVisible(await aparicion(p)), 40);
    const despues = await aparicion(p);
    t.ok(despues.marca === 'ya' && todoVisible(despues), `[${nombre}] al llegar a los principios no aparecen (${JSON.stringify(despues)})`);

    // El icono se mueve con el raton encima; con el dedo, no.
    if (nombre === 'escritorio') {
      await p.mouse.move(20, 300);
      await p.mouse.move(24, 304);
      await p.hover('.principio-masa');
      const masa = await p.evaluate(() => getComputedStyle(document.querySelector('.principio-masa .principio-icono')).animationName);
      await p.hover('.principio-tiempo');
      const aguja = await p.evaluate(() => getComputedStyle(document.querySelector('.principio-aguja')).animationName);
      await p.hover('.principio-origen');
      const espiga = await p.evaluate(() => getComputedStyle(document.querySelector('.principio-origen .principio-icono')).animationName);
      t.ok(masa === 'salta-galleta' && aguja === 'da-la-vuelta' && espiga === 'baila-botella', `[${nombre}] los iconos de los principios no se mueven con el raton (${masa}, ${aguja}, ${espiga})`);
    } else {
      await p.tap('.principio-masa h3');
      const masa = await p.evaluate(() => ({
        puntero: document.documentElement.classList.contains('con-puntero'),
        anima: getComputedStyle(document.querySelector('.principio-masa .principio-icono')).animationName,
      }));
      t.ok(!masa.puntero && masa.anima === 'none', `[${nombre}] tocar un principio con el dedo le deja el movimiento del raton (${JSON.stringify(masa)})`);
    }

    // "Conoce nuestro local" lleva a #/contacto.
    await p.evaluate(() => window.scrollTo(0, 0));
    await espera(200);
    if (nombre === 'movil') await p.tap('.nosotros-llegar');
    else await p.click('.nosotros-llegar');
    await esperaQue(async () => (await hashDe(p)) === '#/contacto');
    t.ok((await hashDe(p)) === '#/contacto', `[${nombre}] "Conoce nuestro local" no lleva a #/contacto (${await hashDe(p)})`);
    await ctx.close();
  }

  // Si ya se ven al abrir, entran con la escena de arriba (y acaban a la vista).
  {
    const ctx = await t.contexto({ ...VENTANAS.escritorio, viewport: { width: 1440, height: 1100 } }, { nombre: 'escena' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/nosotros');
    await p.waitForSelector('.nosotros-principios[data-aparece]');
    await esperaQue(async () => todoVisible(await aparicion(p)), 40);
    const a = await aparicion(p);
    t.ok(a.marca === 'escena' && todoVisible(a), `[escena] con los principios a la vista al abrir no entran con la escena (${JSON.stringify(a)})`);
    // La portada sigue con su sello, que sigue su propio aro.
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.portada-sello textPath');
    const portada = await p.evaluate(() => {
      const sello = document.querySelector('.portada-sello');
      const camino = sello.querySelector('textPath');
      const aro = document.getElementById(camino.getAttribute('href').slice(1));
      return { texto: camino.textContent, propio: Boolean(aro && sello.contains(aro)) };
    });
    t.ok(portada.texto.startsWith('Hecho a mano · Pan de la casa') && portada.propio, `[escena] el sello de la portada cambio (${JSON.stringify(portada)})`);
    await ctx.close();
  }

  // Entre 681 y 900 px el sello no roza el texto, y la lista sigue siendo
  // lista (role="list": Safari quita el rol con list-style: none).
  {
    const ctx = await t.contexto({ ...VENTANAS.escritorio, viewport: { width: 681, height: 800 } }, { nombre: 'sello-681' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/nosotros');
    await p.waitForSelector('.nosotros-sello');
    for (const ancho of [681, 700, 750, 900]) {
      await p.setViewportSize({ width: ancho, height: 800 });
      await espera(150);
      const aire = await p.evaluate(() => {
        const texto = [...document.querySelectorAll('.nosotros-texto > *')].map((e) => e.getBoundingClientRect().left);
        return Math.round(Math.min(...texto) - document.querySelector('.nosotros-sello').getBoundingClientRect().right);
      });
      t.ok(aire >= 8, `[${ancho} px] el sello queda a ${aire} px del texto`);
    }
    const rol = await p.evaluate(() => document.querySelector('ol.principios').getAttribute('role'));
    t.ok(rol === 'list', `la lista de principios no lleva role="list" (${rol})`);

    // Al imprimir sin haber bajado, los principios salen a la vista.
    await p.setViewportSize({ width: 1280, height: 600 });
    await p.goto(t.REACT + '#/');
    await p.goto(t.REACT + '#/nosotros');
    await p.waitForSelector('.nosotros-principios[data-aparece="espera"]');
    await p.emulateMedia({ media: 'print' });
    const impresa = await aparicion(p);
    t.ok(todoVisible(impresa), `al imprimir sin bajar, los principios salen vacios (${JSON.stringify(impresa)})`);
    await ctx.close();
  }

  // Con menos movimiento: sin marca, todo a la vista y quieto desde el principio.
  for (const [nombre, ventana] of [['quieto-escritorio', { ...VENTANAS.escritorio, viewport: { width: 1280, height: 700 } }], ['quieto-movil', VENTANAS.movil]]) {
    const ctx = await t.contexto({ ...ventana, reducedMotion: 'reduce' }, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/nosotros');
    await p.waitForSelector('.principios > li');
    await espera(100);
    const a = await aparicion(p);
    const quieto = await p.evaluate(() => [
      getComputedStyle(document.querySelector('.nosotros-sello')).animationName,
      getComputedStyle(document.querySelector('.nosotros-texto > h1')).animationName,
    ]);
    t.ok(a.marca === null && todoVisible(a), `[${nombre}] con menos movimiento los principios no estan a la vista desde el principio (${JSON.stringify(a)})`);
    t.ok(quieto.every((x) => x === 'none'), `[${nombre}] con menos movimiento la historia se mueve al entrar (${quieto})`);
    await ctx.close();
  }
}
