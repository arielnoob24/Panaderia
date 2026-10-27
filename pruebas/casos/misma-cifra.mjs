// Escribir en una casilla del codigo la misma cifra que ya tenia pasa a la
// siguiente (React no da onChange si el valor no cambia; las casillas
// escuchan onInput). Con teclado de escritorio y en el telefono.
import { VENTANAS } from '../arranque.mjs';

export const descripcion = 'la misma cifra encima de una casilla del codigo pasa a la siguiente';
export const limite = 45;

export default async function mismaCifra(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/cuenta/crear');
    await p.fill('#cuenta-nombre', 'Ana Pérez');
    await p.fill('#cuenta-correo', 'ana@correo.com');
    await p.fill('#cuenta-telefono', '991234567');
    await p.fill('#cuenta-clave', 'Clave123');
    await p.fill('#cuenta-repite', 'Clave123');
    await p.click('.cuenta-crear');
    await p.waitForSelector('.codigo-casilla');
    await p.focus('.codigo-casilla >> nth=0');
    await p.keyboard.type('12');
    await p.focus('.codigo-casilla >> nth=0');
    await p.keyboard.type('1');
    const foco = await p.evaluate(() => document.activeElement.getAttribute('aria-label'));
    t.ok(foco === 'Cifra 2 de 6', `[${nv}] tras escribir 1 sobre 1 el foco esta en ${foco}`);
    const valores = await p.evaluate(() => [...document.querySelectorAll('.codigo-casilla')].map((c) => c.value).join(''));
    t.ok(valores === '12', `[${nv}] las casillas dicen ${valores}`);
    await ctx.close();
  }
}
