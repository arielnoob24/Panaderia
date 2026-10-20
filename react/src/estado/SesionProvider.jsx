// ---- La sesion, para toda la aplicacion --------------------------------
// Context + useReducer, como el pedido (seccion 15 del plan, fase 5). El
// reductor es puro (estado/sesion.js); aqui viven lo que no lo es (la huella
// PBKDF2, el codigo al azar, el correo) y lo unico que sincroniza con fuera:
// guardar la cuenta cuando cambia y volver a leerla cuando otra pestana la
// cambia (entrar en el sitio actual deja pagar aqui sin recargar).
//
// Quien usa la sesion recibe los datos de la cuenta (nombre, correo,
// telefono, direccion, dentro, verificado, metodo), si hay alguna en este
// navegador (hayCuenta), si se puede pagar (puedePedir), la cuenta que espera
// su codigo (pendiente) y las acciones: crear, entrar, verificar, reenviar,
// editar y salir; y para recuperar la contrasena, la recuperacion en marcha
// (sin el codigo) con pedirRecuperar, reenviarRecuperar, comprobarRecuperar,
// cambiarClave y olvidarRecuperar. Lo que pasa en pantalla despues (avisos, foco, a donde se
// va) lo decide quien llama, con lo que estas devuelven.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import { reductor, vigente } from './sesion.js';
import {
  leerCuenta, guardarCuenta, escucharCuenta, puedeHuella, calcularHuella,
  nuevoCodigo, envioInicial, mandarCodigo,
  REENVIO, INTENTOS_RECUPERAR, SIN_CORREO_RECUPERAR, CADUCO_RECUPERAR, mandarCodigoClave,
} from '../servicios/cuenta.js';

const ContextoSesion = createContext(null);

// Lo guardado, sin el correo crudo, que solo hace falta al entrar.
const leerParaEstado = () => {
  const { correoGuardado, ...leido } = leerCuenta();
  return leido;
};
const iniciar = () => ({ ...leerParaEstado(), pendiente: null, recuperacion: null, envioClave: 0, cambios: 0 });

// Textos de entrar, los del sitio actual. Se dice cual de los dos fallo, el
// correo o la contrasena, porque es lo que hace falta para arreglarlo
// (heuristica 9). Con un servidor de verdad se responderia lo mismo a los
// dos; aqui la unica cuenta posible es la de este navegador.
const SIN_ESA_CUENTA = 'No hay ninguna cuenta con este correo. Revisa que esté bien escrito: es el que usaste al registrarte.';
const SIN_NINGUNA = 'En este navegador no hay ninguna cuenta creada todavía. Créala con el enlace de abajo.';
const CLAVE_MAL = 'La contraseña no es correcta. Revisa mayúsculas y minúsculas, o pulsa Mostrar para ver lo que escribiste.';

function SesionProvider({ children }) {
  const [estado, despachar] = useReducer(reductor, undefined, iniciar);

  // Guardar es para los cambios, que el reductor cuenta: lo leido al
  // arrancar no se vuelve a escribir.
  const guardados = useRef(0);
  useEffect(() => {
    if (estado.cambios === guardados.current) return;
    guardados.current = estado.cambios;
    guardarCuenta(estado.cuenta, estado.huella);
  }, [estado]);

  useEffect(() => escucharCuenta(() => despachar({ tipo: 'releer', leido: leerParaEstado() })), []);

  // El estado de verdad, a mano de las acciones que esperan (la huella tarda).
  const actual = useRef(estado);
  useLayoutEffect(() => { actual.current = estado; }, [estado]);

  // Manda el codigo y apunta como fue. No se espera: la vista de verificar
  // sale al momento y el renglon del envio se corrige cuando responde.
  const enviar = useCallback((datos, codigo) => {
    mandarCodigo(datos.correo, datos.nombre, codigo)
      .then((envio) => despachar({ tipo: 'envio', codigo, envio }));
  }, []);
  const porVerificar = useCallback((datos, huella) => {
    const codigo = nuevoCodigo();
    despachar({
      tipo: 'porVerificar', datos, huella, codigo,
      enviadoEn: Date.now(), envio: envioInicial(),
    });
    enviar(datos, codigo);
  }, [enviar]);

  // Crear: los datos ya revisados por el formulario. La cuenta todavia no
  // esta dentro: falta probar que el correo es suyo, porque ahi llega el
  // comprobante. Devuelve un aviso si no se pudo, o '' si toca verificar.
  const crear = useCallback(async ({ nombre, correo, telefono, direccion, clave }) => {
    if (!puedeHuella()) return 'Este navegador no puede guardar la contraseña aquí. Abre el sitio por https.';
    const huella = await calcularHuella(clave);
    porVerificar({ nombre, correo, telefono, direccion, metodo: 'efectivo' }, huella);
    return '';
  }, [porVerificar]);

  // Entrar con un correo con forma de correo y una contrasena escrita (eso lo
  // mira el formulario). Devuelve { campo, texto } si falla un campo,
  // { aviso } si falla lo demas, o { hecho: 'dentro' | 'verificar' }.
  const entrar = useCallback(async (escrito, clave) => {
    const { correoGuardado, huella } = leerCuenta();
    if (!correoGuardado || correoGuardado.toLowerCase() !== escrito.toLowerCase()) {
      return { campo: 'correo', texto: correoGuardado ? SIN_ESA_CUENTA : SIN_NINGUNA };
    }
    if (!puedeHuella()) return { aviso: 'Este navegador no puede comprobar la contraseña aquí. Abre el sitio por https.' };
    // Una cuenta creada antes de que se guardara la huella no tiene con que
    // comparar, y dejarla entrar con cualquier contrasena seria no pedirla.
    if (!huella) return { aviso: 'Esta cuenta se creó sin contraseña. Vuelve a registrarte para ponerle una.' };
    if ((await calcularHuella(clave, huella.sal)).hash !== huella.hash) return { campo: 'clave', texto: CLAVE_MAL };
    const leido = leerParaEstado();
    despachar({ tipo: 'releer', leido });
    // Una cuenta de antes de la verificacion entra igual, pero pasa por el
    // codigo: el comprobante va al correo y hay que saber que es suyo.
    if (!leido.cuenta.verificado) {
      const { dentro, verificado, ...datos } = leido.cuenta;
      porVerificar(datos, leido.huella);
      return { hecho: 'verificar' };
    }
    despachar({ tipo: 'entrar' });
    return { hecho: 'dentro', nombre: leido.cuenta.nombre };
  }, [porVerificar]);

  // El codigo escrito: '' si vale (y ya se esta dentro), o el error.
  const verificar = useCallback((escrito) => {
    const pendiente = actual.current.pendiente;
    if (escrito.length !== 6) return 'El código tiene 6 cifras.';
    if (!pendiente || escrito !== pendiente.codigo) return 'Ese código no es el que enviamos. Míralo otra vez.';
    despachar({ tipo: 'verificar' });
    return '';
  }, []);

  const reenviar = useCallback(() => {
    const pendiente = actual.current.pendiente;
    if (!pendiente) return;
    const codigo = nuevoCodigo();
    despachar({
      tipo: 'codigo', codigo, enviadoEn: Date.now(), envio: envioInicial(),
    });
    enviar(pendiente.datos, codigo);
  }, [enviar]);

  const editar = useCallback((datos) => despachar({ tipo: 'editar', ...datos }), []);
  const salir = useCallback(() => despachar({ tipo: 'salir' }), []);

  // ---- Recuperar la contrasena ------------------------------------------
  // El codigo solo cuenta si el correo salio: sin el no hay nada que
  // escribir, y aqui no se ensena en pantalla. Se espera la respuesta antes
  // de pasar a las casillas. Devuelve true si salio.
  const mandarRecuperar = useCallback(async (correo, nombre) => {
    const codigo = nuevoCodigo();
    if (!(await mandarCodigoClave(correo, nombre, codigo))) return false;
    despachar({ tipo: 'recuperar', correo, nombre, codigo, enviadoEn: Date.now() });
    return true;
  }, []);

  // Los segundos que faltan para poder mandar otro codigo (0 si ya se puede).
  // Cuenta desde el ultimo que salio, aunque se haya cambiado el correo o
  // la recuperacion se haya borrado: si no, eso serviria para saltarse los 45 s.
  const faltaParaOtro = () => {
    const desde = actual.current.envioClave;
    if (!desde) return 0;
    return Math.max(0, REENVIO - Math.floor((Date.now() - desde) / 1000));
  };
  const avisoEspera = (s) => `Ya te enviamos un código hace poco. Espera ${s} s para pedir otro.`;

  // Si el codigo pasa de sus 10 minutos, se olvida: no vale para nada.
  // Devuelve true si caduco.
  const caducoSiToca = () => {
    const r = actual.current.recuperacion;
    if (!r || vigente(r, Date.now())) return false;
    despachar({ tipo: 'caducarRecuperar' });
    return true;
  };

  // El correo escrito: el mismo error que al iniciar sesion si no es el de la
  // cuenta de este navegador. Devuelve { campo, texto }, { aviso } o
  // { hecho, reabierto }.
  const pedirRecuperar = useCallback(async (escrito) => {
    const { correoGuardado, cuenta: guardada } = leerCuenta();
    if (!correoGuardado || correoGuardado.toLowerCase() !== escrito.toLowerCase()) {
      return { campo: 'correo', texto: correoGuardado ? SIN_ESA_CUENTA : SIN_NINGUNA };
    }
    // Se volvio con "Cambiar el correo" y es el mismo: el codigo que ya salio
    // sigue valiendo, con los intentos que le queden, y no se manda otro.
    caducoSiToca();
    const r = actual.current.recuperacion;
    if (r && r.correo.toLowerCase() === correoGuardado.toLowerCase()) {
      despachar({ tipo: 'reabrirRecuperar' });
      return { hecho: true, reabierto: true };
    }
    const falta = faltaParaOtro();
    if (falta) return { aviso: avisoEspera(falta) };
    // Al correo tal como se guardo, que es al que llegan los comprobantes.
    return (await mandarRecuperar(correoGuardado, guardada.nombre)) ? { hecho: true } : { aviso: SIN_CORREO_RECUPERAR };
  }, [mandarRecuperar]);

  // Otro codigo para el mismo correo: '' si salio, o el aviso. Si no sale,
  // el de antes sigue valiendo (si no ha caducado).
  const reenviarRecuperar = useCallback(async () => {
    const r = actual.current.recuperacion;
    if (!r) return SIN_CORREO_RECUPERAR;
    const falta = faltaParaOtro();
    if (falta) return avisoEspera(falta);
    return (await mandarRecuperar(r.correo, r.nombre)) ? '' : SIN_CORREO_RECUPERAR;
  }, [mandarRecuperar]);

  // El codigo escrito: '' si vale, o el error, que dice como seguir.
  const comprobarRecuperar = useCallback((escrito) => {
    const r = actual.current.recuperacion;
    if (!r) return 'Pide un código con "Enviar otro código".';
    const ahora = Date.now();
    if (!vigente(r, ahora)) {
      return 'El código caducó: dura 10 minutos. Pide otro con "Enviar otro código".';
    }
    if (r.intentos >= INTENTOS_RECUPERAR) {
      return 'Ya no quedan intentos con este código. Pide otro con "Enviar otro código".';
    }
    // Las cifras que faltan no gastan un intento: no se ha probado ningun codigo.
    if (escrito.length !== 6) return 'El código tiene 6 cifras.';
    if (escrito !== r.codigo) {
      despachar({ tipo: 'fallaRecuperar' });
      const quedan = INTENTOS_RECUPERAR - r.intentos - 1;
      if (quedan === 0) return 'Ese código no es el que enviamos y ya no quedan intentos. Pide otro con "Enviar otro código".';
      return `Ese código no es el que enviamos. ${quedan === 1 ? 'Te queda 1 intento' : `Te quedan ${quedan} intentos`}.`;
    }
    despachar({ tipo: 'aciertaRecuperar', ahora });
    return '';
  }, []);

  // La contrasena nueva (ya revisada por el formulario), con sal nueva.
  // Devuelve { aviso, alCorreo } si no se pudo (alCorreo: la recuperacion se
  // acabo y la vista vuelve al paso del correo con el aviso), o
  // { hecho, nombre, direccion }.
  const cambiarClave = useCallback(async (clave) => {
    if (caducoSiToca()) return { aviso: CADUCO_RECUPERAR, alCorreo: true };
    const r = actual.current.recuperacion;
    if (!r?.listo) return { aviso: 'Primero escribe el código que te enviamos.', alCorreo: true };
    if (!puedeHuella()) return { aviso: 'Este navegador no puede guardar la contraseña aquí. Abre el sitio por https.' };
    const huella = await calcularHuella(clave);
    // La huella tarda: se vuelve a mirar el plazo con la hora de despues.
    if (caducoSiToca()) return { aviso: CADUCO_RECUPERAR, alCorreo: true };
    // Mientras tanto otra pestana pudo crear otra cuenta encima de esta: la
    // contrasena nueva no puede ir a parar a una cuenta que no es la del codigo.
    const leido = leerParaEstado();
    if (leido.cuenta.correo.toLowerCase() !== r.correo.toLowerCase()) {
      despachar({ tipo: 'caducarRecuperar' });
      return { aviso: 'La cuenta de este navegador cambió mientras tanto. Vuelve a pedir el código.', alCorreo: true };
    }
    despachar({ tipo: 'releer', leido });
    despachar({ tipo: 'nuevaClave', huella, ahora: Date.now() });
    return { hecho: true, nombre: leido.cuenta.nombre, direccion: leido.cuenta.direccion };
  }, []);

  const olvidarRecuperar = useCallback(() => despachar({ tipo: 'olvidarRecuperar' }), []);
  // Para la vista: al pintar el paso de la clave con el codigo ya caducado.
  const caducarRecuperar = useCallback(() => despachar({ tipo: 'caducarRecuperar' }), []);

  const { cuenta, hayCuenta, pendiente, recuperacion } = estado;
  const valor = useMemo(() => ({
    ...cuenta,
    hayCuenta,
    // Pagar pide una cuenta con la sesion abierta y el correo verificado: el
    // comprobante va a ese correo, y uno inventado dejaria el pedido sin el.
    puedePedir: cuenta.dentro && cuenta.verificado,
    // Sin la huella: a la pantalla no le hace falta.
    pendiente: pendiente ? {
      ...pendiente.datos, codigo: pendiente.codigo, enviadoEn: pendiente.enviadoEn, envio: pendiente.envio,
    } : null,
    // Sin el codigo: la pantalla no lo ensena nunca.
    recuperacion: recuperacion ? {
      correo: recuperacion.correo, enviadoEn: recuperacion.enviadoEn,
      intentos: recuperacion.intentos, listo: recuperacion.listo, enCurso: recuperacion.enCurso,
    } : null,
    crear, entrar, verificar, reenviar, editar, salir,
    pedirRecuperar, reenviarRecuperar, comprobarRecuperar, cambiarClave, olvidarRecuperar, caducarRecuperar,
  }), [cuenta, hayCuenta, pendiente, recuperacion, crear, entrar, verificar, reenviar, editar, salir,
    pedirRecuperar, reenviarRecuperar, comprobarRecuperar, cambiarClave, olvidarRecuperar, caducarRecuperar]);

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

const useSesion = () => useContext(ContextoSesion);

export { SesionProvider, useSesion };
