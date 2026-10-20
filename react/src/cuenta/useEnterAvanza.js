// Enter en un campo pasa al siguiente; en el ultimo hace la accion del boton
// (seccion 7 del plan). Es enterAvanza() de js/comun/ui.js como manejador de
// onKeyDown para la caja del formulario: se salta lo escondido o apagado.
function useEnterAvanza(campos, alFinal) {
  return (e) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.target.tagName === 'TEXTAREA') return;
    const i = campos.findIndex((r) => r.current === e.target);
    if (i < 0) return;
    e.preventDefault();
    const visible = (c) => c && !c.disabled && !c.closest('[hidden]');
    const siguiente = campos.slice(i + 1).map((r) => r.current).find(visible);
    if (siguiente) siguiente.focus();
    else alFinal();
  };
}

export { useEnterAvanza };
