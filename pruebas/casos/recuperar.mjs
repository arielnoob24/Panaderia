// Recuperar la contrasena (#/cuenta/recuperar) con Supabase Auth (el de
// mentira, pruebas/supabaseFalso.mjs): correo que no sale (sin casillas), 5
// intentos, reenviar a los 60 s, caduca a los 10 minutos, clave nueva, Atras,
// la vieja ya no vale, desde "Ir a pagar" a #/confirmar, y un correo sin
// cuenta se porta igual que uno con cuenta (no se dice cuales existen).
import { VENTANAS, crearCuenta, espera, esperaQue, hashDe } from '../arranque.mjs';
import { codigoDe, quebrar } from '../supabaseFalso.mjs';

export const descripcion = 'recuperar la contrasena por codigo, de punta a punta';
export const limite = 150;

const SIN_CORREO = 'No pudimos enviar el correo. Inténtalo más tarde.';

export default async function recuperar(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    // El codigo de recuperar que "llego" al correo de Ana.
    const ultimo = () => codigoDe('ana@correo.com', 'recovery');
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
    ok((await p.textContent('.recuperar-limite')).includes('si no, no llega nada'), `sin la nota de los correos sin cuenta: ${await p.textContent('.recuperar-limite')}`);

    // El correo no sale (Auth falla): no se recupera, y no hay casillas.
    quebrar(ctx, '/recover');
    await p.fill('#cuenta-recuperar-correo', 'Ana@Correo.com');
    await p.click('.cuenta-recuperar');
    await esperaQue(async () => (await p.textContent('.cuenta-pie .cuenta-aviso')) === SIN_CORREO);
    ok((await p.textContent('.cuenta-pie .cuenta-aviso')) === SIN_CORREO, `aviso sin correo: ${await p.textContent('.cuenta-pie .cuenta-aviso')}`);
    ok((await p.locator('.codigo-falso, .codigo-casilla').count()) === 0, 'hay recuadro o casillas sin correo');

    // Sale el codigo: casillas, foco en la primera, aviso.
    quebrar(ctx, null);
    await p.click('.cuenta-recuperar');
    await p.waitForSelector('.codigo-casilla');
    const c1 = ultimo();
    ok(/^\d{6}$/.test(c1 || ''), 'no llego el codigo');
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

    // Reenviar a los 60 s.
    ok(await p.isDisabled('.codigo-reenviar'), 'reenviar sin esperar');
    await p.clock.runFor(61000); await espera(150);
    ok(!(await p.isDisabled('.codigo-reenviar')), 'reenviar sigue apagado');
    await p.click('.codigo-reenviar');
    await esperaQue(async () => (await aviso()) === 'Te enviamos un código nuevo.');
    ok((await aviso()) === 'Te enviamos un código nuevo.', `aviso reenviar: ${await aviso()}`);
    const c2 = ultimo();
    ok(c2 && (await p.isDisabled('.codigo-reenviar')), 'reenviar no vuelve a esperar');

    // Caduca a los 10 minutos.
    await p.clock.runFor(10 * 60 * 1000 + 1000); await espera(150);
    await escribirCodigo(c2);
    ok((await error()).startsWith('El código caducó'), `caducado: ${await error()}`);

    // Reenviar con Auth fallando: el aviso, y el codigo de antes no cambia.
    quebrar(ctx, '/recover');
    await p.click('.codigo-reenviar');
    await esperaQue(async () => (await p.textContent('.cuenta-pie .cuenta-aviso')) === SIN_CORREO);
    ok((await p.textContent('.cuenta-pie .cuenta-aviso')) === SIN_CORREO, 'reenviar sin correo');
    ok(ultimo() === c2, 'el codigo cambio sin salir el correo');
    quebrar(ctx, null);
    await p.click('.codigo-reenviar');
    await esperaQue(async () => ultimo() !== c2);
    await escribirCodigo(ultimo());
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
    ok(despues.telefono === antes.telefono && despues.nombre === antes.nombre && !('clave' in despues), `datos no conservados ${JSON.stringify(despues)}`);
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
    ok((await p.textContent('#cuenta-entrar-clave-error')).startsWith('El correo o la contraseña no son correctos'), 'la vieja entro');
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
    // Los 60 s cuentan desde el ultimo codigo, aunque fuera de otra recuperacion.
    await p.click('.cuenta-recuperar'); await espera(400);
    ok((await p.textContent('.recuperar-paso-correo .cuenta-aviso')).startsWith('Ya te enviamos un código hace poco. Espera'), `sin espera entre recuperaciones: ${await p.textContent('.recuperar-paso-correo .cuenta-aviso')}`);
    await p.clock.runFor(61000); await espera(100);
    await p.click('.cuenta-recuperar'); await p.waitForSelector('.codigo-casilla');
    await escribirCodigo(ultimo());
    await p.waitForSelector('#cuenta-recuperar-clave');
    await p.fill('#cuenta-recuperar-clave', 'Otra2027x'); await p.fill('#cuenta-recuperar-repite', 'Otra2027x');
    await p.keyboard.press('Enter');
    await esperaQue(async () => (await hash()) === '#/confirmar');
    ok((await hash()) === '#/confirmar', `viniendo de pagar: ${await hash()}`);
    await ctx.close();

    // Un correo sin cuenta: Supabase contesta igual, asi que la pagina pasa a
    // las casillas como con cualquier otro y no llega ningun codigo.
    const ctx2 = await t.contexto(ventana, { nombre: nv + ' sin cuenta' });
    const q = await ctx2.newPage();
    await q.goto(URL + '#/cuenta/recuperar'); await q.waitForSelector('#cuenta-recuperar-correo');
    await q.fill('#cuenta-recuperar-correo', 'otro@correo.com');
    await q.click('.cuenta-recuperar');
    await q.waitForSelector('.codigo-casilla', { timeout: 4000 }).catch(() => {});
    ok((await q.locator('.codigo-casilla').count()) === 6, 'un correo sin cuenta no pasa a las casillas: se sabria que no existe');
    ok(codigoDe('otro@correo.com', 'recovery') === '', 'llego un codigo a un correo sin cuenta');
    await ctx2.close();
  }
}
