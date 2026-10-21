// La prueba rapida que corre el CI (seccion 15 del plan, fase 6): si esto no
// pasa, la pagina no arranca o lo basico esta roto, y no se publica.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VENTANAS, crearCuenta, esperaQue, hashDe } from '../arranque.mjs';

export const descripcion = 'la portada arranca, se agrega a la canasta y se crea una cuenta hasta #/cuenta';
export const limite = 60;

export default async function humo(t) {
  const productos = JSON.parse(readFileSync(join(t.RAIZ, 'data', 'productos.json'), 'utf8')).productos;
  const ctx = await t.contexto(VENTANAS.escritorio, { nombre: 'humo' });
  const p = await ctx.newPage();

  // La portada: cabecera, h1 y la fila de "Los mas pedidos".
  await p.goto(t.REACT + '#/');
  await p.waitForSelector('.product-card');
  t.ok(await p.locator('h1').count() === 1, 'la portada no tiene un h1');
  t.ok(await p.locator('.site-header').count() === 1, 'la portada no tiene cabecera');
  const destacados = productos.filter((x) => x.destacado === true && x.disponible !== false).length;
  t.ok(await p.locator('.product-card').count() >= Math.min(4, destacados), 'la fila de la portada viene vacia');

  // La tienda entera: una ficha por producto del catalogo.
  await p.goto(t.REACT + '#/tienda-catalogo');
  await esperaQue(async () => (await p.locator('.product-card').count()) === productos.length);
  t.ok(await p.locator('.product-card').count() === productos.length, `la tienda tiene ${await p.locator('.product-card').count()} fichas y el catalogo ${productos.length}`);

  // Agregar el primero que se pueda pedir deja una linea en la canasta.
  await p.locator('.product-card .card-mas:visible').first().click();
  await p.click('.floating-whatsapp.is-canasta');
  await p.waitForSelector('.canasta-panel.is-open .canasta-linea', { timeout: 5000 }).catch(() => {});
  t.ok(await p.locator('.canasta-panel.is-open .canasta-linea').count() === 1, 'agregar no dejo una linea en la canasta abierta');
  await p.keyboard.press('Escape');

  // Crear la cuenta con el codigo del recuadro (EmailJS cortado) lleva a #/cuenta.
  await crearCuenta(p, t.REACT);
  t.ok(await hashDe(p) === '#/cuenta', `crear y verificar la cuenta deja ${await hashDe(p)} y no #/cuenta`);
  const cuenta = JSON.parse(await p.evaluate(() => localStorage.getItem('eltradicional-cuenta')) || '{}');
  t.ok(cuenta.verificado === true && cuenta.sesionAbierta === true, 'la cuenta no quedo verificada y con la sesion abierta');
  t.ok(!JSON.stringify(cuenta).includes('Clave123'), 'la contrasena se guardo en claro');
  // Lo de la canasta sigue ahi despues de crear la cuenta, y esta guardado.
  t.ok((await p.textContent('.canasta-cuenta-numero')).trim() === '1', `la canasta dice ${await p.textContent('.canasta-cuenta-numero')} tras crear la cuenta`);
  const pedido = JSON.parse(await p.evaluate(() => localStorage.getItem('eltradicional-pedido')) || '{}');
  t.ok(Array.isArray(pedido.lineas) && pedido.lineas.length === 1, 'el pedido no se guardo en localStorage');
}
