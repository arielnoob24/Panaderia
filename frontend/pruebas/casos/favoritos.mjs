// Favoritos (solo React): el corazon de la ficha solo guarda con la sesion
// abierta; sin ella abre la hoja que pide iniciar sesion y no guarda nada. Con
// ella el favorito sobrevive a recargar, aparece en Mis favoritos, "Agregar
// todos a la canasta" lo pone en la canasta con el precio de hoy, y "Quitar"
// lo saca.
import { VENTANAS, crearCuenta, espera } from '../arranque.mjs';

export const descripcion = 'favoritos: sin sesion pide entrar, con sesion guarda, lista, agregar y quitar';
export const limite = 120;

const CORAZON = 'button[aria-label="Favorito: Pan redondo"]';
const guardados = (p) => p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('tradicional:favoritos:')));

export default async function favoritos(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);

    // ---- Sin sesion: la hoja, y nada guardado.
    const anonimo = await t.contexto(ventana, { nombre: `${nv}-anonimo` });
    const a = await anonimo.newPage();
    await a.goto(t.REACT + '#/tienda-catalogo');
    await a.waitForSelector(CORAZON, { timeout: 5000 });
    ok((await a.getAttribute(CORAZON, 'aria-pressed')) === 'false', 'sin sesion: el corazon ya viene apretado');
    await a.click(CORAZON);
    await espera(400);
    ok(await a.locator('.pide-cuenta-fija:not([hidden])').count() === 1, 'sin sesion: no salio la hoja de iniciar sesion');
    const titulo = (await a.textContent('#pide-favoritos-titulo')).trim();
    ok(titulo === 'Inicia sesión para guardar favoritos', `sin sesion: titulo "${titulo}"`);
    ok((await guardados(a)).length === 0, 'sin sesion: se guardo un favorito');
    ok((await a.getAttribute(CORAZON, 'aria-pressed')) === 'false', 'sin sesion: el corazon quedo apretado');
    await a.keyboard.press('Escape');
    await espera(300);
    ok(await a.locator('.pide-cuenta-fija:not([hidden])').count() === 0, 'sin sesion: Escape no cerro la hoja');
    const foco = await a.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    ok(foco === 'Favorito: Pan redondo', `sin sesion: el foco no volvio al corazon (${foco})`);

    // ---- Con sesion: guarda, sobrevive a recargar y se ve en la lista.
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT);
    await p.goto(t.REACT + '#/tienda-catalogo'); await p.reload();
    await p.waitForSelector(CORAZON, { timeout: 5000 });
    await p.click(CORAZON);
    await espera(300);
    ok((await p.getAttribute(CORAZON, 'aria-pressed')) === 'true', 'con sesion: el corazon no quedo apretado');
    ok(await p.locator('.pide-cuenta-fija:not([hidden])').count() === 0, 'con sesion: salio la hoja de iniciar sesion');
    ok((await guardados(p)).length === 1, 'con sesion: no se guardo el favorito');
    await p.reload();
    await p.waitForSelector(CORAZON, { timeout: 5000 });
    ok((await p.getAttribute(CORAZON, 'aria-pressed')) === 'true', 'con sesion: el favorito no sobrevivio a recargar');

    await p.goto(t.REACT + '#/cuenta/favoritos'); await p.reload();
    await p.waitForSelector('.cuenta-vista-favoritos', { timeout: 5000 });
    await espera(400);
    const filas = await p.$$eval('.cuenta-favorito strong', (e) => e.map((x) => x.textContent.trim()));
    ok(filas.join(',') === 'Pan redondo', `lista: ${filas.join(',')}`);

    // Agregar: entra con el precio de hoy y la canasta se abre.
    ok(await p.locator('.cuenta-favoritos-todos').count() === 0, 'sigue el boton Agregar todos');
    await p.click('button[aria-label="Agregar Pan redondo a la canasta"]');
    await espera(600);
    ok(await p.locator('.canasta-panel.is-open').count() === 1, 'agregar: la canasta no se abrio');
    const linea = await p.$$eval('.canasta-lista .canasta-linea', (l) => l.map((li) => [
      li.querySelector('h3')?.textContent.trim(), li.querySelector('output')?.textContent.trim(),
    ].join(' | ')).join(' ; '));
    ok(linea === 'Pan redondo | 1', `agregar: ${linea}`);
    await p.keyboard.press('Escape');
    await espera(400);

    // Quitar: la lista queda vacia y lo dice.
    await p.click('button[aria-label="Quitar Pan redondo de favoritos"]');
    await espera(300);
    ok(await p.locator('.cuenta-favoritos-vacio').count() === 1, 'quitar: no salio el mensaje de vacio');
    ok((await p.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('tradicional:favoritos:'))) || '[]').length)) === 0, 'quitar: sigue guardado');
  }
}
