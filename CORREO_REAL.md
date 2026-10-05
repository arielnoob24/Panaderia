# Cómo hacer que los correos salgan de verdad

El código ya está puesto. Falta rellenar tres claves en `script.js` y conectar
una cuenta de EmailJS. Son unos cinco minutos y no cuesta nada.

Mientras las claves estén vacías el sitio **no se rompe**: el código de
verificación y el comprobante se muestran en pantalla, en el recuadro que imita
el correo recibido, con un párrafo que avisa de que el envío no está
configurado. Es el mismo comportamiento que tenía antes.

## Por qué EmailJS y no SMS

Este sitio se publica en GitHub Pages, que solo entrega archivos: no hay
servidor donde guardar una contraseña de API ni donde correr código. EmailJS
existe precisamente para eso — pone el servidor de envío y se deja llamar desde
el navegador.

Para SMS no hay equivalente gratuito. Twilio y los demás cobran por mensaje
(~$0.07 a Ecuador), exigen tarjeta, y en cuenta de prueba solo mandan a números
que verifiques tú mismo, así que no sirven para usuarios cualesquiera. WhatsApp
pide la Business API con empresa verificada. Por eso el canal de aviso es el
correo y el teléfono se quedó como dato de contacto.

## Estado

| Paso | Estado |
|---|---|
| 1. Cuenta y servicio de Gmail | ✅ |
| 2. Service ID en el código | ✅ `service_k57jq25` |
| 3. Plantilla | ✅ |
| 4. Template ID en el código | ✅ `template_uwk7o1f` |
| 5. Public Key en el código | ✅ `3QujvL0rzX_tjKDrK` |
| 6. Autorizar el dominio | ⬜ **pendiente, ver el paso 5** |
| 7. Probar un envío de verdad | ⬜ pendiente |

El envío ya está activo. Falta cerrar la lista de dominios, que es lo único que
impide que un tercero gaste la cuota, y comprobar que llega un correo real.

## Pasos

### 1. Cuenta y servicio

1. Entra en <https://www.emailjs.com> y crea una cuenta.
2. **Email Services** → **Add New Service** → **Gmail**.
3. En el cuadro **Config Service**:
   - **Name**: `Gmail` — es solo una etiqueta interna, da igual.
   - **Service ID**: déjalo como viene. El que salió es `service_k57jq25` y ya
     está escrito en el código; si lo cambias, avísame.
   - **Connect Account** → elige tu cuenta de Google → acepta **"Send email on
     your behalf"**. Sin ese permiso no manda nada.
   - Deja marcado **Send test email to verify configuration**.
   - **Create Service**.

### 2. La plantilla

EmailJS crea una plantilla de ejemplo llamada **Contact Us**. Está hecha para un
formulario de contacto —manda *hacia* el dueño del sitio— y aquí hace falta lo
contrario: mandar *al cliente*. Hay que cambiarle todos los campos. Puedes
reaprovechar esa misma o crear una nueva con **Create New Template**; da igual.

En la pestaña **Content**, deja los campos así:

| Campo | Lo que trae de ejemplo | Lo que hay que poner |
|---|---|---|
| Subject | `Contact Us: {{title}}` | `{{asunto}}` |
| Content | bloque con `{{name}}`, `{{time}}`, `{{message}}` | `{{cuerpo}}` y nada más |
| To Email | `arielescobar2003@gmail.com` | `{{a_correo}}` |
| From Name | `{{name}}` | `El Tradicional` |
| From Email | ☑ Use Default Email Address | déjalo marcado |
| Reply To | `{{email}}` | `arielescobar2003@gmail.com` |
| Bcc / Cc | vacíos | déjalos vacíos |

Los tres cambios que no se pueden saltar:

- **To Email.** Es el que decide quién recibe. Si se queda con el correo fijo,
  todos los códigos y comprobantes llegan a tu buzón en vez de al del cliente.
- **From Name.** Si se queda en `{{name}}`, sale vacío: ese nombre de variable
  no existe en lo que manda el sitio, que solo envía `a_correo`, `a_nombre`,
  `asunto` y `cuerpo`.
- **Reply To.** Mismo caso con `{{email}}`. Poniendo tu correo, quien responda
  al comprobante te escribe a ti.

Para el **Content**: pulsa **Edit Content** y borra todo el bloque de ejemplo. Si
el editor es de texto plano, basta con dejar `{{cuerpo}}`. Si es HTML, pon esto,
porque si no los saltos de línea del mensaje se aplastan en un solo párrafo:

```html
<pre style="font-family: Arial, sans-serif; white-space: pre-wrap; font-size: 14px;">{{cuerpo}}</pre>
```

Esta versión del formulario no tiene campo **To Name**. No pasa nada: el sitio
manda `a_nombre` igual y simplemente no se usa, y el mensaje ya saluda por el
nombre dentro del cuerpo.

Guarda con **Save** y apunta el **Template ID** (`template_x9y8z7w`), que sale en
la pestaña **Settings** de la plantilla.

Una sola plantilla sirve para los dos mensajes — el código de verificación y el
comprobante del pedido — porque el asunto y el cuerpo viajan como variables. Así
no se gastan las dos que da el plan gratuito.

### 3. La clave pública

**Account** → **General** → **Public Key**. Cópiala.

### 4. Pegarlas en el código

Pásame el **Template ID** y la **Public Key** y las pongo yo. Si prefieres
hacerlo a mano, en [script.js](script.js) busca `const BUZON`:

```js
const BUZON = {
  servicio: 'service_k57jq25',
  plantilla: 'template_x9y8z7w',
  clave: 'TuClavePublica',
};
```

### 5. Autorizar el dominio

Esto es lo que impide que un tercero gaste tu cuota, y es el paso que la gente
olvida.

**Account** → **Security** → activa **Allow only from these domains** y añade:

- `arielescobar2003.github.io` — o el dominio donde esté publicado el sitio
- `localhost` — para probar en tu máquina

Las tres claves son públicas por diseño: viajan al navegador de cualquiera que
abra el sitio, así que esconderlas en el código no sirve de nada. La lista de
dominios es la protección real.

## Límites del plan gratuito

- **200 correos al mes.** Si se agota, el envío falla y el sitio lo dice en
  pantalla; el pedido queda registrado igual.
- **2 plantillas**, de las que usamos una.
- Los correos salen desde tu Gmail. A destinatarios que no te conocen pueden
  caer en spam, y por eso los dos mensajes de la interfaz dicen que se mire esa
  carpeta.

## Qué probar después

1. **Registro:** crea una cuenta con un correo tuyo de verdad. El código debe
   llegar al buzón y el recuadro de la pantalla debe quedarse oculto.
2. **Código equivocado:** escribe seis cifras al azar. Debe rechazarlo.
3. **Compra:** confirma un pedido. El comprobante debe llegar con el detalle
   completo y el texto bajo el recibo debe decir a qué correo salió.
4. **Sin red:** desconéctate y confirma un pedido. Debe decir que no se pudo
   enviar y recordarte apuntar el número, sin perder el pedido.

## Lo que esta verificación demuestra y lo que no

Demuestra que el correo escrito existe y que quien se registra lo abre, que es
para lo que sirve el paso: el comprobante del pedido va justo ahí, y un correo
mal escrito deja el pedido sin comprobante.

No resiste a quien quiera saltarse el paso. El código se genera en el navegador,
así que está en la memoria de su propia máquina y se puede leer en las
herramientas de desarrollo. Para que fuera seguro tendría que nacer y
compararse en un servidor, y este sitio no tiene. Conviene decirlo así en el
informe en vez de presentarlo como autenticación.
