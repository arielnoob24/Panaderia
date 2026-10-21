// "¿Como lo quieres?": paso retirando (gratis) o a domicilio ($1.50), con lo
// de cart.js. Retirando, donde esta el local y hasta que hora se puede pasar
// (textoRetiro de servicios/horario.js). A domicilio, la calle, que es lo unico
// obligatorio, y lo que no dice la calle: piso, una referencia e indicaciones.
//
// Los campos de texto no se controlan: React no les reescribe lo tecleado. Lo
// guardado se recorta (sin espacios a los lados), y si el campo fuera
// controlado no se podria escribir un espacio entre dos palabras.
import { ENVIO, dinero } from '../servicios/state.js';
import { textoRetiro } from '../servicios/horario.js';
import { useHorario } from '../comun/useHorario.js';
import { IconoRuta } from './iconosPedido.jsx';

const MAPA = 'https://www.google.com/maps/dir/?api=1&destination=-1.004033,-77.812690';

function ElegirEntrega({ entrega, onModo, onCampo, avisoDir, onDirSalir, refs }) {
  const horario = useHorario();
  const domicilio = entrega.modo === 'domicilio';
  // Lo que se guarda va recortado y con su tope, como en cart.js.
  const al = (campo, tope) => (e) => onCampo(campo, e.target.value.trim().slice(0, tope));
  return (
    <fieldset className="canasta-entrega">
      <legend>¿Cómo lo quieres?</legend>
      <div className="canasta-opciones">
        <label>
          <input type="radio" name="canasta-entrega" value="retiro" checked={!domicilio} onChange={() => onModo('retiro')} />
          <span>Paso retirando<small>Gratis</small></span>
        </label>
        <label>
          <input type="radio" name="canasta-entrega" value="domicilio" checked={domicilio} onChange={() => onModo('domicilio')} />
          <span>A domicilio<small>{dinero(ENVIO)}</small></span>
        </label>
      </div>
      {/* Quien pasa a retirar necesita saber donde esta el local. */}
      <div className="canasta-local" hidden={domicilio}>
        <p className="canasta-local-titulo">Esquina de Eloy Alfaro y Gabriel Espinosa</p>
        <p className="canasta-local-dato">Tena, Napo. Te esperamos en el mostrador.</p>
        <a className="mapa-ruta" href={MAPA} target="_blank" rel="noopener">
          <IconoRuta />Cómo llegar <span aria-hidden="true">↗</span>
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
        <p className="canasta-local-hora">{textoRetiro(horario)}</p>
      </div>
      <div className="canasta-direccion" hidden={!domicilio}>
        <label htmlFor="canasta-dir">¿A dónde lo llevamos?</label>
        <input
          ref={refs.dir}
          id="canasta-dir"
          type="text"
          autoComplete="street-address"
          placeholder="Calle, número y barrio"
          aria-describedby="canasta-dir-error"
          aria-invalid={avisoDir}
          defaultValue={entrega.direccion}
          onChange={al('direccion', 200)}
          onBlur={onDirSalir}
        />
        <p className="canasta-aviso" id="canasta-dir-error" role="alert" hidden={!avisoDir}>
          Escribe la dirección para poder llevarlo.
        </p>
        {/* Opcionales: una casa en la esquina no tiene piso ni torre. */}
        <div className="dir-detalle">
          <div>
            <label htmlFor="canasta-piso">Piso, departamento u oficina</label>
            <input ref={refs.piso} id="canasta-piso" type="text" autoComplete="address-line2" placeholder="Torre B, piso 3, dpto. 302" defaultValue={entrega.piso} onChange={al('piso', 120)} />
          </div>
          <div>
            <label htmlFor="canasta-ref">Una referencia para encontrarlo</label>
            <input ref={refs.referencia} id="canasta-ref" type="text" placeholder="Portón verde, frente a la cancha" defaultValue={entrega.referencia} onChange={al('referencia', 200)} />
          </div>
        </div>
        <label htmlFor="canasta-notas">Indicaciones para quien entrega <small>(opcional)</small></label>
        <textarea ref={refs.notas} id="canasta-notas" rows="2" maxLength={300} placeholder="Timbre dañado, llamar al llegar. Hay perro." defaultValue={entrega.notas} onChange={al('notas', 300)}></textarea>
      </div>
    </fieldset>
  );
}

export default ElegirEntrega;
