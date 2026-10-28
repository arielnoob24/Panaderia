// "Vaciar la canasta" pregunta en una hoja modal (ConfirmarVaciar.jsx), no en
// el mismo sitio: sube sobre la canasta, el foco empieza en "Cancelar", Escape
// y "Cancelar" la cierran sin tocar la canasta, y "Si, vaciar" la vacia y
// ofrece Deshacer. Lo de detras queda inert mientras esta arriba.
import { VENTANAS, crearCuenta, espera, esperaQue, llegar } from '../arranque.mjs';

export const descripcion = 'vaciar la canasta pregunta en una hoja modal: foco en Cancelar, Escape no vacia, Si vacia y deja Deshacer';
export const limite = 90;

export default async function vaciarModal(t) {
  for (const [nombre, ventana] of [['escritorio', VENTANAS.escritorio], ['movil', VENTANAS.movil]]) {
    const ctx = await t.contexto({ ...ventana, reducedMotion: 'reduce' }, { nombre });
    await ctx.route('https://api.emailjs.com/**', (r) => r.abort());
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT, { nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '991234567', clave: 'Clave123' });
    await llegar(p, '#/tienda-catalogo');
    await p.waitForSelector('.product-card .card-mas');
    const pulsar = (sel) => (nombre === 'movil' ? p.locator(sel).first().tap() : p.locator(sel).first().click());
    await pulsar('.product-card .card-mas');
    await espera(600);
    await pulsar('.floating-whatsapp.is-canasta');
    await p.waitForSelector('.canasta-panel.is-open .canasta-vaciar');
    await espera(300);

    const estado = () => p.evaluate(() => {
      const m = document.querySelector('.confirmar-vaciar');
      return {
        visible: Boolean(m) && !m.hidden && getComputedStyle(m).display !== 'none',
        foco: document.activeElement?.textContent?.trim(),
        rol: m?.getAttribute('role'),
        detrasInert: document.querySelector('.canasta-pasos')?.inert === true,
        lineas: document.querySelectorAll('.canasta-lista li').length,
      };
    });

    t.ok((await estado()).visible === false, `[${nombre}] la hoja de vaciar se ve antes de pedirla`);
    await pulsar('.canasta-vaciar');
    await espera(300);
    let e = await estado();
    t.ok(e.visible && e.rol === 'alertdialog' && e.foco === 'Cancelar' && e.detrasInert, `[${nombre}] al vaciar no sube la hoja con el foco en Cancelar y lo de detras inert (${JSON.stringify(e)})`);

    await p.keyboard.press('Escape');
    await espera(300);
    e = await estado();
    t.ok(!e.visible && e.lineas === 1 && !e.detrasInert, `[${nombre}] Escape no cierra la hoja dejando la canasta como estaba (${JSON.stringify(e)})`);
    t.ok(await p.locator('.canasta-panel.is-open').count() === 1, `[${nombre}] Escape en la hoja cerro tambien la canasta`);

    await pulsar('.canasta-vaciar');
    await espera(300);
    await pulsar('.canasta-vaciar-si');
    await esperaQue(() => p.evaluate(() => document.querySelectorAll('.canasta-lista li').length === 0));
    e = await estado();
    t.ok(!e.visible && e.lineas === 0, `[${nombre}] "Si, vaciar" no vacia la canasta y cierra la hoja (${JSON.stringify(e)})`);
    t.ok(await p.locator('.deshacer-barra').isVisible(), `[${nombre}] tras vaciar no queda el Deshacer`);
    await ctx.close();
  }
}
