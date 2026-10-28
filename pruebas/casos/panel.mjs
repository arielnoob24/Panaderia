// El panel de administracion (#/admin): quien lo ve y que hace. Sin sesion se
// va a entrar; un cliente no ve la opcion "Panel" en la ficha y, si escribe la
// direccion, se le dice que no tiene acceso; un empleado ve solo Pedidos y
// los avanza (con las reglas de domicilio y retiro y cancelar con segundo
// toque); el administrador ve tambien Resumen y Productos, y lo que guarda
// en un producto sigue ahi al volver. El servidor de mentira
// (supabaseFalso.mjs) pone los permisos de cada rol como la base.
import { VENTANAS, crearCuenta, espera, esperaQue } from '../arranque.mjs';
import { ponerRol } from '../supabaseFalso.mjs';

export const descripcion = 'el panel: cliente fuera, empleado con pedidos, administrador con todo';
export const limite = 120;

const CORREO = 'ana@correo.com';
const pedido = (numero, modo, estado, nombre = 'Pan redondo', cantidad = 4, precio = 0.25) => ({
  numero, fecha: new Date().toISOString(), estado, modo,
  direccion: modo === 'domicilio' ? 'Av. 15 de Noviembre' : '', metodo: modo === 'domicilio' ? 'Efectivo al recibir' : 'Efectivo al retirar',
  subtotal: cantidad * precio, envio: modo === 'domicilio' ? 1.5 : 0, total: cantidad * precio + (modo === 'domicilio' ? 1.5 : 0),
  lineas: [{ nombre, precio, cantidad }],
});

async function panel(t, nombre, ventana) {
  const ok = (c, q) => t.ok(c, `[${nombre}] ${q}`);
  const ctx = await t.contexto(ventana, { nombre });
  const p = await ctx.newPage();
  const URL = t.REACT;
  const hash = () => p.evaluate(() => location.hash);
  const abrirFicha = async () => {
    await p.click('.nav-cuenta');
    await espera(300);
  };
  const opcionesFicha = () => p.$$eval('#cuenta-menu .cuenta-menu-opcion', (l) => l.map((x) => x.textContent.trim()));

  // Sin sesion: a entrar.
  await p.goto(URL + '#/admin');
  await p.reload();
  await espera(500);
  ok((await hash()) === '#/cuenta/entrar', `sin sesion no lleva a entrar: ${await hash()}`);

  // Un cliente: ni la opcion ni el panel.
  await crearCuenta(p, URL);
  await abrirFicha();
  ok(!(await opcionesFicha()).includes('Panel'), `un cliente ve la opcion Panel: ${await opcionesFicha()}`);
  await p.keyboard.press('Escape');
  await p.goto(URL + '#/admin');
  await p.reload();
  await p.waitForSelector('.cuenta-vista-admin');
  await esperaQue(async () => !(await p.textContent('.cuenta-vista-admin')).includes('Mirando'));
  ok((await p.textContent('.cuenta-vista-admin')).includes('no tiene acceso'), 'un cliente no lee que no tiene acceso');
  ok((await p.$$('.admin-pestana')).length === 0, 'un cliente ve pestañas del panel');

  // Un empleado: la ficha ofrece Panel y solo hay Pedidos.
  const cuenta = ctx.supabaseFalso.cuentas.get(CORREO);
  cuenta.pedidos = [
    pedido('ET-AAAA', 'retiro', 'Pendiente de pago'),
    pedido('ET-BBBB', 'domicilio', 'Pagado', 'Galletas', 2, 1),
    pedido('ET-CCCC', 'retiro', 'Entregado'),
  ];
  ponerRol(CORREO, 'Empleado');
  await p.goto(URL + '#/');
  await p.reload();
  await espera(400);
  await abrirFicha();
  await esperaQue(async () => (await opcionesFicha()).includes('Panel'));
  ok((await opcionesFicha()).includes('Panel'), `un empleado no ve la opcion Panel: ${await opcionesFicha()}`);
  await p.click('#cuenta-menu a[href$="/admin"]');
  await p.waitForSelector('.admin-pedido');
  ok((await hash()) === '#/admin/pedidos', `#/admin no lleva a Pedidos: ${await hash()}`);
  ok((await p.$$eval('.admin-pestana', (l) => l.map((x) => x.textContent))).join() === 'Pedidos', 'el empleado ve mas pestañas que Pedidos');
  ok((await p.$$('.admin-pedido')).length === 2, `Por atender no esconde lo entregado: ${(await p.$$('.admin-pedido')).length}`);
  await p.goto(URL + '#/admin/productos');
  await p.reload();
  await p.waitForSelector('.admin-pedido');
  ok((await hash()) === '#/admin/pedidos', `el empleado entra a Productos: ${await hash()}`);

  // Avanzar un pedido de retiro: Pendiente de pago -> Pagado -> En preparacion -> Listo para retirar -> Entregado.
  const tarjeta = (numero) => p.locator('.admin-pedido', { hasText: numero });
  const avanzar = async (numero, texto) => {
    await tarjeta(numero).locator('.admin-avanzar').click();
    await esperaQue(async () => (await tarjeta(numero).locator('.admin-estado').textContent()) === texto);
    return tarjeta(numero).locator('.admin-estado').textContent();
  };
  ok((await avanzar('ET-AAAA', 'Pagado')) === 'Pagado', 'Pendiente de pago no pasa a Pagado');
  ok((await avanzar('ET-AAAA', 'En preparación')) === 'En preparación', 'Pagado no pasa a En preparacion');
  ok((await tarjeta('ET-AAAA').locator('.admin-avanzar').textContent()).includes('Listo para retirar'), 'un pedido para retirar no ofrece Listo para retirar');
  // A domicilio, tras prepararlo, va En camino.
  await avanzar('ET-BBBB', 'En preparación');
  ok((await tarjeta('ET-BBBB').locator('.admin-avanzar').textContent()).includes('En camino'), 'un pedido a domicilio no ofrece En camino');
  await avanzar('ET-AAAA', 'Listo para retirar');
  // El foco se queda en el boton tras avanzar (no pasa al body).
  ok(await p.evaluate(() => document.activeElement?.classList.contains('admin-avanzar')), 'tras avanzar el foco no esta en el boton');
  ok((await tarjeta('ET-AAAA').locator('.admin-avanzar').getAttribute('aria-label')).includes('ET-AAAA'), 'el boton de avanzar no dice de que pedido es');
  // Entregado pide confirmar: Escape lo deja como estaba y devuelve el foco.
  await tarjeta('ET-AAAA').locator('.admin-avanzar').click();
  await espera(150);
  ok((await tarjeta('ET-AAAA').locator('.admin-estado').textContent()) === 'Listo para retirar', 'Entregado se marca con un solo toque');
  ok(await p.evaluate(() => document.activeElement?.classList.contains('admin-confirmar')), 'el foco no va al Si de la confirmacion');
  await p.keyboard.press('Escape');
  await espera(150);
  ok((await tarjeta('ET-AAAA').locator('.admin-confirma').count()) === 0, 'Escape no deja la confirmacion');
  ok(await p.evaluate(() => document.activeElement?.classList.contains('admin-avanzar')), 'tras Escape el foco no vuelve al boton');
  await tarjeta('ET-AAAA').locator('.admin-avanzar').click();
  await tarjeta('ET-AAAA').locator('.admin-no').click();
  await espera(150);
  ok((await tarjeta('ET-AAAA').locator('.admin-estado').textContent()) === 'Listo para retirar', '«No, dejarlo» cambia el estado');
  await tarjeta('ET-AAAA').locator('.admin-avanzar').click();
  await tarjeta('ET-AAAA').locator('.admin-confirmar').click();
  // Lo entregado sale de "Por atender" (sigue en "Todos") y el foco va al titulo.
  await esperaQue(async () => (await tarjeta('ET-AAAA').count()) === 0);
  ok((await tarjeta('ET-AAAA').count()) === 0, 'un pedido entregado sigue en Por atender');
  await espera(100);
  ok(await p.evaluate(() => document.activeElement?.id === 'admin-pedidos-titulo'), `el foco no va al titulo: ${await p.evaluate(() => document.activeElement?.tagName)}`);
  // Cancelar pide confirmar y se puede dejar.
  await tarjeta('ET-BBBB').locator('.admin-cancelar').click();
  await espera(150);
  ok((await tarjeta('ET-BBBB').locator('.admin-estado').textContent()) === 'En preparación', 'cancelar con un solo toque cancela');
  ok((await tarjeta('ET-BBBB').locator('.admin-confirmar').textContent()).includes('Sí, cancelar'), 'cancelar no pide confirmar');
  await p.keyboard.press('Escape');
  await espera(150);
  ok((await tarjeta('ET-BBBB').locator('.admin-confirma').count()) === 0, 'Escape no deja la confirmacion de cancelar');
  await tarjeta('ET-BBBB').locator('.admin-cancelar').click();
  await tarjeta('ET-BBBB').locator('.admin-confirmar').click();
  await esperaQue(async () => (await tarjeta('ET-BBBB').count()) === 0);
  ok((await tarjeta('ET-BBBB').count()) === 0, 'confirmar no cancela');
  const aviso = await p.evaluate(() => document.querySelector('[aria-live="polite"]').textContent);
  ok(aviso.includes('ET-BBBB') && aviso.includes('Cancelado'), `aviso al cambiar: ${aviso}`);
  await p.click('.admin-filtro >> nth=1');
  await espera(150);
  ok((await p.$$('.admin-pedido')).length === 3, `Todos no ensena los 3: ${(await p.$$('.admin-pedido')).length}`);
  ok((await tarjeta('ET-BBBB').locator('.admin-estado').textContent()) === 'Cancelado', 'en Todos, el cancelado no dice Cancelado');

  // El administrador: Resumen, Pedidos y Productos.
  ponerRol(CORREO, 'Administrador');
  // Pagina nueva: lo que la pagina sabe del rol vale medio minuto.
  await p.goto('about:blank');
  await p.goto(URL + '#/admin');
  await p.waitForSelector('.admin-cifras');
  ok((await hash()) === '#/admin/resumen', `#/admin no lleva al Resumen: ${await hash()}`);
  ok((await p.$$eval('.admin-pestana', (l) => l.map((x) => x.textContent))).join() === 'Resumen,Pedidos,Productos', 'el administrador no ve las tres pestañas');
  ok((await p.textContent('.admin-cifras')).includes('Ventas de hoy'), 'el resumen no dice las ventas de hoy');
  ok((await p.textContent('.admin-lista')).includes('Pan redondo'), 'lo mas vendido no esta');
  await p.click('.admin-pestana >> text=Productos');
  await p.waitForSelector('.admin-producto');
  const primero = p.locator('.admin-producto').first();
  ok(await primero.locator('.admin-guardar').isDisabled(), 'Guardar esta activo sin cambios');
  await primero.locator('input[type=checkbox] >> nth=0').uncheck();
  await primero.locator('.admin-precio-caja input').fill('0,40');
  ok(!(await primero.locator('.admin-guardar').isDisabled()), 'Guardar sigue apagado con cambios');
  await primero.locator('.admin-precio-caja input').fill('0');
  await primero.locator('.admin-guardar').click();
  await espera(150);
  ok((await primero.locator('.admin-error').count()) === 1, 'un precio de 0 no avisa');
  ok(await p.evaluate(() => document.activeElement?.getAttribute('aria-invalid') === 'true'), 'con un precio malo el foco no va al campo');
  ok(!!(await primero.locator('.admin-precio-caja input').getAttribute('aria-describedby')), 'el campo malo no apunta a su error');
  await primero.locator('.admin-precio-caja input').fill('0,40');
  ok((await primero.locator('.admin-error').count()) === 0, 'el error sigue tras corregir el precio');
  ok((await primero.locator('.admin-guardar').getAttribute('aria-label')).startsWith('Guardar '), 'Guardar no dice de que producto es');
  await primero.locator('.admin-guardar').click();
  await esperaQue(async () => (await p.locator('.admin-producto').first().locator('.admin-agotado').count()) === 1);
  ok(await p.evaluate(() => document.activeElement?.classList.contains('admin-guardar')), 'tras guardar el foco no esta en Guardar');
  ok((await p.locator('.admin-producto').first().locator('.admin-agotado').count()) === 1, 'un producto agotado no lleva su etiqueta');
  await p.reload();
  await p.waitForSelector('.admin-producto');
  const vuelto = p.locator('.admin-producto').first();
  ok(!(await vuelto.locator('input[type=checkbox] >> nth=0').isChecked()), 'lo guardado como agotado vuelve disponible');
  ok((await vuelto.locator('.admin-precio-caja input').inputValue()) === '0.40', `el precio guardado no sigue: ${await vuelto.locator('.admin-precio-caja input').inputValue()}`);

  ok(t.errores?.length ? false : true, 'hubo errores de pagina');
  await ctx.close();
}

export default async function panelCaso(t) {
  await panel(t, 'escritorio', VENTANAS.escritorio);
  await panel(t, 'movil', VENTANAS.movil);
}
