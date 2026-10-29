// La cuenta en la cabecera: sin sesion, la silueta es un enlace a iniciar
// sesion; con sesion, las iniciales abren la ficha (raton, dedo, teclado),
// que se cierra con Escape, tocando fuera, tabulando fuera, al navegar y con
// Atras; en el telefono pliega el menu. Cerrar sesion desde ella.
import { VENTANAS, crearCuenta, espera, meterPedidos, PEDIDO_EJEMPLO } from '../arranque.mjs';

export const descripcion = 'la ficha de la cuenta en la cabecera, con raton, dedo y teclado';
export const limite = 90;

async function ficha(t, nombre, ventana) {
  const ok = (c, q) => t.ok(c, `[${nombre}] ${q}`);
  const ctx = await t.contexto(ventana, { nombre });
  const p = await ctx.newPage();
  const URL = t.REACT;
  const pulsar = (sel) => (ventana.hasTouch ? p.tap(sel) : p.click(sel));
  const activo = () => p.evaluate(() => {
    const a = document.activeElement;
    return a?.id || a?.getAttribute('aria-label') || a?.textContent?.trim().slice(0, 30) || a?.tagName;
  });
  await p.goto(URL + '#/');
  await espera(300);
  // Sin sesion: la silueta es un boton que abre las dos puertas, no lleva de golpe.
  ok(await p.evaluate(() => document.querySelector('.nav-cuenta')?.tagName === 'BUTTON'), 'sin sesion no es boton');
  ok((await p.getAttribute('.nav-cuenta', 'aria-label')) === 'Cuenta: iniciar sesión o crear cuenta', 'nombre de la silueta');
  await pulsar('.nav-cuenta');
  await espera(300);
  ok((await p.evaluate(() => location.hash)) === '#/', 'la silueta no debe llevar de golpe a iniciar sesion');
  ok(await p.evaluate(() => document.querySelector('.cuenta-menu-principal')?.textContent === 'Iniciar sesión' && document.querySelector('.cuenta-menu-secundario')?.textContent === 'Crear cuenta'), 'faltan las dos puertas');
  await pulsar('.cuenta-menu-principal');
  await espera(300);
  ok((await p.evaluate(() => location.hash)) === '#/cuenta/entrar', 'Iniciar sesion no lleva a iniciar sesion');
  ok((await activo()) === 'cuenta-vista-titulo', `foco al llegar a iniciar sesion: ${await activo()}`);

  await crearCuenta(p, URL);
  await meterPedidos(p, [{ ...PEDIDO_EJEMPLO }]);
  await p.goto(URL + '#/');
  await p.reload();
  await espera(400);
  const boton = '.nav-cuenta';
  const colores = () => p.locator(boton).evaluate((b) => ({
    fondo: getComputedStyle(b).backgroundColor,
    texto: getComputedStyle(b).color,
  }));
  const normal = await colores();
  ok((await p.evaluate(() => document.querySelector('.nav-cuenta').tagName)) === 'BUTTON', 'con sesion no es boton');
  ok((await p.textContent(boton)).trim() === 'AM', 'iniciales');
  ok((await p.getAttribute(boton, 'aria-controls')) === 'cuenta-menu', 'aria-controls');
  ok((await p.getAttribute(boton, 'aria-expanded')) === 'false', 'aria-expanded cerrado');
  ok(!(await p.isVisible('#cuenta-menu .cuenta-menu-opcion >> nth=0')), 'ficha visible cerrada');

  // Raton o dedo: abre, y tocar fuera la cierra.
  await pulsar(boton);
  await espera(250);
  ok((await p.getAttribute(boton, 'aria-expanded')) === 'true', 'no se abre al pulsar');
  ok((await colores()).fondo !== normal.fondo, 'la cuenta abierta no cambia de color para indicar su estado');
  if (!ventana.hasTouch) {
    await p.mouse.move(10, 600);
    await espera(250);
    const fondoActivo = await colores();
    await p.hover(boton);
    await espera(250);
    const fondoHover = await colores();
    ok(fondoActivo.fondo === 'rgb(255, 253, 248)' && fondoActivo.fondo !== normal.fondo && fondoHover.fondo === fondoActivo.fondo, `el estado seleccionado no queda blanco o cambia al pasar el cursor (${JSON.stringify({ normal, fondoActivo, fondoHover })})`);
    ok(fondoHover.texto === fondoActivo.texto && fondoHover.texto === 'rgb(58, 40, 34)', 'el estado seleccionado cambia el color del icono/texto al pasar el cursor');
  } else {
    const seleccionado = await colores();
    ok(seleccionado.fondo === 'rgb(255, 253, 248)' && seleccionado.fondo !== normal.fondo, 'el estado seleccionado en tactil no queda blanco');
    ok(seleccionado.texto === 'rgb(58, 40, 34)', 'el estado seleccionado en tactil no cambia el icono/texto a horno');
  }
  ok(await p.isVisible('#cuenta-menu >> text=Mis datos'), 'Mis datos no se ve');
  const nombrePedidos = await p.evaluate(() => [...document.querySelectorAll('#cuenta-menu .cuenta-menu-opcion')][1].textContent.replace(/\s+/g, ' ').trim());
  ok(nombrePedidos === 'Mis pedidos(1)', `nombre de Mis pedidos: "${nombrePedidos}"`);
  ok((await p.textContent('.cuenta-menu-nombre')) === 'Ana María Pérez', 'nombre en la ficha');
  if (ventana.hasTouch) await p.touchscreen.tap(60, 600); else await p.mouse.click(300, 600);
  await espera(250);
  ok((await p.getAttribute(boton, 'aria-expanded')) === 'false', 'tocar fuera no la cierra');

  // Teclado: Enter abre; Escape cierra y devuelve; flechas, Fin y la vuelta.
  await p.focus(boton);
  await p.keyboard.press('Enter');
  await espera(200);
  ok((await p.getAttribute(boton, 'aria-expanded')) === 'true', 'Enter no abre');
  await p.keyboard.press('Escape');
  await espera(100);
  ok((await p.getAttribute(boton, 'aria-expanded')) === 'false', 'Escape no cierra');
  ok((await activo()) === 'Tu cuenta, Ana María Pérez', `Escape no devuelve el foco: ${await activo()}`);
  await p.keyboard.press('ArrowDown');
  await espera(200);
  ok((await activo()) === 'Mis datos', `flecha abajo: ${await activo()}`);
  await p.keyboard.press('ArrowDown');
  ok((await activo()).startsWith('Mis pedidos'), `segunda flecha: ${await activo()}`);
  await p.keyboard.press('End');
  ok((await activo()) === 'Cerrar sesión', `Fin: ${await activo()}`);
  await p.keyboard.press('ArrowDown');
  ok((await activo()) === 'Mis datos', `da la vuelta: ${await activo()}`);
  await p.keyboard.press('Escape');
  await espera(100);
  ok((await activo()) === 'Tu cuenta, Ana María Pérez' && (await p.getAttribute(boton, 'aria-expanded')) === 'false', 'Escape desde dentro');
  // Tabular fuera de la ficha la cierra.
  await p.keyboard.press('ArrowDown');
  await espera(200);
  await p.keyboard.press('Shift+Tab');
  await p.keyboard.press('Shift+Tab');
  await espera(100);
  ok((await p.getAttribute(boton, 'aria-expanded')) === 'false', 'tabular fuera no la cierra');

  // Elegir navega y la cierra; el foco va al h1 de la vista.
  await p.focus(boton);
  await p.keyboard.press('ArrowDown');
  await espera(200);
  await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter');
  await espera(400);
  ok((await p.evaluate(() => location.hash)) === '#/cuenta/pedidos', 'Mis pedidos no lleva a su vista');
  ok((await p.getAttribute(boton, 'aria-expanded')) === 'false', 'navegar no la cierra');
  ok((await p.getAttribute(boton, 'data-vista-cuenta')) === 'true' && (await p.locator(boton).evaluate((b) => getComputedStyle(b).backgroundColor)) === 'rgb(255, 253, 248)', 'la cabecera no marca que se esta en una vista de cuenta con fondo blanco');
  ok((await activo()) === 'cuenta-vista-titulo', `foco tras elegir: ${await activo()}`);
  // Navegar con Atras tambien la cierra.
  await pulsar(boton);
  await espera(200);
  await p.goBack();
  await espera(300);
  ok((await p.getAttribute(boton, 'aria-expanded')) === 'false', 'Atras no la cierra');

  // En el telefono, abrir la ficha pliega el menu, y la ficha cabe.
  if (ventana.hasTouch) {
    await p.tap('.menu-toggle');
    await espera(200);
    ok((await p.getAttribute('.menu-toggle', 'aria-expanded')) === 'true', 'menu no abre');
    await p.tap(boton);
    await espera(250);
    ok((await p.getAttribute('.menu-toggle', 'aria-expanded')) === 'false', 'el menu sigue abierto con la ficha');
    ok((await p.getAttribute(boton, 'aria-expanded')) === 'true', 'la ficha no abre con el menu abierto');
    const caja = await p.evaluate(() => { const r = document.getElementById('cuenta-menu').getBoundingClientRect(); return [r.left, r.right, innerWidth]; });
    ok(caja[0] >= 0 && caja[1] <= caja[2], `la ficha se sale de la pantalla: ${caja}`);
    await p.tap('#cuenta-menu >> text=Mis datos');
    await espera(400);
    ok((await p.evaluate(() => location.hash)) === '#/cuenta', 'tocar Mis datos no lleva a #/cuenta');
  }

  // Cerrar sesion desde la ficha, en la portada: el foco a la silueta.
  await p.goto(URL + '#/');
  await p.reload();
  await espera(300);
  await p.focus(boton);
  await p.keyboard.press('ArrowUp');
  await espera(200);
  ok((await activo()) === 'Cerrar sesión', `flecha arriba: ${await activo()}`);
  await p.keyboard.press('Enter');
  await espera(300);
  ok(await p.evaluate(() => !document.querySelector('.nav-cuenta').classList.contains('is-dentro')), 'tras salir no vuelve la silueta');
  ok((await activo()) === 'Cuenta: iniciar sesión o crear cuenta', `foco tras salir: ${await activo()}`);
  const aviso = await p.evaluate(() => document.querySelector('[aria-live="polite"]').textContent);
  ok(aviso.includes('Cerraste la sesión de Ana María Pérez.'), `aviso al salir: ${aviso}`);
  // Iniciar sesion otra vez y salir desde #/cuenta: a la portada, con replace.
  await p.goto(URL + '#/cuenta/entrar');
  await p.fill('#cuenta-entrar-correo', 'ana@correo.com');
  await p.fill('#cuenta-entrar-clave', 'Clave123');
  await p.click('.cuenta-entrar');
  await p.waitForSelector('.cuenta-vista-datos');
  await espera(300);
  const largo = await p.evaluate(() => history.length);
  await pulsar(boton);
  await espera(200);
  await pulsar('#cuenta-menu .is-salir');
  await espera(400);
  ok((await p.evaluate(() => location.hash)) === '#/', 'salir desde #/cuenta no lleva a #/');
  ok((await p.evaluate(() => history.length)) === largo, 'salir desde #/cuenta no es replace');
  ok((await activo()) !== 'BODY', 'foco perdido tras salir desde #/cuenta');
  await ctx.close();
}

export default async function fichaCuenta(t) {
  await ficha(t, 'escritorio', VENTANAS.escritorio);
  await ficha(t, 'movil', VENTANAS.movil);
}
