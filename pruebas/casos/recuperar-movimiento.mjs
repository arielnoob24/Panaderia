// Recuperar, en movimiento: la hoja que sale entre pasos (inert, detras, sin
// ids), el foco en cada paso, nada se mueve con menos movimiento, sin
// desplazamiento horizontal a 320 px, sin el aviso de "ya hay una cuenta"
// (la cuenta ya no es de un navegador) y el enlace "¿Olvidaste...?" de al
// menos 24 px.
import { VENTANAS, crearCuenta, espera } from '../arranque.mjs';
import { codigoDe } from '../supabaseFalso.mjs';

export const descripcion = 'recuperar: movimiento entre pasos, foco, menos movimiento y 320 px';
export const limite = 120;

const PRUEBAS = {
  e1280: VENTANAS.escritorio,
  m390: VENTANAS.movil,
  m320: VENTANAS.m320,
  reducido: { ...VENTANAS.escritorio, reducedMotion: 'reduce' },
};

export default async function recuperarMovimiento(t) {
  for (const [nv, ventana] of Object.entries(PRUEBAS)) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    ctx.setDefaultTimeout(6000);
    const p = await ctx.newPage();
    const reducido = nv === 'reducido';
    const foco = () => p.evaluate(() => document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName);
    // Mide la transicion cuadro a cuadro: si hay hoja saliendo, si es inert,
    // si va detras, cuanto se desplaza la nueva y si hay desborde.
    const muestrear = () => p.evaluate(() => new Promise((listo) => {
      const s = []; let n = 0;
      const mira = () => {
        const sal = document.querySelector('.paso-marco.is-saliendo');
        const nueva = document.querySelector('.paso-marco:not(.is-saliendo)');
        s.push({
          sale: Boolean(sal), inert: sal ? sal.inert : null,
          detras: sal && nueva ? Boolean(nueva.compareDocumentPosition(sal) & Node.DOCUMENT_POSITION_FOLLOWING) : null,
          ids: sal ? sal.querySelectorAll('[id]').length : 0,
          tx: nueva ? new DOMMatrix(getComputedStyle(nueva).transform).m41 : null,
          desborde: document.documentElement.scrollWidth - innerWidth,
        });
        if (++n < 40) requestAnimationFrame(mira); else listo(s);
      };
      mira();
    }));
    const resumen = (s) => ({
      conSalida: s.some((x) => x.sale),
      siempreInert: s.filter((x) => x.sale).every((x) => x.inert && x.detras && x.ids === 0),
      maxTx: Math.max(...s.map((x) => Math.abs(x.tx || 0))),
      desborde: Math.max(...s.map((x) => x.desborde)),
      finSinSalida: !s[s.length - 1].sale,
    });

    await crearCuenta(p, t.REACT);
    await p.click('.cuenta-salir'); await espera(600);
    // Crear con una cuenta ya usada en el navegador: ningun aviso.
    await p.goto(t.REACT + '#/cuenta/crear'); await espera(700);
    ok((await p.locator('.cuenta-ya-hay').count()) === 0, 'aun sale el aviso de que ya hay una cuenta');
    // Iniciar sesion: el enlace de "¿Olvidaste...?".
    await p.goto(t.REACT + '#/cuenta/entrar'); await espera(700);
    await p.fill('#cuenta-entrar-correo', 'ana@correo.com');
    const caja = await p.locator('.cuenta-olvide-enlace').boundingBox();
    ok(caja && caja.height >= 24, `"¿Olvidaste...?" mide ${caja?.height} px de alto`);
    await p.click('.cuenta-olvide-enlace'); await p.waitForSelector('.recuperar-paso-correo'); await espera(600);
    // correo -> codigo
    const m1 = muestrear();
    await p.click('.cuenta-recuperar');
    const r1 = resumen(await m1);
    await p.waitForSelector('.recuperar-paso-codigo'); await espera(500);
    ok(await p.evaluate(() => document.activeElement === document.querySelector('.codigo-casilla')), `foco no en la primera casilla: ${await foco()}`);
    ok(reducido ? !r1.conSalida && r1.maxTx === 0 : r1.conSalida && r1.siempreInert && r1.maxTx > 5, `correo->codigo ${JSON.stringify(r1)}`);
    ok(r1.desborde <= 0 && r1.finSinSalida, `desborde o salida colgada ${JSON.stringify(r1)}`);
    // codigo -> correo (Cambiar el correo): en el acto.
    const m2 = muestrear();
    await p.click('.cuenta-cambiar');
    const r2 = resumen(await m2);
    await espera(400);
    ok(!r2.conSalida, `volver al correo deja hoja saliendo ${JSON.stringify(r2)}`);
    ok(await p.evaluate(() => document.activeElement?.id?.includes('correo')), `foco al volver: ${await foco()}`);
    // Otra vez al codigo y a la clave.
    await p.click('.cuenta-recuperar'); await p.waitForSelector('.recuperar-paso-codigo'); await espera(500);
    const m3 = muestrear();
    await p.click('.codigo-casilla >> nth=0'); await p.keyboard.type(codigoDe('ana@correo.com', 'recovery') || '000000');
    const r3 = resumen(await m3);
    await p.waitForSelector('.recuperar-paso-clave'); await espera(500);
    ok(await p.evaluate(() => document.activeElement?.id?.includes('clave')), `foco en clave: ${await foco()}`);
    ok(reducido ? !r3.conSalida : r3.conSalida && r3.siempreInert, `codigo->clave ${JSON.stringify(r3)}`);
    ok(r3.desborde <= 0 && r3.finSinSalida, `desborde 2 ${JSON.stringify(r3)}`);
    ok((await p.locator('.recuperar-paso').count()) === 1, 'quedan hojas de mas');
    // Terminar rapido (sin esperar animaciones): sin errores.
    await p.fill('#cuenta-recuperar-clave', 'Nueva1234');
    await p.fill('#cuenta-recuperar-repite', 'Nueva1234');
    await p.click('.cuenta-recuperar'); await espera(1500);
    ok((await p.evaluate(() => location.hash)) === '#/cuenta', `al terminar: ${await p.evaluate(() => location.hash)}`);
    await ctx.close();
  }
}
