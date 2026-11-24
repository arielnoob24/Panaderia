// Las lineas de la canasta miden lo mismo con una unidad (sin X) que con
// varias (con X), y la X es roja (--rojo, solo para lo que borra).
import { VENTANAS, crearCuenta, espera, llegar } from '../arranque.mjs';

export const descripcion = 'las lineas de la canasta miden lo mismo con o sin la X, y la X es roja';
export const limite = 90;

export default async function canastaLineaAlto(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto({ ...ventana, reducedMotion: 'reduce' }, { nombre });
    await ctx.route('https://api.emailjs.com/**', (r) => r.abort());
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT, { nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '991234567', clave: 'Clave123' });
    await llegar(p, '#/tienda-catalogo');
    await p.waitForSelector('.product-card .card-mas');
    // Tres productos con 1, 2 y 3 unidades. Se busca uno de nombre corto en
    // cada tarjeta: el alto solo cambia si el nombre da la vuelta, y eso no es de la X.
    await p.evaluate(() => {
      [...document.querySelectorAll('.product-card:not([hidden]) .card-mas')].slice(0, 3).forEach((b, i) => { for (let k = 0; k <= i; k++) b.click(); });
    });
    await espera(600);
    await p.locator('.floating-whatsapp.is-canasta').first()[nombre === 'movil' ? 'tap' : 'click']();
    await p.waitForSelector('.canasta-panel.is-open .canasta-lista li');
    await espera(500);
    const m = await p.evaluate(() => [...document.querySelectorAll('.canasta-lista li')].map((li) => ({
      cantidad: li.querySelector('output')?.textContent,
      equis: Boolean(li.querySelector('.canasta-quitar')),
      alto: Math.round(li.querySelector('.canasta-fila').getBoundingClientRect().height),
      color: li.querySelector('.canasta-quitar') ? getComputedStyle(li.querySelector('.canasta-quitar')).color : null,
    })));
    t.ok(m.length === 3 && !m[0].equis && m[1].equis && m[2].equis, `[${nombre}] la X no sale solo desde dos unidades (${JSON.stringify(m)})`);
    t.ok(m.every((l) => l.alto === m[0].alto), `[${nombre}] la fila del nombre no mide lo mismo con y sin X (${JSON.stringify(m)})`);
    t.ok(m.filter((l) => l.equis).every((l) => l.color === 'rgb(166, 58, 46)'), `[${nombre}] la X no es roja (${JSON.stringify(m)})`);
    await ctx.close();
  }
}
