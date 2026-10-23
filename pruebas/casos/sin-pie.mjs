// El sitio sin pie de pagina (seccion 4 del plan), en escritorio y en el
// telefono (390 px, tactil):
// - ninguna vista lleva <footer>;
// - "Tu pedido se guardo..." sale en la canasta, bajo "Ir a pagar", solo si
//   hay algo en ella;
// - al llegar al final de una vista (tambien las de la cuenta: entrar,
//   crear, verificar, recuperar y Mis datos), lo ultimo que se lee o se
//   pulsa no queda pegado al borde ni debajo de la canasta flotante.
import { VENTANAS, ANA, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'sin pie: ninguna vista con <footer>, el guardado en la canasta bajo Ir a pagar, y el final de cada vista libre de la canasta flotante';
export const limite = 120;

const VISTAS = ['#/', '#/nosotros', '#/tienda-catalogo', '#/contacto', '#/cuenta/entrar', '#/cuenta/crear', '#/cuenta/recuperar'];
// Lo ultimo que se lee o se pulsa en cada vista.
const ULTIMO = {
  '#/': '.cinta-enlace:last-of-type',
  '#/nosotros': '.principles > div:last-child',
  '#/tienda-catalogo': '.product-card:not([hidden]):last-of-type .card-mas, .product-card:not([hidden]):last-of-type .card-agotado',
  '#/contacto': '.contacto-nota',
  '#/cuenta/entrar': '.cuenta-vista .cuenta-pie',
  '#/cuenta/crear': '.cuenta-vista .cuenta-pie',
  '#/cuenta/recuperar': '.cuenta-vista .cuenta-pie',
};

export default async function sinPie(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto({ ...ventana, reducedMotion: 'reduce' }, { nombre });
    const p = await ctx.newPage();
    const pulsar = (sel) => (nombre === 'movil' ? p.locator(sel).first().tap() : p.locator(sel).first().click());

    for (const hash of VISTAS) {
      await p.goto(t.REACT + 'index.html' + hash);
      await p.reload();
      await p.waitForSelector(ULTIMO[hash].split(',')[0].trim().replace(':last-of-type', '').replace(':last-child', ''));
      await espera(400);
      await mirarFinal(t, p, nombre, hash, ULTIMO[hash]);
    }

    // La canasta vacia no habla de lo guardado; con algo, lo dice bajo "Ir a pagar".
    await p.goto(t.REACT + 'index.html#/tienda-catalogo');
    await p.reload();
    await p.waitForSelector('.product-card:not([hidden]) .card-mas');
    await pulsar('.floating-whatsapp.is-canasta');
    await p.waitForSelector('.canasta-panel.is-open');
    await espera(300);
    t.ok(!(await p.isVisible('.canasta-guardado')), `[${nombre}] con la canasta vacia sale "Tu pedido se guardo"`);
    await p.keyboard.press('Escape');
    await esperaQue(() => p.evaluate(() => !document.querySelector('.canasta-panel.is-open')));
    await pulsar('.product-card:not([hidden]) .card-mas');
    await espera(300);
    await pulsar('.floating-whatsapp.is-canasta');
    await p.waitForSelector('.canasta-panel.is-open .canasta-guardado:not([hidden])');
    const g = await p.evaluate(() => {
      const nota = document.querySelector('.canasta-guardado');
      const boton = document.querySelector('.canasta-enviar');
      return {
        texto: nota.textContent.trim(),
        debajo: nota.getBoundingClientRect().top >= boton.getBoundingClientRect().bottom,
        enPanel: Boolean(nota.closest('.canasta-panel .canasta-pie')),
        dentro: nota.getBoundingClientRect().bottom <= window.innerHeight,
      };
    });
    t.ok(/^Tu pedido se guardó .+ en este navegador\.$/.test(g.texto), `[${nombre}] la canasta no dice cuando se guardo el pedido ("${g.texto}")`);
    t.ok(g.debajo && g.enPanel && g.dentro, `[${nombre}] "Tu pedido se guardo" no va en el pie de la canasta, bajo "Ir a pagar" y a la vista (${JSON.stringify(g)})`);

    // Verificar el correo ("Cambiar el correo" es lo ultimo) y Mis datos, con
    // la canasta flotante a la vista porque hay algo en ella.
    await p.goto(t.REACT + 'index.html#/cuenta/crear');
    await p.reload();
    await p.waitForSelector('#cuenta-nombre');
    await p.fill('#cuenta-nombre', ANA.nombre);
    await p.fill('#cuenta-correo', ANA.correo);
    await p.fill('#cuenta-telefono', ANA.telefono);
    await p.fill('#cuenta-clave', ANA.clave);
    await p.fill('#cuenta-repite', ANA.clave);
    await p.click('.cuenta-crear');
    await p.waitForSelector('.codigo-falso');
    await espera(400);
    await mirarFinal(t, p, nombre, '#/cuenta/verificar', '.cuenta-cambiar');
    const codigo = (await p.textContent('.codigo-valor')).trim();
    await p.click('.codigo-casilla >> nth=0');
    await p.keyboard.type(codigo);
    await p.waitForSelector('.cuenta-vista-datos');
    await espera(400);
    await mirarFinal(t, p, nombre, '#/cuenta', '.cuenta-vista .cuenta-pie');
    await ctx.close();
  }
}

// Al final de la vista: sin pie, con aire hasta el borde y sin la canasta
// flotante encima de lo ultimo (sel: lo ultimo que se lee o se pulsa).
async function mirarFinal(t, p, nombre, donde, sel) {
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await espera(300);
  const m = await p.evaluate((s) => {
    const lista = [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length);
    const e = lista[lista.length - 1];
    const r = e.getBoundingClientRect();
    const flotante = document.querySelector('.floating-whatsapp.is-canasta');
    const f = flotante && getComputedStyle(flotante).position === 'fixed' && flotante.getClientRects().length ? flotante.getBoundingClientRect() : null;
    const pisa = f ? Math.max(0, Math.min(r.right, f.right) - Math.max(r.left, f.left)) * Math.max(0, Math.min(r.bottom, f.bottom) - Math.max(r.top, f.top)) : 0;
    return {
      pies: document.querySelectorAll('footer, .site-footer').length,
      aire: Math.round(window.innerHeight - r.bottom),
      pisa,
    };
  }, sel);
  t.ok(m.pies === 0, `[${nombre}] ${donde} todavia lleva un pie`);
  t.ok(m.aire >= 16, `[${nombre}] al final de ${donde} lo ultimo queda pegado al borde (${m.aire} px)`);
  t.ok(m.pisa === 0, `[${nombre}] al final de ${donde} la canasta flotante tapa lo ultimo`);
}
