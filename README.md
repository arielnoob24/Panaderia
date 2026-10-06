# Panaderia El Tradicional

Sitio estatico de una panaderia: catalogo, canasta, pago simulado y cuenta de
cliente. No hay servidor detras; todo corre en el navegador y se publica en
GitHub Pages.

## Como esta repartido

```
index.html            la pagina, con sus secciones semanticas
assets/
  styles.css          todos los estilos
  img/                logo, mascota, iconos y la foto de portada
    productos/        las fotos del catalogo, cada una en 420 y 840 px
data/
  productos.json      el catalogo: nombre, precio, foto, categoria y tamanos
js/
  app.js              el arranque: trae los datos y enciende lo demas
  repo.js             lee y revisa data/productos.json
  view.js             pinta las fichas y manda el catalogo (orden, filtro, vistas)
  cart.js             la canasta: panel, lineas y control de cantidad
  checkout.js         pago simulado y comprobante
  account.js          crear cuenta, verificar el correo y entrar
  map.js              mapa del reparto (Leaflet, se trae solo si hace falta)
  mail.js             envio de correo por EmailJS
  ui.js               barra, foco, cuadritos de ayuda, animaciones y horario
  state.js            lo que comparten los modulos, y el puente entre ellos
  storage.js          los cuatro sitios donde se guarda: local, session, IDB y cookie
  sin-servidor.js     los 11 modulos en un solo archivo, con el catalogo dentro
                      (generado; es lo que corre al abrir index.html con doble clic)
herramientas/
  empaquetar.mjs      genera js/sin-servidor.js
```

## Con que esta hecho

Sin dependencias: lo que hay en el repositorio es lo que corre en el
navegador. La unica pieza generada es `js/sin-servidor.js`, para abrir el sitio
sin servidor (ver abajo).

- **HTML5 semantico.** `header`, `nav`, `main`, `footer` y `section`; los
  dialogos de la canasta y de la cuenta son `aside` con `role="dialog"`.
- **CSS3** en un solo archivo, con Grid para la cuadricula del catalogo y
  Flexbox para el resto. Seis puntos de quiebre (420, 680 y 900 px, mas los de
  `hover` y `prefers-reduced-motion`).
- **JavaScript ES6+** en modulos nativos (`<script type="module">`): `import`
  y `export`, `async`/`await`, desestructuracion, plantillas, `Map`, spread y
  encadenamiento opcional.
- **Leaflet** y **OpenStreetMap** para el mapa del reparto, traidos por CDN y
  solo cuando se elige envio a domicilio.
- **EmailJS** para el codigo de verificacion y el comprobante.

Las fotos estan en el repositorio y no en un CDN, asi que el catalogo entero se
ve sin conexion. Lo unico que sale por red es lo que no se puede traer de otra
forma, y solo cuando hace falta: el mapa al elegir envio a domicilio, y el
correo al pedir el codigo o el comprobante. Sin internet el sitio se usa igual
de principio a fin; el pago es simulado y no necesita a nadie.

## Para verlo en tu maquina

Funciona de tres formas, sin servidor dinamico en ninguna:

- **Doble clic en `index.html`.** El navegador no deja que una pagina abierta
  como archivo (`file://`) cargue modulos de JavaScript ni lea
  `data/productos.json`, asi que en ese caso `index.html` carga
  `js/sin-servidor.js`: el mismo codigo en un solo archivo, con el catalogo
  dentro. Lo unico que no hace asi es escribir en el pie cuando se guardo el
  pedido, porque el navegador no guarda cookies en `file://`; el pedido se
  guarda igual.
- **Live Server** (la extension de VS Code) o cualquier servidor estatico:

  ```sh
  python -m http.server 8000
  # y abrir http://localhost:8000
  ```

- **En internet**, en GitHub Pages: https://arielnoob24.github.io/Panaderia/.
  Sirve igual en cualquier hosting estatico, como Neocities: se suben los
  archivos tal cual.

Servida por HTTP, la pagina carga los modulos de `js/` de siempre.

## Para tocar el catalogo

Meter, quitar o cambiar un producto es editar `data/productos.json`: las
fichas se pintan desde ahi. Despues hay que correr
`node herramientas/empaquetar.mjs`, para que la version de doble clic lleve el
catalogo nuevo; lo mismo al tocar cualquier archivo de `js/`. El CI lo
comprueba y no publica si se olvida. Cada producto necesita `nombre`, `categoria`,
`precio`, `foto` y `alt`; `disponible: false` lo marca como agotado, `etiqueta`
le pone el rotulo de color y `tamanos` le da varias medidas con su precio.

El campo `foto` es la raiz del nombre del archivo, sin ancho ni extension: de
`assets/img/productos/pan-redondo` salen `pan-redondo-420.jpg` y
`pan-redondo-840.jpg`, y el navegador elige la que le cabe. Un producto nuevo
necesita las dos, con esos mismos sufijos; el CI comprueba que esten y no
publica si falta alguna.

Si una categoria nueva no esta en el menu Tienda de `index.html`, sus productos
quedan inalcanzables: el CI lo comprueba y no publica.

## Donde se guarda cada cosa

Sin servidor, todo lo que sobrevive a cerrar la pagina se queda en el
navegador. Se usan los cuatro mecanismos, y cada uno porque le toca: lo que
decide donde va un dato es cuanto tiene que durar y que forma tiene. Las
funciones estan juntas en `js/storage.js`.

| Donde | Que guarda | Por que ahi |
| --- | --- | --- |
| `localStorage` | El pedido a medias (lineas, modo de entrega, direccion, punto del mapa y datos de la factura) y la cuenta del cliente. | Tiene que seguir ahi manana. Es el unico sitio que no se vacia al cerrar. |
| `sessionStorage` | Por donde ibas mirando el catalogo: categoria, orden y filtro. | Dura lo que dura la pestana. Recargar no te mueve de sitio, pero volver otro dia empieza limpio: quien dejo puesto "solo los disponibles" no deberia volver una semana despues a un catalogo a medias sin acordarse de por que. |
| `IndexedDB` | Los pedidos ya pagados, con su recibo entero. Base `eltradicional`, almacen `pedidos`, clave el numero de pedido. | Son registros que se acumulan y se buscan por numero. En `localStorage` habria que guardar la lista entera en una sola clave y reescribirla completa cada vez. |
| Cookie | La marca de cuando se guardo por ultima vez (`eltradicional-guardado`, un mes de vida, `SameSite=Lax`). | Es un dato corto que caduca solo y que se lee sin tener que abrir el pedido entero. |

**La marca de ultima actualizacion** se escribe en dos sitios cada vez que algo
se guarda: dentro del propio pedido en `localStorage`, para saber de cuando es
lo que se esta recuperando, y en la cookie, que es la que se lee para escribirla
en el pie de la pagina ("Tu pedido se guardo hoy a las 14:05 en este
navegador"). Al vaciar la canasta se borra la marca: dejarla puesta seria decir
que hay guardado algo que ya no esta.

Nada de esto es obligatorio para que el sitio funcione. Cada lectura y cada
escritura va en su `try`/`catch`, porque en una ventana privada escribir lanza
una excepcion, y que no se pueda recordar el orden del catalogo no puede tumbar
la pagina. Si falta `IndexedDB`, el historial sale vacio, que es lo mismo que ve
quien todavia no ha pedido nada.

## Accesibilidad

- **Teclado.** Todo se puede usar sin raton. Los dos dialogos -canasta y
  cuenta- atrapan el foco mientras estan abiertos, se cierran con `Escape` y lo
  devuelven al boton que los abrio. El menu de Tienda se recorre con las
  flechas. Hay un enlace para saltar al contenido. En `ACCESIBILIDAD_TECLADO.md`
  esta el recorrido completo.
- **Foco visible.** Ningun `outline: none` sin reemplazo: el foco se marca con
  un anillo propio, y se usa `:focus-visible` para no ensenarlo al pulsar con
  el raton.
- **ARIA donde hace falta y no mas.** `role="dialog"` con `aria-modal` y
  `aria-labelledby` en los paneles; `aria-expanded` y `aria-controls` en lo que
  abre y cierra; `aria-live="polite"` en la region de avisos y en el contador
  del catalogo, para que los cambios se oigan sin interrumpir; `aria-hidden` en
  los iconos decorativos, que no aportan nada leidos en voz alta.
- **Errores de formulario accesibles.** Cada campo mal rellenado lleva
  `aria-invalid="true"` y un `aria-describedby` que apunta al parrafo con el
  motivo, de forma que el lector de pantalla lo dice junto al campo en vez de
  dejarlo como un texto suelto en la pagina.
- **Textos alternativos.** Cada producto trae su `alt` en
  `data/productos.json`, y `repo.js` se niega a cargar el catalogo si a alguno
  le falta: sin el, quien usa lector de pantalla no sabe que hay en la foto.
- **Contraste.** Los pares de texto del tema pasan AA de sobra, comprobados
  con la formula de luminancia relativa de la WCAG: 12,4:1 el texto principal
  sobre el fondo claro, 6,8:1 el secundario, 11,1:1 el texto sobre el fondo
  oscuro del pie y 8,7:1 el secundario de ahi. El unico color por debajo de
  4,5:1 es `--horno-claro` (4,5:1 justo), y no se usa para texto sino para el
  puntero de los filtros, donde el minimo que pide la norma es 3:1. Lo que es
  solo color -las etiquetas de "Agotado" o "De la casa"- lleva tambien su
  texto, para quien no distingue el verde del rojo.
- **Movimiento.** Con `prefers-reduced-motion: reduce` se quitan la entrada
  escalonada de las fichas, el velo del cambio de categoria y el desplazamiento
  suave.
- **Formularios con validacion por expresiones regulares.** Correo, telefono
  (`/^9\d{8}$/`, los nueve digitos de Ecuador tras el +593), los tres digitos
  del CVV y los cuatro requisitos de la contrasena, cada uno con su regex y su
  mensaje en castellano.

## Lo que esta simulado

El cobro no existe: no se procesa ningun pago y los datos de la tarjeta no se
guardan ni se envian. La cuenta se guarda solo en el navegador y la contrasena
no se guarda en ninguna parte. El correo del codigo y del comprobante si sale
de verdad, por EmailJS: las tres claves van en `js/mail.js`, y mientras esten
vacias el codigo y el comprobante se ensenan en pantalla en vez de enviarse.
