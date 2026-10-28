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
  // Lo entregado y lo cancelado sale de "Por atender" (sigue en "Todos").
  await tarjeta('ET-AAAA').locator('.admin-avanzar').click();
  await esperaQue(async () => (await tarjeta('ET-AAAA').count()) === 0);
  ok((await tarjeta('ET-AAAA').count()) === 0, 'un pedido entregado sigue en Por atender');
  // Cancelar pide un segundo toque.
  await tarjeta('ET-BBBB').locator('.admin-cancelar').click();
  await espera(150);
  ok((await tarjeta('ET-BBBB').locator('.admin-estado').textContent()) === 'En preparación', 'cancelar con un solo toque cancela');
  ok((await tarjeta('ET-BBBB').locator('.admin-cancelar').textContent()).includes('Sí, cancelar'), 'cancelar no pide confirmar');
  await tarjeta('ET-BBBB').locator('.admin-cancelar').click();
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
  await primero.locator('.admin-precio-caja input').fill('0,40');
  await primero.locator('.admin-guardar').click();
  await esperaQue(async () => (await p.locator('.admin-producto').first().locator('.admin-guardar').isDisabled()));
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
