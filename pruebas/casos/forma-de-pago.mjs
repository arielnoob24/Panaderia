// La forma de pago preferida en Mis datos: el fieldset, el teclado, que solo
// se guarda con "Guardar los cambios" y que #/confirmar empieza con ella.
import { VENTANAS, crearCuenta, espera, llegar } from '../arranque.mjs';

export const descripcion = 'forma de pago preferida en Mis datos y en #/confirmar';
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
    await ctx.close();
  }
}
