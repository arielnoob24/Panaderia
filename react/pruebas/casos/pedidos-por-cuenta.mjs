// Pedidos por cuenta: Mis pedidos y el numero de la ficha ensenan solo los de
// la cuenta abierta (y los viejos sin correo). Y el aviso de Crear cuando ya
// hay una cuenta en el navegador, con el correo a medias.
import { VENTANAS, crearCuenta, espera, meterPedidos } from '../arranque.mjs';

export const descripcion = 'Mis pedidos y la ficha solo con los pedidos de la cuenta; aviso de Crear con cuenta';
export const limite = 90;

const BASE = { modo: 'retiro', direccion: '', metodo: 'Efectivo', subtotal: 1, envio: 0, total: 1, lineas: [{ nombre: 'Pan de yuca', cantidad: 1, precio: 1 }] };

export default async function pedidosPorCuenta(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    // Sin cuenta: Crear no avisa.
    await p.goto(t.REACT + '#/cuenta/crear'); await p.waitForSelector('#cuenta-nombre');
    ok((await p.locator('.cuenta-ya-hay').count()) === 0, 'aviso sin cuenta');
    await crearCuenta(p, t.REACT);
    await meterPedidos(p, [
      { ...BASE, numero: 'ET-AAAA', correo: 'Ana@Correo.com' },
      { ...BASE, numero: 'ET-LLLL', correo: 'luis@correo.com', haceMs: 1000 },
      { ...BASE, numero: 'ET-VVVV', haceMs: 86400000 },
    ]);
    const numeros = async () => {
      await p.goto(t.REACT + '#/cuenta/pedidos'); await p.reload(); await p.waitForSelector('.cuenta-vista-pedidos');
      await espera(500);
      return p.$$eval('.cuenta-pedido-numero', (l) => l.map((e) => e.textContent.trim()).join(','));
    };
    const ficha = async () => {
      await p.click('.nav-cuenta'); await espera(400);
      const n = await p.locator('.cuenta-menu-numero').textContent({ timeout: 3000 }).catch(() => '');
      await p.keyboard.press('Escape'); await espera(200);
      return n.replace(/[()\s]/g, '');
    };
    const deAna = await numeros();
    ok(deAna === 'ET-AAAA,ET-VVVV', `pedidos de Ana: ${deAna}`);
    const fichaAna = await ficha();
    ok(fichaAna === '2', `ficha de Ana: ${fichaAna}`);
    // Salir y crear otra: el aviso, con el correo a medias.
    await p.goto(t.REACT + '#/cuenta'); await p.waitForSelector('.cuenta-salir');
    await p.click('.cuenta-salir'); await espera(500);
    await p.goto(t.REACT + '#/cuenta/crear'); await p.waitForSelector('#cuenta-nombre');
    const aviso = (await p.textContent('.cuenta-ya-hay', { timeout: 3000 }).catch(() => '')).replace(/\s+/g, ' ').trim();
    ok(aviso === 'En este navegador ya hay una cuenta (a…@correo.com). Crear otra la reemplaza.', `aviso crear: ${aviso}`);
    await p.fill('#cuenta-nombre', 'Luis Tapia'); await p.fill('#cuenta-correo', 'luis@correo.com');
    await p.fill('#cuenta-telefono', '998877665'); await p.fill('#cuenta-clave', 'Otra4567'); await p.fill('#cuenta-repite', 'Otra4567');
    await p.click('.cuenta-crear');
    await p.waitForSelector('.codigo-falso');
    const c = (await p.textContent('.codigo-valor')).trim();
    await p.click('.codigo-casilla >> nth=0'); await p.keyboard.type(c); await p.waitForSelector('.cuenta-vista-datos'); await espera(400);
    const deLuis = await numeros();
    ok(deLuis === 'ET-LLLL,ET-VVVV', `pedidos de Luis: ${deLuis}`);
    const fichaLuis = await ficha();
    ok(fichaLuis === '2', `ficha de Luis: ${fichaLuis}`);
    await ctx.close();
  }
}
