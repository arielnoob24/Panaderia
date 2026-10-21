// ---- Pedir lo mismo otra vez (solo React; seccion 15 del plan, fase 6) -----
// De un pedido de Mis pedidos, lo que puede volver a la canasta y lo que no.
// Funcion pura: entra el pedido guardado, el catalogo de hoy y lo que ya hay en
// la canasta, y sale lo que hay que sumar y el aviso. Quien la usa despacha
// { tipo: 'sumar', lineas } y dice el aviso; aqui no se toca nada.
//
// Reglas:
//   - entra lo que sigue en el catalogo y disponible, con el mismo tamano
//     (el nombre de la linea lleva el tamano: "Coca-Cola 2 L");
//   - con el precio de hoy, no el de entonces;
//   - se suma a lo que ya tenga la canasta, con el tope de siempre por linea;
//   - lo que ya no esta (quitado, agotado o sin ese tamano) se dice por su
//     nombre: "Ya no tenemos Palanqueta".
import { MAX_UNIDADES, idDe } from '@raiz/js/comun/state.js';
import { enLista } from '@raiz/js/pedido/cobro.js';

// Lo que hoy se puede pedir, por id de linea: un producto sin tamanos es una
// linea; con tamanos, una por tamano, con el nombre y el precio que arma la ficha.
const ofertaDeHoy = (productos) => {
  const oferta = new Map();
  for (const p of productos) {
    if (!p.disponible) continue;
    const variantes = p.tamanos.length
      ? p.tamanos.map((t) => ({ nombre: `${p.nombre} ${t.valor}`, precio: t.precio }))
      : [{ nombre: p.nombre, precio: p.precio }];
    for (const v of variantes) oferta.set(idDe(v.nombre), v);
  }
  return oferta;
};

// pedido: el registro de IndexedDB ({ numero, lineas: [{ nombre, cantidad }] }).
// productos: los del catalogo, normalizados. enCanasta: los pares [id, linea].
// Devuelve { lineas: [{ id, nombre, precio, cantidad }], aviso, entro }.
function pedirOtraVez(pedido, productos, enCanasta = []) {
  const oferta = ofertaDeHoy(productos);
  const yaHay = new Map(enCanasta.map(([id, l]) => [id, l.cantidad]));
  const lineas = [];
  const entran = [];
  const faltan = [];
  const topados = [];
  for (const l of Array.isArray(pedido?.lineas) ? pedido.lineas : []) {
    const nombre = String(l?.nombre || '');
    const cantidad = Math.floor(Number(l?.cantidad) || 0);
    if (!nombre || cantidad < 1) continue;
    const id = idDe(nombre);
    const hoy = oferta.get(id);
    if (!hoy) { faltan.push(nombre); continue; }
    const antes = yaHay.get(id) || 0;
    const caben = Math.max(0, MAX_UNIDADES - antes);
    const suma = Math.min(cantidad, caben);
    if (suma < cantidad) topados.push(hoy.nombre);
    if (suma < 1) continue;
    yaHay.set(id, antes + suma);
    lineas.push({ id, nombre: hoy.nombre, precio: hoy.precio, cantidad: suma });
    entran.push(`${suma} × ${hoy.nombre}`);
  }

  const partes = [];
  if (entran.length) partes.push(`Pusimos en tu canasta ${enLista(entran)}, con el precio de hoy.`);
  if (topados.length) {
    partes.push(`${enLista(topados)} ya ${topados.length === 1 ? 'llega' : 'llegan'} al máximo de ${MAX_UNIDADES} por producto.`);
  }
  if (faltan.length) partes.push(`Ya no tenemos ${enLista(faltan)}.`);
  if (!entran.length) partes.push('No pusimos nada en tu canasta.');
  return { lineas, aviso: partes.join(' '), entro: lineas.length > 0 };
}

export { pedirOtraVez };
