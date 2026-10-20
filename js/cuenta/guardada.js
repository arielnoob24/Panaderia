// ---- La cuenta guardada, sin pantalla ----------------------------------
// Que se acepta de la cuenta que hay en localStorage. Vive aparte de
// account.js porque account.js arma su panel al cargarse, y la version en
// React (react/, seccion 15 del plan) necesita leer la misma cuenta sin ese
// panel: asi, quien crea la cuenta en un sitio entra con ella en el otro.
//
// Aqui no se toca localStorage: quien llama lee, con su try/catch, y pasa el
// texto. La huella de la contrasena no sale de aqui: para pagar no hace falta.
const CLAVE_CUENTA = 'eltradicional-cuenta';

// El telefono se guarda sin el 0 ni el +593: los nueve digitos del movil.
const soloNueve = (v) => v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);

const SIN_CUENTA = {
  nombre: '', correo: '', telefono: '', direccion: '',
  dentro: false, verificado: false, metodo: 'efectivo',
};

// Lo de localStorage lo puede tocar cualquiera a mano, asi que se revisa
// antes de usarlo. Sin nombre o sin correo no hay cuenta: se esta fuera.
const leerCuentaGuardada = (crudo) => {
  if (!crudo) return { ...SIN_CUENTA };
  let dato;
  try { dato = JSON.parse(crudo); } catch (e) { return { ...SIN_CUENTA }; }
  if (!dato || typeof dato !== 'object' || !dato.nombre || typeof dato.correo !== 'string') {
    return { ...SIN_CUENTA };
  }
  return {
    nombre: String(dato.nombre).slice(0, 60),
    correo: String(dato.correo).slice(0, 80),
    telefono: soloNueve(String(dato.telefono || '')),
    direccion: String(dato.direccion || '').slice(0, 200),
    verificado: dato.verificado === true,
    metodo: dato.metodo === 'tarjeta' ? 'tarjeta' : 'efectivo',
    // Una cuenta guardada antes de que existiera este dato no trae el campo, y
    // entonces se entra como siempre: solo un cierre expreso deja fuera.
    dentro: dato.sesionAbierta !== false,
  };
};

// Si en este navegador hay alguna cuenta, aunque la sesion este cerrada: la
// hoja de "Entra a tu cuenta para pagar" ofrece entonces entrar y no crear.
const correoDeCuenta = (crudo) => {
  try { return crudo ? String(JSON.parse(crudo).correo || '') : ''; } catch (e) { return ''; }
};

export { CLAVE_CUENTA, soloNueve, leerCuentaGuardada, correoDeCuenta };
