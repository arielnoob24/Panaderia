// Lo que queda de una recuperacion a medias (revision de calidad de la fase
// 5): 1) un codigo acertado y sin usar no sobrevive a entrar y salir ni a sus
// 10 minutos; 2) "Cambiar el correo" no se salta los 45 s ni los 5 intentos;
// 3) el aviso de "la cuenta cambio" se ve en el paso del correo.
import { VENTANAS, crearCuenta, espera } from '../arranque.mjs';

export const descripcion = 'recuperar a medias: el codigo caduca, no sobrevive a entrar y no regala intentos';
export const limite = 120;

export default async function recuperarAMedias(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    let falla = true; let ultimo = null; const correos = [];
    const ctx = await t.contexto(ventana, {
      nombre: nv,
      correo: (r) => {
        const cuerpo = JSON.parse(r.request().postData() || '{}').template_params || {};
        correos.push(cuerpo);
        if (falla) return r.abort();
        ultimo = (String(cuerpo.cuerpo).match(/\d{6}/) || [])[0];
        return r.fulfill({ status: 200, body: 'OK' });
      },
    });
    const p = await ctx.newPage();
    const ir = (h) => p.evaluate((x) => { location.hash = x; }, h);
    const huella = async () => JSON.parse(await p.evaluate(() => localStorage.getItem('eltradicional-cuenta'))).clave.hash;
    const avisoPie = () => p.textContent('.recuperar-paso-correo .cuenta-aviso', { timeout: 2000 }).catch(() => '');
    const pedir = async () => {
      await ir('#/cuenta/recuperar'); await p.waitForSelector('#cuenta-recuperar-correo');
      await p.fill('#cuenta-recuperar-correo', 'ana@correo.com'); await p.click('.recuperar-paso-correo .cuenta-recuperar');
    };
    const escribir = async (c) => { await p.click('.codigo-casilla >> nth=0'); await p.keyboard.type(c); await espera(300); };

    await p.clock.install();
    await crearCuenta(p, t.REACT); falla = false;
    await p.click('.cuenta-salir'); await espera(400);
    const original = await huella();

    // --- 2: Cambiar el correo no da otro correo ni intentos nuevos.
    await pedir(); await p.waitForSelector('.codigo-casilla');
    const c1 = ultimo; const malo = c1 === '111111' ? '222222' : '111111';
    const n0 = correos.length;
    await escribir(malo); await escribir(malo);
    await p.click('.recuperar-paso-codigo .cuenta-cambiar'); await p.waitForSelector('#cuenta-recuperar-correo');
    ok((await p.inputValue('#cuenta-recuperar-correo')) === 'ana@correo.com', 'cambiar el correo no deja el correo puesto');
    await p.fill('#cuenta-recuperar-correo', 'ana@correo.com'); await p.click('.recuperar-paso-correo .cuenta-recuperar');
    await p.waitForSelector('.recuperar-paso-codigo .codigo-casilla');
    ok(correos.length === n0, `cambiar el correo mando otro correo (${correos.length - n0})`);
    ok(await p.isDisabled('.codigo-reenviar'), 'reenviar no espera tras volver');
    await escribir(malo);
    const e3 = await p.textContent('#cuenta-recuperar-codigo-error');
    ok(e3 === 'Ese código no es el que enviamos. Te quedan 2 intentos.', `intentos tras cambiar el correo: ${e3}`);

    // --- 1: acertar, no terminar, entrar y salir: el codigo ya no vale.
    await escribir(c1);
    ok((await p.locator('#cuenta-recuperar-clave').count()) === 1, 'no llego al paso de la clave');
    await ir('#/cuenta/entrar'); await p.waitForSelector('#cuenta-entrar-correo');
    await p.fill('#cuenta-entrar-correo', 'ana@correo.com'); await p.fill('#cuenta-entrar-clave', 'Clave123');
    await p.click('.cuenta-entrar'); await p.waitForSelector('.cuenta-vista-datos');
    await p.click('.cuenta-salir'); await espera(400);
    await p.clock.runFor(30 * 60 * 1000); await espera(200);
    await ir('#/cuenta/recuperar'); await espera(600);
    ok((await p.locator('#cuenta-recuperar-clave').count()) === 0, 'tras entrar y salir, paso de la clave sin codigo');
    ok((await p.locator('#cuenta-recuperar-correo').count()) === 1, 'tras entrar y salir no esta el paso del correo');
    ok((await huella()) === original, 'la contrasena cambio');

    // --- 1: acertar y dejar pasar los 10 minutos sin salir de la pestana.
    await pedir(); await p.waitForSelector('.codigo-casilla');
    await escribir(ultimo);
    await ir('#/cuenta/entrar'); await p.waitForSelector('#cuenta-entrar-correo');
    await p.clock.runFor(11 * 60 * 1000); await espera(200);
    await ir('#/cuenta/recuperar'); await espera(600);
    ok((await p.locator('#cuenta-recuperar-clave').count()) === 0, 'caducado: abre el paso de la clave');
    ok((await avisoPie()).startsWith('El código caducó'), `caducado al pintar, aviso: ${await avisoPie()}`);
    // ...y con el paso de la clave en pantalla al pulsar.
    await p.clock.runFor(60 * 1000); await espera(100);
    await pedir(); await p.waitForSelector('.codigo-casilla');
    await escribir(ultimo); await p.waitForSelector('#cuenta-recuperar-clave');
    await p.clock.runFor(11 * 60 * 1000); await espera(200);
    await p.fill('#cuenta-recuperar-clave', 'Otra1234'); await p.fill('#cuenta-recuperar-repite', 'Otra1234');
    await p.click('.recuperar-paso-clave .cuenta-recuperar'); await espera(1500);
    ok((await p.locator('#cuenta-recuperar-clave').count()) === 0, 'caducado al pulsar: sigue en la clave');
    ok((await avisoPie()).startsWith('El código caducó'), `caducado al pulsar, aviso: ${await avisoPie()}`);
    ok((await huella()) === original, 'caducado: la contrasena cambio');
    ok((await p.evaluate(() => location.hash)) === '#/cuenta/recuperar', `caducado: se fue a ${await p.evaluate(() => location.hash)}`);

    // --- 3: la cuenta cambia en otra pestana mientras se escribe la clave.
    await p.clock.runFor(60 * 1000); await espera(100);
    await pedir(); await p.waitForSelector('.codigo-casilla');
    await escribir(ultimo); await p.waitForSelector('#cuenta-recuperar-clave');
    await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('eltradicional-cuenta')); c.correo = 'luis@correo.com'; localStorage.setItem('eltradicional-cuenta', JSON.stringify(c)); });
    await p.fill('#cuenta-recuperar-clave', 'Otra1234'); await p.fill('#cuenta-recuperar-repite', 'Otra1234');
    await p.click('.recuperar-paso-clave .cuenta-recuperar'); await espera(1500);
    ok((await avisoPie()) === 'La cuenta de este navegador cambió mientras tanto. Vuelve a pedir el código.', `aviso de cuenta cambiada: ${await avisoPie()}`);
    ok((await huella()) === original, 'cuenta cambiada: la contrasena cambio');
    await ctx.close();
  }
}
