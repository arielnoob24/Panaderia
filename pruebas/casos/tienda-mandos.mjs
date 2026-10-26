// Los mandos y las fichas de la tienda del 25 de octubre de 2026 (seccion 4
// del plan), en escritorio y en el telefono (390 px, tactil):
// - "Ordenar por" es un combobox de solo seleccion del APG: role=combobox
//   con aria-expanded, aria-controls y aria-activedescendant; la lista es un
//   listbox con sus option y aria-selected. Teclado: Enter, Espacio, Alt+Abajo
//   y Abajo abren; Arriba/Abajo, Inicio y Fin recorren; una letra salta;
//   Enter o Espacio eligen y cierran; Esc y Tab cierran sin cambiar. Clic
//   fuera cierra. El foco no sale del boton, el orden se anuncia y se
//   recuerda en sessionStorage como antes. La elegida, en la pastilla horno
//   con el texto papel; el panel entra con fundido y scale desde el boton,
//   y con menos movimiento solo aparece.
// - "Mostrar" es un interruptor "Solo disponibles" con aria-pressed: un clic
//   o Espacio lo cambian, esconde los agotados y se recuerda como antes.
// - Las fichas: 5 por fila con la tienda de 1080 px o mas, 4 desde unos 860,
//   3 en la tableta y 2 en el telefono; la letra no baja de 11 px y el - y
//   el + no bajan de 24 x 24. Con 5 y con 4 (1440, 1280 y 1024 px), con el
//   "- n +" abierto en todas, el precio y el control van en una linea sin
//   salirse de la ficha y ninguna palabra del nombre se parte.
// - Sin "Volver al inicio" en la tienda, y Tienda en el menu es un enlace
//   simple, sin flecha ni desplegable.
import { VENTANAS, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'Tienda: Ordenar por como combobox del APG (teclado, letras, Esc, Tab, clic fuera), Mostrar como interruptor aria-pressed, fichas 5/4/3/2 por fila con letra >= 11 px, - + >= 24 px y precio y - n + en una linea, sin Volver al inicio ni desplegable en el menu';
export const limite = 150;

const HORNO = 'rgb(58, 40, 34)';
const PAPEL = 'rgb(255, 253, 248)';

const combo = (p) => p.evaluate(() => {
  const c = document.querySelector('[role="combobox"]');
  const lista = document.getElementById(c.getAttribute('aria-controls'));
  const activa = c.getAttribute('aria-activedescendant');
  const elegida = lista.querySelector('[aria-selected="true"]');
  return {
    expandido: c.getAttribute('aria-expanded'),
    foco: document.activeElement === c,
    texto: c.textContent.trim(),
    activa: activa ? document.getElementById(activa)?.textContent : null,
    rol: lista.getAttribute('role'),
    opciones: [...lista.querySelectorAll('[role="option"]')].length,
    elegida: elegida?.textContent,
    visible: getComputedStyle(lista).visibility,
    nombre: document.getElementById(c.getAttribute('aria-labelledby'))?.textContent,
    recordado: JSON.parse(sessionStorage.getItem('eltradicional-vista') || '{}').orden,
  };
});

// El primer producto que se ve, por la propiedad order (la tienda ordena asi).
const primero = (p) => p.evaluate(() => [...document.querySelectorAll('.product-card:not([hidden])')]
  .sort((a, b) => Number(a.style.order) - Number(b.style.order))[0]?.querySelector('h3')?.textContent);

const aviso = (p) => p.evaluate(() => [...document.querySelectorAll('[role="status"]')].map((e) => e.textContent).join(' | '));

export default async function tiendaMandos(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto(ventana, { nombre });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card:not([hidden])');
    await espera(1400);

    // Sin "Volver al inicio" en la tienda; Tienda en el menu, enlace simple.
    t.ok((await p.getByRole('button', { name: 'Volver al inicio' }).count()) === 0 && (await p.locator('.vista-volver').count()) === 0, `[${nombre}] la tienda sigue teniendo "Volver al inicio"`);
    const menu = await p.evaluate(() => {
      const nav = document.querySelector('#main-nav');
      const tienda = nav.querySelector('a[href$="tienda-catalogo"]');
      return {
        hijo: tienda?.parentElement === nav,
        actual: tienda?.getAttribute('aria-current'),
        botones: nav.querySelectorAll('button, [aria-expanded]').length,
        enlacesCategoria: nav.querySelectorAll('a[href*="tienda-"]:not([href$="tienda-catalogo"])').length,
      };
    });
    t.ok(menu.hijo && menu.actual === 'page' && menu.botones === 0 && menu.enlacesCategoria === 0, `[${nombre}] Tienda en el menu no es un enlace simple y la pagina actual (${JSON.stringify(menu)})`);

    // ---- Las fichas por fila -------------------------------------------
    const fichas = await p.evaluate(() => {
      const vistas = [...document.querySelectorAll('.product-card:not([hidden])')];
      const filas = new Set(vistas.map((v) => Math.round(v.getBoundingClientRect().top)));
      const porFila = vistas.filter((v) => Math.round(v.getBoundingClientRect().top) === Math.min(...filas)).length;
      const letras = vistas.flatMap((v) => [...v.querySelectorAll('*')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length).map((e) => parseFloat(getComputedStyle(e).fontSize)));
      const botones = vistas.flatMap((v) => [...v.querySelectorAll('.card-cantidad button:not([hidden])')].map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); }));
      return { porFila, menorLetra: Math.min(...letras), menorBoton: Math.min(...botones), tienda: document.querySelector('.vista-tienda > .container').getBoundingClientRect().width };
    });
    const esperadas = nombre === 'escritorio' ? 5 : 2;
    t.ok(fichas.porFila === esperadas, `[${nombre}] con la tienda de ${Math.round(fichas.tienda)} px van ${fichas.porFila} fichas por fila y deberian ser ${esperadas}`);
    t.ok(fichas.menorLetra >= 11 && fichas.menorBoton >= 24, `[${nombre}] en las fichas hay letra de ${fichas.menorLetra} px o un - / + de ${fichas.menorBoton} px`);

    // ---- "Ordenar por" ---------------------------------------------------
    let c = await combo(p);
    t.ok(c.rol === 'listbox' && c.opciones === 4 && c.expandido === 'false' && c.texto === 'Recomendados' && c.elegida === 'Recomendados' && c.nombre === 'Ordenar por' && c.visible === 'hidden', `[${nombre}] "Ordenar por" no es un combobox cerrado con su listbox (${JSON.stringify(c)})`);
    t.ok((await p.locator('.vista-mando select').count()) === 0, `[${nombre}] siguen los <select> en los mandos`);

    if (nombre === 'escritorio') {
      await p.focus('[role="combobox"]');
      // Abajo abre en la elegida, sin cambiar nada.
      await p.keyboard.press('ArrowDown');
      c = await combo(p);
      t.ok(c.expandido === 'true' && c.activa === 'Recomendados' && c.texto === 'Recomendados' && c.foco, `[teclado] Abajo no abre en la elegida (${JSON.stringify(c)})`);
      // El panel entra con su animacion (fundido y scale desde el boton).
      const entra = await p.evaluate(() => {
        const l = document.querySelector('.orden-lista');
        return { origen: getComputedStyle(l).transformOrigin, anima: l.getAnimations().length };
      });
      t.ok(entra.anima > 0 && entra.origen.startsWith('0px'), `[teclado] el panel no entra animado desde el boton (${JSON.stringify(entra)})`);
      // Abajo, Fin, Inicio recorren sin dar la vuelta.
      await p.keyboard.press('ArrowDown');
      t.ok((await combo(p)).activa === 'Precio: de menor a mayor', '[teclado] Abajo no pasa a la siguiente');
      await p.keyboard.press('End');
      t.ok((await combo(p)).activa === 'Nombre: de la A a la Z', '[teclado] Fin no va a la ultima');
      await p.keyboard.press('ArrowDown');
      t.ok((await combo(p)).activa === 'Nombre: de la A a la Z', '[teclado] Abajo en la ultima da la vuelta');
      await p.keyboard.press('Home');
      t.ok((await combo(p)).activa === 'Recomendados', '[teclado] Inicio no va a la primera');
      // Una letra salta; repetida, pasa a la siguiente que empieza igual.
      await p.keyboard.press('p');
      t.ok((await combo(p)).activa === 'Precio: de menor a mayor', '[teclado] la p no salta al primer precio');
      await p.keyboard.press('p');
      t.ok((await combo(p)).activa === 'Precio: de mayor a menor', '[teclado] la segunda p no pasa al otro precio');
      // Esc cierra sin cambiar.
      await p.keyboard.press('Escape');
      c = await combo(p);
      t.ok(c.expandido === 'false' && c.texto === 'Recomendados' && c.activa === null && c.foco, `[teclado] Esc no cierra sin cambiar (${JSON.stringify(c)})`);
      // Enter abre; Abajo y Enter eligen, cierran y se anuncia.
      await p.keyboard.press('Enter');
      t.ok((await combo(p)).expandido === 'true', '[teclado] Enter no abre');
      await p.keyboard.press('ArrowDown');
      await p.keyboard.press('Enter');
      await espera(300);
      c = await combo(p);
      t.ok(c.expandido === 'false' && c.texto === 'Precio: de menor a mayor' && c.elegida === 'Precio: de menor a mayor' && c.foco && c.recordado === 'precio-asc', `[teclado] Enter no elige (${JSON.stringify(c)})`);
      t.ok((await aviso(p)).includes('Ordenado por precio, de menor a mayor.'), `[teclado] el orden no se anuncia (${await aviso(p)})`);
      t.ok((await primero(p)) === 'Pan redondo', `[teclado] de menor a mayor no empieza por el mas barato (${await primero(p)})`);
      // La elegida, en la pastilla horno con el texto papel.
      const pastilla = await p.evaluate(() => { const e = document.querySelector('.orden-opcion[aria-selected="true"]'); return [getComputedStyle(e.querySelector('.orden-pastilla')).backgroundColor, getComputedStyle(e).color, document.querySelectorAll('.orden-pastilla').length]; });
      t.ok(pastilla[0] === HORNO && pastilla[1] === PAPEL && pastilla[2] === 1, `[teclado] la elegida no va en horno con texto papel (${pastilla})`);
      // Espacio y Alt+Abajo abren; Espacio elige.
      await p.keyboard.press('Space');
      t.ok((await combo(p)).expandido === 'true', '[teclado] Espacio no abre');
      await p.keyboard.press('Escape');
      await p.keyboard.press('Alt+ArrowDown');
      t.ok((await combo(p)).expandido === 'true', '[teclado] Alt+Abajo no abre');
      await p.keyboard.press('n');
      await p.keyboard.press('Space');
      c = await combo(p);
      t.ok(c.expandido === 'false' && c.texto === 'Nombre: de la A a la Z' && c.recordado === 'nombre', `[teclado] la n y Espacio no eligen Nombre (${JSON.stringify(c)})`);
      // Tab cierra sin cambiar y el foco sigue su camino.
      await p.keyboard.press('ArrowDown');
      await p.keyboard.press('Home');
      await p.keyboard.press('Tab');
      c = await combo(p);
      const foco = await p.evaluate(() => document.activeElement.className);
      t.ok(c.expandido === 'false' && c.texto === 'Nombre: de la A a la Z' && !c.foco && foco.includes('interruptor'), `[teclado] Tab no cierra sin cambiar o no pasa al interruptor (${JSON.stringify(c)}, foco en ${foco})`);
      // El foco del combobox se ve.
      await p.keyboard.press('Shift+Tab');
      const anillo = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return [s.outlineStyle, s.outlineWidth]; });
      t.ok(anillo[0] !== 'none' && parseFloat(anillo[1]) >= 2, `[teclado] el foco del combobox no se ve (${anillo})`);

      // Con el raton: clic abre, el puntero marca la que mira, clic elige.
      await p.mouse.move(10, 600);
      await p.mouse.move(12, 602);
      await p.click('[role="combobox"]');
      await p.hover('.orden-opcion >> nth=2');
      c = await combo(p);
      t.ok(c.expandido === 'true' && c.activa === 'Precio: de mayor a menor', `[raton] el puntero no marca la opcion que mira (${JSON.stringify(c)})`);
      // Clic fuera cierra sin cambiar.
      await p.mouse.click(10, 600);
      await espera(250);
      c = await combo(p);
      t.ok(c.expandido === 'false' && c.texto === 'Nombre: de la A a la Z', `[raton] el clic fuera no cierra sin cambiar (${JSON.stringify(c)})`);
      await p.click('[role="combobox"]');
      await p.click('.orden-opcion >> nth=2');
      await espera(250);
      c = await combo(p);
      t.ok(c.expandido === 'false' && c.texto === 'Precio: de mayor a menor' && c.foco, `[raton] el clic en una opcion no la elige con el foco en el boton (${JSON.stringify(c)})`);
    } else {
      // Con el dedo: tocar abre, tocar una opcion elige y cierra; tocar fuera cierra.
      await p.tap('[role="combobox"]');
      await espera(300);
      t.ok((await combo(p)).expandido === 'true', '[dedo] tocar el boton no abre');
      const caja = await p.evaluate(() => {
        const l = document.querySelector('.orden-lista').getBoundingClientRect();
        return { izq: l.left, der: l.right, ancho: innerWidth, alto: Math.min(...[...document.querySelectorAll('.orden-opcion')].map((o) => o.getBoundingClientRect().height)) };
      });
      t.ok(caja.izq >= 0 && caja.der <= caja.ancho && caja.alto >= 24, `[dedo] el panel se sale de la pantalla o sus opciones miden menos de 24 px (${JSON.stringify(caja)})`);
      await p.tap('.orden-opcion >> nth=3');
      await espera(300);
      let c2 = await combo(p);
      t.ok(c2.expandido === 'false' && c2.texto === 'Nombre: de la A a la Z' && c2.recordado === 'nombre', `[dedo] tocar una opcion no la elige (${JSON.stringify(c2)})`);
      await p.tap('[role="combobox"]');
      await espera(300);
      await p.tap('.tienda-texto h1');
      await espera(300);
      c2 = await combo(p);
      t.ok(c2.expandido === 'false' && c2.texto === 'Nombre: de la A a la Z', `[dedo] tocar fuera no cierra sin cambiar (${JSON.stringify(c2)})`);
    }

    // ---- "Mostrar" --------------------------------------------------------
    const inter = () => p.evaluate(() => {
      const b = document.querySelector('.interruptor');
      const r = b.getBoundingClientRect();
      return {
        tag: b.tagName, pulsado: b.getAttribute('aria-pressed'), nombre: b.textContent.replace('✓', '').trim(),
        fondo: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color, alto: r.height,
        visibles: document.querySelectorAll('.product-card:not([hidden])').length,
        agotados: document.querySelectorAll('.product-card:not([hidden])[data-available="false"]').length,
        recordado: JSON.parse(sessionStorage.getItem('eltradicional-vista') || '{}').soloDisponibles,
      };
    });
    let m = await inter();
    t.ok(m.tag === 'BUTTON' && m.pulsado === 'false' && m.nombre === 'Solo disponibles' && m.fondo === PAPEL && m.agotados > 0 && m.alto >= 24, `[${nombre}] "Mostrar" no es un interruptor apagado en papel (${JSON.stringify(m)})`);
    t.ok((await p.getByRole('button', { name: 'Solo disponibles', pressed: false }).count()) === 1, `[${nombre}] el interruptor no se llama "Solo disponibles"`);
    if (nombre === 'escritorio') {
      await p.focus('.interruptor');
      await p.keyboard.press('Space');
    } else {
      await p.tap('.interruptor');
    }
    await espera(300);
    m = await inter();
    t.ok(m.pulsado === 'true' && m.fondo === HORNO && m.color === PAPEL && m.agotados === 0 && m.recordado === true, `[${nombre}] encender "Solo disponibles" no esconde los agotados o no va en horno (${JSON.stringify(m)})`);
    // Se recuerda al recargar, como antes.
    await p.reload();
    await p.waitForSelector('.interruptor');
    await espera(400);
    m = await inter();
    t.ok(m.pulsado === 'true' && m.agotados === 0, `[${nombre}] al recargar no se recuerda "Solo disponibles" (${JSON.stringify(m)})`);
    if (nombre === 'escritorio') await p.click('.interruptor');
    else await p.tap('.interruptor');
    await espera(300);
    m = await inter();
    t.ok(m.pulsado === 'false' && m.agotados > 0, `[${nombre}] apagarlo no vuelve a ensenar los agotados (${JSON.stringify(m)})`);
    await ctx.close();
  }

  // Cinco a 1440, cuatro a 1024 y tres en la tableta. Con cinco y con cuatro
  // la ficha baja a unos 200 px: con el "- n +" abierto en todas, el precio
  // y el control siguen en una linea y dentro de la ficha, y el nombre mas
  // largo parte entre palabras, nunca dentro de una.
  for (const [ancho, esperadas] of [[1440, 5], [1280, 5], [1024, 4], [900, 3]]) {
    const ctx = await t.contexto({ viewport: { width: ancho, height: 1000 } }, { nombre: `${ancho}` });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.product-card:not([hidden])');
    const porFila = await p.evaluate(() => {
      const tops = [...document.querySelectorAll('.product-card:not([hidden])')].map((v) => Math.round(v.getBoundingClientRect().top));
      return tops.filter((x) => x === Math.min(...tops)).length;
    });
    t.ok(porFila === esperadas, `[${ancho}] van ${porFila} fichas por fila y deberian ser ${esperadas}`);
    if (esperadas >= 4) {
      await p.evaluate(() => document.querySelectorAll('.product-card:not([hidden]) .card-mas').forEach((b) => b.click()));
      await espera(900);
      const malas = await p.evaluate(() => [...document.querySelectorAll('.product-card:not([hidden])')].flatMap((ficha) => {
        const fallos = [];
        const nombre = ficha.querySelector('h3');
        const caja = ficha.getBoundingClientRect();
        const precio = ficha.querySelector('.product-bottom strong');
        const control = ficha.querySelector('.card-cantidad, .card-agotado');
        const rp = precio.getBoundingClientRect();
        const rc = control.getBoundingClientRect();
        if (ficha.querySelector('.card-cantidad') && !ficha.querySelector('.card-cantidad.is-lleno')) fallos.push('control sin abrir');
        if (rc.left < caja.left || rc.right > caja.right) fallos.push(`control fuera (${Math.round(rc.left)}-${Math.round(rc.right)} en ${Math.round(caja.left)}-${Math.round(caja.right)})`);
        if (rc.top > rp.bottom || rc.bottom < rp.top) fallos.push('precio y control en dos lineas');
        if (precio.scrollWidth > precio.clientWidth + 1 || precio.getClientRects().length !== 1) fallos.push('precio partido');
        if (nombre.scrollWidth > nombre.clientWidth + 1) fallos.push('nombre se sale');
        const texto = nombre.firstChild;
        const rango = document.createRange();
        for (const m of texto.textContent.matchAll(/\S+/g)) {
          rango.setStart(texto, m.index);
          rango.setEnd(texto, m.index + m[0].length);
          if (new Set([...rango.getClientRects()].map((r) => Math.round(r.top))).size > 1) fallos.push(`"${m[0]}" partida`);
        }
        return fallos.length ? [`${nombre.textContent}: ${fallos.join(', ')}`] : [];
      }));
      t.ok(malas.length === 0, `[${ancho}] con el control abierto: ${malas.join(' | ')}`);
    }
    await ctx.close();
  }

  // Con menos movimiento el panel solo aparece: sin transicion ni scale.
  {
    const ctx = await t.contexto({ ...VENTANAS.escritorio, reducedMotion: 'reduce' }, { nombre: 'quieto' });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('[role="combobox"]');
    await p.focus('[role="combobox"]');
    await p.keyboard.press('Enter');
    await esperaQue(() => p.evaluate(() => document.querySelector('[role="combobox"]').getAttribute('aria-expanded') === 'true'));
    const q = await p.evaluate(() => {
      const l = document.querySelector('.orden-lista');
      return { anima: l.getAnimations().length, transform: getComputedStyle(l).transform, opacidad: getComputedStyle(l).opacity };
    });
    t.ok(q.anima === 0 && q.transform === 'none' && q.opacidad === '1', `[quieto] con menos movimiento el panel se anima (${JSON.stringify(q)})`);
    await ctx.close();
  }
}
