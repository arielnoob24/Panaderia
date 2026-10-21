// Atras y Adelante dentro de la tienda no limpian orden, "Mostrar" ni
// busqueda; entrar con un enlace si.
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'Atras y Adelante en la tienda conservan orden, Mostrar y busqueda; un enlace los limpia';
export const limite = 60;

export default async function filtrosAtras(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    const ir = (s) => p.evaluate((x) => document.querySelector(x).click(), s);
    const estado = () => p.evaluate(() => {
      const sels = [...document.querySelectorAll('.vista-mando select')];
      const orden = sels.find((s) => [...s.options].some((o) => o.value === 'precio-asc'));
      const otro = sels.find((s) => s !== orden);
      return { hash: location.hash, orden: orden?.value, mostrar: otro?.value, busca: document.querySelector('.vista-buscar input')?.value };
    });
    await p.goto(t.REACT + '#/tienda-catalogo'); await espera(900);
    await ir('.nav-submenu a[href$="tienda-panes"]'); await espera(700);
    await ir('.nav-submenu a[href$="tienda-dulces"]'); await espera(700);
    // En dulces: orden, Mostrar y busqueda.
    const sels = p.locator('.vista-mando select');
    const n = await sels.count();
    t.ok(n >= 2, `[${nv}] la tienda tiene ${n} selects y deberian ser Ordenar y Mostrar`);
    for (let i = 0; i < n; i += 1) {
      const vals = await sels.nth(i).evaluate((s) => [...s.options].map((o) => o.value));
      await sels.nth(i).selectOption(vals.includes('nombre') ? 'nombre' : vals[vals.length - 1]);
    }
    await p.fill('.vista-buscar input', 'tor'); await espera(400);
    const puesto = await estado();
    await p.goBack(); await espera(900);
    const atras = await estado();
    t.ok(atras.hash === '#/tienda-panes' && atras.orden === puesto.orden && atras.mostrar === puesto.mostrar && atras.busca === puesto.busca, `[${nv}] Atras limpio: ${JSON.stringify({ puesto, atras })}`);
    await p.goForward(); await espera(900);
    const adelante = await estado();
    t.ok(adelante.hash === '#/tienda-dulces' && adelante.orden === puesto.orden && adelante.busca === puesto.busca, `[${nv}] Adelante limpio: ${JSON.stringify(adelante)}`);
    // Entrar con un enlace si limpia.
    await ir('.nav-submenu a[href$="tienda-panes"]'); await espera(900);
    const enlace = await estado();
    t.ok(enlace.orden === 'recomendados' && enlace.busca === '', `[${nv}] el enlace no limpio: ${JSON.stringify(enlace)}`);
    await ctx.close();
  }
}
