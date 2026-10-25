// Atras y Adelante dentro de la tienda no limpian orden, "Mostrar" ni
// busqueda; entrar con un enlace si. Tienda en el menu ya no tiene
// desplegable (seccion 4 del plan): de una categoria a otra se pasa
// cambiando la direccion, que es una entrada nueva sin state.entrar, como
// la que deja la cinta al volver a la portada.
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'Atras y Adelante en la tienda conservan orden, Mostrar y busqueda; un enlace los limpia';
export const limite = 60;

export default async function filtrosAtras(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    const ir = (s) => p.evaluate((x) => document.querySelector(x).click(), s);
    const estado = () => p.evaluate(() => ({
      hash: location.hash,
      orden: document.querySelector('.orden-boton')?.textContent.trim(),
      mostrar: document.querySelector('.interruptor')?.getAttribute('aria-pressed'),
      busca: document.querySelector('.vista-buscar input')?.value,
    }));
    const irA = async (hash) => { await p.evaluate((h) => { location.hash = h; }, hash); await espera(700); };
    await p.goto(t.REACT + '#/tienda-catalogo'); await espera(900);
    await irA('#/tienda-panes');
    await irA('#/tienda-dulces');
    // En dulces: orden por nombre, solo disponibles y busqueda.
    t.ok((await p.locator('.orden-boton[role="combobox"]').count()) === 1 && (await p.locator('.interruptor[aria-pressed]').count()) === 1, `[${nv}] la tienda no tiene el desplegable de Ordenar y el interruptor de Mostrar`);
    await ir('.orden-boton'); await espera(250);
    await ir('.orden-opcion:last-child'); await espera(200);
    await ir('.interruptor'); await espera(200);
    await p.fill('.vista-buscar input', 'tor'); await espera(400);
    const puesto = await estado();
    await p.goBack(); await espera(900);
    const atras = await estado();
    t.ok(puesto.orden === 'Nombre: de la A a la Z' && puesto.mostrar === 'true', `[${nv}] no se pudo poner el orden o Mostrar: ${JSON.stringify(puesto)}`);
    t.ok(atras.hash === '#/tienda-panes' && atras.orden === puesto.orden && atras.mostrar === puesto.mostrar && atras.busca === puesto.busca, `[${nv}] Atras limpio: ${JSON.stringify({ puesto, atras })}`);
    await p.goForward(); await espera(900);
    const adelante = await estado();
    t.ok(adelante.hash === '#/tienda-dulces' && adelante.orden === puesto.orden && adelante.mostrar === puesto.mostrar && adelante.busca === puesto.busca, `[${nv}] Adelante limpio: ${JSON.stringify(adelante)}`);
    // Entrar con un enlace (Tienda en el menu) si limpia.
    await ir('#main-nav a[href$="tienda-catalogo"]'); await espera(900);
    const enlace = await estado();
    t.ok(enlace.hash === '#/tienda-catalogo' && enlace.orden === 'Recomendados' && enlace.mostrar === 'false' && enlace.busca === '', `[${nv}] el enlace no limpio: ${JSON.stringify(enlace)}`);
    await ctx.close();
  }
}
