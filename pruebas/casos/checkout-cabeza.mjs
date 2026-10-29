// La cabeza de #/confirmar (CabezaPedido.jsx) no cambia con la tienda: el
// pago espera a la segunda vuelta del estilo (seccion 10 del plan). En
// escritorio y en el telefono (390 px, tactil):
// - el h1 va en Fraunces, centrado;
// - "Volver a la tienda" es la pastilla de antes: Arial, borde fino de masa
//   (no el outset del boton nativo) y del ancho de su texto, no de toda la
//   fila; y sale del pago (a la portada, como dice useVistaPedido).
// EmailJS va cortado (t.contexto ya lo corta; se vuelve a cortar aqui por
// si acaso: crear una cuenta sin cortarlo manda correos de verdad).
import { VENTANAS, crearCuenta, espera, esperaQue, llegar } from '../arranque.mjs';

export const descripcion = 'cabeza de #/confirmar como antes: h1 en Fraunces centrado, Volver a la tienda en pastilla Arial sin borde outset ni todo el ancho';
export const limite = 90;

const ES_FRAUNCES = /^"?Fraunces Variable/;

export default async function checkoutCabeza(t) {
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
    await p.waitForSelector('.canasta-panel.is-open .canasta-enviar');
    await espera(300);
    await pulsar('.canasta-enviar');
    await esperaQue(() => p.evaluate(() => location.hash === '#/confirmar'));
    await p.waitForSelector('.checkout-cabeza');
    await espera(300);

    const c = await p.evaluate(() => {
      const cabeza = document.querySelector('.checkout-cabeza');
      const volver = cabeza.querySelector('.checkout-volver');
      const h1 = cabeza.querySelector('h1');
      const ev = getComputedStyle(volver);
      const eh = getComputedStyle(h1);
      return {
        h1: [eh.fontFamily, eh.textAlign],
        letra: ev.fontFamily,
        borde: [ev.borderTopStyle, ev.borderTopWidth],
        radio: ev.borderTopLeftRadius,
        ancho: Math.round(volver.getBoundingClientRect().width),
        fila: Math.round(cabeza.getBoundingClientRect().width),
        clases: [cabeza.className, volver.className, h1.className],
      };
    });
    t.ok(ES_FRAUNCES.test(c.h1[0]) && c.h1[1] === 'center', `[${nombre}] el h1 del pago no va en Fraunces centrado (${c.h1})`);
    t.ok(/^Arial/.test(c.letra) && c.borde[0] === 'solid' && c.borde[1] === '1px' && parseFloat(c.radio) > 20, `[${nombre}] "Volver a la tienda" no es la pastilla de antes (${JSON.stringify(c)})`);
    t.ok(c.ancho < c.fila * .6, `[${nombre}] "Volver a la tienda" ocupa ${c.ancho} de ${c.fila} px`);
    t.ok(!c.clases.join(' ').includes('vista-'), `[${nombre}] la cabeza del pago lleva clases de la tienda (${c.clases})`);

    // La barra de pasos corta: dos pasos, el primero es el actual (nodo horno con cifra papel).
    const pasos = await p.evaluate(() => [...document.querySelectorAll('.checkout-pasos li')].map((li) => ({
      texto: li.textContent, actual: li.getAttribute('aria-current'), fondo: getComputedStyle(li.querySelector('.checkout-paso-num')).backgroundColor, color: getComputedStyle(li.querySelector('.checkout-paso-num')).color,
    })));
    t.ok(pasos.length === 2 && pasos[0].actual === 'step' && pasos[1].actual === null && /Confirmar y pagar/.test(pasos[0].texto) && /Pedido listo/.test(pasos[1].texto), `[${nombre}] la barra de pasos no marca el paso 1 de 2 (${JSON.stringify(pasos)})`);
    t.ok(pasos[0].fondo === 'rgb(58, 40, 34)' && pasos[0].color === 'rgb(255, 253, 248)', `[${nombre}] el nodo del paso actual no es horno con cifra papel (${JSON.stringify(pasos[0])})`);

    await pulsar('.checkout-volver');
    await esperaQue(() => p.evaluate(() => location.hash === '#/'));
    t.ok((await p.evaluate(() => location.hash)) === '#/', `[${nombre}] "Volver a la tienda" no sale del pago`);
    await ctx.close();
  }
}
