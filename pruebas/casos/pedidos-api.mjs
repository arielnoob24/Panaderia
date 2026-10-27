// Los pedidos en la base, por la API (el Supabase de mentira,
// pruebas/supabaseFalso.mjs): pagar registra el pedido y el comprobante
// ensena el numero que dio la base; si la API falla no hay pedido, se dice
// junto al boton y la canasta sigue igual; Mis pedidos los lee de la base,
// asi que se ven aunque este navegador no tenga nada guardado.
import { VENTANAS, crearCuenta, espera, hashDe, llegar } from '../arranque.mjs';
import { pedidosDe, quebrar } from '../supabaseFalso.mjs';

export const descripcion = 'pagar registra el pedido en la base; si falla, no se pierde la canasta; Mis pedidos desde la base';
export const limite = 90;

export default async function pedidosApi(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT);

    // Dos cosas en la canasta y a confirmar.
    await llegar(p, '#/tienda-catalogo');
    await p.waitForSelector('.product-card .card-mas');
    await p.locator('.product-card .card-mas').nth(0).click();
    await p.locator('.product-card .card-mas').nth(1).click();
    await espera(700);
    await p.click('.floating-whatsapp.is-canasta'); await espera(400);
    await p.click('.canasta-enviar');
    await p.waitForFunction(() => location.hash === '#/confirmar', null, { timeout: 5000 }).catch(() => {});
    ok((await hashDe(p)) === '#/confirmar', `no llego a confirmar: ${await hashDe(p)}`);

    // La API falla: no hay pedido, se dice junto al boton y no se vacia nada.
    quebrar(ctx, '/pedidos');
    const canastaAntes = await p.evaluate(() => localStorage.getItem('eltradicional-pedido'));
    await p.click('.canasta-pagar');
    await p.waitForSelector('.pago-error:not([hidden])', { timeout: 6000 }).catch(() => {});
    const error = (await p.textContent('.pago-error')) || '';
    ok(error.startsWith('No pudimos registrar tu pedido') && error.includes('No se cobró nada'), `error al fallar la API: ${error}`);
    ok((await hashDe(p)) === '#/confirmar', `con la API fallando se fue a ${await hashDe(p)}`);
    ok(!(await p.isDisabled('.canasta-pagar')) && !(await p.textContent('.canasta-pagar')).includes('Procesando'), 'el boton sigue procesando');
    ok(await p.evaluate(() => document.activeElement?.classList.contains('canasta-pagar')), 'el foco no volvio al boton');
    ok((await p.evaluate(() => localStorage.getItem('eltradicional-pedido'))) === canastaAntes, 'la canasta cambio sin pedido');
    ok(pedidosDe('ana@correo.com').length === 0, 'quedo un pedido en la base');

    // Con la API bien: el comprobante lleva el numero y el total de la base.
    quebrar(ctx, null);
    await p.click('.canasta-pagar');
    await p.waitForFunction(() => location.hash === '#/comprobante', null, { timeout: 8000 }).catch(() => {});
    ok((await hashDe(p)) === '#/comprobante', `tras pagar: ${await hashDe(p)}`);
    const enBase = pedidosDe('ana@correo.com');
    ok(enBase.length === 1, `pedidos en la base: ${enBase.length}`);
    const numero = (await p.textContent('.recibo-numero'))?.trim();
    ok(enBase[0] && numero === enBase[0].numero, `el numero no es el de la base: ${numero} / ${enBase[0]?.numero}`);
    const total = (await p.textContent('.recibo-total'))?.trim();
    ok(enBase[0] && total === `$${enBase[0].total.toFixed(2)}`, `el total no es el de la base: ${total} / ${enBase[0]?.total}`);

    // Mis pedidos desde la base: aunque se borre lo de este navegador.
    await p.evaluate(() => new Promise((listo) => { const r = indexedDB.deleteDatabase('eltradicional'); r.onsuccess = r.onerror = r.onblocked = () => listo(); }));
    await p.reload();
    await llegar(p, '#/cuenta/pedidos');
    await p.waitForSelector('.cuenta-pedido-numero', { timeout: 5000 }).catch(() => {});
    const numeros = await p.locator('.cuenta-pedido-numero').allTextContents();
    ok(numeros.length === 1 && numeros[0].trim() === numero, `Mis pedidos sin nada en el navegador: ${numeros.join(', ')}`);
    await ctx.close();
  }
}
