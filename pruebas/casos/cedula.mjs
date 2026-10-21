// La cedula y el RUC de la factura a otro nombre: digito verificador
// (modulo 10) y la misma regla que FN_CEDULA_VALIDA / FN_RUC_VALIDO de la base.
// Primero la regla sola (src/servicios/cobro.js, la de React) y
// despues lo que ve el cliente al dejar el campo.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RAIZ, VENTANAS, crearCuenta, espera, llegar } from '../arranque.mjs';

export const descripcion = 'cedula y RUC con digito verificador, en la regla y en la pantalla de confirmar';
export const limite = 120;

const MAL_CEDULA = 'Esta cédula no es válida: revisa los números.';
const MAL_RUC = 'Este RUC no es válido: revisa los números.';

// Lo que se escribe y lo que debe decir el error ('' = sin error).
const CASOS = [
  ['1710034065', ''],
  ['1710034066', MAL_CEDULA],
  ['1760001550001', ''],
  ['1790011674001', ''],
  ['1710034065001', ''],
  ['1710034066001', MAL_RUC],
  ['1790011674000', MAL_RUC],
  ['3010034065', 'Los dos primeros dígitos no son de una provincia del Ecuador.'],
  ['17100340', 'La cédula tiene 10 dígitos y el RUC 13.'],
];

// Escribe el numero, deja el campo y lee el error que queda a la vista.
async function probarCampo(p, ok, donde) {
  for (const [ident, espera_] of CASOS) {
    await p.fill('#factura-ident', ident);
    await p.locator('#factura-ident').blur();
    await espera(150);
    const error = await p.locator('#factura-ident-error');
    const visible = await error.isVisible();
    const texto = visible ? (await error.textContent()).trim() : '';
    ok(texto === espera_, `${donde} ${ident}: "${texto}" en vez de "${espera_}"`);
    const invalido = await p.getAttribute('#factura-ident', 'aria-invalid');
    ok((invalido === 'true') === Boolean(espera_), `${donde} ${ident}: aria-invalid=${invalido}`);
  }
}

export default async function cedula(t) {
  // La regla sola, con cedulas a mano.
  const cobro = await import(pathToFileURL(join(RAIZ, 'src', 'servicios', 'cobro.js')).href);
  for (const [ident, error] of CASOS) {
    const r = cobro.fallosFactura({ aOtro: true, nombre: 'Luis Tapia', ident }).ident || '';
    t.ok(r === error, `regla ${ident}: "${r}"`);
  }

  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT);
    await llegar(p, '#/tienda-catalogo');
    await p.locator('.product-card .card-mas').first().click(); await espera(900);
    await p.click('.floating-whatsapp.is-canasta'); await espera(400);
    await p.click('.canasta-enviar'); await espera(500);
    ok((await p.evaluate(() => location.hash)) === '#/confirmar', 'React no llega a confirmar');
    await p.click('label:has(input[name="canasta-factura"][value="otro"])'); await espera(200);
    await probarCampo(p, ok, 'React');

    await ctx.close();
  }
}
