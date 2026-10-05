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

## Pasos

### 1. Cuenta y servicio

1. Entra en <https://www.emailjs.com> y crea una cuenta.
2. **Email Services** → **Add New Service** → **Gmail** → conecta tu Gmail.
3. Apunta el **Service ID** (algo como `service_a1b2c3d`).

### 2. La plantilla

**Email Templates** → **Create New Template**. Rellena los campos así, con las
llaves dobles tal cual:

| Campo del formulario | Qué poner |
|---|---|
| To Email | `{{a_correo}}` |
| To Name | `{{a_nombre}}` |
| Subject | `{{asunto}}` |
| Content | `{{cuerpo}}` |

En **Content** usa la vista de texto plano (el botón `</>` o "Edit Content"), no
el editor visual: el cuerpo ya viene con sus saltos de línea escritos.

Guarda y apunta el **Template ID** (`template_x9y8z7w`).

Una sola plantilla sirve para los dos mensajes — el código de verificación y el
comprobante del pedido — porque el asunto y el cuerpo viajan como variables. Así
no se gastan las dos que da el plan gratuito.

### 3. La clave pública

**Account** → **General** → **Public Key**. Cópiala.

### 4. Pegarlas en el código

En [script.js](script.js), busca `const BUZON` y rellena las tres:

```js
const BUZON = {
  servicio: 'service_a1b2c3d',
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
