// Verificar el correo con Supabase Auth (el de mentira, pruebas/supabaseFalso.mjs):
// el estado del envio, la espera de 60 s para pedir otro (que no se reinicia
// al salir y volver), "Cambiar el correo" conserva lo escrito, reenviar
// limpia las casillas y el codigo viejo deja de valer, y si el reenvio falla
// se dice. Con el reloj de Playwright, sin esperar de verdad.
import { VENTANAS, espera } from '../arranque.mjs';
import { codigoDe, quebrar } from '../supabaseFalso.mjs';

export const descripcion = 'verificar: estado del envio, espera de 60 s, cambiar el correo, reenviar y reenvio que falla';
export const limite = 90;

const CODIGO_MAL = 'Ese código no es el que enviamos o ya caducó. Míralo otra vez o pide otro.';

export default async function reenviar(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    await p.clock.install();
    await p.goto(t.REACT + '#/cuenta/crear');
    await p.fill('#cuenta-nombre', 'Ana Pérez');
    await p.fill('#cuenta-correo', 'ana@correo.com');
    await p.fill('#cuenta-telefono', '991234567');
    await p.fill('#cuenta-direccion', 'Calle 1');
    await p.fill('#cuenta-clave', 'Clave123');
    await p.fill('#cuenta-repite', 'Clave123');
    await p.click('.cuenta-crear');
    await p.waitForSelector('.codigo-casilla');
    const aviso = () => p.evaluate(() => document.querySelector('[aria-live="polite"]').textContent);
    ok((await p.textContent('.codigo-estado')).startsWith('Código enviado.'), 'estado del envio: ' + await p.textContent('.codigo-estado'));
    const alertas = await p.evaluate(() => [...document.querySelector('.cuenta-verificar').parentElement.querySelectorAll('[role="alert"]')].map((e) => e.outerHTML));
    ok(alertas.length === 0, 'el pie de verificar aun tiene role=alert: ' + alertas.join(' '));
    const c1 = codigoDe('ana@correo.com');
    ok(/^\d{6}$/.test(c1), `no llego un codigo: ${c1}`);
    ok((await p.textContent('.codigo-reenviar')) === 'Enviar otro código en 60s', await p.textContent('.codigo-reenviar'));
    await p.clock.runFor(10000);
    ok((await p.textContent('.codigo-reenviar')) === 'Enviar otro código en 50s', 'tras 10 s: ' + await p.textContent('.codigo-reenviar'));
    // Salir y volver no reinicia la espera. Antes, que crear acabe de irse: con
    // el reloj quieto su salida no termina sola.
    for (let k = 0; k < 20 && (await p.locator('.vista-marco.is-saliendo').count()); k += 1) { await p.clock.runFor(20); await espera(50); }
    await p.click('.cuenta-cambiar');
    await p.waitForSelector('#cuenta-nombre');
    ok((await p.inputValue('#cuenta-nombre')) === 'Ana Pérez' && (await p.inputValue('#cuenta-direccion')) === 'Calle 1', 'cambiar el correo no conserva lo escrito');
    ok((await p.inputValue('#cuenta-clave')) === '', 'la clave se conservo');
    await p.goBack();
    await p.waitForSelector('.codigo-reenviar');
    ok((await p.textContent('.codigo-reenviar')) === 'Enviar otro código en 50s', 'volver reinicio la espera: ' + await p.textContent('.codigo-reenviar'));
    await p.clock.runFor(51000);
    ok(!(await p.isDisabled('.codigo-reenviar')) && (await p.textContent('.codigo-reenviar')) === 'Enviar otro código', 'tras 60 s: ' + await p.textContent('.codigo-reenviar'));
    await p.click('.codigo-casilla >> nth=0');
    await p.keyboard.type('12');
    await p.click('.codigo-reenviar');
    await espera(300);
    const c2 = codigoDe('ana@correo.com');
    ok((await p.evaluate(() => [...document.querySelectorAll('.codigo-casilla')].map((c) => c.value).join(''))) === '', 'reenviar no limpio las casillas');
    ok(await p.evaluate(() => document.activeElement === document.querySelector('.codigo-casilla')), 'foco tras reenviar');
    ok((await aviso()) === 'Te enviamos un código nuevo.', 'aviso reenviar: ' + await aviso());
    ok(await p.isDisabled('.codigo-reenviar'), 'reenviar no vuelve a esperar');
    // El codigo viejo ya no vale (si por azar salio el mismo, no se puede ver).
    if (c1 !== c2) {
      await p.keyboard.type(c1);
      await espera(300);
      ok(await p.isVisible('#cuenta-codigo-error'), 'el codigo viejo valio');
      // Una sola via: el foco en la primera casilla, que lo describe, y nada en el pie.
      ok(await p.evaluate(() => document.activeElement === document.querySelector('.codigo-casilla')
        && document.getElementById(document.activeElement.getAttribute('aria-describedby')).textContent.includes('no es el que enviamos')), 'foco o describedby del error');
      ok((await p.$$('[role="alert"]:not([hidden])')).length === 0, 'el error salio en un role=alert');
      // Enter en la primera casilla con el mismo codigo: el foco ya esta ahi, va por avisos.
      await p.keyboard.press('Enter');
      await espera(300);
      ok((await aviso()) === CODIGO_MAL, 'Enter en la primera no lo dijo: ' + await aviso());
      await p.click('.codigo-casilla >> nth=0');
    }
    // Si el reenvio falla en el servidor, se dice en pantalla y al lector.
    await p.clock.runFor(61000);
    quebrar(ctx, '/resend');
    await p.click('.codigo-reenviar');
    await espera(300);
    ok((await p.textContent('.codigo-estado')).startsWith('No pudimos enviarte el correo'), 'el fallo del reenvio no se ve: ' + await p.textContent('.codigo-estado'));
    ok((await aviso()) === 'No pudimos enviar el correo. Pide otro código en un momento.', 'el fallo del reenvio no se dice: ' + await aviso());
    quebrar(ctx, null);
    await p.click('.codigo-casilla >> nth=0');
    await p.keyboard.type(c2);
    for (let k = 0; k < 10 && (await p.evaluate(() => location.hash)) !== '#/cuenta'; k += 1) {
      await p.clock.runFor(200);
      await espera(200);
    }
    ok((await p.evaluate(() => location.hash)) === '#/cuenta', 'no llego a #/cuenta: ' + await p.evaluate(() => location.hash));
    ok((await aviso()) === 'Correo verificado. Iniciaste sesión como Ana Pérez.', 'aviso verificado: ' + await aviso());
    await ctx.close();
  }
}
