// La cabeza de la tienda con el estilo de la portada (seccion 10 del plan,
// "La tienda con el estilo de la portada"), en escritorio y en el telefono
// (390 px, tactil):
// - sin la tarjeta oscura: sobre la masa, y la barra de arriba no gana la
//   linea ambar al pasar por encima;
// - sin "Volver al inicio" (quitado el 25 de octubre de 2026; lo mira
//   tienda-mandos.mjs); el rotulo "Nuestra vitrina" con la espiga; el h1 en
//   Fraunces a la izquierda y la frase en cursiva de cada vista;
// - "Filtrar por" como la cinta: radios con su nombre de siempre, Fraunces
//   cursiva, el icono de cada categoria (Todas sin), estrellas de adorno,
//   la elegida en pastilla horno con texto papel, las flechas cambian de
//   categoria y el foco se ve en la etiqueta; en el telefono no se sale;
// - los mandos entre lineas dobles, buscador papel, Ordenar por solo texto con linea, rotulos en versalitas y
//   "Mostrando X de Y" en versalitas horno; el aviso del catalogo
//   sigue;
// - la escena entra al llegar y no se repite al cambiar de categoria; con
//   menos movimiento todo quieto;
// - objetivos de 24 px o mas, la canasta flotante no tapa la cabeza, y con
//   el espaciado de texto de WCAG 1.4.12 a 320 px nada se sale.
import { VENTANAS, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'Tienda como la portada: cabeza sobre la masa sin banda oscura, rotulo, h1 y frase por categoria, Filtrar por como la cinta (radios, flechas, pastilla horno), mandos entre lineas dobles, escena que no se repite al cambiar de categoria';
export const limite = 150;

const ES_FRAUNCES = /^"?Fraunces Variable/;
const HORNO = 'rgb(58, 40, 34)';
const PAPEL = 'rgb(255, 253, 248)';
const CORTEZA_OSCURA = 'rgb(58, 40, 34)'; // horno
const VISTAS = [
  ['tienda-catalogo', 'todas', 'Todo el catálogo', 'Panes, dulces y bebidas de la casa.'],
  ['tienda-panes', 'panes', 'Panes', 'Lo que sale del horno cada mañana.'],
  ['tienda-dulces', 'dulces', 'Dulces y pasteles', 'Para endulzar la tarde.'],
  ['tienda-bebidas-frias', 'bebidas-frias', 'Bebidas', 'Para acompañar el pan.'],
];

const mirar = (p) => p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const cabeza = q('.vista-cabeza');
  const rotulo = q('.tienda-texto .rotulo-espiga');
  const h1 = q('.tienda-texto h1');
  const grupo = q('.vista-chips');
  const etiquetas = [...grupo.querySelectorAll('.chip')];
  const elegida = q('.chip-input:checked + .chip');
  const barra = q('.vista-barra');
  const mando = q('.vista-mando > span:not(.sr-only)');
  const cuenta = q('.vista-cuenta');
  return {
    oscuras: document.querySelectorAll('.vista-tienda .banda-oscura').length,
    fondo: getComputedStyle(cabeza).backgroundColor,
    rotulo: [q('.tienda-texto .rotulo-espiga')?.textContent.trim(), Boolean(q('.tienda-texto .rotulo-espiga svg'))],
    h1: h1.textContent,
    h1Letra: getComputedStyle(h1).fontFamily,
    h1Izquierda: Math.abs(h1.getBoundingClientRect().left - rotulo.getBoundingClientRect().left) <= 2 && getComputedStyle(h1).textAlign !== 'center',
    frase: [q('.tienda-frase').textContent, getComputedStyle(q('.tienda-frase')).fontStyle],
    rol: grupo.getAttribute('role'),
    rotuloFiltro: [q('#vista-sub-rotulo').textContent, getComputedStyle(q('#vista-sub-rotulo')).textTransform],
    etiquetas: etiquetas.map((e) => ({
      icono: Boolean(e.querySelector('svg')),
      letra: getComputedStyle(e).fontFamily,
      cursiva: getComputedStyle(e).fontStyle,
      ola: e.querySelector('.letras')?.getAttribute('aria-hidden'),
      alto: Math.round(e.getBoundingClientRect().height),
      derecha: e.getBoundingClientRect().right,
    })),
    estrellas: [...grupo.querySelectorAll('.chip-estrella')].map((e) => e.getAttribute('aria-hidden')),
    elegida: elegida && [getComputedStyle(elegida.querySelector(':scope > .chip-pastilla') || elegida).backgroundColor, getComputedStyle(elegida).color, document.querySelectorAll('.vista-chips .chip-pastilla').length],
    lineas: barra.querySelectorAll('.linea-doble').length,
    campos: [...document.querySelectorAll('.vista-buscar input')].map((c) => getComputedStyle(c).backgroundColor),
    ordenBoton: (() => { const s = getComputedStyle(document.querySelector('.orden-boton')); return [s.backgroundColor, s.borderTopWidth, s.borderBottomWidth, s.borderBottomColor]; })(),
    mando: [getComputedStyle(mando).textTransform, getComputedStyle(mando).color],
    cuenta: [cuenta.textContent, getComputedStyle(cuenta).textTransform, getComputedStyle(cuenta).color],
    aviso: q('.catalog-status')?.getAttribute('aria-live'),
    anchoPagina: document.documentElement.scrollWidth,
    ancho: window.innerWidth,
  };
});

// Las animaciones que corren en la cabeza (la escena).
const animando = (p) => p.evaluate(() => [...document.querySelectorAll('.tienda-texto > *, .vista-barra, .vista-barra .linea-doble, .vista-cuenta')]
  .flatMap((e) => e.getAnimations()).filter((a) => a.playState === 'running').length);

export default async function tienda(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.tienda-texto h1');

    // La escena entra al llegar y acaba.
    t.ok((await animando(p)) > 0, `[${nombre}] la cabeza de la tienda no entra con su escena`);
    await esperaQue(async () => (await animando(p)) === 0, 40);
    t.ok((await animando(p)) === 0, `[${nombre}] la escena no acaba`);

    const m = await mirar(p);
    t.ok(m.oscuras === 0 && m.fondo === 'rgba(0, 0, 0, 0)', `[${nombre}] la cabeza sigue en la tarjeta oscura (${m.oscuras}, ${m.fondo})`);
    t.ok(m.rotulo[0] === 'Nuestra vitrina' && m.rotulo[1], `[${nombre}] falta el rotulo con la espiga (${m.rotulo})`);
    t.ok(m.h1 === 'Todo el catálogo' && ES_FRAUNCES.test(m.h1Letra) && m.h1Izquierda, `[${nombre}] el h1 no va en Fraunces a la izquierda ("${m.h1}", ${m.h1Letra})`);
    t.ok(m.rol === 'radiogroup' && m.rotuloFiltro[0] === 'Filtrar por' && m.rotuloFiltro[1] === 'uppercase', `[${nombre}] "Filtrar por" cambio (${m.rol}, ${m.rotuloFiltro})`);
    for (const nombreRadio of ['Todas', 'Panes', 'Dulces y pasteles', 'Bebidas']) {
      const n = await p.getByRole('radio', { name: nombreRadio, exact: true }).count();
      t.ok(n === 1, `[${nombre}] no hay un radio llamado "${nombreRadio}" (${n})`);
    }
    t.ok(m.etiquetas.map((e) => e.icono).join() === 'false,true,true,true', `[${nombre}] los iconos de las categorias no son los de la cinta (${JSON.stringify(m.etiquetas)})`);
    t.ok(m.etiquetas.every((e) => ES_FRAUNCES.test(e.letra) && e.cursiva === 'italic' && e.ola === 'true' && e.alto >= 24), `[${nombre}] las categorias no van en Fraunces cursiva con la ola, o miden menos de 24 px (${JSON.stringify(m.etiquetas)})`);
    t.ok(m.estrellas.length === 3 && m.estrellas.every((a) => a === 'true'), `[${nombre}] las estrellas no son adorno (${m.estrellas})`);
    t.ok(m.elegida?.[0] === HORNO && m.elegida?.[1] === PAPEL && m.elegida?.[2] === 1, `[${nombre}] la elegida no va en la pastilla horno (una sola, la que viaja) con texto papel (${m.elegida})`);
    t.ok(m.lineas === 2 && m.campos.length === 1 && m.campos.every((c) => c === PAPEL), `[${nombre}] los mandos no van entre lineas dobles o el buscador no es papel (${m.lineas}, ${m.campos})`);
    t.ok(m.ordenBoton[0] === 'rgba(0, 0, 0, 0)' && m.ordenBoton[1] === '1px' && m.ordenBoton[2] === '1px', `[${nombre}] el boton de Ordenar por no es un cuadro con filete fino y sin relleno (${m.ordenBoton})`);
    t.ok(m.mando[0] === 'uppercase' && m.cuenta[0].startsWith('Mostrando 17 de 17') && m.cuenta[1] === 'uppercase' && m.cuenta[2] === CORTEZA_OSCURA, `[${nombre}] los rotulos o la cuenta no van en versalitas (${JSON.stringify([m.mando, m.cuenta])})`);
    t.ok(m.aviso === 'polite', `[${nombre}] el aviso del catalogo cambio (${m.aviso})`);
    t.ok(m.anchoPagina <= m.ancho && m.etiquetas.every((e) => e.derecha <= m.ancho), `[${nombre}] "Filtrar por" se sale de la pantalla (${JSON.stringify(m.etiquetas.map((e) => Math.round(e.derecha)))})`);

    // La barra de arriba: sin banda oscura debajo, no gana la linea ambar.
    await p.evaluate(() => window.scrollTo(0, 120));
    await espera(300);
    t.ok(!(await p.evaluate(() => document.querySelector('.site-header').classList.contains('is-sobre-oscuro'))), `[${nombre}] la barra cree que tiene una banda oscura debajo en la tienda`);
    await p.evaluate(() => window.scrollTo(0, 0));
    await espera(200);

    // La canasta flotante no tapa nada de la cabeza.
    const tapa = await p.evaluate(() => {
      const f = document.querySelector('.floating-whatsapp.is-canasta')?.getBoundingClientRect();
      if (!f) return [];
      return [...document.querySelectorAll('.vista-cabeza :is(button, .chip, [role="combobox"], input:not(.chip-input))')].filter((e) => {
        const r = e.getBoundingClientRect();
        return Math.min(r.right, f.right) > Math.max(r.left, f.left) && Math.min(r.bottom, f.bottom) > Math.max(r.top, f.top);
      }).map((e) => e.className || e.tagName);
    });
    t.ok(tapa.length === 0, `[${nombre}] la canasta flotante tapa ${tapa.join(', ')}`);

    // Con el teclado: Tab entra en el radio puesto, el foco se ve en su
    // etiqueta y las flechas cambian de categoria; con cada una cambian el
    // titulo y la frase, y la escena no se repite.
    if (nombre === 'escritorio') {
      await p.focus('#vista-sub-todas');
      await p.keyboard.press('Shift+Tab');
      await p.keyboard.press('Tab');
      const anillo = await p.evaluate(() => {
        const e = document.activeElement;
        const c = getComputedStyle(e.nextElementSibling);
        return { id: e.id, estilo: c.outlineStyle, ancho: c.outlineWidth };
      });
      t.ok(anillo.id === 'vista-sub-todas' && anillo.estilo !== 'none' && parseFloat(anillo.ancho) >= 2, `[${nombre}] el foco del radio no se ve en su etiqueta (${JSON.stringify(anillo)})`);
      for (const [hash, valor, titulo, frase] of VISTAS.slice(1)) {
        await p.keyboard.press('ArrowRight');
        await esperaQue(() => p.evaluate((h) => location.hash === '#/' + h, hash));
        await espera(150);
        const v = await p.evaluate(() => ({
          hash: location.hash,
          foco: document.activeElement.id,
          h1: document.querySelector('.tienda-texto h1').textContent,
          frase: document.querySelector('.tienda-frase').textContent,
        }));
        t.ok(v.hash === '#/' + hash && v.foco === `vista-sub-${valor}` && v.h1 === titulo && v.frase === frase, `[${nombre}] la flecha no lleva a ${titulo} con su frase (${JSON.stringify(v)})`);
        t.ok((await animando(p)) === 0, `[${nombre}] la escena se repite al cambiar a ${titulo}`);
      }
    } else {
      // La zona de toque de 44 px de cada categoria no invade la de otra
      // fila: tocar el borde de abajo de "Todas" no elige "Dulces".
      const invade = await p.evaluate(() => {
        const zonas = [...document.querySelectorAll('.vista-chips .chip')].map((e) => {
          const r = e.getBoundingClientRect();
          const z = getComputedStyle(e, '::before');
          const arriba = parseFloat(z.top);
          return { que: e.textContent, top: r.top + arriba, bottom: r.bottom - parseFloat(z.bottom), left: r.left, right: r.right, fila: Math.round(r.top) };
        });
        return zonas.flatMap((a, i) => zonas.slice(i + 1)
          .filter((b) => a.fila !== b.fila && Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top))
          .map((b) => `${a.que}/${b.que}`));
      });
      t.ok(invade.length === 0, `[${nombre}] la zona de toque de una categoria invade otra fila (${invade.join(', ')})`);
      // Con el dedo, tocar una categoria la elige.
      await p.tap('label[for="vista-sub-dulces"]');
      await esperaQue(() => p.evaluate(() => location.hash === '#/tienda-dulces'));
      await espera(150);
      const v = await p.evaluate(() => [document.querySelector('.tienda-texto h1').textContent, document.querySelector('.tienda-frase').textContent]);
      t.ok(v[0] === 'Dulces y pasteles' && v[1] === 'Para endulzar la tarde.', `[${nombre}] tocar Dulces no cambia el titulo y la frase (${v})`);
      t.ok((await animando(p)) === 0, `[${nombre}] la escena se repite al cambiar de categoria`);
    }
    await ctx.close();
  }

  // Cada categoria, abierta de cero, con su frase.
  {
    const ctx = await t.contexto({ ...VENTANAS.escritorio, reducedMotion: 'reduce' }, { nombre: 'frases' });
    const p = await ctx.newPage();
    for (const [hash, , titulo, frase] of VISTAS) {
      await p.goto(t.REACT + 'index.html#/' + hash);
      await p.reload();
      await p.waitForSelector('.tienda-frase');
      const v = await p.evaluate(() => [document.querySelector('.tienda-texto h1').textContent, document.querySelector('.tienda-frase').textContent]);
      t.ok(v[0] === titulo && v[1] === frase, `[${hash}] el titulo o la frase no son los suyos (${v})`);
    }
    // En colores forzados el foco de la categoria elegida usa el color del
    // sistema, no el horno (que alli no se ve).
    {
      const forzado = await t.contexto({ ...VENTANAS.escritorio, reducedMotion: 'reduce', forcedColors: 'active' }, { nombre: 'forzados' });
      const pf = await forzado.newPage();
      await pf.goto(t.REACT + '#/tienda-catalogo');
      await pf.waitForSelector('#vista-sub-todas');
      await pf.focus('#vista-sub-todas');
      await pf.keyboard.press('Shift+Tab');
      await pf.keyboard.press('Tab');
      const anillo = await pf.evaluate(() => {
        const c = getComputedStyle(document.querySelector('#vista-sub-todas + .chip'));
        return [c.outlineStyle, c.outlineColor, c.boxShadow];
      });
      t.ok(anillo[0] !== 'none' && anillo[1] !== 'rgb(58, 40, 34)' && anillo[2] === 'none', `[forzados] el foco de la categoria elegida no usa el color del sistema (${anillo})`);
      await forzado.close();
    }
    // Con menos movimiento, todo quieto y a la vista.
    const quieto = await p.evaluate(() => [...document.querySelectorAll('.tienda-texto > *, .vista-barra, .vista-barra .linea-doble, .vista-cuenta')]
      .map((e) => [e.className || e.tagName, getComputedStyle(e).animationName, getComputedStyle(e).opacity])
      .filter(([, anima, op]) => anima !== 'none' || op !== '1'));
    t.ok(quieto.length === 0, `[quieto] con menos movimiento algo se mueve o no se ve (${JSON.stringify(quieto)})`);

    // A 320 px con el espaciado de texto de WCAG 1.4.12, nada de la cabeza
    // se sale de la pantalla.
    await p.setViewportSize({ width: 320, height: 640 });
    await p.addStyleTag({ content: '*:not(svg *) { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }' });
    await espera(200);
    const fuera = await p.evaluate(() => [...document.querySelectorAll('.vista-cabeza :is(button, .rotulo, h1, .tienda-frase, .chip, .vista-mando, [role="combobox"], input:not(.chip-input))')]
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > window.innerWidth + 1); })
      .map((e) => e.className || e.tagName));
    const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
    t.ok(fuera.length === 0 && ancho <= 320, `[320 con espaciado] se sale ${fuera.join(', ')} (ancho ${ancho})`);
    await ctx.close();
  }
}
