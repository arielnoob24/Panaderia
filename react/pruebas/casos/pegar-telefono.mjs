// Pegar o escribir el telefono con 0, +593 o espacios deja los 9 numeros, en
// crear y en Mis datos de React y en crear y editar del sitio actual.
import { VENTANAS, crearCuenta, espera } from '../arranque.mjs';

export const descripcion = 'pegar y escribir el telefono (0, +593, espacios) en React y en el sitio actual';
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
    for (const [sitio, base] of [['react', t.REACT], ['actual', t.ACTUAL]]) {
      const ctx = await t.contexto(ventana, { nombre: `${nv} ${sitio}` });
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base.replace(/\/$/, '') });
      const p = await ctx.newPage();
      if (sitio === 'react') {
        await p.goto(base + '#/cuenta/crear'); await p.waitForSelector('#cuenta-telefono');
        await probarCampo(t, p, '#cuenta-telefono', `${nv} react crear`);
        await crearCuenta(p, base);
        await p.waitForSelector('#cuenta-editar-telefono');
        await probarCampo(t, p, '#cuenta-editar-telefono', `${nv} react mis datos`);
      } else {
        await p.goto(base); await p.waitForSelector('.nav-cuenta');
        await p.click('.nav-cuenta'); await p.click('.cuenta-menu [data-va="crear"]');
        await p.waitForSelector('#cuenta-telefono', { state: 'visible' });
        await probarCampo(t, p, '#cuenta-telefono', `${nv} actual crear`);
        await p.evaluate(() => localStorage.setItem('eltradicional-cuenta', JSON.stringify({ nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '991234567', direccion: '', verificado: true, sesionAbierta: true, metodo: 'efectivo' })));
        await p.reload(); await p.waitForSelector('.nav-cuenta');
        await p.click('.nav-cuenta'); await p.click('.cuenta-menu [data-va="sesion"]');
        await p.click('.cuenta-paso[data-paso="sesion"] .cuenta-editar:not(.cuenta-ver-pedidos):not(.cuenta-ver-pagos)');
        await p.waitForSelector('#cuenta-editar-telefono', { state: 'visible' });
        await probarCampo(t, p, '#cuenta-editar-telefono', `${nv} actual editar`);
      }
      await ctx.close();
    }
  }
}
