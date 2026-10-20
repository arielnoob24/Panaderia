// La pantalla de confirmar el pedido: a la izquierda como se recibe, como se
// paga y a nombre de quien va la factura; a la derecha el resumen con el boton
// (seccion 6 del plan). Es lo que arman cart.js y checkout.js en el sitio
// actual, con las mismas clases y los mismos textos.
//
// Las reglas no se escriben aqui: vienen de js/pedido/cobro.js, las mismas
// del sitio actual. Al confirmar se revisa en el orden en que se ve:
// direccion, factura y tarjeta; el foco va al primer campo que falla. Los
// errores salen al dejar el campo o al intentar confirmar.
//
// El cobro se simula: 1,5 s "procesando" y se aprueba. La tarjeta vive solo
// en el estado de este componente: no se guarda, no se envia y desaparece al
// salir de la vista. Del recibo solo salen sus cuatro ultimos digitos.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { guardarPedido } from '@raiz/js/comun/storage.js';
import { buzonListo, enviarCorreo } from '@raiz/js/comun/mail.js';
import {
  sumasDe, CAMPOS_FACTURA, fallosFactura, avisoFactura,
  CAMPOS_TARJETA, fallosTarjeta, avisoTarjeta,
  reformatear, grupos4, mmaa, tresCifras, textoBotonPagar,
  numeroDePedido, armarRecibo, reciboParaGuardar, asuntoComprobante, cuerpoComprobante,
  avisoAprobado,
} from '@raiz/js/pedido/cobro.js';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCanasta } from './CanastaProvider.jsx';
import { useVistaPedido } from './useVistaPedido.js';
import CabezaPedido from './CabezaPedido.jsx';
import ElegirEntrega from './ElegirEntrega.jsx';
import ElegirPago from './ElegirPago.jsx';
import DatosFactura from './DatosFactura.jsx';
import ResumenPedido from './ResumenPedido.jsx';

const TARJETA_VACIA = { numero: '', vence: '', cvv: '', titular: '' };
// Como se escribe cada campo de la tarjeta mientras se teclea.
const FORMAS = { numero: grupos4, vence: mmaa, cvv: tresCifras };
const ESPERA_COBRO = 1500;

// Solo se ensena el error de un campo ya tocado, o de todos si ya se intento
// confirmar: avisar de un error antes de escribir nada no ayuda a nadie.
const aLaVista = (fallos, intentado, tocados) => Object.fromEntries(
  Object.entries(fallos).filter(([clave]) => intentado || tocados.has(clave)),
);
const conClave = (tocados, clave) => (tocados.has(clave) ? tocados : new Set(tocados).add(clave));

function FormularioPedido() {
  const {
    lineas, entrega, factura, unidades, hacer, cumplir, anotarCorreo,
  } = usePedido();
  const sesion = useSesion();
  const { abrir: abrirCanasta } = useCanasta();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const { tituloRef, salir } = useVistaPedido('Confirmar el pedido');

  // Empieza en la forma de pago preferida de la cuenta.
  const [metodo, setMetodo] = useState(sesion.metodo);
  const [tarjeta, setTarjeta] = useState(TARJETA_VACIA);
  const [tocadosT, setTocadosT] = useState(() => new Set());
  const [intentadoT, setIntentadoT] = useState(false);
  const [tocadosF, setTocadosF] = useState(() => new Set());
  const [intentadoF, setIntentadoF] = useState(false);
  const [avisoDir, setAvisoDir] = useState(false);
  const [errorPago, setErrorPago] = useState('');
  const [procesando, setProcesando] = useState(false);

  const refs = {
    dir: useRef(null), piso: useRef(null), referencia: useRef(null), notas: useRef(null),
    numero: useRef(null), vence: useRef(null), cvv: useRef(null), titular: useRef(null),
    fNombre: useRef(null), fIdent: useRef(null), fCorreo: useRef(null), fDireccion: useRef(null),
    pagar: useRef(null),
  };

  // ---- La entrega ------------------------------------------------------
  const alModo = (modo) => {
    flushSync(() => {
      hacer({ tipo: 'entrega', campo: 'modo', valor: modo });
      setAvisoDir(false);
    });
    if (modo === 'domicilio') refs.dir.current?.focus();
  };
  const alCampoEntrega = (campo, valor) => {
    hacer({ tipo: 'entrega', campo, valor });
    if (campo === 'direccion' && valor) setAvisoDir(false);
  };
  const alDejarDir = () => {
    if (entrega.modo === 'domicilio' && !entrega.direccion) setAvisoDir(true);
  };

  // ---- El pago ---------------------------------------------------------
  const alMetodo = (valor) => { setMetodo(valor); setErrorPago(''); };
  // Donde dejar el cursor del campo de la tarjeta que se acaba de reescribir.
  const cursor = useRef(null);
  const alTarjeta = (clave, campo) => {
    let valor = campo.value;
    if (FORMAS[clave]) {
      const nuevo = reformatear(campo.value, campo.selectionStart, FORMAS[clave]);
      valor = nuevo.valor;
      cursor.current = { clave, pos: nuevo.cursor };
    }
    setTarjeta((t) => ({ ...t, [clave]: valor }));
  };
  useLayoutEffect(() => {
    if (!cursor.current) return;
    const { clave, pos } = cursor.current;
    cursor.current = null;
    const campo = refs[clave].current;
    if (campo === document.activeElement) campo.setSelectionRange(pos, pos);
  });
  const alDejarTarjeta = (clave) => setTocadosT((t) => conClave(t, clave));

  // ---- La factura ------------------------------------------------------
  // Al cambiar de opcion se dejan de avisar errores de campos que ya no se
  // piden, pero lo escrito se queda: puede ser un cambio de idea de ida y vuelta.
  const alAOtro = (aOtro) => {
    flushSync(() => {
      hacer({ tipo: 'factura', campo: 'aOtro', valor: aOtro });
      setErrorPago('');
      setIntentadoF(false);
      setTocadosF(new Set());
    });
    if (aOtro) refs.fNombre.current?.focus();
  };
  const alCampoFactura = (campo, valor) => hacer({ tipo: 'factura', campo, valor });
  const alDejarFactura = (clave) => setTocadosF((t) => conClave(t, clave));

  const fallosF = fallosFactura(factura);
  const fallosT = fallosTarjeta(tarjeta);
  const refFactura = { nombre: refs.fNombre, ident: refs.fIdent };

  // ---- Confirmar -------------------------------------------------------
  // Lo ultimo de cada cosa, para aprobar con lo que haya al terminar el
  // segundo y medio y no con lo de cuando se pulso.
  const ultimo = useRef(null);
  useLayoutEffect(() => { ultimo.current = { lineas, entrega, factura, tarjeta, metodo, sesion }; });
  const reloj = useRef(0);
  useEffect(() => () => window.clearTimeout(reloj.current), []);

  const aprobar = () => {
    const ahora = ultimo.current;
    if (!ahora.lineas.length) { setProcesando(false); return; }
    const numero = numeroDePedido();
    const recibo = armarRecibo({
      lineas: ahora.lineas, entrega: ahora.entrega, factura: ahora.factura, sesion: ahora.sesion,
      metodo: ahora.metodo, numeroTarjeta: ahora.tarjeta.numero, numero,
    });
    // Al historial antes de vaciar nada: es lo unico que queda del pedido si
    // el correo no sale. guardarPedido no lanza.
    guardarPedido(reciboParaGuardar(recibo));
    const conCorreo = buzonListo();
    cumplir({ ...recibo, envioCorreo: conCorreo ? 'enviando' : 'simulado' });
    // El comprobante no espera al correo: sale al momento y el renglon del
    // envio se corrige cuando responde. enviarCorreo no lanza.
    if (conCorreo) {
      enviarCorreo(recibo.correo, recibo.nombre, asuntoComprobante(recibo), cuerpoComprobante(recibo))
        .then((bien) => anotarCorreo(numero, bien ? 'enviado' : 'fallo'));
    }
    // replace: Atras no puede volver al pago de un pedido ya hecho.
    navegar('/comprobante', { replace: true });
    avisar(avisoAprobado(numero));
  };

  const alPagar = () => {
    if (procesando || !lineas.length) return;
    // Sin direccion no se puede llevar nada.
    if (entrega.modo === 'domicilio' && !entrega.direccion) {
      setAvisoDir(true);
      refs.dir.current?.focus();
      return;
    }
    // La factura antes que la tarjeta porque esta mas arriba: avisar primero de
    // lo de abajo manda el foco hacia atras y parece que el formulario salta.
    const faltaF = CAMPOS_FACTURA.map(([c]) => c).filter((c) => fallosF[c]);
    if (faltaF.length) {
      flushSync(() => { setIntentadoF(true); setErrorPago(avisoFactura(faltaF)); });
      refFactura[faltaF[0]].current?.focus();
      return;
    }
    if (metodo === 'tarjeta') {
      const faltaT = CAMPOS_TARJETA.map(([c]) => c).filter((c) => fallosT[c]);
      if (faltaT.length) {
        flushSync(() => { setIntentadoT(true); setErrorPago(avisoTarjeta(faltaT)); });
        refs[faltaT[0]].current?.focus();
        return;
      }
    }
    flushSync(() => { setErrorPago(''); setProcesando(true); });
    // El boton se desactiva y el foco se iria con el: va al titulo.
    tituloRef.current?.focus();
    avisar('Procesando el pago…');
    reloj.current = window.setTimeout(aprobar, ESPERA_COBRO);
  };

  // Enter recorre los campos en el orden en que se ven. Del ultimo solo lleva
  // al boton de confirmar, sin pulsarlo: un Enter de mas no tiene que bastar
  // para hacer un pedido.
  const ORDEN = [refs.dir, refs.piso, refs.referencia, refs.notas, refs.numero, refs.vence,
    refs.cvv, refs.titular, refs.fNombre, refs.fIdent, refs.fCorreo, refs.fDireccion];
  const alTeclear = (e) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.target.tagName === 'TEXTAREA') return;
    const i = ORDEN.findIndex((r) => r.current === e.target);
    if (i < 0) return;
    e.preventDefault();
    const visible = (c) => c && !c.disabled && !c.closest('[hidden]');
    const siguiente = ORDEN.slice(i + 1).map((r) => r.current).find(visible);
    (siguiente || refs.pagar.current)?.focus();
  };

  const sumas = sumasDe(lineas.map(([, l]) => l), entrega.modo);
  const vacia = lineas.length === 0;

  return (
    <section id="confirmar" className={procesando ? 'checkout section-pad is-procesando' : 'checkout section-pad'}>
      <div className="container">
        <CabezaPedido titulo="Confirmar el pedido" tituloRef={tituloRef} onVolver={salir} />
        <div className="checkout-paso" data-checkout="pedido">
          <div className="checkout-grid">
            <div className="checkout-datos" onKeyDown={alTeclear}>
              <p className="pago-demo">
                <strong>Esto es una demostración.</strong> Es un proyecto de clase: no se procesa ningún
                cobro real y los datos de la tarjeta no se guardan ni se envían.
              </p>
              <ElegirEntrega
                entrega={entrega}
                onModo={alModo}
                onCampo={alCampoEntrega}
                avisoDir={avisoDir}
                onDirSalir={alDejarDir}
                refs={refs}
              />
              <ElegirPago
                metodo={metodo}
                onMetodo={alMetodo}
                modo={entrega.modo}
                tarjeta={tarjeta}
                onTarjeta={alTarjeta}
                onTarjetaSalir={alDejarTarjeta}
                errores={aLaVista(fallosT, intentadoT, tocadosT)}
                refs={refs}
              />
              <DatosFactura
                factura={factura}
                sesion={sesion}
                onAOtro={alAOtro}
                onCampo={alCampoFactura}
                onSalir={alDejarFactura}
                errores={aLaVista(fallosF, intentadoF, tocadosF)}
                refs={{ nombre: refs.fNombre, ident: refs.fIdent, correo: refs.fCorreo, direccion: refs.fDireccion }}
              />
            </div>
            <ResumenPedido
              lineas={lineas}
              unidades={unidades}
              sumas={sumas}
              correo={sesion.correo}
              onEditar={abrirCanasta}
              errorPago={errorPago}
              textoPagar={textoBotonPagar(metodo, sumas.total, vacia)}
              procesando={procesando}
              vacia={vacia}
              onPagar={alPagar}
              pagarRef={refs.pagar}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default FormularioPedido;
