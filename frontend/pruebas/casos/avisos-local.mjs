// Los avisos del local en Contactanos, leidos de Firestore
// (src/servicios/firestore.js y src/comun/AvisosDelLocal.jsx). Las pruebas
// no salen a internet: Firestore se contesta aqui, con la misma forma que
// su API REST (runQuery). En escritorio y en el telefono:
// - la consulta pide la coleccion "avisos" con activo == true;
// - los avisos salen bajo el horario, en su orden, en una nota (role="note") con titulo;
// - si Firestore falla, no sale nada y el resto de Contactanos sigue igual.
import { VENTANAS, espera, llegar } from '../arranque.mjs';

export const descripcion = 'Contactanos: avisos del local desde Firestore (NoSQL), y sin ellos si Firestore falla';
export const limite = 60;

const FIRESTORE = 'https://firestore.googleapis.com/v1/projects/*/databases/**';
const documento = (id, texto, orden) => ({
  document: {
    name: `projects/p/databases/(default)/documents/avisos/${id}`,
    fields: { texto: { stringValue: texto }, activo: { booleanValue: true }, orden: { integerValue: String(orden) } },
  },
  readTime: new Date().toISOString(),
});

export default async function avisosLocal(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    let consulta = null;
    // Vienen al reves de su orden: la pagina los ordena por "orden".
    await ctx.route(FIRESTORE, (r) => {
      consulta = JSON.parse(r.request().postData() || '{}');
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([documento('b', 'Segundo aviso', 2), documento('a', 'Primer aviso', 1)]) });
    });
    const p = await ctx.newPage();
    await p.goto(t.REACT);
    await llegar(p, '#/contacto');
    await p.waitForSelector('.avisos-local', { timeout: 6000 }).catch(() => {});
    const q = consulta?.structuredQuery;
    ok(q?.from?.[0]?.collectionId === 'avisos', `la consulta no va a "avisos": ${JSON.stringify(q)}`);
    ok(q?.where?.fieldFilter?.field?.fieldPath === 'activo' && q.where.fieldFilter.value?.booleanValue === true, 'la consulta no pide activo == true');
    const avisos = await p.$$eval('.contacto-horario .avisos-local[role="note"] li', (l) => l.map((e) => e.textContent.trim()));
    ok(avisos.join('|') === 'Primer aviso|Segundo aviso', `avisos bajo el horario, en orden: ${avisos.join('|')}`);
    ok((await p.getAttribute('.avisos-local', 'aria-labelledby')) === 'avisos-local-titulo'
      && (await p.textContent('#avisos-local-titulo')).trim() === 'Avisos del local', 'el aviso no lleva su titulo');

    // Firestore falla: nada de avisos, el horario sigue ahi.
    await ctx.unroute(FIRESTORE);
    await ctx.route(FIRESTORE, (r) => r.fulfill({ status: 500, body: '{}' }));
    await p.reload();
    await p.waitForSelector('.carta-horario');
    await espera(1500);
    ok((await p.locator('.avisos-local').count()) === 0, 'con Firestore caido sale un aviso');
    ok((await p.locator('.carta-horario div').count()) > 0, 'con Firestore caido se fue el horario');
    await ctx.close();
  }
}
