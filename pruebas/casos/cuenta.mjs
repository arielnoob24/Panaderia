// El recorrido de la cuenta en React (fase 5): desvios con replace, crear con
// sus errores, verificar con las 6 casillas, Mis datos, cerrar sesion,
// iniciar sesion, de "Ir a pagar" a #/confirmar y Mis pedidos.
import { VENTANAS, espera, hashDe, llegar } from '../arranque.mjs';

export const descripcion = 'crear, verificar, Mis datos, iniciar sesion, pagar y Mis pedidos';
export const limite = 180;

async function recorrido(t, nombre, ventana) {
  const ok = (cond, que) => t.ok(cond, `[${nombre}] ${que}`);
  const ctx = await t.contexto(ventana, { nombre });
  const p = await ctx.newPage();
  const REACT = t.REACT;
  const ruta = hashDe;
  const foco = () => p.evaluate(() => document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName);

  // ---- Desvios sin cuenta (con replace) ----
  for (const [desde, hacia] of [['#/cuenta', '#/cuenta/entrar'], ['#/cuenta/pedidos', '#/cuenta/entrar'], ['#/cuenta/verificar', '#/cuenta/entrar'], ['#/confirmar', '#/']]) {
    const q = await ctx.newPage();
    await q.goto(REACT + desde);
    await espera(400);
    const h = await ruta(q);
    const largo = await q.evaluate(() => history.length);
    ok(h === hacia, `${desde} sin cuenta lleva a ${h} y deberia ${hacia}`);
    // 2: la about:blank de la pestana nueva y la direccion, ya cambiada.
    ok(largo === 2, `${desde} dejo ${largo} entradas en el historial (replace)`);
    // Al abrir la pagina con el desvio, el foco no se mueve.
    ok(await q.evaluate(() => document.activeElement === document.body), `al abrir ${desde} el foco se movio`);
    await q.close();
  }
  // Y desde dentro de la aplicacion, el desvio tambien es replace.
  await p.goto(REACT + '#/');
  await espera(300);
  const antes = await p.evaluate(() => history.length);
  await llegar(p, '#/cuenta');
  ok((await ruta(p)) === '#/cuenta/entrar' && (await p.evaluate(() => history.length)) === antes + 1, 'desvio interno no es replace');
  ok((await foco()) === 'cuenta-vista-titulo', `foco tras desvio interno: ${await foco()}`);

  // ---- Crear ----
  await p.goto(REACT + '#/');
  await espera(300);
  await llegar(p, '#/cuenta/crear');
  ok(await p.title() === 'Crear cuenta | El Tradicional', `titulo de pestana: ${await p.title()}`);
  ok((await foco()) === 'cuenta-vista-titulo', `foco al llegar a crear: ${await foco()}`);
  await p.click('.cuenta-crear');
  await espera(100);
  ok((await p.textContent('.cuenta-aviso')) === 'Faltan 4 campos por corregir.', `aviso de crear vacio: ${await p.textContent('.cuenta-aviso')}`);
  ok((await foco()) === 'cuenta-nombre', `foco tras crear vacio: ${await foco()}`);
  ok((await p.getAttribute('#cuenta-nombre', 'aria-invalid')) === 'true', 'nombre sin aria-invalid');
  ok((await p.getAttribute('#cuenta-nombre', 'aria-describedby')) === 'cuenta-nombre-error', 'nombre sin aria-describedby');
  ok((await p.getAttribute('#cuenta-clave', 'aria-describedby')) === 'cuenta-clave-reglas cuenta-clave-error', 'clave sin describedby de reglas');

  // Con una pagina nueva, los errores salen al dejar el campo.
  await llegar(p, '#/');
  await llegar(p, '#/cuenta/crear');
  await p.fill('#cuenta-nombre', 'Ana');
  ok(!(await p.isVisible('#cuenta-nombre-error')), 'error del nombre antes de dejarlo');
  await p.press('#cuenta-nombre', 'Enter');
  ok((await foco()) === 'cuenta-correo', `Enter en nombre lleva a ${await foco()}`);
  ok((await p.textContent('#cuenta-nombre-error')) === 'Falta el apellido.', `error nombre: ${await p.textContent('#cuenta-nombre-error')}`);
  await p.fill('#cuenta-nombre', 'Ana Pérez');
  await p.fill('#cuenta-correo', 'ana');
  await p.locator('#cuenta-correo').blur();
  ok((await p.textContent('#cuenta-correo-error')) === 'Le falta el @ y todo lo que sigue, por ejemplo @gmail.com.', 'error del correo sin @');
  await p.fill('#cuenta-correo', 'ana@correo.com');
  ok(!(await p.isVisible('#cuenta-correo-error')), 'el error del correo no se fue al corregir');
  await p.locator('#cuenta-telefono').pressSequentially('0991234567');
  ok((await p.inputValue('#cuenta-telefono')) === '991234567', `telefono: ${await p.inputValue('#cuenta-telefono')}`);
  await p.fill('#cuenta-clave', 'clave');
  ok((await p.locator('.cuenta-reglas li.is-hecha').count()) === 1, 'reglas cumplidas con "clave"');
  ok(!(await p.isVisible('#cuenta-clave-error')), 'la clave se marca mientras se escribe');
  await p.fill('#cuenta-clave', 'Clave123');
  ok((await p.locator('.cuenta-reglas li.is-hecha').count()) === 4, 'no se cumplen las 4 reglas');
  ok((await p.textContent('[data-regla="numero"] .cuenta-regla-estado')) === ', cumplido', 'estado para el lector de la regla');
  await p.click('.ver-clave >> nth=0');
  ok((await p.getAttribute('#cuenta-clave', 'type')) === 'text', 'Mostrar no ensena la clave');
  ok((await p.getAttribute('.ver-clave >> nth=0', 'aria-label')) === 'Ocultar la contraseña', 'aria-label del boton ver');
  await p.click('.ver-clave >> nth=0');
  await p.fill('#cuenta-repite', 'Clave12');
  ok((await p.textContent('#cuenta-repite-error')) === 'Las dos no son iguales.', 'repite distinto sin error al escribir');
  await p.fill('#cuenta-repite', 'Clave123');
  ok(!(await p.isVisible('#cuenta-repite-error')), 'error de repite sigue');
  await p.press('#cuenta-repite', 'Enter');
  await p.waitForFunction(() => location.hash === '#/cuenta/verificar', null, { timeout: 5000 }).catch(() => {});
  ok((await ruta(p)) === '#/cuenta/verificar', `tras crear: ${await ruta(p)}`);
  ok((await p.evaluate(() => localStorage.getItem('eltradicional-cuenta'))) === null, 'la cuenta se guardo antes de verificar');

  // ---- Verificar ----
  await p.waitForSelector('.codigo-falso', { timeout: 5000 }).catch(() => {});
  ok(await p.isVisible('.codigo-falso'), 'no sale el recuadro con el codigo con EmailJS caido');
  ok((await p.textContent('.cuenta-maqueta-codigo')).includes('No pudimos enviarte el correo en este momento.'), 'motivo del recuadro');
  const codigo = (await p.textContent('.codigo-valor')).trim();
  ok(/^\d{6}$/.test(codigo), `codigo: ${codigo}`);
  ok((await p.title()) === 'Verificar tu correo | El Tradicional', 'titulo verificar');
  ok((await p.locator('fieldset.codigo-casillas > legend').textContent()) === 'Código de 6 cifras', 'legend');
  ok((await p.getAttribute('.codigo-casilla >> nth=2', 'aria-label')) === 'Cifra 3 de 6', 'aria-label casilla');
  ok((await p.getAttribute('.codigo-casilla >> nth=0', 'autocomplete')) === 'one-time-code', 'autocomplete one-time-code');
  ok((await p.getAttribute('.codigo-casilla >> nth=3', 'inputmode')) === 'numeric', 'inputmode');
  ok((await p.isDisabled('.codigo-reenviar')) && /en \d+s/.test(await p.textContent('.codigo-reenviar')), `reenviar: ${await p.textContent('.codigo-reenviar')}`);
  // Teclear un codigo malo: salto de foco y comprobar al llenar la sexta.
  const malo = codigo === '111111' ? '222222' : '111111';
  const enCasilla = () => p.evaluate(() => [...document.querySelectorAll('.codigo-casilla')].indexOf(document.activeElement));
  await p.click('.codigo-casilla >> nth=0');
  await p.keyboard.type('a1');
  ok((await p.inputValue('.codigo-casilla >> nth=0')) === '1', 'una letra entro en la casilla');
  ok((await enCasilla()) === 1, 'el foco no salto a la 2');
  await p.keyboard.type(malo.slice(1, 5));
  ok(!(await p.isVisible('#cuenta-codigo-error')), 'se comprobo antes de la sexta');
  await p.keyboard.type(malo[5]);
  await espera(100);
  ok((await p.textContent('#cuenta-codigo-error')) === 'Ese código no es el que enviamos. Míralo otra vez.', 'error del codigo malo');
  // Una sola via: el error del codigo no se repite en un role="alert" del pie.
  ok((await p.$$('.cuenta-verificar >> xpath=.. >> [role="alert"]')).length === 0, 'el error del codigo sigue en un alert del pie');
  ok((await enCasilla()) === 0, 'foco no fue a la primera tras el error');
  ok((await p.getAttribute('.codigo-casilla >> nth=0', 'aria-invalid')) === 'true', 'casillas sin aria-invalid');
  ok((await p.getAttribute('.codigo-casilla >> nth=0', 'aria-describedby')) === 'cuenta-codigo-error', 'casillas sin describedby');
  // Flechas y Retroceso.
  await p.keyboard.press('End');
  await p.keyboard.press('Backspace');
  await p.keyboard.press('Backspace');
  const tras = await p.evaluate(() => ({ v: [...document.querySelectorAll('.codigo-casilla')].map((c) => c.value).join(','), i: [...document.querySelectorAll('.codigo-casilla')].indexOf(document.activeElement) }));
  ok(tras.v === '1,1,1,1,,'.replace(/1/g, malo[0]) && tras.i === 4, `retroceso: ${JSON.stringify(tras)}`);
  ok(!(await p.isVisible('#cuenta-codigo-error')), 'el error no se fue al tocar');
  await p.keyboard.press('ArrowLeft');
  ok((await enCasilla()) === 3, 'flecha izquierda');
  await p.keyboard.press('ArrowRight');
  ok((await enCasilla()) === 4, 'flecha derecha');
  // Enter con 5 cifras.
  await p.keyboard.press('Enter');
  ok((await p.textContent('#cuenta-codigo-error')) === 'El código tiene 6 cifras.', 'Enter con 5 cifras');
  // Pegar el bueno en una casilla del medio: lo reparte entero y entra.
  await p.click('.codigo-casilla >> nth=2');
  await p.evaluate((c) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', ` ${c.slice(0, 3)}-${c.slice(3)} `);
    document.activeElement.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, codigo);
  await espera(300);
  ok((await ruta(p)) === '#/cuenta', `tras verificar sin venir de pagar: ${await ruta(p)}`);
  ok((await foco()) === 'cuenta-vista-titulo', `foco en Mis datos: ${await foco()}`);
  const guardada = JSON.parse(await p.evaluate(() => localStorage.getItem('eltradicional-cuenta')));
  ok(guardada && guardada.nombre === 'Ana Pérez' && guardada.correo === 'ana@correo.com' && guardada.telefono === '991234567'
    && guardada.verificado === true && guardada.sesionAbierta === true && guardada.metodo === 'efectivo'
    && /^[0-9a-f]{32}$/.test(guardada.clave?.sal) && /^[0-9a-f]{64}$/.test(guardada.clave?.hash) && !JSON.stringify(guardada).includes('Clave123'),
  `formato guardado: ${JSON.stringify(guardada)}`);

  // ---- Mis datos ----
  ok((await p.title()) === 'Mis datos | El Tradicional', 'titulo mis datos');
  ok((await p.textContent('.cuenta-datos-correo dd')) === 'ana@correo.com', 'correo visible');
  ok((await p.locator('input[type="email"]').count()) === 0, 'el correo se puede editar');
  ok((await p.inputValue('#cuenta-editar-nombre')) === 'Ana Pérez', 'nombre precargado');
  await p.fill('#cuenta-editar-telefono', '12');
  await p.locator('#cuenta-editar-telefono').blur();
  ok((await p.textContent('#cuenta-editar-telefono-error')) === 'Son 9 números después del +593, empezando por 9.', 'error telefono editar');
  await p.click('.cuenta-guardar');
  ok((await p.textContent('.cuenta-aviso')) === 'Falta corregir un campo.', 'aviso editar');
  ok((await foco()) === 'cuenta-editar-telefono', 'foco al telefono malo');
  await p.fill('#cuenta-editar-telefono', '987654321');
  await p.fill('#cuenta-editar-nombre', 'Ana María Pérez');
  await p.fill('#cuenta-editar-direccion', 'Av. 15 de Noviembre y Juan Montalvo');
  await p.press('#cuenta-editar-nombre', 'Enter');
  ok((await foco()) === 'cuenta-editar-telefono', 'Enter en nombre de editar');
  await p.press('#cuenta-editar-direccion', 'Enter');
  await espera(100);
  ok(await p.isVisible('.cuenta-hecho'), 'no sale "Guardamos tus cambios"');
  const editada = JSON.parse(await p.evaluate(() => localStorage.getItem('eltradicional-cuenta')));
  ok(editada.nombre === 'Ana María Pérez' && editada.telefono === '987654321' && editada.direccion.startsWith('Av. 15') && editada.clave.hash === guardada.clave.hash, `editada: ${JSON.stringify(editada)}`);
  // Con sesion, iniciar sesion y crear llevan a Mis datos; verificar sin
  // cuenta por verificar lleva a iniciar sesion, que con sesion lleva a Mis datos.
  for (const desde of ['#/cuenta/entrar', '#/cuenta/crear', '#/cuenta/verificar']) {
    await llegar(p, desde);
    ok((await ruta(p)) === '#/cuenta', `${desde} con sesion lleva a ${await ruta(p)}`);
  }

  // ---- Cerrar sesion ----
  await p.click('.cuenta-salir');
  await espera(200);
  ok((await ruta(p)) === '#/', `cerrar sesion lleva a ${await ruta(p)}`);
  const cerrada = JSON.parse(await p.evaluate(() => localStorage.getItem('eltradicional-cuenta')));
  ok(cerrada.sesionAbierta === false && cerrada.nombre === 'Ana María Pérez' && cerrada.clave.hash === guardada.clave.hash, 'cerrar sesion borro la cuenta o no la cerro');
  await llegar(p, '#/cuenta');
  ok((await ruta(p)) === '#/cuenta/entrar', 'mis datos tras cerrar sesion');

  // ---- Iniciar sesion: mal y bien ----
  await p.fill('#cuenta-entrar-correo', 'ana@correo');
  await p.locator('#cuenta-entrar-correo').blur();
  ok((await p.textContent('#cuenta-entrar-correo-error')) === 'Le falta el final, por ejemplo .com, .ec o .es.', `correo al salir: ${await p.textContent('#cuenta-entrar-correo-error')}`);
  await p.fill('#cuenta-entrar-correo', 'otra@correo.com');
  ok(!(await p.isVisible('#cuenta-entrar-correo-error')), 'error del correo no sigue lo escrito');
  await p.press('#cuenta-entrar-correo', 'Enter');
  ok((await foco()) === 'cuenta-entrar-clave', 'Enter en correo de entrar');
  await p.press('#cuenta-entrar-clave', 'Enter');
  ok((await p.textContent('#cuenta-entrar-clave-error')) === 'Escribe tu contraseña.', 'clave vacia');
  await p.fill('#cuenta-entrar-clave', 'Mala1234');
  ok(!(await p.isVisible('#cuenta-entrar-clave-error')), 'el error de la clave no se va al escribir');
  await p.press('#cuenta-entrar-clave', 'Enter');
  await espera(600);
  ok((await p.textContent('#cuenta-entrar-correo-error')).startsWith('No hay ninguna cuenta con este correo.'), 'otro correo');
  ok((await foco()) === 'cuenta-entrar-correo', 'foco al correo sin cuenta');
  await p.fill('#cuenta-entrar-correo', 'ANA@correo.com');
  await p.press('#cuenta-entrar-correo', 'Enter');
  await p.press('#cuenta-entrar-clave', 'Enter');
  await espera(800);
  ok((await p.textContent('#cuenta-entrar-clave-error')).startsWith('La contraseña no es correcta.'), 'clave mala');
  ok((await p.getAttribute('#cuenta-entrar-clave', 'aria-invalid')) === 'true', 'clave mala sin aria-invalid');
  ok((await p.inputValue('#cuenta-entrar-clave')) === 'Mala1234', 'la clave mala se borro');
  ok((await foco()) === 'cuenta-entrar-clave', 'foco tras clave mala');
  await p.fill('#cuenta-entrar-clave', 'Clave123');
  await p.press('#cuenta-entrar-clave', 'Enter');
  await espera(800);
  ok((await ruta(p)) === '#/cuenta', `entrar sin venir de pagar: ${await ruta(p)}`);
  await p.click('.cuenta-salir');
  await espera(200);

  // ---- Ir a pagar sin sesion -> iniciar sesion -> confirmar -> pagar ----
  await llegar(p, '#/tienda-catalogo');
  await p.locator('.product-card .card-mas').first().click();
  await espera(900);
  await p.click('.floating-whatsapp.is-canasta');
  await espera(400);
  await p.click('.canasta-enviar');
  await espera(200);
  ok(await p.isVisible('.pide-cuenta'), 'no sale la hoja de cuenta');
  ok((await p.textContent('.pide-cuenta-principal')).trim() === 'Iniciar sesión', 'con cuenta la grande no es iniciar sesion');
  await p.click('.pide-cuenta-principal');
  await espera(500);
  ok((await ruta(p)) === '#/cuenta/entrar', `la hoja lleva a ${await ruta(p)}`);
  ok(!(await p.locator('.canasta-panel.is-open').count()), 'la canasta sigue abierta');
  ok((await foco()) === 'cuenta-vista-titulo', `foco tras la hoja: ${await foco()}`);
  ok((await p.locator('[inert]').count()) === 0, 'algo quedo inert');
  // Pasar por crear y volver no olvida que se venia de pagar.
  await p.click('.cuenta-otro-enlace');
  await espera(200);
  await p.click('.cuenta-otro-enlace');
  await espera(200);
  await p.fill('#cuenta-entrar-correo', 'ana@correo.com');
  await p.fill('#cuenta-entrar-clave', 'Clave123');
  await p.click('.cuenta-entrar');
  await p.waitForFunction(() => location.hash === '#/confirmar', null, { timeout: 5000 }).catch(() => {});
  ok((await ruta(p)) === '#/confirmar', `entrar viniendo de pagar: ${await ruta(p)}`);
  await espera(300);
  ok((await p.textContent('h1')).includes('Confirmar el pedido'), 'h1 de confirmar');
  // La direccion de la cuenta pasa al pedido.
  ok((await p.evaluate(() => JSON.parse(localStorage.getItem('eltradicional-pedido') || '{}')?.direccion || '')).startsWith('Av. 15'), 'la direccion de la cuenta no paso al pedido');
  await p.click('.canasta-pagar');
  await p.waitForFunction(() => location.hash === '#/comprobante', null, { timeout: 6000 }).catch(() => {});
  ok((await ruta(p)) === '#/comprobante', `tras pagar: ${await ruta(p)}`);
  await llegar(p, '#/cuenta/pedidos');
  await espera(400);
  ok((await p.title()) === 'Mis pedidos | El Tradicional', 'titulo pedidos');
  ok((await p.locator('details.cuenta-pedido').count()) === 1, `pedidos: ${await p.locator('details.cuenta-pedido').count()}`);
  ok(/^ET-[A-Z0-9]{4}$/.test((await p.textContent('.cuenta-pedido-numero')).trim()), 'numero ET-XXXX');
  ok((await p.locator('.cuenta-pedido summary strong').textContent()).startsWith('$'), 'total en summary');
  ok((await p.textContent('.cuenta-pedido-fecha')).startsWith('hoy a las'), 'fecha en summary');
  await p.click('.cuenta-pedido summary');
  ok(await p.isVisible('.cuenta-pedido-lineas li'), 'el details no abre');
  await llegar(p, '#/cuenta');
  await espera(300);
  ok((await p.textContent('.cuenta-ver-pedidos')).trim() === 'Ver mis pedidos (1)', 'contador de pedidos');

  // ---- Ir a pagar sin cuenta -> crear -> verificar -> confirmar ----
  const ctx3 = await t.contexto(ventana, { nombre: nombre + ' crear desde pagar' });
  const c3 = await ctx3.newPage();
  await c3.goto(REACT + '#/tienda-catalogo');
  await c3.waitForSelector('.product-card .card-mas');
  await c3.locator('.product-card .card-mas').first().click();
  await espera(900);
  await c3.click('.floating-whatsapp.is-canasta');
  await espera(400);
  await c3.click('.canasta-enviar');
  await espera(200);
  ok((await c3.textContent('.pide-cuenta-principal')).trim() === 'Crear una cuenta', 'sin cuenta la grande no es crear');
  await c3.click('.pide-cuenta-principal');
  await espera(400);
  ok((await ruta(c3)) === '#/cuenta/crear', `crear desde la hoja: ${await ruta(c3)}`);
  await c3.fill('#cuenta-nombre', 'Rosa Grefa');
  await c3.fill('#cuenta-correo', 'rosa@correo.ec');
  await c3.fill('#cuenta-telefono', '991112233');
  await c3.fill('#cuenta-clave', 'Masa2026');
  await c3.fill('#cuenta-repite', 'Masa2026');
  await c3.click('.cuenta-crear');
  await c3.waitForSelector('.codigo-falso', { timeout: 6000 }).catch(() => {});
  const cod3 = (await c3.textContent('.codigo-valor')).trim();
  await c3.click('.codigo-casilla >> nth=0');
  await c3.keyboard.type(cod3);
  await c3.waitForFunction(() => location.hash === '#/confirmar', null, { timeout: 5000 }).catch(() => {});
  ok((await ruta(c3)) === '#/confirmar', `verificar viniendo de pagar: ${await ruta(c3)}`);
  // Atras no vuelve a los formularios ya hechos.
  await c3.goBack();
  await espera(300);
  ok(!(await ruta(c3)).startsWith('#/cuenta/verificar'), `Atras desde confirmar vuelve a ${await ruta(c3)}`);
  await Promise.all([ctx.close(), ctx3.close()]);
}

export default async function cuenta(t) {
  await recorrido(t, 'escritorio', VENTANAS.escritorio);
  await recorrido(t, 'movil', VENTANAS.movil);
}
