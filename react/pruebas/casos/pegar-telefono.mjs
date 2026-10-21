// Pegar o escribir el telefono con 0, +593 o espacios deja los 9 numeros, en
// crear y en Mis datos.
import { VENTANAS, crearCuenta, espera } from '../arranque.mjs';

export const descripcion = 'pegar y escribir el telefono (0, +593, espacios) en crear y en Mis datos';
export const limite = 120;

const PEGADOS = [
  ['0991234567', '991234567'], ['099 123 4567', '991234567'], ['+593 99 123 4567', '991234567'],
  ['+593991234567', '991234567'], ['593 099 123 4567', '991234567'], ['99 123 4567', '991234567'],
  ['991234567', '991234567'],
];
const ESCRITOS = [['991234567', '991234567'], ['0991234567', '991234567'], ['+593 99 123 4567', '991234567'], ['9912345678', '991234567']];

async function probarCampo(t, p, sel, etiqueta) {
  for (const [texto, quiero] of PEGADOS) {
    await p.fill(sel, '');
    await p.evaluate((x) => navigator.clipboard.writeText(x), texto);
    await p.focus(sel);
    await p.keyboard.press('Control+V');
    await espera(120);
    const v = await p.inputValue(sel);
    t.ok(v === quiero, `${etiqueta} pegar ${JSON.stringify(texto)} -> ${v}`);
  }
  // A mano, tecla a tecla, incluido el +593 y el 0.
  for (const [texto, quiero] of ESCRITOS) {
    await p.fill(sel, '');
    await p.focus(sel);
    await p.keyboard.type(texto, { delay: 10 });
    const v = await p.inputValue(sel);
    t.ok(v === quiero, `${etiqueta} escribir ${JSON.stringify(texto)} -> ${v}`);
  }
  const ac = await p.getAttribute(sel, 'autocomplete');
  const ml = await p.getAttribute(sel, 'maxlength');
  t.ok(ac === 'tel-national' && ml === null, `${etiqueta} autocomplete=${ac} maxlength=${ml}`);
}

export default async function pegarTelefono(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ctx = await t.contexto(ventana, { nombre: nv });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: t.REACT.replace(/\/$/, '') });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/cuenta/crear'); await p.waitForSelector('#cuenta-telefono');
    await probarCampo(t, p, '#cuenta-telefono', `${nv} crear`);
    await crearCuenta(p, t.REACT);
    await p.waitForSelector('#cuenta-editar-telefono');
    await probarCampo(t, p, '#cuenta-editar-telefono', `${nv} mis datos`);
    await ctx.close();
  }
}
