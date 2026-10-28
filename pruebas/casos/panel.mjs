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
  ok((await p.$$eval('.admin-pestana', (l) => l.map((x) => x.textContent))).join() === 'Pedidos,Inventario,Bodega,Producción,Ajustes', 'el empleado no ve sus cinco pestañas');
  ok((await p.$$('.admin-pedido')).length === 2, `Por atender no esconde lo entregado: ${(await p.$$('.admin-pedido')).length}`);
  await p.goto(URL + '#/admin/productos');
  await p.reload();
  await p.waitForSelector('.admin-pedido');
  ok((await hash()) === '#/admin/pedidos', `el empleado entra a Productos: ${await hash()}`);

  // El empleado ve el inventario con cantidades, pero sin valores.
  await p.click('.admin-pestana >> text=Inventario');
  await p.waitForSelector('.admin-material');
  const invEmp = await p.textContent('.cuenta-vista-admin');
  ok(invEmp.includes('Harina de trigo') && invEmp.includes('Hay 12,5 kg'), 'el empleado no ve las existencias');
  ok(!invEmp.includes('vale $') && !invEmp.includes('costo $'), 'el empleado ve valores o costos');
  // Bodega sin compras por recibir.
  await p.click('.admin-pestana >> text=Bodega');
  await esperaQue(async () => (await p.textContent('.cuenta-vista-admin')).includes('No hay compras por recibir'));
  // Produccion: el empleado registra una tanda; sin costos.
  await p.click('.admin-pestana >> text=Producción');
  await p.waitForSelector('#admin-registrar-tanda');
  await p.click('button:has-text("Registrar tanda")');
  await p.waitForSelector('.admin-formulario .admin-error');
  ok((await p.textContent('.admin-formulario .admin-error')).includes('número entero'), 'una tanda sin cantidad no avisa');
  await p.getByLabel('Unidades que salieron').fill('500');
  await p.click('button:has-text("Registrar tanda")');
  await esperaQue(async () => (await p.textContent('.admin-formulario .admin-error').catch(() => '')).includes('No alcanza'));
  ok((await p.textContent('.admin-formulario .admin-error')).includes('No alcanza Harina'), 'una tanda que no alcanza no dice que falta');
  await p.getByLabel('Unidades que salieron').fill('12');
  await p.click('button:has-text("Registrar tanda")');
  await esperaQue(async () => (await p.$$('.admin-tandas li')).length === 1);
  const tanda = await p.textContent('.admin-tandas li');
  ok(tanda.includes('Pan redondo') && tanda.includes('12 u · Producida') && !tanda.includes('costó'), `la tanda no sale registrada sin costo: ${tanda}`);
  // Ajustes: el empleado reporta, pero no aprueba.
  await p.click('.admin-pestana >> text=Ajustes');
  await p.waitForSelector('#admin-reportar-ajuste');
  await p.getByLabel('Cuánto (kg)').fill('2');
  await p.click('button:has-text("Reportar")');
  await esperaQue(async () => (await p.textContent('.admin-formulario .admin-error').catch(() => '')).includes('motivo'));
  await p.getByLabel('Motivo').fill('Se cayó un saco');
  await p.click('button:has-text("Reportar")');
  await p.waitForSelector('li.admin-material:has-text("AJU0000001")');
  ok((await p.textContent('li.admin-material:has-text("AJU0000001")')).includes('Abierto'), 'el ajuste reportado no sale abierto');
  ok((await p.textContent('li.admin-material:has-text("AJU0000001")')).includes('-2 kg'), 'el ajuste no dice cuánto falta');
  ok((await p.$$('button[aria-label^="Aprobar el ajuste"]')).length === 0, 'el empleado puede aprobar un ajuste');
  await p.click('.admin-pestana >> text=Pedidos');
  await p.waitForSelector('.admin-pedido');

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
  ok((await p.$$eval('.admin-pestana', (l) => l.map((x) => x.textContent))).join() === 'Resumen,Pedidos,Productos,Inventario,Compras,Bodega,Producción,Ajustes,Equipo,Facturas,Nómina', 'el administrador no ve las once pestañas');
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

  // Inventario del administrador: alertas, valores, filtro y movimientos.
  await p.click('.admin-pestana >> text=Inventario');
  await p.waitForSelector('.admin-material');
  ok((await p.$$('.admin-material')).length === 3, 'el inventario no trae los 3 materiales');
  ok((await p.textContent('.cuenta-vista-admin')).includes('vale $18.40'), 'el administrador no ve el valor');
  ok((await p.$$eval('.admin-material .admin-estado', (l) => l.map((x) => x.textContent))).join() === 'Bajo el mínimo,Bajo el mínimo', 'las alertas de stock bajo no estan');
  await p.click('.admin-filtro >> text=Bajo el mínimo');
  await espera(150);
  ok((await p.$$('.admin-material')).length === 2, 'el filtro Bajo el minimo no deja 2');
  ok((await p.textContent('.admin-caducan')).includes('Caduca el'), 'los lotes por caducar no salen');
  await p.click('.admin-ver-mov >> nth=0');
  await p.waitForSelector('.admin-movimientos li');
  ok((await p.$$('.admin-movimientos li')).length === 2, 'el kardex no trae 2 movimientos');
  ok((await p.getAttribute('.admin-ver-mov >> nth=0', 'aria-expanded')) === 'true', 'el boton de movimientos no dice que esta abierto');

  // Compras: proveedores. Empiezan en cero; se crea uno, se le pone lo que vende y se desactiva.
  await p.click('.admin-pestana >> text=Compras');
  await p.waitForSelector('#admin-compras-titulo');
  await esperaQue(async () => (await p.textContent('.cuenta-vista-admin')).includes('Todavía no hay proveedores'));
  ok((await p.$$('.admin-material')).length === 0, 'Compras no empieza sin proveedores');
  await p.click('text=Nuevo proveedor >> nth=0');
  await p.click('button:has-text("Crear proveedor")');
  await p.waitForSelector('.admin-formulario .admin-error');
  ok((await p.textContent('.admin-formulario .admin-error')).includes('razón social'), 'un proveedor vacio no dice que falta');
  ok(await p.evaluate(() => document.activeElement?.tagName === 'INPUT'), 'con el error el foco no va al formulario');
  await p.getByLabel('Cédula', { exact: true }).fill('1501107609');
  await p.getByLabel('Nombre o razón social').fill('Molino Napo');
  await p.getByLabel('Correo').fill('molino@napo.ec');
  await p.getByLabel('Dirección').fill('Av. Tena 1');
  await p.click('button:has-text("Crear proveedor")');
  await p.waitForSelector('.admin-material');
  ok((await p.$$('.admin-material')).length === 1 && (await p.textContent('.admin-material')).includes('Molino Napo'), 'el proveedor creado no sale en la lista');
  ok((await p.$$('.admin-formulario')).length === 0, 'el formulario sigue abierto tras crear');
  ok(await p.evaluate(() => document.activeElement?.textContent === 'Nuevo proveedor'), 'tras crear el foco no vuelve a Nuevo proveedor');
  await p.click('text=Nuevo proveedor >> nth=0');
  await p.getByLabel('Cédula', { exact: true }).fill('1501107609');
  await p.getByLabel('Nombre o razón social').fill('Otro');
  await p.getByLabel('Correo').fill('otro@napo.ec');
  await p.getByLabel('Dirección').fill('Calle 2');
  await p.click('button:has-text("Crear proveedor")');
  await p.waitForSelector('.admin-formulario .admin-error');
  ok((await p.textContent('.admin-formulario .admin-error')).includes('Ya hay un proveedor'), 'repetir la cedula no avisa');
  await p.click('button:has-text("Cancelar")');
  await p.click('button[aria-label="Ver lo que vende Molino Napo"]');
  await p.waitForSelector('.admin-vende');
  ok((await p.textContent('.admin-vende')).includes('Todavía no se le ha puesto nada'), 'un proveedor nuevo ya vende algo');
  await p.getByLabel('Precio sin IVA').fill('0');
  await p.click('.admin-vende button:has-text("Agregar")');
  await p.waitForSelector('.admin-vende .admin-error');
  ok(true, 'precio malo avisa');
  await p.getByLabel('Precio sin IVA').fill('12,5');
  await p.click('.admin-vende button:has-text("Agregar")');
  await p.waitForSelector('.admin-vende .admin-lista li');
  ok((await p.textContent('.admin-vende .admin-lista')).includes('$12.50'), `lo que vende no trae el precio: ${await p.textContent('.admin-vende')}`);
  ok((await p.$$eval('.admin-vende select option', (l) => l.length)) === 2, 'lo que ya vende sigue en la lista de materiales');
  await p.click('.admin-vende button:has-text("Quitar")');
  await esperaQue(async () => (await p.$$('.admin-vende .admin-lista li')).length === 0);
  ok((await p.$$('.admin-vende .admin-lista li')).length === 0, 'Quitar no quita lo que vendia');
  await p.click('button[aria-label="Desactivar a Molino Napo"]');
  await p.waitForSelector('.admin-material .admin-agotado');
  ok((await p.textContent('.admin-material .admin-agotado')) === 'Desactivado', 'un proveedor desactivado no lo dice');

  // Ordenes de compra: se arma una con el proveedor, se aprueba confirmando y bodega la recibe.
  await p.click('button[aria-label="Activar a Molino Napo"]');
  await esperaQue(async () => (await p.locator('.admin-material .admin-agotado').count()) === 0);
  await p.getByLabel('Precio sin IVA').fill('12,5');
  await p.click('.admin-vende button:has-text("Agregar")');
  await p.waitForSelector('.admin-vende .admin-lista li');
  await p.click('button:has-text("Nueva orden")');
  await p.waitForSelector('#admin-nueva-orden');
  await p.click('button:has-text("Crear orden")');
  await p.waitForSelector('.admin-formulario .admin-error');
  ok((await p.textContent('.admin-formulario .admin-error')).includes('al menos un material'), 'una orden sin materiales no avisa');
  await p.getByLabel('Cantidad de Harina de trigo en qq').fill('3');
  ok((await p.textContent('.admin-formulario')).includes('$37.50'), 'la orden no suma el subtotal');
  await p.click('button:has-text("Crear orden")');
  const orden = p.locator('li.admin-material', { hasText: 'OCO0000001' });
  await orden.waitFor();
  ok((await orden.textContent()).includes('Abierta') && (await orden.textContent()).includes('$43.13'), `la orden creada no sale abierta con su total: ${await orden.textContent()}`);
  ok(await p.evaluate(() => document.activeElement?.textContent === 'Nueva orden'), 'tras crear la orden el foco no vuelve a Nueva orden');
  // Aprobar pide confirmar; Escape la deja abierta y devuelve el foco.
  await orden.locator('button[aria-label="Aprobar la orden OCO0000001"]').click();
  await espera(150);
  ok((await orden.locator('.admin-estado').textContent()) === 'Abierta', 'aprobar con un solo toque aprueba');
  ok(await p.evaluate(() => document.activeElement?.classList.contains('admin-confirmar')), 'el foco no va al Si de aprobar');
  await p.keyboard.press('Escape');
  await espera(150);
  ok(await p.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Aprobar la orden OCO0000001'), 'tras Escape el foco no vuelve a Aprobar');
  await orden.locator('button[aria-label="Aprobar la orden OCO0000001"]').click();
  await orden.locator('.admin-confirmar').click();
  await esperaQue(async () => (await orden.locator('.admin-estado').textContent()) === 'Aprobada');
  ok((await orden.textContent()).includes('recepción pendiente'), 'la orden aprobada no dice que espera su recepcion');
  ok((await orden.locator('button[aria-label^="Anular"]').count()) === 0, 'una orden aprobada se puede anular');

  // Bodega: lo que llega menos de lo pedido pide el motivo.
  await p.click('.admin-pestana >> text=Bodega');
  const recibo = p.locator('form[aria-label^="Recibir la orden OCO0000001"]');
  await recibo.waitFor();
  const cuanto = recibo.getByLabel('Cuánto llegó de Harina de trigo en qq');
  ok((await cuanto.inputValue()) === '3', 'bodega no trae escrito lo que falta');
  await cuanto.fill('2');
  await recibo.locator('button[type=submit]').click();
  await recibo.locator('.admin-error').waitFor();
  ok((await recibo.locator('.admin-error').textContent()).includes('motivo'), 'llegar menos sin motivo no avisa');
  await cuanto.fill('5');
  await recibo.locator('button[type=submit]').click();
  await esperaQue(async () => (await recibo.locator('.admin-error').textContent()).includes('más de lo que falta'));
  await cuanto.fill('2');
  await recibo.getByLabel('Motivo: llegó menos de lo pedido').fill('Faltaron dos sacos');
  await recibo.locator('button[type=submit]').click();
  await esperaQue(async () => (await p.textContent('.cuenta-vista-admin')).includes('No hay compras por recibir'));
  ok((await p.textContent('.admin-recibidas')).includes('2 qq de Harina de trigo'), 'lo recibido no queda en la lista');
  ok(await p.evaluate(() => document.activeElement?.id === 'admin-bodega-titulo'), 'tras recibir el foco no va al titulo');
  await p.click('.admin-pestana >> text=Compras');
  await p.waitForSelector('li.admin-material:has-text("OCO0000001")');
  ok((await p.locator('li.admin-material', { hasText: 'OCO0000001' }).textContent()).includes('recibido 2'), 'la orden no muestra lo recibido');

  // Produccion con costo y ajustes: el administrador aprueba lo que reporto el empleado.
  await p.click('.admin-pestana >> text=Producción');
  await p.waitForSelector('.admin-tandas li');
  ok((await p.textContent('.admin-tandas li')).includes('costó $'), 'el administrador no ve el costo de la tanda');
  await p.click('.admin-pestana >> text=Ajustes');
  const ajuste = p.locator('li.admin-material', { hasText: 'AJU0000001' });
  await ajuste.waitFor();
  await ajuste.locator('button[aria-label="Aprobar el ajuste AJU0000001"]').click();
  await espera(150);
  ok((await ajuste.locator('.admin-estado').textContent()) === 'Abierto', 'aprobar un ajuste con un solo toque lo aprueba');
  await p.keyboard.press('Escape');
  await espera(150);
  ok(await p.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Aprobar el ajuste AJU0000001'), 'tras Escape el foco no vuelve a Aprobar el ajuste');
  await ajuste.locator('button[aria-label="Aprobar el ajuste AJU0000001"]').click();
  await ajuste.locator('.admin-confirmar').click();
  await esperaQue(async () => (await p.locator('li.admin-material', { hasText: 'AJU0000001' }).locator('.admin-estado').textContent()) === 'Aprobado');
  ok((await p.textContent('li.admin-material:has-text("AJU0000001")')).includes('lo aprobó'), 'el ajuste aprobado no dice quién lo aprobó');

  // Equipo: la ficha propia sin botones de baja, y dar de alta, cambiar el sueldo y dar de baja a otro.
  await p.click('.admin-pestana >> text=Equipo');
  const yo = p.locator('li.admin-material', { hasText: 'Ariel Antonio' });
  await yo.waitFor();
  ok((await yo.textContent()).includes('tu cuenta'), 'la ficha propia no dice que es tu cuenta');
  ok((await yo.locator('button[aria-label^="Dar de baja"]').count()) === 0 && (await yo.locator('button[aria-label^="Quitar el acceso"]').count()) === 0, 'la ficha propia deja darse de baja o quitarse el acceso');
  await p.click('button:has-text("Nuevo empleado")');
  await p.click('button:has-text("Dar de alta")');
  await p.waitForSelector('.admin-formulario .admin-error');
  ok((await p.textContent('.admin-formulario .admin-error')).includes('cédula'), 'un empleado vacio no avisa de la cedula');
  await p.getByLabel('Cédula', { exact: true }).fill('0102030400');
  await p.getByLabel('Primer nombre').fill('Luis');
  await p.getByLabel('Primer apellido').fill('Andi');
  await p.getByLabel('Fecha de nacimiento').fill('1995-03-12');
  await p.getByLabel('Correo', { exact: true }).fill('luis@panaderia.ec');
  await p.getByLabel('Celular').fill('0987654321');
  await p.getByLabel('Dirección').fill('Barrio Centro, Tena');
  await p.getByLabel('Sueldo mensual ($)').fill('520');
  await p.click('button:has-text("Dar de alta")');
  const luis = p.locator('li.admin-material', { hasText: 'Luis Andi' });
  await luis.waitFor();
  ok((await luis.textContent()).includes('$520.00'), 'el empleado nuevo no sale con su sueldo');
  ok(await p.evaluate(() => document.activeElement?.textContent === 'Nuevo empleado'), 'tras dar de alta el foco no vuelve a Nuevo empleado');
  await luis.locator('button[aria-label="Dar acceso al panel a Luis Andi"]').click();
  await luis.getByLabel('Correo de su cuenta del sitio').fill('nadie@correo.ec');
  await luis.locator('form[aria-label="Dar acceso al panel a Luis Andi"] button[type=submit]').click();
  await luis.locator('.admin-error').waitFor();
  ok((await luis.locator('.admin-error').textContent()).includes('No hay una cuenta'), 'dar acceso a un correo sin cuenta no avisa');
  await luis.locator('button[aria-label="Cambiar el cargo o el sueldo de Luis Andi"]').click();
  await luis.getByLabel('Sueldo mensual ($)').fill('600');
  await luis.locator('form[aria-label="Cargo y sueldo de Luis Andi"] button[type=submit]').click();
  await esperaQue(async () => (await luis.textContent()).includes('$600.00'));
  ok((await luis.textContent()).includes('$600.00'), 'el sueldo nuevo no se ve');
  await luis.locator('button[aria-label="Dar de baja a Luis Andi"]').click();
  await espera(150);
  ok((await luis.locator('.admin-agotado').count()) === 0, 'dar de baja con un solo toque da de baja');
  ok(await p.evaluate(() => document.activeElement?.classList.contains('admin-confirmar')), 'el foco no va al Si de dar de baja');
  await p.keyboard.press('Escape');
  await espera(150);
  ok(await p.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Dar de baja a Luis Andi'), 'tras Escape el foco no vuelve a Dar de baja');
  await luis.locator('button[aria-label="Dar de baja a Luis Andi"]').click();
  await luis.locator('.admin-confirmar').click();
  await esperaQue(async () => (await luis.locator('.admin-agotado').count()) === 1);
  ok((await luis.locator('.admin-agotado').textContent()) === 'De baja', 'un empleado de baja no lo dice');

  // Facturas: ver las ultimas, anular una con confirmacion y ver que el cliente ya no la cuenta.
  await p.click('.admin-pestana >> text=Facturas');
  const fa1 = p.locator('li.admin-material', { hasText: 'Factura 001-001-000000001' });
  await fa1.waitFor();
  ok((await fa1.textContent()).includes('$12.50') && (await fa1.textContent()).includes('ET-A1A1'), 'la factura no trae su total y su pedido');
  ok((await p.locator('li.admin-material', { hasText: 'Hermanos Cruz' }).count()) >= 1, 'no salen los clientes');
  await fa1.locator('button[aria-label="Anular la factura 001-001-000000001"]').click();
  await espera(150);
  ok((await fa1.locator('.admin-agotado').count()) === 0, 'anular con un solo toque anula');
  ok(await p.evaluate(() => document.activeElement?.classList.contains('admin-confirmar')), 'el foco no va al Si de anular');
  await p.keyboard.press('Escape');
  await espera(150);
  ok(await p.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Anular la factura 001-001-000000001'), 'tras Escape el foco no vuelve a Anular');
  await fa1.locator('button[aria-label="Anular la factura 001-001-000000001"]').click();
  await fa1.locator('.admin-confirmar').click();
  await esperaQue(async () => (await fa1.locator('.admin-agotado').count()) === 1);
  ok((await fa1.locator('.admin-agotado').textContent()) === 'Anulada', 'una factura anulada no lo dice');
  ok((await fa1.locator('button[aria-label^="Anular"]').count()) === 0, 'una factura anulada deja anular otra vez');
  // Nomina: abrir un rol, agregar y quitar una linea, y aprobarlo con confirmacion.
  await p.click('.admin-pestana >> text=Nómina');
  await p.click('button:has-text("Abrir un rol")');
  await p.locator('.admin-formulario select').nth(1).selectOption('9');
  await p.getByLabel('Año').fill('2027');
  await p.click('button:has-text("Abrir rol")');
  await p.waitForSelector('.admin-formulario .admin-error');
  ok((await p.textContent('.admin-formulario .admin-error')).includes('todavía no llega'), 'abrir un rol de un mes futuro no avisa');
  await p.getByLabel('Año').fill('2026');
  await p.click('button:has-text("Abrir rol")');
  const rol = p.locator('li.admin-material', { hasText: 'septiembre de 2026' });
  await rol.waitFor();
  ok((await rol.textContent()).includes('Neto $425.58'), 'el rol nuevo no trae el neto del sueldo menos el IESS');
  ok(await p.evaluate(() => document.activeElement?.textContent === 'Abrir un rol'), 'tras abrir el rol el foco no vuelve a Abrir un rol');
  await rol.getByLabel('Valor ($)').fill('0');
  await rol.locator('form button[type=submit]').click();
  await rol.locator('.admin-error').waitFor();
  await rol.getByLabel('Valor ($)').fill('50');
  await rol.locator('form button[type=submit]').click();
  await esperaQue(async () => (await rol.textContent()).includes('Neto $475.58'));
  ok((await rol.textContent()).includes('Neto $475.58'), 'las horas extra no suben el neto');
  await rol.locator('button[aria-label^="Quitar Horas extra"]').click();
  await esperaQue(async () => (await rol.textContent()).includes('Neto $425.58'));
  ok((await rol.locator('button[aria-label^="Quitar"]').count()) === 0, 'el sueldo o el IESS se pueden quitar');
  await rol.locator('button[aria-label^="Aprobar el rol"]').click();
  await espera(150);
  ok((await rol.locator('.admin-estado').textContent()) === 'Abierto', 'aprobar con un solo toque aprueba');
  ok(await p.evaluate(() => document.activeElement?.classList.contains('admin-confirmar')), 'el foco no va al Si de aprobar');
  await p.keyboard.press('Escape');
  await espera(150);
  ok(await p.evaluate(() => document.activeElement?.getAttribute('aria-label')?.startsWith('Aprobar el rol')), 'tras Escape el foco no vuelve a Aprobar');
  await rol.locator('button[aria-label^="Aprobar el rol"]').click();
  await rol.locator('.admin-confirmar').click();
  await esperaQue(async () => (await rol.locator('.admin-estado').textContent()) === 'Aprobado');
  ok((await rol.locator('.admin-estado').textContent()) === 'Aprobado', 'un rol aprobado no lo dice');
  ok((await rol.locator('form').count()) === 0 && (await rol.locator('button[aria-label^="Anular"]').count()) === 0, 'un rol aprobado deja agregar lineas o anularlo');
  ok(t.errores?.length ? false : true, 'hubo errores de pagina');
  await ctx.close();
}

export default async function panelCaso(t) {
  await panel(t, 'escritorio', VENTANAS.escritorio);
  await panel(t, 'movil', VENTANAS.movil);
}
