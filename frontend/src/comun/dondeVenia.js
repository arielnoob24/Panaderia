// ---- De donde se viene a la cuenta -----------------------------------------
// Las vistas que salen de "Tu cuenta" (Mis datos, Mis pedidos, Mis favoritos,
// Mi canasta predeterminada y Forma de pago) se ven sin la cabecera: son una
// hoja aparte, y lo que llevan arriba es un "Volver". Ese boton lleva a la
// ultima direccion que no era de la cuenta, que es lo que se estaba viendo
// antes de abrirla (o la portada, si la pagina se abrio ya en la cuenta).

// Sin cabecera: las cinco de la ficha de la cuenta. Entrar, crear, verificar
// y recuperar la conservan: no son de la cuenta, son la puerta.
export const SIN_CABECERA = new Set([
  '/cuenta',
  '/cuenta/pedidos',
  '/cuenta/favoritos',
  '/cuenta/canasta',
  '/cuenta/pago',
]);

let ultima = '/';

// Se llama con cada direccion nueva; solo se queda con las de fuera de la cuenta.
export function recordarSitio(ruta) {
  if (!ruta.startsWith('/cuenta')) ultima = ruta;
}

export const sitioDeAntes = () => ultima;
