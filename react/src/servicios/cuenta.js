// ---- La cuenta de este navegador, solo para leer -----------------------
// La cuenta llega a React en la fase 5. Hasta entonces, la que se creo en el
// sitio actual ya esta en localStorage, y React la lee con las mismas reglas
// (js/cuenta/guardada.js) para saber si se puede pagar y a que correo va el
// comprobante. Aqui no se escribe nada.
//
// Se lee una vez y se vuelve a leer cuando otra pestana la cambia (el evento
// 'storage'): quien entra en su cuenta en el sitio actual puede pagar aqui sin
// recargar.
import { CLAVE_CUENTA, leerCuentaGuardada, correoDeCuenta } from '@raiz/js/cuenta/guardada.js';

const leerCrudo = () => {
  try { return window.localStorage.getItem(CLAVE_CUENTA); } catch (e) { return null; }
};

const leer = () => {
  const crudo = leerCrudo();
  return { ...leerCuentaGuardada(crudo), hayCuenta: Boolean(correoDeCuenta(crudo)) };
};

let cuenta = null;
const oyentes = new Set();

const alGuardarse = (e) => {
  // key null es que se vacio todo el almacenamiento.
  if (e.key !== null && e.key !== CLAVE_CUENTA) return;
  cuenta = leer();
  oyentes.forEach((avisar) => avisar());
};

// Para useSyncExternalStore: la misma cuenta mientras no cambie, para no
// repintar en balde.
const suscribirCuenta = (avisar) => {
  if (!oyentes.size) window.addEventListener('storage', alGuardarse);
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
    if (!oyentes.size) window.removeEventListener('storage', alGuardarse);
  };
};
const cuentaActual = () => {
  if (!cuenta) cuenta = leer();
  return cuenta;
};

export { suscribirCuenta, cuentaActual };
