// Verificar el correo con EmailJS caido: el aviso de que el codigo esta en
// pantalla, la espera de 45 s (que no se reinicia al salir y volver),
// "Cambiar el correo" conserva lo escrito, reenviar limpia las casillas y el
// codigo viejo deja de valer. Con el reloj de Playwright, sin esperar de verdad.
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'verificar: aviso sin correo, espera de 45 s, cambiar el correo y reenviar';
export const limite = 90;

const SIN_CORREO = 'No pudimos enviar el correo; el código está en pantalla.';

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
    await p.waitForSelector('.codigo-falso');
    const aviso = () => p.evaluate(() => document.querySelector('[aria-live="polite"]').textContent);
    // Con el reloj instalado, el fallo del envio llega cuando se le deja correr.
    const hastaAviso = async (texto) => {
      for (let k = 0; k < 10 && (await aviso()) !== texto; k += 1) { await p.clock.runFor(100); await espera(100); }
    };
    await hastaAviso(SIN_CORREO);
    ok((await aviso()) === SIN_CORREO, 'aviso al fallar el envio: ' + await aviso());
    const alertas = await p.evaluate(() => [...document.querySelector('.cuenta-verificar').parentElement.querySelectorAll('[role="alert"]')].map((e) => e.outerHTML));
    ok(alertas.length === 0, 'el pie de verificar aun tiene role=alert: ' + alertas.join(' '));
    const c1 = await p.textContent('.codigo-valor');
    ok((await p.textContent('.codigo-reenviar')) === 'Enviar otro código en 45s', await p.textContent('.codigo-reenviar'));
    await p.clock.runFor(10000);
    ok((await p.textContent('.codigo-reenviar')) === 'Enviar otro código en 35s', 'tras 10 s: ' + await p.textContent('.codigo-reenviar'));
    // Salir y volver no reinicia la espera. Antes, que crear acabe de irse: con
    // el reloj quieto su salida no termina sola, y si se vuelve mientras sale,
    // vuelve la misma hoja con la contrasena escrita (pasa tambien con el reloj
    // de verdad si se pulsa en sus 220 ms; esta apuntado para frontend).
    for (let k = 0; k < 20 && (await p.locator('.vista-marco.is-saliendo').count()); k += 1) { await p.clock.runFor(20); await espera(50); }
    await p.click('.cuenta-cambiar');
    await p.waitForSelector('#cuenta-nombre');
    ok((await p.inputValue('#cuenta-nombre')) === 'Ana Pérez' && (await p.inputValue('#cuenta-direccion')) === 'Calle 1', 'cambiar el correo no conserva lo escrito');
    ok((await p.inputValue('#cuenta-clave')) === '', 'la clave se conservo');
    await p.goBack();
    await p.waitForSelector('.codigo-reenviar');
    ok((await p.textContent('.codigo-reenviar')) === 'Enviar otro código en 35s', 'volver reinicio la espera: ' + await p.textContent('.codigo-reenviar'));
    await p.clock.runFor(36000);
    ok(!(await p.isDisabled('.codigo-reenviar')) && (await p.textContent('.codigo-reenviar')) === 'Enviar otro código', 'tras 45 s: ' + await p.textContent('.codigo-reenviar'));
    await p.click('.codigo-casilla >> nth=0');
    await p.keyboard.type('12');
    await p.click('.codigo-reenviar');
    const c2 = await p.textContent('.codigo-valor');
    ok((await p.evaluate(() => [...document.querySelectorAll('.codigo-casilla')].map((c) => c.value).join(''))) === '', 'reenviar no limpio las casillas');
    ok(await p.evaluate(() => document.activeElement === document.querySelector('.codigo-casilla')), 'foco tras reenviar');
    ok(['Te enviamos un código nuevo.', SIN_CORREO].includes(await aviso()), 'aviso reenviar: ' + await aviso());
    await hastaAviso(SIN_CORREO);
    ok((await aviso()) === SIN_CORREO, 'aviso del fallo tras reenviar: ' + await aviso());
    ok(await p.isDisabled('.codigo-reenviar'), 'reenviar no vuelve a esperar');
    // El codigo viejo ya no vale (si por azar salio el mismo, no se puede ver).
    if (c1 !== c2) {
      await p.keyboard.type(c1);
      ok(await p.isVisible('#cuenta-codigo-error'), 'el codigo viejo valio');
      // Una sola via: el foco en la primera casilla, que lo describe, y nada en el pie.
      ok(await p.evaluate(() => document.activeElement === document.querySelector('.codigo-casilla')
        && document.getElementById(document.activeElement.getAttribute('aria-describedby')).textContent.includes('no es el que enviamos')), 'foco o describedby del error');
      ok((await p.$$('[role="alert"]:not([hidden])')).length === 0, 'el error salio en un role=alert');
      // Enter en la primera casilla con el mismo codigo: el foco ya esta ahi, va por avisos.
      await p.keyboard.press('Enter');
      ok((await aviso()) === 'Ese código no es el que enviamos. Míralo otra vez.', 'Enter en la primera no lo dijo: ' + await aviso());
      await p.click('.codigo-casilla >> nth=0');
    }
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
