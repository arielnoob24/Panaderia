// Los 6 puntos del "Movimiento de la cuenta" (seccion 15 del plan, fase 5),
// con y sin menos movimiento: el fundido de los errores, el visto con rebote,
// de crear a verificar de lado, las casillas que se llenan, "Guardado" unos
// 2 s y Mis pedidos que anima la altura y gira la flecha.
import { VENTANAS, espera, meterPedidos, PEDIDO_EJEMPLO } from '../arranque.mjs';

export const descripcion = 'el movimiento de la cuenta (6 puntos), con y sin menos movimiento';
export const limite = 120;

// Escala, desplazamiento y opacidad de un elemento en este instante.
const como = (p, sel) => p.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const m = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform);
  return { x: m.m41, escala: m.a, opacidad: Number(cs.opacity), alto: el.getBoundingClientRect().height };
}, sel);

async function movimiento(t, nombre, ventana, reducido) {
  const etiqueta = `${nombre}${reducido ? ' reducido' : ''}`;
  const ok = (c, q) => t.ok(c, `[${etiqueta}] ${q}`);
  const ctx = await t.contexto({ ...ventana, reducedMotion: reducido ? 'reduce' : 'no-preference' }, { nombre: etiqueta });
  const p = await ctx.newPage();
  const activo = () => p.evaluate(() => {
    const a = document.activeElement;
    return a?.id || a?.getAttribute('aria-label') || a?.textContent?.trim().slice(0, 30) || a?.tagName;
  });
  await p.goto(t.REACT + '#/cuenta/crear');
  await p.waitForSelector('#cuenta-nombre');
  await espera(300);

  // 6. Error con fundido.
  await p.fill('#cuenta-nombre', 'Ana');
  await p.press('#cuenta-nombre', 'Tab');
  await espera(30);
  const err = await como(p, '#cuenta-nombre-error .texto-suave');
  ok(err && (reducido ? err.opacidad === 1 : err.opacidad < 1), `fundido del error: ${JSON.stringify(err)}`);
  await espera(400);
  ok((await como(p, '#cuenta-nombre-error .texto-suave'))?.opacidad === 1, 'el error no acaba de verse');
  ok((await p.textContent('#cuenta-nombre-error')) === 'Falta el apellido.', 'texto del error');

  // 1. El visto con rebote.
  await p.fill('#cuenta-clave', 'a');
  await espera(40);
  const v = await como(p, '[data-regla] .cuenta-regla-visto');
  ok(v && (reducido ? v.escala === 1 : Math.abs(v.escala - 1) > 0.01), `visto en movimiento: ${JSON.stringify(v)}`);
  if (!reducido) {
    // El resorte se pasa de 1 antes de quedarse: eso es el rebote.
    let maximo = 0;
    for (let i = 0; i < 20; i += 1) { const e = await como(p, '[data-regla] .cuenta-regla-visto'); maximo = Math.max(maximo, e?.escala || 0); await espera(12); }
    ok(maximo > 1.01, `el visto no rebota (maximo ${maximo})`);
  }
  await espera(400);
  ok((await p.locator('.cuenta-regla-visto').count()) === 1, 'un visto con una minuscula');
  await p.fill('#cuenta-clave', '');
  await espera(reducido ? 50 : 400);
  ok((await p.locator('.cuenta-regla-visto').count()) === 0, 'el visto no se va al dejar de cumplirse');

  // 2. De crear a verificar.
  await p.fill('#cuenta-nombre', 'Ana María Pérez');
  await p.fill('#cuenta-correo', 'ana@correo.com');
  await p.fill('#cuenta-telefono', '991234567');
  await p.fill('#cuenta-clave', 'Clave123');
  await p.fill('#cuenta-repite', 'Clave123');
  await p.click('.cuenta-crear');
  await p.waitForSelector('.cuenta-vista-verificar');
  await espera(40);
  const sale = await como(p, '.vista-marco.is-saliendo');
  const entra = await como(p, '.vista-marco:not(.is-saliendo)');
  if (reducido) {
    ok(!sale || sale.opacidad === 0, `con menos movimiento crear se ve saliendo: ${JSON.stringify(sale)}`);
    ok(entra?.x === 0, `con menos movimiento verificar se desplaza: ${JSON.stringify(entra)}`);
  } else {
    ok(sale && sale.x < 0, `crear no sale por la izquierda: ${JSON.stringify(sale)}`);
    ok(entra && entra.x > 0, `verificar no entra por la derecha: ${JSON.stringify(entra)}`);
    ok(await p.evaluate(() => document.querySelector('.vista-marco.is-saliendo')?.inert === true), 'lo que sale no es inert');
  }
  await espera(500);
  ok((await p.locator('.vista-marco').count()) === 1, 'crear no se va');
  ok((await como(p, '.vista-marco'))?.x === 0, 'verificar no se queda en su sitio');
  ok((await activo()) === 'cuenta-vista-titulo', `foco en verificar: ${await activo()}`);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'desplazamiento horizontal tras la transicion');

  // 3. Las casillas: se llenan y dan su saltito.
  await p.waitForSelector('.codigo-falso');
  await p.focus('.codigo-casilla >> nth=0');
  await p.keyboard.type('1');
  const llena = await p.evaluate(() => { const c = document.querySelector('.codigo-casilla'); return [c.classList.contains('is-llena'), getComputedStyle(c).animationName]; });
  ok(llena[0], 'la casilla no se marca llena');
  ok(reducido ? llena[1] === 'none' : llena[1] === 'codigo-pon', `animacion de la casilla: ${llena[1]}`);
  ok((await activo()) === 'Cifra 2 de 6', 'el foco no salta a la siguiente');
  // Un codigo malo, para ver el error de las casillas con su fundido.
  const codigo = (await p.textContent('.codigo-valor')).trim();
  const malo = codigo.slice(1).split('').map((d) => String((Number(d) + 1) % 10)).join('');
  await p.keyboard.type(malo);
  await espera(30);
  const ec = await como(p, '#cuenta-codigo-error .texto-suave');
  ok(ec && (reducido ? ec.opacidad === 1 : ec.opacidad < 1), `fundido del error del codigo: ${JSON.stringify(ec)}`);
  ok(await p.evaluate(() => document.querySelectorAll('.codigo-casilla.is-mal').length === 6), 'casillas sin is-mal');
  await p.focus('.codigo-casilla >> nth=5');
  for (let i = 0; i < 6; i += 1) await p.keyboard.press('Backspace');
  await p.keyboard.type(codigo);
  await p.waitForSelector('.cuenta-vista-datos');

  // 5. "Guardado ✓" unos 2 s, ademas del aviso.
  await espera(300);
  await p.click('.cuenta-guardar');
  await espera(reducido ? 50 : 450);
  ok((await p.textContent('.cuenta-guardar')).trim() === 'Guardado ✓', `boton tras guardar: ${await p.textContent('.cuenta-guardar')}`);
  ok((await p.evaluate(() => document.querySelector('[aria-live="polite"]').textContent)).includes('Guardamos tus cambios.'), 'sin aviso aria-live');
  ok((await activo()).includes('Guardado'), `el foco se va del boton: ${await activo()}`);
  await espera(1100);
  ok((await p.textContent('.cuenta-guardar')).trim() === 'Guardado ✓', 'Guardado dura menos de 1,5 s');
  await espera(1100);
  ok((await p.textContent('.cuenta-guardar')).trim() === 'Guardar los cambios', `no vuelve a Guardar: ${await p.textContent('.cuenta-guardar')}`);

  // 4. Mis pedidos: la altura crece y la flecha gira.
  await meterPedidos(p, [{ ...PEDIDO_EJEMPLO }]);
  await p.click('.cuenta-ver-pedidos');
  await p.waitForSelector('details.cuenta-pedido');
  await espera(400);
  const flecha = () => p.evaluate(() => getComputedStyle(document.querySelector('.cuenta-pedido summary'), '::after').transform);
  const cerrada = await flecha();
  await p.click('.cuenta-pedido summary');
  await espera(60);
  const medio = await como(p, '.cuenta-pedido-despliegue');
  const flechaMedio = await flecha();
  await espera(500);
  const lleno = await como(p, '.cuenta-pedido-despliegue');
  ok(lleno.alto > 100, `el detalle no se abre del todo: ${lleno.alto}`);
  ok(reducido ? medio.alto === lleno.alto : medio.alto > 0 && medio.alto < lleno.alto, `la altura no se anima: ${medio.alto} de ${lleno.alto}`);
  ok(await p.evaluate(() => document.querySelector('details.cuenta-pedido').open), 'details sin open');
  ok((await flecha()) !== cerrada, 'la flecha no gira');
  if (!reducido) ok(flechaMedio !== cerrada && flechaMedio !== (await flecha()), `la flecha salta en vez de girar: ${flechaMedio}`);
  // Con el teclado se pliega igual.
  await p.focus('.cuenta-pedido summary');
  await p.keyboard.press('Enter');
  await espera(60);
  const plegando = await p.evaluate(() => [document.querySelector('details.cuenta-pedido').open, document.querySelector('.cuenta-pedido-despliegue').getBoundingClientRect().height]);
  if (!reducido) ok(plegando[0] && plegando[1] > 0, `se cierra de golpe: ${plegando}`);
  await espera(500);
  ok(!(await p.evaluate(() => document.querySelector('details.cuenta-pedido').open)), 'Enter no lo cierra');
  ok((await flecha()) === cerrada, 'la flecha no vuelve');
  await p.keyboard.press(' ');
  await espera(500);
  ok(await p.evaluate(() => document.querySelector('details.cuenta-pedido').open), 'Espacio no lo abre');
  await ctx.close();
}

export default async function movimientoCuenta(t) {
  for (const reducido of [false, true]) {
    await movimiento(t, 'escritorio', VENTANAS.escritorio, reducido);
    await movimiento(t, 'movil', VENTANAS.movil, reducido);
  }
}
