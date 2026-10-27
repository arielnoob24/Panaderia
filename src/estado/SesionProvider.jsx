// ---- La sesion, para toda la aplicacion --------------------------------
// Context + useReducer, como el pedido. El reductor es puro
// (estado/sesion.js); aqui vive lo que habla con fuera: Supabase Auth para
// crear, verificar, entrar, salir y cambiar la contrasena, y la API para los
// datos de la cuenta (tabla USUARIOS). Tambien la copia local de la cuenta,
// que se guarda cuando cambia.
//
// Quien usa la sesion recibe los datos de la cuenta (nombre, correo,
// telefono, direccion, dentro, verificado, metodo), si en este navegador ya
// entro alguna (hayCuenta), si se puede pagar (puedePedir), la cuenta que
// espera su codigo (pendiente) y las acciones: crear, entrar, verificar,
// reenviar, editar y salir; y para recuperar la contrasena, la recuperacion
// en marcha con pedirRecuperar, reenviarRecuperar, comprobarRecuperar,
// cambiarClave y olvidarRecuperar. Todas las que hablan con fuera devuelven
// una promesa. Lo que pasa en pantalla despues (avisos, foco, a donde se va)
// lo decide quien llama, con lo que estas devuelven.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import { reductor, vigente } from './sesion.js';
import {
  SIN_CUENTA, leerCuenta, guardarCuenta,
  REENVIO, INTENTOS_RECUPERAR, SIN_CORREO_RECUPERAR, CADUCO_RECUPERAR,
} from '../servicios/cuenta.js';
import { supabase } from '../servicios/supabase.js';
import { pedirApi } from '../servicios/api.js';

const ContextoSesion = createContext(null);

const SIN_RED = 'No pudimos conectar con el servidor. Revisa tu internet e inténtalo otra vez.';
// Supabase no dice si el correo existe o si fallo la contrasena: responde lo
// mismo a los dos, para que nadie pueda averiguar que correos tienen cuenta.
const NO_ENTRA = 'El correo o la contraseña no son correctos. Revisa mayúsculas y minúsculas, o pulsa Mostrar para ver lo que escribiste.';
const CODIGO_MAL = 'Ese código no es el que enviamos o ya caducó. Míralo otra vez o pide otro.';

// Lo que dice un fallo de Supabase Auth, en palabras de la pagina. code es el
// de Supabase; status 0 es que no hubo respuesta.
const textoDe = (error) => {
  if (!error) return '';
  if (!error.status || error.name === 'AuthRetryableFetchError') return SIN_RED;
  switch (error.code) {
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Pediste demasiados códigos seguidos. Espera un minuto e inténtalo otra vez.';
    case 'weak_password':
      return 'Esa contraseña es demasiado fácil de adivinar. Prueba con otra.';
    case 'same_password':
      return 'La contraseña nueva tiene que ser distinta de la anterior.';
    default:
      return 'Algo falló en el servidor. Inténtalo otra vez en un momento.';
  }
};

// ---- Los datos de la cuenta, de la API ----------------------------------
// Con la sesion de Auth ya abierta: GET /cuenta. Si la cuenta aun no tiene
// fila en USUARIOS (se verifico pero no se llego a guardar), se crea con lo
// que se dio al registrarse, que Auth guarda en user_metadata. Devuelve
// { cuenta } o { error }.
const datosDe = (usuario, extra = {}) => ({
  nombre: usuario.user_metadata?.nombre || '',
  telefono: usuario.user_metadata?.telefono || '',
  direccion: usuario.user_metadata?.direccion || '',
  metodo: 'efectivo',
  ...extra,
});
const traerCuenta = async (usuario, extra) => {
  try {
    return { cuenta: await pedirApi('/cuenta', { sesion: true }) };
  } catch (e) {
    if (e.estado !== 404) return { error: e.estado ? 'No pudimos leer tu cuenta. Inténtalo otra vez.' : SIN_RED, estado: e.estado };
  }
  try {
    return { cuenta: await pedirApi('/cuenta', { metodo: 'POST', cuerpo: datosDe(usuario, extra), sesion: true }) };
  } catch (e) {
    return { error: e.estado ? 'No pudimos guardar tus datos. Inténtalo otra vez.' : SIN_RED, estado: e.estado };
  }
};

// ---- Al abrir la pagina ------------------------------------------------
// main.jsx espera a cargarSesion antes de pintar, como al catalogo: asi las
// vistas de la cuenta saben desde el principio si hay sesion. Sin red, con
// la sesion de Auth abierta, vale la copia local de esa misma cuenta.
let arranque = { cuenta: { ...SIN_CUENTA }, hayCuenta: false };
const cargarSesion = async () => {
  const copia = leerCuenta();
  arranque = { cuenta: { ...SIN_CUENTA, ...(copia || {}), dentro: false }, hayCuenta: Boolean(copia) };
  try {
    const { data } = await supabase.auth.getSession();
    const usuario = data.session?.user;
    if (!usuario) return;
    const r = await traerCuenta(usuario);
    if (r.cuenta) {
      arranque = { cuenta: { ...r.cuenta, dentro: true, verificado: true }, hayCuenta: true };
    } else if (r.estado === 401) {
      await supabase.auth.signOut({ scope: 'local' });
    } else if (copia && copia.correo.toLowerCase() === String(usuario.email).toLowerCase()) {
      arranque = { cuenta: { ...copia, dentro: true, verificado: true }, hayCuenta: true };
    }
  } catch (e) { /* sin sesion: se empieza fuera */ }
};

const iniciar = () => ({ ...arranque, pendiente: null, recuperacion: null, envioClave: 0, cambios: 0 });

function SesionProvider({ children }) {
  const [estado, despachar] = useReducer(reductor, undefined, iniciar);

  // La copia local, solo cuando cambia algo: lo leido al arrancar no se
  // vuelve a escribir.
  const guardados = useRef(0);
  useEffect(() => {
    if (estado.cambios === guardados.current) return;
    guardados.current = estado.cambios;
    if (estado.cuenta.correo) guardarCuenta(estado.cuenta);
  }, [estado]);

  // El estado de verdad, a mano de las acciones que esperan.
  const actual = useRef(estado);
  useLayoutEffect(() => { actual.current = estado; }, [estado]);

  // Cerrar la sesion en otra pestana la cierra aqui tambien.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT' && actual.current.cuenta.dentro) despachar({ tipo: 'salir' });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Entro con la sesion de Auth abierta: se traen sus datos de la API.
  // Devuelve { hecho, nombre, direccion } o { aviso }.
  const meter = useCallback(async (usuario, extra) => {
    const r = await traerCuenta(usuario, extra);
    if (!r.cuenta) return { aviso: r.error };
    despachar({ tipo: 'dentro', cuenta: r.cuenta });
    return { hecho: 'dentro', nombre: r.cuenta.nombre, direccion: r.cuenta.direccion };
  }, []);

  // Crear: los datos ya revisados por el formulario. Supabase Auth guarda la
  // cuenta y manda el codigo; nombre, telefono y direccion van en
  // user_metadata hasta que, con el codigo bueno, la API los pase a
  // USUARIOS. Devuelve un aviso si no se pudo, o '' si toca verificar.
  const crear = useCallback(async ({ nombre, correo, telefono, direccion, clave }) => {
    const { data, error } = await supabase.auth.signUp({
      email: correo, password: clave, options: { data: { nombre, telefono, direccion } },
    });
    if (error) {
      if (error.code === 'user_already_exists') return 'Ya hay una cuenta con este correo. Inicia sesión con el enlace de abajo.';
      return textoDe(error);
    }
    // Con el correo ya registrado y verificado, Supabase no da error (para no
    // decir que correos existen) pero devuelve la cuenta sin identidades.
    if (data.user && data.user.identities?.length === 0) {
      return 'Ya hay una cuenta con este correo. Inicia sesión con el enlace de abajo, o recupera la contraseña.';
    }
    despachar({
      tipo: 'porVerificar', datos: { nombre, correo, telefono, direccion, metodo: 'efectivo' },
      enviadoEn: Date.now(), envio: 'enviado',
    });
    return '';
  }, []);

  // Entrar con un correo con forma de correo y una contrasena escrita (eso lo
  // mira el formulario). Devuelve { campo, texto } si falla un campo,
  // { aviso } si falla lo demas, o { hecho: 'dentro' | 'verificar' }.
  const entrar = useCallback(async (escrito, clave) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: escrito, password: clave });
    if (error?.code === 'invalid_credentials') return { campo: 'clave', texto: NO_ENTRA };
    if (error?.code === 'email_not_confirmed') {
      // Se creo y no se verifico: otro codigo y a las casillas.
      const { error: fallo } = await supabase.auth.resend({ type: 'signup', email: escrito });
      despachar({
        tipo: 'porVerificar', datos: { nombre: '', correo: escrito, telefono: '', direccion: '', metodo: 'efectivo' },
        enviadoEn: Date.now(), envio: fallo ? 'fallo' : 'enviado',
      });
      return { hecho: 'verificar' };
    }
    if (error) return { aviso: textoDe(error) };
    return meter(data.user);
  }, [meter]);

  // El codigo escrito: '' si vale (y ya se esta dentro), o el error.
  const verificar = useCallback(async (escrito) => {
    const pendiente = actual.current.pendiente;
    if (escrito.length !== 6) return 'El código tiene 6 cifras.';
    if (!pendiente) return 'Vuelve a crear la cuenta: no hay ninguna esperando su código.';
    const { data, error } = await supabase.auth.verifyOtp({ email: pendiente.datos.correo, token: escrito, type: 'email' });
    if (error) return error.status ? CODIGO_MAL : SIN_RED;
    const r = await meter(data.user, pendiente.datos.nombre ? pendiente.datos : undefined);
    return r.aviso || '';
  }, [meter]);

  const reenviar = useCallback(async () => {
    const pendiente = actual.current.pendiente;
    if (!pendiente) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email: pendiente.datos.correo });
    despachar({ tipo: 'codigo', enviadoEn: Date.now(), envio: error ? 'fallo' : 'enviado' });
  }, []);

  // Los datos nuevos, ya revisados por el formulario: '' si se guardaron en
  // la base, o el aviso.
  const editar = useCallback(async ({ nombre, telefono, direccion, metodo }) => {
    try {
      const cuenta = await pedirApi('/cuenta', { metodo: 'PUT', cuerpo: { nombre, telefono, direccion, metodo }, sesion: true });
      despachar({ tipo: 'editar', cuenta });
      return '';
    } catch (e) {
      if (e.estado === 401) return 'Tu sesión caducó. Vuelve a iniciar sesión para guardar.';
      return e.estado ? e.message : SIN_RED;
    }
  }, []);

  // Se sale al momento, aunque no haya red: el token se borra de este
  // navegador ('local') y caduca solo en el servidor.
  const salir = useCallback(() => {
    despachar({ tipo: 'salir' });
    supabase.auth.signOut({ scope: 'local' });
  }, []);

  // ---- Recuperar la contrasena ------------------------------------------
  // Supabase manda el codigo si el correo tiene cuenta y responde igual si
  // no, para no decir que correos existen. Devuelve true si salio.
  const mandarRecuperar = useCallback(async (correo) => {
    const { error } = await supabase.auth.resetPasswordForEmail(correo);
    if (error) return false;
    despachar({ tipo: 'recuperar', correo, enviadoEn: Date.now() });
    return true;
  }, []);

  // Los segundos que faltan para poder mandar otro codigo (0 si ya se puede).
  const faltaParaOtro = () => {
    const desde = actual.current.envioClave;
    if (!desde) return 0;
    return Math.max(0, REENVIO - Math.floor((Date.now() - desde) / 1000));
  };
  const avisoEspera = (s) => `Ya te enviamos un código hace poco. Espera ${s} s para pedir otro.`;

  // Si el codigo pasa de sus 10 minutos, se olvida. Devuelve true si caduco.
  const caducoSiToca = () => {
    const r = actual.current.recuperacion;
    if (!r || vigente(r, Date.now())) return false;
    despachar({ tipo: 'caducarRecuperar' });
    return true;
  };

  // El correo escrito. Devuelve { aviso } o { hecho, reabierto }.
  const pedirRecuperar = useCallback(async (escrito) => {
    // Se volvio con "Cambiar el correo" y es el mismo: el codigo que ya salio
    // sigue valiendo, con los intentos que le queden, y no se manda otro.
    caducoSiToca();
    const r = actual.current.recuperacion;
    if (r && r.correo.toLowerCase() === escrito.toLowerCase()) {
      despachar({ tipo: 'reabrirRecuperar' });
      return { hecho: true, reabierto: true };
    }
    const falta = faltaParaOtro();
    if (falta) return { aviso: avisoEspera(falta) };
    return (await mandarRecuperar(escrito)) ? { hecho: true } : { aviso: SIN_CORREO_RECUPERAR };
  }, [mandarRecuperar]);

  // Otro codigo para el mismo correo: '' si salio, o el aviso.
  const reenviarRecuperar = useCallback(async () => {
    const r = actual.current.recuperacion;
    if (!r) return SIN_CORREO_RECUPERAR;
    const falta = faltaParaOtro();
    if (falta) return avisoEspera(falta);
    return (await mandarRecuperar(r.correo)) ? '' : SIN_CORREO_RECUPERAR;
  }, [mandarRecuperar]);

  // El codigo escrito: '' si vale, o el error, que dice como seguir. Con el
  // codigo bueno Supabase abre la sesion, pero la pagina no cuenta como
  // dentro hasta que se ponga la contrasena nueva.
  const comprobarRecuperar = useCallback(async (escrito) => {
    const r = actual.current.recuperacion;
    if (!r) return 'Pide un código con "Enviar otro código".';
    if (!vigente(r, Date.now())) {
      return 'El código caducó: dura 10 minutos. Pide otro con "Enviar otro código".';
    }
    if (r.intentos >= INTENTOS_RECUPERAR) {
      return 'Ya no quedan intentos con este código. Pide otro con "Enviar otro código".';
    }
    // Las cifras que faltan no gastan un intento: no se ha probado ningun codigo.
    if (escrito.length !== 6) return 'El código tiene 6 cifras.';
    const { error } = await supabase.auth.verifyOtp({ email: r.correo, token: escrito, type: 'recovery' });
    if (error && !error.status) return SIN_RED;
    if (error) {
      despachar({ tipo: 'fallaRecuperar' });
      const quedan = INTENTOS_RECUPERAR - r.intentos - 1;
      if (quedan === 0) return 'Ese código no es el que enviamos y ya no quedan intentos. Pide otro con "Enviar otro código".';
      return `Ese código no es el que enviamos. ${quedan === 1 ? 'Te queda 1 intento' : `Te quedan ${quedan} intentos`}.`;
    }
    despachar({ tipo: 'aciertaRecuperar', ahora: Date.now() });
    return '';
  }, []);

  // La contrasena nueva (ya revisada por el formulario). Devuelve
  // { aviso, alCorreo } si no se pudo (alCorreo: la recuperacion se acabo y
  // la vista vuelve al paso del correo con el aviso), o { hecho, nombre,
  // direccion }.
  const cambiarClave = useCallback(async (clave) => {
    if (caducoSiToca()) return { aviso: CADUCO_RECUPERAR, alCorreo: true };
    const r = actual.current.recuperacion;
    if (!r?.listo) return { aviso: 'Primero escribe el código que te enviamos.', alCorreo: true };
    const { data, error } = await supabase.auth.updateUser({ password: clave });
    if (error) return { aviso: textoDe(error) };
    return meter(data.user);
  }, [meter]);

  const olvidarRecuperar = useCallback(() => despachar({ tipo: 'olvidarRecuperar' }), []);
  // Para la vista: al pintar el paso de la clave con el codigo ya caducado.
  const caducarRecuperar = useCallback(() => despachar({ tipo: 'caducarRecuperar' }), []);

  const { cuenta, hayCuenta, pendiente, recuperacion } = estado;
  const valor = useMemo(() => ({
    ...cuenta,
    hayCuenta,
    // Pagar pide la sesion abierta, que con Supabase ya lleva el correo
    // verificado: el comprobante va a ese correo.
    puedePedir: cuenta.dentro && cuenta.verificado,
    pendiente: pendiente ? { ...pendiente.datos, enviadoEn: pendiente.enviadoEn, envio: pendiente.envio } : null,
    recuperacion,
    crear, entrar, verificar, reenviar, editar, salir,
    pedirRecuperar, reenviarRecuperar, comprobarRecuperar, cambiarClave, olvidarRecuperar, caducarRecuperar,
  }), [cuenta, hayCuenta, pendiente, recuperacion, crear, entrar, verificar, reenviar, editar, salir,
    pedirRecuperar, reenviarRecuperar, comprobarRecuperar, cambiarClave, olvidarRecuperar, caducarRecuperar]);

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

const useSesion = () => useContext(ContextoSesion);

export { SesionProvider, useSesion, cargarSesion };
