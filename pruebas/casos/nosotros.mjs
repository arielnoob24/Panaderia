// #/nosotros con el estilo de la portada (seccion 10 del plan, "Nosotros con
// el estilo de la portada"), en escritorio y en el telefono (390 px, tactil):
// - la historia: rotulo con la espiga, h1 en Fraunces con la segunda linea
//   en cursiva corteza, la frase y "Conoce nuestro local" con el aspecto y
//   la ola de "Cómo llegar", que lleva a #/contacto;
// - en escritorio, la foto en arco a la izquierda del texto, con su pie, el
//   sello "Masa madre · Hecho despacio" (su texto sigue su propio aro) y el
//   parrafo de la madrugada en Arial; en el telefono, la foto pequena al
//   lado del titulo, sin sello ni pie, y sin el parrafo de la madrugada;
// - los principios sin banda oscura: tres en una lista (role="list"), con
//   N.º, icono y nombre en Fraunces, en una fila de tres separadas por la
//   estrella; su frase solo en escritorio;
// - todo en una sola pantalla, sin desplazarse, con la franja en el borde
//   de abajo, de 1440x900 a 360x640; con zoom o ventana muy baja (320x256,
//   640x360) crece y se desplaza sin cortar ni pisar nada (WCAG 1.4.10); el
//   alto que sobra se reparte parejo arriba, en medio y abajo;
// - los principios entran en la misma escena que la historia, sin esperar
//   al desplazamiento; con menos movimiento, todo visible y quieto;
// - la canasta flotante del telefono no tapa el enlace ni los principios;
// - el icono de cada principio se mueve con el raton encima, no con el dedo;
// - entre 681 y 900 px el sello no roza el texto.
import { VENTANAS, espera, esperaQue, hashDe } from '../arranque.mjs';

export const descripcion = 'Nosotros en una pantalla sin scroll: arco y sello (foto al lado del titulo en el telefono), Conoce nuestro local con la ola, principios en una fila que entran con la escena, crece sin cortar con zoom, quieto con menos movimiento';
export const limite = 150;

const ES_FRAUNCES = /^"?Fraunces Variable/;
const CORTEZA = 'rgb(168, 95, 69)';

// Lo que se ve de la historia y de los principios, en una sola lectura.
const mirar = (p) => p.evaluate(() => {
  const caja = (s) => document.querySelector(s)?.getBoundingClientRect();
  const estilo = (s) => getComputedStyle(document.querySelector(s));
  const seVe = (s) => Boolean(document.querySelector(s)?.getClientRects().length);
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
    madrugadaSeVe: seVe('.nosotros-madrugada'),
    enlaceClases: enlace?.className,
    enlaceHref: enlace?.getAttribute('href'),
    enlaceNombre: enlace?.querySelector('.sr-only')?.textContent,
    enlaceLetras: enlace?.querySelector('.letras')?.getAttribute('aria-hidden'),
    enlaceLetra: enlace && getComputedStyle(enlace).fontFamily,
    pie: document.querySelector('.nosotros-foto figcaption')?.textContent,
    pieSeVe: seVe('.nosotros-foto figcaption'),
    selloSeVe: seVe('.nosotros-sello'),
    selloTexto: camino?.textContent,
    selloOculto: sello?.getAttribute('aria-hidden'),
    aroEnSuSello: Boolean(aro && sello.contains(aro)),
    foto: caja('.nosotros-foto .arco'),
    texto: caja('.nosotros-texto'),
    titulo: caja('.nosotros-texto h1'),
    oscuras: vista.querySelectorAll('.banda-oscura, .fondo-principios').length,
    ultimo: vista.lastElementChild.className,
    rol: lista.getAttribute('role'),
    numeros: items.map((li) => li.querySelector('.principio-numero')?.textContent),
    numerosOcultos: items.every((li) => li.querySelector('.principio-numero')?.getAttribute('aria-hidden') === 'true'),
    numeroColor: estilo('.principio-numero').color,
    iconos: items.filter((li) => li.querySelector('svg.principio-icono')?.getClientRects().length).length,
    h3: items.map((li) => getComputedStyle(li.querySelector('h3')).fontFamily),
    frasesSeVen: items.filter((li) => li.querySelector('p').getClientRects().length).length,
    columnas: getComputedStyle(lista).gridTemplateColumns.split(' ').length,
    estrella: getComputedStyle(items[1], '::before').content,
    marcas: vista.querySelectorAll('[data-aparece]').length,
  };
});

// Como estan los principios: opacidad de cada columna y las lineas.
const principios = (p) => p.evaluate(() => {
  const zona = document.querySelector('.nosotros-principios');
  return {
    opacidades: [...zona.querySelectorAll('.principio')].map((li) => Number(getComputedStyle(li).opacity)),
    lineas: [...zona.querySelectorAll('.linea-doble')].map((l) => getComputedStyle(l).transform),
  };
});
const todoVisible = (a) => a.opacidades.every((o) => o === 1) && a.lineas.every((x) => x === 'none' || x === 'matrix(1, 0, 0, 1, 0, 0)');

// Si la vista cabe en la ventana, si la franja llega al borde y si algo se
// corta o se pisa: lo que se lee no se sale de su caja ni de la ventana a lo
// ancho, y cada bloque empieza donde acaba el anterior.
const medir = (p) => p.evaluate(() => {
  const ancho = window.innerWidth;
  const r = (s) => document.querySelector(s).getBoundingClientRect();
  const textos = [...document.querySelectorAll('.vista-nosotros :is(.rotulo-espiga, h1, .frase, .nosotros-madrugada, .nosotros-llegar, h2, .principio-numero, h3, .principio p, figcaption)')]
    .filter((e) => e.getClientRects().length);
  const cortados = textos.filter((e) => {
    const c = e.getBoundingClientRect();
    return e.scrollWidth > e.clientWidth + 1 || c.left < -1 || c.right > ancho + 1;
  }).map((e) => e.className || e.tagName);
  const historia = r('.nosotros-historia');
  const lista = r('.principios');
  const cabeza = r('.principios-cabeza');
  const franja = r('.vista-nosotros .franja-pie');
  const rejilla = r('.nosotros-rejilla');
  const cabecera = r('.site-header');
  return {
    // El aire que sobra: encima de la historia, entre ella y los principios,
    // y entre los principios y la curva de la franja.
    huecos: [rejilla.top - cabecera.bottom, cabeza.top - rejilla.bottom, franja.top - 22 - lista.bottom].map(Math.round),
    alto: document.documentElement.scrollHeight,
    ventana: window.innerHeight,
    anchoPagina: document.documentElement.scrollWidth,
    ancho,
    franjaAbajo: Math.round(franja.bottom + window.scrollY),
    cortados,
    // La curva de la franja sube 22 px: lo de encima tiene que acabar antes.
    pisa: historia.bottom > cabeza.top + 1 || lista.bottom > franja.top - 22 + 1,
  };
});

export default async function nosotros(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/nosotros');
    await p.waitForSelector('.nosotros-texto h1');

    // Los principios entran con la escena: al abrir todavia no se ven, y al
    // poco, sin desplazarse, ya si.
    const alAbrir = await principios(p);
    t.ok(alAbrir.opacidades.some((o) => o < 1), `[${nombre}] los principios no entran con la escena (${JSON.stringify(alAbrir)})`);
    await esperaQue(async () => todoVisible(await principios(p)), 40);
    t.ok(todoVisible(await principios(p)), `[${nombre}] los principios no acaban a la vista sin desplazarse (${JSON.stringify(await principios(p))})`);

    const m = await mirar(p);
    t.ok(m.marcas === 0, `[${nombre}] queda una marca data-aparece del observador`);
    t.ok(m.rotulo === 'Nuestra historia' && m.espiga, `[${nombre}] falta el rotulo con la espiga ("${m.rotulo}")`);
    t.ok(m.h1 === 'El tiempo es nuestro ingrediente' && ES_FRAUNCES.test(m.h1Letra), `[${nombre}] el h1 no es el de la portada ("${m.h1}", ${m.h1Letra})`);
    t.ok(m.emColor === CORTEZA && m.emCursiva === 'italic', `[${nombre}] la segunda linea del h1 no va en cursiva corteza (${m.emColor}, ${m.emCursiva})`);
    t.ok(m.frase === 'italic', `[${nombre}] la frase no va en cursiva`);
    t.ok(/\benlace-llegar\b/.test(m.enlaceClases) && m.enlaceHref === '#/contacto' && m.enlaceNombre === 'Conoce nuestro local' && m.enlaceLetras === 'true' && ES_FRAUNCES.test(m.enlaceLetra), `[${nombre}] "Conoce nuestro local" no es como "Cómo llegar" (${JSON.stringify([m.enlaceClases, m.enlaceHref, m.enlaceNombre, m.enlaceLetras, m.enlaceLetra])})`);
    t.ok(m.selloTexto?.startsWith('Masa madre · Hecho despacio') && m.selloOculto === 'true' && m.aroEnSuSello, `[${nombre}] el sello no dice lo suyo o su texto sigue otro aro (${JSON.stringify([m.selloTexto, m.selloOculto, m.aroEnSuSello])})`);
    if (nombre === 'escritorio') {
      t.ok(m.foto.right <= m.texto.left, `[${nombre}] la foto no va a la izquierda del texto (${Math.round(m.foto.right)} > ${Math.round(m.texto.left)})`);
      t.ok(m.pieSeVe && m.pie === 'Despacio sabe mejor' && m.selloSeVe, `[${nombre}] falta el pie ("${m.pie}") o el sello de la foto`);
      t.ok(m.madrugadaSeVe && /^Arial/.test(m.madrugada) && !m.madrugada.includes('Georgia'), `[${nombre}] el parrafo de la madrugada no se ve o va en ${m.madrugada}`);
      t.ok(m.frasesSeVen === 3, `[${nombre}] en escritorio se ven ${m.frasesSeVen} frases de los principios`);
    } else {
      const alLado = m.foto.left >= m.titulo.left + 40 && m.foto.top < m.titulo.bottom && m.foto.bottom > m.titulo.top;
      t.ok(alLado, `[${nombre}] la foto no va al lado del titulo (foto ${JSON.stringify([m.foto.left, m.foto.top, m.foto.bottom].map(Math.round))}, h1 ${JSON.stringify([m.titulo.left, m.titulo.top, m.titulo.bottom].map(Math.round))})`);
      t.ok(!m.pieSeVe && !m.selloSeVe && !m.madrugadaSeVe, `[${nombre}] en el telefono siguen el pie, el sello o el parrafo de la madrugada`);
      t.ok(m.frasesSeVen === 0, `[${nombre}] en el telefono se ven ${m.frasesSeVen} frases de los principios`);
    }
    t.ok(m.oscuras === 0, `[${nombre}] Nosotros todavia lleva banda oscura o el fondo de los principios`);
    t.ok(/\bfranja-pie\b/.test(m.ultimo), `[${nombre}] Nosotros no termina en la franja (${m.ultimo})`);
    t.ok(m.rol === 'list', `[${nombre}] la lista de principios no lleva role="list" (${m.rol})`);
    t.ok(m.numeros.join() === 'N.º 1,N.º 2,N.º 3' && m.numerosOcultos, `[${nombre}] los numeros de los principios son ${JSON.stringify(m.numeros)}`);
    t.ok(m.numeroColor === 'rgb(122, 64, 48)', `[${nombre}] el numero no va en corteza oscura (${m.numeroColor})`);
    t.ok(m.iconos === 3 && m.h3.every((f) => ES_FRAUNCES.test(f)), `[${nombre}] a los principios les falta el icono o el nombre en Fraunces`);
    t.ok(m.columnas === 3, `[${nombre}] los principios van en ${m.columnas} columnas`);
    t.ok(m.estrella.includes('✦'), `[${nombre}] no hay estrella entre los principios (${m.estrella})`);

    const d = await medir(p);
    t.ok(d.alto <= d.ventana && d.franjaAbajo === d.ventana, `[${nombre}] Nosotros no cabe en la pantalla o la franja no llega al borde (${JSON.stringify(d)})`);

    if (nombre === 'escritorio') {
      // El icono se mueve con el raton encima.
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
      // La canasta flotante no tapa el enlace ni los principios.
      const tapa = await p.evaluate(() => {
        const f = document.querySelector('.floating-whatsapp.is-canasta').getBoundingClientRect();
        return [...document.querySelectorAll('.nosotros-llegar, .principio-numero, .principio-icono, .principio h3')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return Math.min(r.right, f.right) > Math.max(r.left, f.left) && Math.min(r.bottom, f.bottom) > Math.max(r.top, f.top);
          }).map((e) => e.className.baseVal ?? (e.className || e.tagName));
      });
      t.ok(tapa.length === 0, `[${nombre}] la canasta flotante tapa ${tapa.join(', ')}`);
      // Con el dedo no queda el movimiento del raton.
      await p.tap('.principio-masa h3');
      const masa = await p.evaluate(() => ({
        puntero: document.documentElement.classList.contains('con-puntero'),
        anima: getComputedStyle(document.querySelector('.principio-masa .principio-icono')).animationName,
      }));
      t.ok(!masa.puntero && masa.anima === 'none', `[${nombre}] tocar un principio con el dedo le deja el movimiento del raton (${JSON.stringify(masa)})`);
    }

    // "Conoce nuestro local" lleva a #/contacto.
    if (nombre === 'movil') await p.tap('.nosotros-llegar');
    else await p.click('.nosotros-llegar');
    await esperaQue(async () => (await hashDe(p)) === '#/contacto');
    t.ok((await hashDe(p)) === '#/contacto', `[${nombre}] "Conoce nuestro local" no lleva a #/contacto (${await hashDe(p)})`);
    await ctx.close();
  }

  // En una pantalla sin desplazarse en los tamanos de siempre; con zoom o
  // una ventana muy baja, crece sin cortar ni pisar nada.
  {
    const ctx = await t.contexto({ ...VENTANAS.escritorio, reducedMotion: 'reduce' }, { nombre: 'alturas' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/nosotros');
    await p.waitForSelector('.principios > li');
    const caben = [[1440, 900], [1366, 768], [1280, 720], [900, 1000], [768, 1024], [390, 844], [390, 700], [375, 667], [360, 640]];
    for (const [ancho, alto] of caben) {
      await p.setViewportSize({ width: ancho, height: alto });
      await espera(150);
      const d = await medir(p);
      t.ok(d.alto <= d.ventana && d.franjaAbajo === d.ventana, `[${ancho}x${alto}] Nosotros no cabe sin desplazarse (${d.alto} de ${d.ventana}, franja hasta ${d.franjaAbajo})`);
      t.ok(d.cortados.length === 0 && !d.pisa && d.anchoPagina <= d.ancho, `[${ancho}x${alto}] algo se corta o se pisa (${JSON.stringify(d)})`);
      // El alto que sobra se reparte parejo: ningun hueco le saca mas de 30 px a otro.
      t.ok(Math.max(...d.huecos) - Math.min(...d.huecos) <= 30, `[${ancho}x${alto}] el aire no se reparte parejo (${d.huecos.join(', ')} px)`);
    }
    for (const [ancho, alto] of [[320, 256], [640, 360]]) {
      await p.setViewportSize({ width: ancho, height: alto });
      await espera(150);
      const d = await medir(p);
      t.ok(d.cortados.length === 0 && !d.pisa && d.anchoPagina <= d.ancho, `[${ancho}x${alto}] con poca altura algo se corta o se pisa (${JSON.stringify(d)})`);
      t.ok(d.alto > d.ventana, `[${ancho}x${alto}] con poca altura la vista no crece (${d.alto} de ${d.ventana})`);
    }
    // Entre 681 y 900 px el sello no roza el texto.
    for (const ancho of [681, 700, 750, 900]) {
      await p.setViewportSize({ width: ancho, height: 900 });
      await espera(150);
      const aire = await p.evaluate(() => {
        const texto = [...document.querySelectorAll('.nosotros-texto > *')].map((e) => e.getBoundingClientRect().left);
        return Math.round(Math.min(...texto) - document.querySelector('.nosotros-sello').getBoundingClientRect().right);
      });
      t.ok(aire >= 8, `[${ancho} px] el sello queda a ${aire} px del texto`);
    }
    await ctx.close();
  }

  // La portada sigue con su sello, que sigue su propio aro.
  {
    const ctx = await t.contexto(VENTANAS.escritorio, { nombre: 'portada' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/');
    await p.waitForSelector('.portada-sello textPath');
    const portada = await p.evaluate(() => {
      const sello = document.querySelector('.portada-sello');
      const camino = sello.querySelector('textPath');
      const aro = document.getElementById(camino.getAttribute('href').slice(1));
      return { texto: camino.textContent, propio: Boolean(aro && sello.contains(aro)) };
    });
    t.ok(portada.texto.startsWith('Hecho a mano · Pan de la casa') && portada.propio, `[portada] el sello de la portada cambio (${JSON.stringify(portada)})`);
    await ctx.close();
  }

  // Con menos movimiento: todo a la vista y quieto desde el principio.
  for (const [nombre, ventana] of [['quieto-escritorio', VENTANAS.escritorio], ['quieto-movil', VENTANAS.movil]]) {
    const ctx = await t.contexto({ ...ventana, reducedMotion: 'reduce' }, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/nosotros');
    await p.waitForSelector('.principios > li');
    const a = await principios(p);
    const quieto = await p.evaluate(() => [
      getComputedStyle(document.querySelector('.nosotros-sello')).animationName,
      getComputedStyle(document.querySelector('.nosotros-texto > h1')).animationName,
      getComputedStyle(document.querySelector('.principio')).animationName,
      getComputedStyle(document.querySelector('.nosotros-principios .linea-doble')).animationName,
    ]);
    t.ok(todoVisible(a), `[${nombre}] con menos movimiento los principios no estan a la vista desde el principio (${JSON.stringify(a)})`);
    t.ok(quieto.every((x) => x === 'none'), `[${nombre}] con menos movimiento algo se mueve al entrar (${quieto})`);
    await ctx.close();
  }
}
