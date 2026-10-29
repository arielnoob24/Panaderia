// #/contacto con el estilo de la portada (seccion 10 del plan, "Contacto con
// el estilo de la portada"), en escritorio y en el telefono (390 px, tactil):
// - el texto: rotulo "Dónde estamos" con la espiga, el h1 "Visítanos / en
//   Tena" con la segunda linea en cursiva horno, la direccion en su
//   <address> en cursiva, y "Ver en el mapa", el ticket ambar, que se abre en
//   otra pestana;
// - el mapa en un marco fino recto, con su sello "Eloy Alfaro · Gabriel
//   Espinosa" (aria-hidden, su texto en su aro) arriba a la derecha, lejos
//   de los creditos de abajo, y que deja pasar el puntero al mapa;
// - el horario sin la tarjeta oscura: el h2 entre lineas dobles, el estado
//   debajo (en tinta de horno, no ambar, sobre la masa) y un <dl>
//   como una carta, con puntos guia que no son texto y la pastilla "hoy";
// - Escribenos: el h2 entre lineas dobles, WhatsApp con el
//   aspecto y la ola de "Cómo llegar" y su rotulo encima, que se abren en
//   otra pestana y lo dicen en el nombre;
// - todo en una pantalla, sin desplazarse y hasta el borde, de
//   1440x900 a 360x640; en los telefonos bajos (390x700, 375x667, 360x640)
//   el estado sube junto al rotulo (uno solo se ve y se lee), el h1 va en
//   una linea y el mapa baja hasta 120 px; con zoom (320x256, 640x360) o a
//   320 px crece sin cortar ni pisar nada (WCAG 1.4.10);
// - la escena entra una vez; con menos movimiento, todo quieto;
// - foco visible y objetivos de 24 px o mas; la canasta flotante no tapa
//   ningun enlace.
import { VENTANAS, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'Contacto como la portada: rotulo, titular y direccion, mapa con marco y sello en su esquina, horario como carta entre lineas dobles sin tarjeta oscura, Escribenos con la ola, una pantalla sin scroll y crece sin cortar, quieto con menos movimiento';
export const limite = 150;

const ES_FRAUNCES = /^"?Fraunces Variable/;
const CORTEZA = 'rgb(58, 40, 34)'; // horno: la cursiva de em ya no lleva otro color
const HORNO = 'rgb(58, 40, 34)';
const CORTEZA_OSCURA = 'rgb(58, 40, 34)'; // horno

const mirar = (p) => p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const estilo = (s, pseudo) => getComputedStyle(q(s), pseudo);
  const caja = (s) => q(s).getBoundingClientRect();
  const vista = q('.vista-contacto');
  const sello = q('.contacto-sello');
  const camino = sello.querySelector('textPath');
  const aro = document.getElementById(camino.getAttribute('href').slice(1));
  const mapa = q('.contacto-mapa-enlace');
  const cabeza = (s) => {
    const c = q(s + ' .contacto-cabeza');
    return [...c.children].map((e) => (e.tagName === 'H2' ? e.textContent : e.className)).join('|');
  };
  const filas = [...document.querySelectorAll('.carta-horario > div')];
  const contactos = [...document.querySelectorAll('.contacto-lista .contacto')].map((c) => {
    const a = c.querySelector('a');
    return {
      rotulo: c.querySelector('.rotulo')?.textContent,
      encima: c.querySelector('.rotulo').getBoundingClientRect().bottom <= a.getBoundingClientRect().top + 1,
      clases: a.className,
      fuera: a.target === '_blank' && /noopener/.test(a.rel),
      letras: a.querySelector('.letras')?.getAttribute('aria-hidden'),
      letra: getComputedStyle(a).fontFamily,
      cursiva: getComputedStyle(a).fontStyle,
    };
  });
  const estado = q('.contacto-horario .open-label');
  const hijos = [...q('.contacto-horario').children];
  return {
    rotulo: q('.contacto-texto .rotulo-espiga')?.textContent.trim(),
    espiga: Boolean(q('.contacto-texto .rotulo-espiga svg')),
    h1: q('.contacto-texto h1').textContent.replace(/\s+/g, ' ').trim(),
    h1Clase: q('.contacto-texto h1').className,
    h1Letra: estilo('.contacto-texto h1').fontFamily,
    emColor: estilo('.contacto-texto h1 em').color,
    emCursiva: estilo('.contacto-texto h1 em').fontStyle,
    direccion: q('.contacto-texto address')?.textContent,
    direccionCursiva: estilo('.contacto-texto address').fontStyle,
    mapaClases: mapa.className,
    mapaFuera: mapa.target === '_blank' && mapa.textContent.includes('(abre en una pestaña nueva)'),
    marco: estilo('.contacto-mapa-marco').boxShadow,
    radio: estilo('.contacto-mapa-marco').borderRadius,
    iframe: Boolean(q('.contacto-mapa-marco iframe[title]')),
    caja: { mapa: caja('.contacto-mapa-marco'), sello: sello.getBoundingClientRect() },
    selloTexto: camino.textContent,
    selloOculto: sello.getAttribute('aria-hidden'),
    aroEnSuSello: Boolean(aro && sello.contains(aro)),
    selloPuntero: getComputedStyle(sello).pointerEvents,
    oscuras: vista.querySelectorAll('.banda-oscura').length,
    cabezaHorario: cabeza('.contacto-horario'),
    cabezaEscribir: cabeza('.contacto-escribir'),
    estadoTras: hijos.indexOf(estado) === 1 && hijos[2]?.tagName === 'DL',
    estadoColor: getComputedStyle(estado).color,
    filas: filas.map((f) => [f.querySelector('dt')?.firstChild.textContent, f.querySelector('dd')?.textContent].join(' ')),
    soloDtDd: filas.every((f) => [...f.children].every((h) => h.tagName === 'DT' || h.tagName === 'DD')),
    puntos: (() => { const d = getComputedStyle(filas[0].querySelector('dt'), '::after'); return [d.content, d.borderBottomStyle]; })(),
    hoy: filas.filter((f) => f.classList.contains('is-today')).map((f) => f.querySelector('.dia-hoy')?.textContent),
    feriados: [q('.contacto-horario-nota').textContent, estilo('.contacto-horario-nota').fontStyle],
    contactos,
    ultimo: vista.lastElementChild.className,
  };
});

// Si la vista cabe, si la franja llega al borde y si algo se corta o se pisa.
const medir = (p) => p.evaluate(() => {
  const ancho = window.innerWidth;
  const r = (s) => document.querySelector(s).getBoundingClientRect();
  const f = document.querySelector('.floating-whatsapp.is-canasta')?.getBoundingClientRect();
  const tapados = f ? [...document.querySelectorAll('.vista-contacto a')].filter((a) => {
    const c = a.getBoundingClientRect();
    return Math.min(c.right, f.right) > Math.max(c.left, f.left) && Math.min(c.bottom, f.bottom) > Math.max(c.top, f.top);
  }).map((a) => a.textContent.slice(0, 20)) : [];
  const estados = [...document.querySelectorAll('.vista-contacto .open-label')].filter((e) => e.getClientRects().length);
  const h1 = document.querySelector('.contacto-texto h1');
  const textos = [...document.querySelectorAll('.vista-contacto :is(.rotulo, h1, address, .contacto-mapa-enlace, h2, .open-label, dt, dd, .contacto-horario-nota, .contacto-valor)')];
  // El ticket lleva su sombra dura fuera de la caja (scrollWidth mayor sin
  // que se corte nada): a el solo se le mira que no se salga de la ventana.
  const cortados = textos.filter((e) => {
    const c = e.getBoundingClientRect();
    return (!e.matches('.button') && e.scrollWidth > e.clientWidth + 1) || c.left < -1 || c.right > ancho + 1;
  }).map((e) => e.className || e.tagName);
  // El sello entero dentro de la ventana: lo que se sale lo corta el clip.
  const sello = document.querySelector('.contacto-sello').getBoundingClientRect();
  if (sello.left < 0 || sello.right > ancho) cortados.push(`sello ${Math.round(sello.left)}-${Math.round(sello.right)}`);
  const bloques = ['.contacto-texto', '.contacto-mapa', '.contacto-horario', '.contacto-escribir'].map(r);
  const solapan = (a, b) => Math.min(a.right, b.right) > Math.max(a.left, b.left) + 1 && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 1;
  const pisa = bloques.some((a, i) => bloques.some((b, j) => i < j && solapan(a, b)));
  const ultimo = Math.max(...bloques.map((b) => b.bottom));
  return {
    alto: document.documentElement.scrollHeight,
    ventana: window.innerHeight,
    anchoPagina: document.documentElement.scrollWidth,
    ancho,
    cortados,
    tapados,
    estados: estados.map((e) => (e.parentElement.classList.contains('contacto-texto') ? 'arriba' : 'horario')),
    lineasH1: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).fontSize)),
    pisa,
  };
});

export default async function contacto(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/contacto');
    await p.waitForSelector('.contacto-horario-nota');

    // La escena: el horario sube tras el texto y acaba a la vista.
    const opacidad = () => p.evaluate(() => Number(getComputedStyle(document.querySelector('.contacto-horario')).opacity));
    t.ok((await opacidad()) < 1, `[${nombre}] el horario no entra con la escena`);
    await esperaQue(async () => (await opacidad()) === 1, 40);
    await espera(1200);

    const m = await mirar(p);
    t.ok(m.rotulo === 'Dónde estamos' && m.espiga, `[${nombre}] falta el rotulo con la espiga ("${m.rotulo}")`);
    t.ok(m.h1 === 'Visítanos en Tena' && /\btitular\b/.test(m.h1Clase) && ES_FRAUNCES.test(m.h1Letra), `[${nombre}] el h1 no es el de la portada ("${m.h1}", ${m.h1Clase}, ${m.h1Letra})`);
    t.ok(m.emColor === CORTEZA && m.emCursiva === 'italic', `[${nombre}] "en Tena" no va en cursiva horno (${m.emColor}, ${m.emCursiva})`);
    t.ok(m.direccion === 'Esquina de Eloy Alfaro y Gabriel Espinosa, Tena' && m.direccionCursiva === 'italic', `[${nombre}] la direccion no va en su address en cursiva ("${m.direccion}", ${m.direccionCursiva})`);
    t.ok(/\bbutton-yellow\b/.test(m.mapaClases) && m.mapaFuera, `[${nombre}] "Ver en el mapa" no es el ticket ambar que abre otra pestana (${m.mapaClases})`);
    // El filete horno a 10 px de la masa (a 6 en el telefono), sin radio.
    t.ok(m.iframe && /rgb\(58, 40, 34\) 0px 0px 0px (7|11)px/.test(m.marco) && m.radio === '0px', `[${nombre}] el mapa no va en su marco fino recto (${m.marco}, radio ${m.radio})`);
    t.ok(m.selloTexto.startsWith('Eloy Alfaro · Gabriel Espinosa') && m.selloOculto === 'true' && m.aroEnSuSello, `[${nombre}] el sello del mapa no dice lo suyo (${JSON.stringify([m.selloTexto, m.selloOculto, m.aroEnSuSello])})`);
    // Arriba a la derecha: su centro en el cuarto de arriba a la derecha del
    // mapa, y nada del sello en la mitad de abajo (logo, creditos, zoom).
    const { mapa, sello } = m.caja;
    const cx = (sello.left + sello.right) / 2;
    const cy = (sello.top + sello.bottom) / 2;
    t.ok(cx > mapa.left + mapa.width * .6 && cy < mapa.top + mapa.height * .4 && sello.bottom < mapa.top + mapa.height / 2, `[${nombre}] el sello no va arriba a la derecha del mapa (sello ${JSON.stringify([sello.left, sello.top, sello.right, sello.bottom].map(Math.round))}, mapa ${JSON.stringify([mapa.left, mapa.top, mapa.right, mapa.bottom].map(Math.round))})`);
    t.ok(m.selloPuntero === 'none', `[${nombre}] el sello no deja pasar el puntero al mapa (${m.selloPuntero})`);
    t.ok(m.oscuras === 0, `[${nombre}] Contacto todavia lleva la tarjeta oscura`);
    t.ok(m.cabezaHorario === 'linea-doble|Horario de atención|linea-doble' && m.cabezaEscribir === 'linea-doble|Escríbenos|linea-doble', `[${nombre}] los h2 no van entre lineas dobles (${m.cabezaHorario} / ${m.cabezaEscribir})`);
    t.ok(m.estadoTras && [HORNO, CORTEZA_OSCURA].includes(m.estadoColor), `[${nombre}] el estado no va bajo el h2 o no se lee sobre la masa (${m.estadoColor})`);
    t.ok(m.filas.join(' / ') === 'Lun — Vie 08:00 — 20:00 / Sáb — Dom 09:00 — 21:00' && m.soloDtDd, `[${nombre}] el horario cambio o el dl lleva algo mas que dt y dd (${m.filas.join(' / ')})`);
    t.ok(m.puntos[0] === '""' && m.puntos[1] === 'dotted', `[${nombre}] faltan los puntos guia o llevan texto (${m.puntos})`);
    t.ok(m.hoy.length === 1 && m.hoy[0] === 'hoy', `[${nombre}] la fila de hoy no lleva su pastilla (${JSON.stringify(m.hoy)})`);
    t.ok(m.feriados[0] === 'En feriados nacionales cerramos.' && m.feriados[1] === 'italic', `[${nombre}] la nota de feriados cambio (${m.feriados})`);
    t.ok(m.contactos.length === 1 && m.contactos[0].rotulo === 'WhatsApp', `[${nombre}] falta WhatsApp o sobra algo (${JSON.stringify(m.contactos)})`);
    t.ok(m.contactos.every((c) => c.encima && /\benlace-llegar\b/.test(c.clases) && c.fuera && c.letras === 'true' && ES_FRAUNCES.test(c.letra) && c.cursiva === 'italic'), `[${nombre}] WhatsApp no es como "Cómo llegar" con su rotulo encima (${JSON.stringify(m.contactos)})`);
    for (const nombreEnlace of ['WhatsApp: +593 99 000 0000 (abre en una pestaña nueva)']) {
      const n = await p.getByRole('link', { name: nombreEnlace, exact: true }).count();
      t.ok(n === 1, `[${nombre}] no hay un enlace llamado "${nombreEnlace}" (${n})`);
    }

    const d = await medir(p);
    t.ok(nombre === 'movil' || d.alto <= d.ventana, `[${nombre}] Contacto no cabe en la pantalla (${JSON.stringify(d)})`);
    t.ok(d.cortados.length === 0 && !d.pisa && d.anchoPagina <= d.ancho, `[${nombre}] algo se corta o se pisa (${JSON.stringify(d)})`);

    // Objetivos de 24 px o mas, y la canasta flotante no tapa ningun enlace.
    const objetivos = await p.evaluate(() => {
      const f = document.querySelector('.floating-whatsapp.is-canasta')?.getBoundingClientRect();
      return [...document.querySelectorAll('.vista-contacto a')].map((a) => {
        const r = a.getBoundingClientRect();
        const tapa = f && Math.min(r.right, f.right) > Math.max(r.left, f.left) && Math.min(r.bottom, f.bottom) > Math.max(r.top, f.top);
        return { que: a.textContent.slice(0, 20), alto: Math.round(r.height), ancho: Math.round(r.width), tapa };
      });
    });
    t.ok(objetivos.every((o) => o.alto >= 24 && o.ancho >= 24), `[${nombre}] hay enlaces de menos de 24 px (${JSON.stringify(objetivos)})`);
    t.ok(objetivos.every((o) => !o.tapa), `[${nombre}] la canasta flotante tapa un enlace (${JSON.stringify(objetivos.filter((o) => o.tapa))})`);

    // Foco visible en "Ver en el mapa" y en WhatsApp.
    if (nombre === 'escritorio') {
      for (const sel of ['.contacto-mapa-enlace', '.contacto-valor']) {
        await p.focus(sel);
        await p.keyboard.press('Shift+Tab');
        await p.keyboard.press('Tab');
        const anillo = await p.evaluate((s) => {
          const e = document.activeElement;
          const c = getComputedStyle(e);
          return { es: e.matches(s), estilo: c.outlineStyle, ancho: c.outlineWidth };
        }, sel);
        t.ok(anillo.es && anillo.estilo !== 'none' && parseFloat(anillo.ancho) >= 2, `[${nombre}] ${sel} no muestra el foco (${JSON.stringify(anillo)})`);
      }
    }
    await ctx.close();
  }

  // Con menos movimiento todo esta quieto y a la vista desde el principio.
  {
    const ctx = await t.contexto({ ...VENTANAS.movil, reducedMotion: 'reduce' }, { nombre: 'quieto' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/contacto');
    await p.waitForSelector('.contacto-horario-nota');
    const quieto = await p.evaluate(() => [...document.querySelectorAll('.contacto-texto > *, .contacto-mapa-marco iframe, .contacto-sello, .contacto-horario, .contacto-escribir, .contacto-cabeza .linea-doble')]
      .map((e) => [e.className || e.tagName, getComputedStyle(e).animationName, getComputedStyle(e).opacity])
      .filter(([, anima, op]) => anima !== 'none' || op !== '1'));
    t.ok(quieto.length === 0, `[quieto] con menos movimiento algo se mueve o no se ve (${JSON.stringify(quieto)})`);
    await ctx.close();
  }

  // En una pantalla sin desplazarse en los tamanos de siempre; con zoom o
  // una ventana baja, crece sin cortar ni pisar nada.
  {
    const ctx = await t.contexto({ ...VENTANAS.escritorio, reducedMotion: 'reduce' }, { nombre: 'alturas' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/contacto');
    await p.waitForSelector('.contacto-horario-nota');
    for (const [ancho, alto] of [[1440, 900], [1366, 768], [1280, 720], [900, 1000], [768, 1024], [390, 844], [390, 700], [375, 667], [360, 640]]) {
      await p.setViewportSize({ width: ancho, height: alto });
      await espera(150);
      const d = await medir(p);
      const bajo = ancho <= 680 && alto <= 800;
      t.ok(d.estados.join() === (bajo ? 'arriba' : 'horario'), `[${ancho}x${alto}] el estado no va donde toca o se ve dos veces (${d.estados})`);
      t.ok(bajo ? d.lineasH1 <= 1 : d.lineasH1 >= 2, `[${ancho}x${alto}] el h1 va en ${d.lineasH1} lineas`);
      t.ok(d.tapados.length === 0, `[${ancho}x${alto}] la canasta flotante tapa ${d.tapados.join(', ')}`);
      // En el telefono puede desplazarse un poco: la canasta flotante pide 92 px libres abajo.
      t.ok(ancho <= 680 || d.alto <= d.ventana, `[${ancho}x${alto}] Contacto no cabe sin desplazarse (${d.alto} de ${d.ventana})`);
      t.ok(d.cortados.length === 0 && !d.pisa && d.anchoPagina <= d.ancho, `[${ancho}x${alto}] algo se corta o se pisa (${JSON.stringify(d)})`);
    }
    for (const [ancho, alto] of [[320, 640], [320, 256], [640, 360]]) {
      await p.setViewportSize({ width: ancho, height: alto });
      await espera(150);
      const d = await medir(p);
      t.ok(d.cortados.length === 0 && !d.pisa && d.anchoPagina <= d.ancho, `[${ancho}x${alto}] con poca altura algo se corta o se pisa (${JSON.stringify(d)})`);
    }
    // Con el espaciado de texto de WCAG 1.4.12 a 320 px, nada se corta.
    await p.setViewportSize({ width: 320, height: 640 });
    await p.addStyleTag({ content: '*:not(svg *) { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }' });
    await espera(200);
    const d = await medir(p);
    t.ok(d.cortados.length === 0 && !d.pisa && d.anchoPagina <= d.ancho, `[320x640 con espaciado] algo se corta o se pisa (${JSON.stringify(d)})`);
    await ctx.close();
  }
}
