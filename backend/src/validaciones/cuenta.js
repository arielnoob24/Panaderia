// ---- Que los datos de la cuenta vengan bien (400 si no) ----------------
// Las mismas reglas que la pagina (frontend/src/servicios/cuenta.js) y que
// la Edge Function: nombre con apellido, telefono de 9 cifras que empieza
// por 9 (lo que va despues del +593) y direccion de hasta 80.
import { ErrorHttp } from '../errores.js';

const validarCuenta = (d) => {
  const nombre = String(d?.nombre ?? '').trim().replace(/\s+/g, ' ');
  const telefono = String(d?.telefono ?? '');
  const direccion = String(d?.direccion ?? '').trim();
  const metodo = d?.metodo === 'tarjeta' ? 'tarjeta' : 'efectivo';
  if (nombre.length < 3 || nombre.length > 120 || !nombre.includes(' ')) throw new ErrorHttp(400, 'El nombre lleva nombre y apellido.');
  if (!/^9\d{8}$/.test(telefono)) throw new ErrorHttp(400, 'El teléfono son 9 números después del +593, empezando por 9.');
  if (direccion.length > 80) throw new ErrorHttp(400, 'La dirección es demasiado larga.');
  return { nombre, telefono, direccion, metodo };
};

// "Ana María Pérez López" -> nombres "Ana María", apellidos "Pérez López":
// la primera mitad de las palabras (redondeando hacia arriba) son nombres.
const partirNombre = (nombre) => {
  const p = nombre.split(' ');
  const n = Math.ceil(p.length / 2);
  return { nombres: p.slice(0, n).join(' '), apellidos: p.slice(n).join(' ') };
};

export { validarCuenta, partirNombre };
