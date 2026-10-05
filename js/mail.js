// ---- Correo ----------------------------------------------------------
// El sitio no tiene servidor, asi que de aqui solo puede salir un tipo de
// mensaje: el correo. Sale por EmailJS, que pone el servidor de envio y se
// deja llamar desde el navegador. Es la unica via gratuita que hay: el SMS se
// cobra por mensaje y WhatsApp exige la Business API con empresa verificada.
// Por eso el telefono de la cuenta se queda como dato de contacto y el aviso
// viaja al correo, que es ademas el canal que se verifica al registrarse:
// pedir un codigo a un numero al que luego no se le escribe nada seria un
// paso de adorno.
//
// Las tres claves son publicas por diseno -viajan al navegador de cualquiera
// que abra el sitio-, asi que lo que impide que un tercero las gaste es la
// lista de dominios permitidos del panel de EmailJS, no esconderlas aqui.
// Mientras esten vacias no se manda nada y el recuadro que imita la
// notificacion sigue siendo la unica prueba, declarado como simulacion.
// Como rellenarlas: CORREO_REAL.md.
const BUZON = {
  servicio: 'service_u77o0ad',
  plantilla: 'template_76qhpup',
  clave: '-ftq8owbv8TlMmxV8',
};
const buzonListo = () => Boolean(BUZON.servicio && BUZON.plantilla && BUZON.clave);

// Una sola plantilla sirve para los dos mensajes, el codigo y el comprobante:
// el asunto y el cuerpo viajan como variables, asi que no hace falta gastar
// las dos que da el plan gratuito.
const enviarCorreo = async (para, nombre, asunto, cuerpo) => {
  if (!buzonListo()) return false;
  try {
    const r = await window.fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: BUZON.servicio,
        template_id: BUZON.plantilla,
        user_id: BUZON.clave,
        template_params: { a_correo: para, a_nombre: nombre, asunto, cuerpo },
      }),
    });
    return r.ok;
  } catch (e) {
    // Sin red, con el dominio fuera de la lista o con la cuota del mes
    // agotada el envio falla. No es motivo para romper el registro ni el
    // pedido: se devuelve false y quien llama lo cuenta en pantalla.
    return false;
  }
};


export { buzonListo, enviarCorreo };
