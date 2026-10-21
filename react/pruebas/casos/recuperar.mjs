// Recuperar la contrasena (#/cuenta/recuperar): correo que no es, correo que
// no sale (sin recuadro), 5 intentos, reenviar a los 45 s, caduca a los 10
// minutos, clave nueva, Atras, la vieja ya no vale, desde "Ir a pagar" a
// #/confirmar, y el sitio actual entra con la nueva.
import { VENTANAS, crearCuenta, espera, esperaQue, hashDe } from '../arranque.mjs';

export const descripcion = 'recuperar la contrasena por codigo, de punta a punta, y el sitio actual con la nueva';
export const limite = 150;

const SIN_CORREO = 'No pudimos enviar el correo. Inténtalo más tarde.';

export default async function recuperar(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    // El correo: cortado (falla) o bien, y de lo que se manda se saca el codigo.
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
    const URL = t.REACT;
    const aviso = () => p.evaluate(() => document.querySelector('[role=status][aria-live=polite]').textContent);
    const foco = () => p.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName);
    const hash = () => hashDe(p);
    const escribirCodigo = async (c) => { await p.click('.codigo-casilla >> nth=0'); await p.keyboard.type(c); await espera(150); };
    const error = () => p.textContent('#cuenta-recuperar-codigo-error');

    await p.clock.install();
    await crearCuenta(p, URL);
    const antes = await p.evaluate(() => JSON.parse(localStorage.getItem('eltradicional-cuenta')));
    await p.click('.cuenta-salir'); await esperaQue(async () => (await hash()) === '#/');

    // Iniciar sesion: titulo, boton y el enlace con el correo ya puesto.
    await p.goto(URL + '#/cuenta/entrar'); await p.waitForSelector('#cuenta-entrar-correo');
    ok((await p.textContent('h1')).trim() === 'Iniciar sesión', `titulo: ${await p.textContent('h1')}`);
    ok((await p.textContent('.cuenta-entrar')).trim() === 'Iniciar sesión', 'boton entrar');
    await p.fill('#cuenta-entrar-correo', 'ana@correo.com');
    await p.click('.cuenta-olvide-enlace');
    await p.waitForSelector('#cuenta-recuperar-correo');
    ok((await hash()) === '#/cuenta/recuperar', `no llego a recuperar: ${await hash()}`);
    ok((await p.inputValue('#cuenta-recuperar-correo')) === 'ana@correo.com', 'correo no puesto');
    ok((await p.textContent('.recuperar-limite')).includes('mismo navegador'), 'sin el limite del navegador');

    // Correo que no es el de la cuenta: el error de iniciar sesion, en el campo.
    await p.fill('#cuenta-recuperar-correo', 'otro@correo.com');
    await p.click('.cuenta-recuperar'); await espera(200);
    ok((await p.textContent('#cuenta-recuperar-correo-error')).startsWith('No hay ninguna cuenta con este correo'), `error correo: ${await p.textContent('#cuenta-recuperar-correo-error')}`);
    ok((await p.getAttribute('#cuenta-recuperar-correo', 'aria-invalid')) === 'true', 'sin aria-invalid');
    ok((await foco()) === 'cuenta-recuperar-correo', `foco tras error correo: ${await foco()}`);
    ok(correos.length === 1, `se mando un correo con el correo malo (${correos.length})`);

    // El correo no sale: no se recupera, y no hay recuadro con el codigo.
    await p.fill('#cuenta-recuperar-correo', 'Ana@Correo.com');
    await p.click('.cuenta-recuperar');
    await esperaQue(async () => (await p.textContent('.cuenta-pie .cuenta-aviso')) === SIN_CORREO);
    ok((await p.textContent('.cuenta-pie .cuenta-aviso')) === SIN_CORREO, `aviso sin correo: ${await p.textContent('.cuenta-pie .cuenta-aviso')}`);
    ok((await p.locator('.codigo-falso, .codigo-casilla').count()) === 0, 'hay recuadro o casillas sin correo');

    // Sale el codigo: casillas, foco en la primera, aviso.
    falla = false;
    await p.click('.cuenta-recuperar');
    await p.waitForSelector('.codigo-casilla');
    const c1 = ultimo;
    ok(/^\d{6}$/.test(c1 || ''), 'no se capturo el codigo');
    const ultimoCorreo = correos[correos.length - 1];
    ok(ultimoCorreo.a_correo === 'ana@correo.com' && /cambiar tu contraseña/.test(ultimoCorreo.cuerpo) && /contraseña/.test(ultimoCorreo.asunto), `correo raro: ${JSON.stringify(ultimoCorreo)}`);
    ok((await foco()) === 'Cifra 1 de 6', `foco al llegar al codigo: ${await foco()}`);
    ok(['Te enviamos un código a Ana@Correo.com.', 'Te enviamos un código a ana@correo.com.'].includes(await aviso()), `aviso codigo: ${await aviso()}`);
    ok(!(await p.content()).includes(c1), 'el codigo esta en la pagina');

    // Cinco intentos.
    const malo = c1 === '111111' ? '222222' : '111111';
    for (let i = 1; i <= 5; i += 1) {
      await escribirCodigo(malo);
      const e = await error();
      if (i < 4) ok(e === `Ese código no es el que enviamos. Te quedan ${5 - i} intentos.`, `intento ${i}: ${e}`);
      if (i === 4) ok(e === 'Ese código no es el que enviamos. Te queda 1 intento.', `intento 4: ${e}`);
      if (i === 5) ok(e.includes('ya no quedan intentos'), `intento 5: ${e}`);
      ok((await foco()) === 'Cifra 1 de 6', `foco tras intento ${i}: ${await foco()}`);
    }
    ok((await p.$$('.recuperar-paso [role="alert"]:not([hidden])')).length === 0, 'el error del codigo en un alert');
    await escribirCodigo(c1);
    ok((await error()).startsWith('Ya no quedan intentos'), `el bueno valio tras 5: ${await error()}`);

    // Reenviar a los 45 s.
    ok(await p.isDisabled('.codigo-reenviar'), 'reenviar sin esperar');
    await p.clock.runFor(46000); await espera(150);
    ok(!(await p.isDisabled('.codigo-reenviar')), 'reenviar sigue apagado');
    await p.click('.codigo-reenviar');
    await esperaQue(async () => (await aviso()) === 'Te enviamos un código nuevo.');
    ok((await aviso()) === 'Te enviamos un código nuevo.', `aviso reenviar: ${await aviso()}`);
    const c2 = ultimo;
    ok(c2 && (await p.isDisabled('.codigo-reenviar')), 'reenviar no vuelve a esperar');

    // Caduca a los 10 minutos.
    await p.clock.runFor(10 * 60 * 1000 + 1000); await espera(150);
    await escribirCodigo(c2);
    ok((await error()).startsWith('El código caducó'), `caducado: ${await error()}`);

    // Reenviar con el correo cortado: el aviso, y el codigo de antes no cambia.
    falla = true;
    await p.click('.codigo-reenviar');
    await esperaQue(async () => (await p.textContent('.cuenta-pie .cuenta-aviso')) === SIN_CORREO);
    ok((await p.textContent('.cuenta-pie .cuenta-aviso')) === SIN_CORREO, 'reenviar sin correo');
    ok((await p.locator('.codigo-falso').count()) === 0, 'recuadro al reenviar sin correo');
    falla = false;
    await p.click('.codigo-reenviar');
    await esperaQue(async () => ultimo !== c2);
    await escribirCodigo(ultimo);
    await p.waitForSelector('#cuenta-recuperar-clave');
    ok((await foco()) === 'cuenta-recuperar-clave', `foco en la clave nueva: ${await foco()}`);

    // Contrasena nueva.
    await p.fill('#cuenta-recuperar-clave', 'corta');
    await p.click('.cuenta-recuperar'); await espera(150);
    ok((await p.textContent('#cuenta-recuperar-clave-error')) === 'A la contraseña le falta algo de la lista.', 'clave corta');
    ok((await foco()) === 'cuenta-recuperar-clave', 'foco clave corta');
    await p.fill('#cuenta-recuperar-clave', 'Nueva2026');
    await p.fill('#cuenta-recuperar-repite', 'Nueva202');
    await p.click('.cuenta-recuperar'); await espera(150);
    ok((await p.textContent('#cuenta-recuperar-repite-error')) === 'Las dos no son iguales.', 'repite');
    await p.fill('#cuenta-recuperar-repite', 'Nueva2026');
    await p.click('.cuenta-recuperar');
    await esperaQue(async () => (await hash()) === '#/cuenta');
    ok((await hash()) === '#/cuenta', `destino sin pagar: ${await hash()}`);
    ok((await aviso()) === 'Contraseña cambiada. Iniciaste sesión como Ana María Pérez.', `aviso final: ${await aviso()}`);
    const despues = await p.evaluate(() => JSON.parse(localStorage.getItem('eltradicional-cuenta')));
    ok(despues.clave.sal !== antes.clave.sal && despues.clave.hash !== antes.clave.hash, 'misma huella');
    ok(despues.telefono === antes.telefono && despues.nombre === antes.nombre && despues.verificado === true && despues.sesionAbierta === true, `datos no conservados ${JSON.stringify(despues)}`);
    // Atras no vuelve al codigo.
    await p.goBack(); await espera(500);
    ok((await hash()) !== '#/cuenta/recuperar' && (await p.locator('.codigo-casilla').count()) === 0, `Atras volvio a recuperar: ${await hash()}`);

    // La vieja ya no entra, la nueva si.
    await p.goto(URL + '#/cuenta'); await p.waitForSelector('.cuenta-salir');
    await p.click('.cuenta-salir'); await esperaQue(async () => (await hash()) === '#/');
    await p.goto(URL + '#/cuenta/entrar'); await p.waitForSelector('#cuenta-entrar-correo');
    await p.fill('#cuenta-entrar-correo', 'ana@correo.com');
    await p.fill('#cuenta-entrar-clave', 'Clave123');
    await p.click('.cuenta-entrar'); await espera(800);
    ok((await p.textContent('#cuenta-entrar-clave-error')).startsWith('La contraseña no es correcta'), 'la vieja entro');
    await p.fill('#cuenta-entrar-clave', 'Nueva2026');
    await p.click('.cuenta-entrar');
    await esperaQue(async () => (await hash()) === '#/cuenta');
    ok((await hash()) === '#/cuenta', `la nueva no entro: ${await hash()}`);
    ok((await aviso()) === 'Iniciaste sesión como Ana María Pérez.', `aviso entrar: ${await aviso()}`);

    // Con sesion, recuperar lleva a Mis datos.
    await p.goto(URL + '#/cuenta/recuperar'); await espera(500);
    ok((await hash()) === '#/cuenta', `recuperar con sesion: ${await hash()}`);

    // Viniendo de pagar: hoja -> Iniciar sesion -> olvidaste -> ... -> #/confirmar.
    await p.click('.cuenta-salir'); await esperaQue(async () => (await hash()) === '#/');
    await p.goto(URL + '#/tienda-catalogo'); await p.waitForSelector('.product-card .card-mas');
    await p.locator('.product-card .card-mas').first().click(); await espera(700);
    await p.click('.floating-whatsapp.is-canasta'); await espera(400);
    await p.click('.canasta-enviar'); await espera(400);
    ok((await p.textContent('#pide-cuenta-titulo')) === 'Inicia sesión para pagar', `titulo hoja: ${await p.textContent('#pide-cuenta-titulo')}`);
    await p.click('.pide-cuenta-principal'); await p.waitForSelector('.cuenta-olvide-enlace');
    await p.click('.cuenta-olvide-enlace'); await p.waitForSelector('#cuenta-recuperar-correo');
    await p.fill('#cuenta-recuperar-correo', 'ana@correo.com');
    // Los 45 s cuentan desde el ultimo codigo, aunque fuera de otra recuperacion.
    await p.click('.cuenta-recuperar'); await espera(400);
    ok((await p.textContent('.recuperar-paso-correo .cuenta-aviso')).startsWith('Ya te enviamos un código hace poco. Espera'), `sin espera entre recuperaciones: ${await p.textContent('.recuperar-paso-correo .cuenta-aviso')}`);
    await p.clock.runFor(46000); await espera(100);
    await p.click('.cuenta-recuperar'); await p.waitForSelector('.codigo-casilla');
    await escribirCodigo(ultimo);
    await p.waitForSelector('#cuenta-recuperar-clave');
    await p.fill('#cuenta-recuperar-clave', 'Otra2027x'); await p.fill('#cuenta-recuperar-repite', 'Otra2027x');
    await p.keyboard.press('Enter');
    await esperaQue(async () => (await hash()) === '#/confirmar');
    ok((await hash()) === '#/confirmar', `viniendo de pagar: ${await hash()}`);

    // El sitio actual entra con la contrasena nueva (otro origen: se copia la cuenta).
    const guardada = await p.evaluate(() => localStorage.getItem('eltradicional-cuenta'));
    const p2 = await ctx.newPage();
    await p2.goto(t.ACTUAL); await p2.waitForSelector('.nav-cuenta');
    await p2.evaluate((g) => { const c = JSON.parse(g); c.sesionAbierta = false; localStorage.setItem('eltradicional-cuenta', JSON.stringify(c)); }, guardada);
    await p2.reload(); await p2.waitForSelector('.nav-cuenta');
    for (const [clave, vale] of [['Nueva2026', false], ['Otra2027x', true]]) {
      await p2.click('.nav-cuenta'); await p2.click('.cuenta-menu [data-va="entrar"]');
      await p2.waitForSelector('#cuenta-entrar-correo', { state: 'visible' });
      await p2.fill('#cuenta-entrar-correo', 'ana@correo.com'); await p2.fill('#cuenta-entrar-clave', clave);
      await p2.click('.cuenta-entrar'); await espera(900);
      const dentro = await p2.evaluate(() => JSON.parse(localStorage.getItem('eltradicional-cuenta')).sesionAbierta === true);
      ok(dentro === vale, `sitio actual con ${clave}: dentro=${dentro}`);
      if (!vale) await p2.keyboard.press('Escape');
      await espera(300);
    }
    await ctx.close();
  }
}
