// ---- Mis pedidos en CSV ------------------------------------------------
// Un archivo plano que abre cualquier hoja de calculo: una fila por cada
// cosa pedida, con los datos de su pedido repetidos, para poder filtrar y
// sumar por producto, por mes o por forma de entrega. Sin DOM: recibe los
// pedidos (servicios/pedidos.js) y devuelve el texto.

const COLUMNAS = ['numero', 'fecha', 'estado', 'entrega', 'pago', 'producto', 'cantidad', 'precio_unitario', 'importe', 'total_pedido'];

// Un valor tal cual, o entre comillas si lleva coma, comillas o salto de
// linea (las comillas de dentro se doblan), como pide el formato CSV.
const celda = (valor) => {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const dosDecimales = (n) => (Number(n) || 0).toFixed(2);

const pedidosACsv = (pedidos) => {
  const filas = [COLUMNAS];
  for (const p of pedidos) {
    const comun = [
      p.numero,
      // La fecha en ISO (2026-11-24T10:30:00.000Z): la hoja la entiende.
      p.fecha ? new Date(p.fecha).toISOString() : '',
      p.estado || '',
      p.modo === 'domicilio' ? 'A domicilio' : 'Retiro en el local',
      p.metodo || '',
    ];
    for (const l of Array.isArray(p.lineas) ? p.lineas : []) {
      const cantidad = Number(l.cantidad) || 0;
      filas.push([...comun, l.nombre, cantidad, dosDecimales(l.precio), dosDecimales(cantidad * (Number(l.precio) || 0)), dosDecimales(p.total)]);
    }
  }
  // \r\n entre filas, como dice el RFC 4180 y como lo espera Excel.
  return filas.map((f) => f.map(celda).join(',')).join('\r\n') + '\r\n';
};

export { pedidosACsv, COLUMNAS };
