// Quitar un producto de la canasta pregunta antes en una hoja modal
// (ConfirmarCanasta.jsx): con la X de la linea (dos unidades) o con el basurero
// de la ultima unidad sube "¿Quitar <producto>?", el foco empieza en Cancelar,
// Escape y Cancelar la cierran sin tocar nada y "Si, quitar" lo quita y deja
// la barra de Deshacer.
import { VENTANAS, crearCuenta, espera, esperaQue, llegar } from '../arranque.mjs';

export const descripcion = 'quitar un producto pregunta en una hoja modal: foco en Cancelar, Escape no quita, Si quita y deja Deshacer';
export const limite = 90;

export default async function quitarModal(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto({ ...ventana, reducedMotion: 'reduce' }, { nombre });
    await ctx.route('https://api.emailjs.com/**', (r) => r.abort());
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT, { nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '991234567', clave: 'Clave123' });
    await llegar(p, '#/tienda-catalogo');
    await p.waitForSelector('.product-card .card-mas');
    const pulsar = (sel) => (nombre === 'movil' ? p.locator(sel).first().tap() : p.locator(sel).first().click());
    await p.evaluate(() => {
      const mas = document.querySelector('.product-card:not([hidden]) .card-mas');
      mas.click(); mas.click();
    });
    await espera(600);
    await pulsar('.floating-whatsapp.is-canasta');
    await p.waitForSelector('.canasta-panel.is-open .canasta-quitar');
    await espera(300);

    const estado = () => p.evaluate(() => {
      const m = document.querySelector('.confirmar-vaciar:has(.canasta-quitar-si)');
      return {
        visible: Boolean(m) && !m.hidden && getComputedStyle(m).display !== 'none',
        titulo: m?.querySelector('h3')?.textContent,
        foco: document.activeElement?.textContent?.trim(),
        detrasInert: document.querySelector('.canasta-pasos')?.inert === true,
        lineas: document.querySelectorAll('.canasta-lista li').length,
      };
    });

    t.ok((await estado()).visible === false, `[${nombre}] la hoja de quitar se ve antes de pedirla`);
    await pulsar('.canasta-quitar');
    await espera(300);
    let e = await estado();
    t.ok(e.visible && /^¿Quitar .+\?$/.test(e.titulo) && e.foco === 'Cancelar' && e.detrasInert && e.lineas === 1, `[${nombre}] al quitar no sube la hoja con el nombre, el foco en Cancelar y lo de detras inert (${JSON.stringify(e)})`);

    await p.keyboard.press('Escape');
    await espera(300);
    e = await estado();
    t.ok(!e.visible && e.lineas === 1 && !e.detrasInert, `[${nombre}] Escape no deja la canasta como estaba (${JSON.stringify(e)})`);
    t.ok(await p.locator('.canasta-panel.is-open').count() === 1, `[${nombre}] Escape en la hoja cerro tambien la canasta`);

    await pulsar('.canasta-quitar');
    await espera(300);
    await pulsar('.canasta-quitar-no');
    await espera(300);
    e = await estado();
    t.ok(!e.visible && e.lineas === 1, `[${nombre}] Cancelar no deja el producto en la canasta (${JSON.stringify(e)})`);

    await pulsar('.canasta-quitar');
    await espera(300);
    await pulsar('.canasta-quitar-si');
    await esperaQue(() => p.evaluate(() => document.querySelectorAll('.canasta-lista li').length === 0));
    e = await estado();
    t.ok(!e.visible && e.lineas === 0, `[${nombre}] "Si, quitar" no quita el producto y cierra la hoja (${JSON.stringify(e)})`);
    t.ok(await p.locator('.deshacer-barra').isVisible(), `[${nombre}] tras quitar no queda el Deshacer`);
    await ctx.close();
  }
}
