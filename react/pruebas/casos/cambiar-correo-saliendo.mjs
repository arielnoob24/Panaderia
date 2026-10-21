// "Cambiar el correo" pulsado mientras crear todavia se va (sus 220 ms hacia
// la izquierda) monta una hoja nueva: con lo escrito, pero sin las
// contrasenas. Antes volvia la misma hoja que salia, con ellas puestas. Con
// el reloj de Playwright la salida no avanza sola: asi se pulsa a tiempo.
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = '"Cambiar el correo" mientras crear sale monta una hoja nueva, sin las contrasenas';
export const limite = 60;

export default async function cambiarCorreoSaliendo(t) {
  for (const nv of ['escritorio', 'movil']) {
    const ctx = await t.contexto(VENTANAS[nv], { nombre: nv });
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const p = await ctx.newPage();
    await p.clock.install();
    await p.goto(t.REACT + '#/cuenta/crear');
    await p.waitForSelector('#cuenta-nombre');
    await p.fill('#cuenta-nombre', 'Ana Pérez');
    await p.fill('#cuenta-correo', 'ana@correo.com');
    await p.fill('#cuenta-telefono', '991234567');
    await p.fill('#cuenta-clave', 'Clave123');
    await p.fill('#cuenta-repite', 'Clave123');
    await p.click('.cuenta-crear');
    await p.waitForSelector('.cuenta-cambiar');
    const saliendo = await p.locator('.vista-marco.is-saliendo').count();
    ok(saliendo === 1, `crear no se estaba yendo al volver (${saliendo})`);
    await p.click('.cuenta-cambiar');
    const nueva = '.vista-marco:not(.is-saliendo)';
    await p.waitForSelector(`${nueva} #cuenta-nombre`);
    ok((await p.inputValue(`${nueva} #cuenta-nombre`)) === 'Ana Pérez', 'la hoja nueva no conserva el nombre');
    ok((await p.inputValue(`${nueva} #cuenta-clave`)) === '' && (await p.inputValue(`${nueva} #cuenta-repite`)) === '', 'volvio la hoja con las contrasenas escritas');
    // Que la de antes acabe de irse: queda una sola, la nueva.
    for (let k = 0; k < 20 && (await p.locator('.vista-marco.is-saliendo').count()); k += 1) { await p.clock.runFor(50); await espera(50); }
    ok(await p.locator('#cuenta-clave').count() === 1, `quedan ${await p.locator('#cuenta-clave').count()} formularios de crear`);
    ok((await p.inputValue('#cuenta-clave')) === '', 'la contrasena sigue escrita');
    await ctx.close();
  }
}
