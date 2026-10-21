// La forma de pago preferida en Mis datos: el fieldset, el teclado, que solo
// se guarda con "Guardar los cambios", que #/confirmar empieza con ella, y que
// el sitio actual la ve y la cambia (y React lo ve).
import { VENTANAS, crearCuenta, espera, llegar } from '../arranque.mjs';

export const descripcion = 'forma de pago preferida en Mis datos, en #/confirmar y en el sitio actual';
export const limite = 90;

export default async function formaDePago(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT, { nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '991234567', clave: 'Clave123' });
    ok((await p.locator('fieldset.cuenta-metodos legend').textContent()) === 'Forma de pago preferida', 'legend');
    ok(await p.isChecked('input[name="cuenta-metodo"][value="efectivo"]'), 'no empieza en efectivo');
    ok((await p.locator('.cuenta-metodo-caja svg.cuenta-icono').count()) === 2, 'iconos');
    ok((await p.textContent('.cuenta-metodo >> nth=1')).includes('Crédito o débito. La escribes al pagar.'), 'frase tarjeta');
    ok((await p.textContent('.cuenta-forma-pago .cuenta-maqueta')).startsWith('No guardamos tarjetas.'), 'aviso tarjetas');
    // Teclado: flechas entre los dos radios.
    await p.focus('input[name="cuenta-metodo"][value="efectivo"]');
    await p.keyboard.press('ArrowDown');
    ok(await p.isChecked('input[name="cuenta-metodo"][value="tarjeta"]'), 'flecha no elige tarjeta');
    ok(JSON.parse(await p.evaluate(() => localStorage.getItem('eltradicional-cuenta'))).metodo === 'efectivo', 'se guardo sin pulsar Guardar');
    await p.click('.cuenta-guardar');
    await espera(200);
    ok((await p.textContent('.cuenta-guardar')).includes('Guardado'), 'boton no dice Guardado');
    const g = JSON.parse(await p.evaluate(() => localStorage.getItem('eltradicional-cuenta')));
    ok(g.metodo === 'tarjeta' && g.verificado && g.clave?.hash, 'formato tras guardar: ' + JSON.stringify(g));
    // #/confirmar empieza con la preferida.
    await llegar(p, '#/tienda-catalogo');
    await espera(150);
    await p.locator('.product-card .card-mas').first().click(); await espera(900);
    await p.click('.floating-whatsapp.is-canasta'); await espera(400);
    await p.click('.canasta-enviar'); await espera(500);
    ok((await p.evaluate(() => location.hash)) === '#/confirmar', 'no llega a confirmar');
    ok(await p.isChecked('input[name="canasta-metodo"][value="tarjeta"]'), 'confirmar no empieza en tarjeta');
    // React -> sitio actual (otro origen: se copia la cuenta).
    const cruda = await p.evaluate(() => localStorage.getItem('eltradicional-cuenta'));
    const a = await ctx.newPage();
    await a.goto(t.ACTUAL);
    await a.evaluate((c) => localStorage.setItem('eltradicional-cuenta', c), cruda);
    await a.reload(); await a.waitForSelector('.nav-cuenta.is-dentro');
    ok((await a.textContent('.cuenta-dato-metodo')) === 'Tarjeta', 'el sitio actual no ve tarjeta: ' + await a.textContent('.cuenta-dato-metodo'));
    // Y en el sitio actual se cambia a efectivo -> React lo ve.
    await a.click('.nav-cuenta'); await a.click('.cuenta-menu-opcion[data-va="pagos"]'); await espera(300);
    await a.click('.cuenta-metodo:has(input[value="efectivo"])'); await espera(200);
    const cruda2 = await a.evaluate(() => localStorage.getItem('eltradicional-cuenta'));
    ok(JSON.parse(cruda2).metodo === 'efectivo', 'el sitio actual no guardo efectivo');
    const r = await ctx.newPage();
    await r.goto(t.REACT + '#/');
    await r.evaluate((c) => localStorage.setItem('eltradicional-cuenta', c), cruda2);
    await r.goto(t.REACT + '#/cuenta'); await r.reload(); await espera(500);
    ok(await r.isChecked('input[name="cuenta-metodo"][value="efectivo"]'), 'React no ve efectivo del sitio actual');
    await ctx.close();
  }
}
