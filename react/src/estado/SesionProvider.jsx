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
// editar y salir. Lo que pasa en pantalla despues (avisos, foco, a donde se
// va) lo decide quien llama, con lo que estas devuelven.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import { reductor } from './sesion.js';
import {
  leerCuenta, guardarCuenta, escucharCuenta, puedeHuella, calcularHuella,
  nuevoCodigo, buzonListo, mandarCodigo,
} from '../servicios/cuenta.js';

const ContextoSesion = createContext(null);

// Lo guardado, sin el correo crudo, que solo hace falta al entrar.
const leerParaEstado = () => {
  const { correoGuardado, ...leido } = leerCuenta();
  return leido;
};
const iniciar = () => ({ ...leerParaEstado(), pendiente: null, cambios: 0 });

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
      enviadoEn: Date.now(), envio: buzonListo() ? 'enviando' : 'sin-buzon',
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
      tipo: 'codigo', codigo, enviadoEn: Date.now(), envio: buzonListo() ? 'enviando' : 'sin-buzon',
    });
    enviar(pendiente.datos, codigo);
  }, [enviar]);

  const editar = useCallback((datos) => despachar({ tipo: 'editar', ...datos }), []);
  const salir = useCallback(() => despachar({ tipo: 'salir' }), []);

  const { cuenta, hayCuenta, pendiente } = estado;
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
    crear, entrar, verificar, reenviar, editar, salir,
  }), [cuenta, hayCuenta, pendiente, crear, entrar, verificar, reenviar, editar, salir]);

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

const useSesion = () => useContext(ContextoSesion);

export { SesionProvider, useSesion };
