# Cómo está hecho el sitio de El Tradicional

Este documento recorre el código del proyecto archivo por archivo. Para cada uno
explica para qué sirve, cómo está dividido por dentro y qué hacen sus piezas
principales. No repite cada línea: el objetivo es que, al abrir un archivo,
sepas dónde estás y qué estás mirando.

---

## 1. La idea general

Es un sitio **estático**: no hay servidor ni base de datos en internet. Todo lo
que pasa (el catálogo, la canasta, la cuenta, el pago simulado) ocurre en el
navegador de quien lo visita, y lo que se guarda queda en ese mismo navegador.
Se publica en GitHub Pages.

Las piezas son tres tipos de archivo:

| Tipo | Archivo(s) | Qué pone |
|---|---|---|
| Estructura | `index.html` | El esqueleto de la página: cabecera, portada, catálogo vacío, historia y pie |
| Aspecto | `assets/styles.css` | Colores, tipografía, distribución, animaciones y adaptación al teléfono |
| Comportamiento | `js/*.js` (10 módulos) | Todo lo que se mueve: pintar productos, canasta, cuenta, pago |
| Datos | `data/productos.json` | La lista de productos con su precio, foto y categoría |

Hay mucho HTML que **no está** en `index.html`: el panel de la canasta, la
pantalla de confirmar el pedido, el panel de la cuenta y las fichas de los
productos se crean desde JavaScript. La razón es que sin JavaScript esas partes
no funcionarían, así que tampoco tiene sentido que existan.

### Cómo se conectan los módulos

El HTML carga un solo archivo: `js/app.js`. Ese archivo importa a los demás, y
cada uno importa lo que necesita de los otros con `import` / `export`.

La excepción es cuando `index.html` se abre con doble clic: ahí el navegador
bloquea los módulos, y un pequeño script al final del HTML carga en su lugar
`js/sin-servidor.js`. Es el mismo código de los 10 módulos juntado en un solo
archivo, con el catálogo ya metido dentro, y lo genera
`herramientas/empaquetar.mjs`.

```
index.html
   └── app.js  (el arranque)
         ├── repo.js      lee data/productos.json
         ├── view.js      pinta las fichas y maneja el catálogo
         ├── cart.js      la canasta y la pantalla de confirmar
         │     └── checkout.js   pago simulado y comprobante
         ├── account.js   la cuenta del cliente
         └── ui.js        piezas comunes (menú, foco, horario, animaciones)

   Todos usan además:
         state.js    los datos compartidos (el pedido, la entrega, la sesión...)
         storage.js  dónde se guarda cada cosa en el navegador
         mail.js     el envío de correos
```

**El "puente".** Algunos módulos necesitan llamarse entre sí en las dos
direcciones (la canasta abre la cuenta y la cuenta rellena la canasta). Si se
importaran mutuamente se formaría un círculo. Para evitarlo, `state.js` exporta
un objeto vacío llamado `puente`; cada módulo cuelga ahí las funciones que los
demás pueden usar (por ejemplo `puente.abrirC = abrirC`) y los otros las llaman
como `puente.abrirC()`. Como nadie las llama hasta que el usuario pulsa algo,
para entonces todos los módulos ya están cargados.

---

## 2. `index.html`

La única página del sitio. Está escrita con etiquetas **semánticas** (que dicen
qué es cada parte, no solo cómo se ve), lo que ayuda a los lectores de pantalla
y a los buscadores.

### `<head>`
- **`meta` de descripción, Open Graph y Twitter**: el texto y la imagen que
  salen al compartir el enlace en redes o en WhatsApp.
- **`link rel="preload"`** de la foto de portada: le pide al navegador que la
  descargue antes que nada, porque es lo primero que se ve.
- **Íconos** (`favicon`, `apple-touch-icon`) y la hoja de estilos. Llevan
  `?v=...` al final: es un truco para que el navegador no use una versión vieja
  guardada. Cuando se cambia ese texto, el navegador lo trata como un archivo
  nuevo y lo vuelve a descargar.
- **`<script type="application/ld+json">`**: datos estructurados de tipo
  `Bakery` (panadería) con dirección y horario, en el formato que entiende
  Google.

### `<body>`
1. **Enlace "Saltar al contenido"** (`.skip-link`): invisible hasta que se pulsa
   Tab; permite a quien usa teclado saltarse la navegación.
2. **`<header class="site-header">`**: logo y mascota, la navegación
   (`Nosotros`, el desplegable `Tienda` con sus tres categorías, `Contáctanos`)
   y el botón de hamburguesa (`.menu-toggle`) que solo se ve en el teléfono.
   Los enlaces de Tienda llevan `data-filtro="panes"` etc.: ese atributo es el
   que lee `view.js` para saber qué categoría abrir.
3. **`<main id="contenido">`** con las secciones:
   - `#inicio` (`.hero`): la portada con el título, los botones "Ver el menú" y
     "Cómo llegar", y la nota de estado del horno (`.hero-note`), cuyo texto
     cambia según la hora.
   - `.sign-band`: la franja decorativa con espigas de trigo dibujadas en SVG.
   - `#catalogo`: el título de la sección, un párrafo `.catalog-status` (que
     anuncia cuántos productos hay) y un `div.product-grid` **vacío**: las
     fichas las mete `view.js`.
   - `#historia` (`.story`): la foto del amasado, el texto y los tres
     principios con sus íconos.
4. **`<footer id="visitanos">`**: mascota, horario (`.footer-horario`, cada fila
   con `data-dias` para saber qué días cubre), dirección con el estado
   abierto/cerrado (`.open-label`), el aviso de que los contactos son de
   ejemplo y `.footer-guardado`, donde se escribe cuándo se guardó el pedido.
5. **`.floating-whatsapp`**: el botón flotante. Sin JavaScript es un enlace a
   WhatsApp; con JavaScript, `cart.js` lo convierte en el botón de la canasta.
6. **El script del final**: mira si la página se abrió como archivo
   (`file:`). Si es así carga `js/sin-servidor.js`; si no, carga `js/app.js`
   como módulo. Cualquiera de los dos arranca todo.

---

## 3. `assets/styles.css`

Un solo archivo de estilos, ordenado de lo general a lo particular.

### Las variables (`:root`)
Al principio se definen todos los valores que se repiten, como **variables CSS**
(`--nombre: valor`), y después se usan con `var(--nombre)`. Así, cambiar un
color o una duración se hace en un solo lugar.

- **Colores**: cinco principales (`--masa` fondo crema, `--horno` marrón del
  texto, `--ambar` color de marca, `--corteza`, `--papel`) y sus variantes más
  claras u oscuras (`--corteza-oscura`, `--horno-suave`, `--masa-linea`...).
- **Sombras** (`--shadow-contact`, `--shadow-lift`, `--shadow-float`).
- **Radios de borde** (`--r-chip`, `--r-btn`, `--r-card`, `--r-pill`...), incluso
  dos con forma irregular de masa (`--r-dough`, `--r-mass`).
- **Duraciones** (`--dur-fast` 200 ms ... `--dur-scene` 900 ms) y **curvas de
  animación** (`--ease-ui`, `--ease-out`, `--ease-soft`...).

### Los bloques, en orden
1. **Base**: márgenes del `body`, tipografía, la clase `.sr-only` (texto oculto
   a la vista pero leído por los lectores de pantalla) y el contorno de foco
   para quien navega con teclado.
2. **Cabecera**: rejilla de tres columnas (`.nav-wrap`), y los estados
   `.is-pegada` (cuando bajas y la barra toma fondo) e `.is-sobre-oscuro`
   (cuando pasa sobre una sección marrón y se invierten los colores).
3. **Menú Tienda**: `.nav-grupo`, `.nav-submenu` y su apertura con `.is-open`.
4. **Portada**: `.hero`, la imagen, el velo degradado, el título, los botones
   (`.button-yellow`, `.text-link`) y la animación del pin de "Cómo llegar"
   (`@keyframes pin-salta`).
5. **Catálogo**: la fila del mostrador (`.product-grid.is-fila`, con
   desplazamiento horizontal y las flechas `.fila-flecha`), la cuadrícula
   normal y las fichas (`.product-card`, `.product-image`, `.product-tag`,
   `.card-tamanos`, `.card-cantidad`).
6. **Vista de categoría**: la cabecera de la vista (`.vista-cabeza`), el botón
   de volver, el título y la barra de controles (`.vista-barra`,
   `.vista-mando`, el buscador `.vista-buscar`). La regla
   `.vista-cabeza:not(.es-catalogo) .solo-catalogo { display: none; }` es la
   que esconde la búsqueda y "Filtrar por" cuando no estás en el catálogo
   completo.
7. **Historia y pie**.
8. **La pantalla de confirmar el pedido** (`.checkout`, `.checkout-grid` en dos
   columnas, `.checkout-resumen` pegado al desplazarse).
9. **Cuenta**, **Canasta**, **Buscador de dirección**, **Pago**, **Factura**,
   **Verificación del correo**: cada uno con un comentario `/* ---- ... */` que
   marca dónde empieza.

### Adaptación a pantallas y preferencias
- `@media (max-width: 900px)`, `680px` y `420px`: cambian la distribución para
  tableta y teléfono (por ejemplo, el menú pasa a ser desplegable y la
  cuadrícula baja a una o dos columnas).
- `@media (hover: hover) and (pointer: fine)`: los efectos al pasar el cursor
  solo se aplican donde hay ratón; en una pantalla táctil se quedarían
  "pegados".
- `@media (prefers-reduced-motion: reduce)`: si la persona pidió en su sistema
  menos animaciones, aquí se apagan todas.

### Clases de estado
Muchas clases no describen qué es algo sino **en qué estado está**, y las pone
o quita JavaScript: `is-open` (abierto), `is-loaded` (la imagen ya cargó),
`is-loading`, `is-visible` (la sección ya entró en pantalla y se anima),
`is-fila`, `is-lleno`, `is-mal` (campo con error), `is-dentro` (sesión
iniciada). El CSS solo dice cómo se ve cada estado.

---

## 4. `data/productos.json`

La lista de productos. Tiene una única clave, `productos`, con un arreglo de
objetos. Cada producto tiene:

| Campo | Obligatorio | Qué es |
|---|---|---|
| `nombre` | sí | Lo que se muestra en la ficha |
| `categoria` | sí | `panes`, `dulces` o `bebidas-frias`; tiene que coincidir con un `data-filtro` del menú |
| `precio` | sí | Número, en dólares |
| `foto` | sí | La **raíz** del nombre del archivo, sin tamaño ni extensión. De `assets/img/productos/agua` salen `agua-420.jpg` y `agua-840.jpg` |
| `alt` | sí | Descripción de la foto para quien no la ve |
| `disponible` | no | `false` lo marca como agotado |
| `etiqueta` | no | `{ "color": "yellow" o "green", "texto": "..." }`, el sello redondo sobre la foto |
| `tamanos` | no | Lista de `{ "valor": "500 ml", "precio": 0.85 }` para productos con varias medidas |

Para agregar un producto basta con añadir un objeto aquí y sus dos fotos.

---

## 5. Los módulos de JavaScript

### 5.1 `app.js` — el arranque

Es el único archivo que carga el HTML. Su función `arrancar()` enciende el
resto **en un orden concreto**, porque cada paso necesita el anterior:

1. `cargarProductos()` trae el JSON.
2. `montarCatalogo(productos)` pinta las fichas.
3. `montarControlesDeFicha()` cambia el botón "Pedir" de cada ficha por el
   control de cantidad (−, número, +).
4. `vigilarImagenes()` observa la carga de las fotos.
5. `iniciarCanasta()` recupera el pedido guardado.
6. `iniciarCuenta()` recupera la sesión.
7. `pintarGuardado()` escribe en el pie cuándo se guardó el pedido.
8. `updateOpeningStatus()` calcula si la panadería está abierta, y se repite
   cada minuto con `setInterval`.

Los pasos 1 a 4 están dentro de un `try/catch`: si el catálogo no carga, se
muestra un aviso en lugar de las fichas (`sinCatalogo`), pero la canasta y la
cuenta siguen funcionando.

### 5.2 `repo.js` — leer los productos

- **`RUTA`**: la dirección del JSON.
- **`revisar(p, i)`**: comprueba que cada producto tenga lo necesario (nombre,
  categoría, precio válido, foto sin extensión, texto alternativo, tamaños bien
  formados y que el precio coincida con el del primer tamaño). Si algo falta,
  lanza un error que dice **qué producto** y **qué le falta**. El CI de GitHub
  importa esta misma función para validar el JSON antes de publicar.
- **`normalizar(p)`**: rellena lo opcional con su valor por defecto
  (`disponible: true`, `tamanos: []`, `etiqueta: null`) para que el resto del
  código no tenga que preguntar si existe.
- **`cargarProductos()`**: usa el catálogo de `CATALOGO_EMBEBIDO` si existe
  (la versión de doble clic lo trae dentro) y si no hace el `fetch`; después
  revisa, normaliza y devuelve `{ productos }`.

### 5.3 `state.js` — los datos compartidos

Aquí viven los datos que leen y modifican varios módulos a la vez:

- **`pedido`**: un `Map` donde cada clave es el id del producto y el valor es
  `{ nombre, precio, cantidad }`. Se usa `Map` porque mantiene el orden y
  permite buscar, añadir y borrar por clave fácilmente.
- **`entrega`**: si se retira o va a domicilio, la dirección, piso, referencia
  y notas.
- **`sesion`**: los datos de la cuenta y si está dentro y verificada.
- **`tarjeta`**, **`cobro`** y **`factura`**: lo del pago.
- **Constantes**: `MAX_UNIDADES` (100 por producto) y `ENVIO`, la tarifa fija
  del envío a domicilio ($1,50).

Funciones de cálculo:
- **`subtotal()`**, **`envio()`**, **`total()`**, **`unidades()`**: suman a
  partir del `pedido`. El envío es `ENVIO` a domicilio y 0 al retirar.
- **`dinero(n)`**: da formato `$1.50`.
- **`idDe(nombre)`**: convierte un nombre en un identificador sin tildes ni
  espacios (`"Empanada de queso"` → `empanada-de-queso`).
- **`direccionEntera()`**: une calle, piso y referencia en una línea.

Los objetos se exportan y se modifican **por dentro** (`entrega.modo = ...`).
Un módulo no puede reasignar lo que importó, pero sí cambiar su contenido, y así
todos miran siempre el mismo objeto.

### 5.4 `storage.js` — dónde se guarda cada cosa

El sitio usa **cuatro** mecanismos del navegador, cada uno para lo que mejor
sirve:

| Mecanismo | Qué guarda | Por qué ahí |
|---|---|---|
| `localStorage` | El pedido a medias y la cuenta | No se borra al cerrar el navegador |
| `sessionStorage` | La categoría, orden y filtro que estabas mirando | Dura solo lo que dure la pestaña |
| IndexedDB | Los pedidos ya pagados (historial) | Son muchos registros que crecen; es una base de datos de verdad |
| Cookie | La fecha de la última vez que se guardó | Un dato corto con caducidad propia (un mes) |

Funciones:
- **Cookie**: `marcarActualizacion()` escribe la fecha, `ultimaActualizacion()`
  la lee, `olvidarMarca()` la borra y `marcaBonita(fecha)` la convierte en
  texto como "hoy a las 14:05" o "ayer a las 9:30".
- **Session**: `recordarVista(vista)` y `vistaRecordada()`.
- **IndexedDB**: `abrir()` abre la base la primera vez que hace falta (no al
  cargar la página); `guardarPedido(recibo)` guarda un pedido usando su número
  como clave; `pedidosGuardados()` devuelve los últimos cinco, más nuevos
  primero.

Todas están envueltas en `try/catch`: en una ventana privada guardar puede
fallar, y eso no debe romper la página.

### 5.5 `view.js` — el catálogo

Es el módulo que dibuja los productos y controla cómo se ven.

**Construir las fichas**
- **`escapar(texto)`**: cambia `<`, `>`, `&` y `"` por sus equivalentes seguros
  antes de meter un texto como HTML, para que un nombre no pueda convertirse en
  una etiqueta.
- **`fichaHtml(p)`**: arma el HTML de una ficha (`<article class="product-card">`)
  con la foto, la etiqueta, el nombre, los tamaños y el precio. La foto usa
  `srcset` y `sizes`, para que el navegador elija la de 420 px o la de 840 px
  según el tamaño de la pantalla.
- Funciones auxiliares: `tamanosHtml` (los botones de tamaño, como *radio
  buttons*), `etiquetaHtml` (el sello o "Agotado") y `fondoHtml` (el botón
  "Pedir", o "Vuelve mañana" si está agotado).
- **`pintarFichas(productos)`**: mete todas las fichas en `.product-grid`.

**El mostrador en fila** (dentro de `montarCatalogo`)
En la portada, los productos se ven en una sola fila que se desplaza de lado:
- Crea el rótulo "Nuestro mostrador", las dos flechas y el botón de pausa.
- **`pasoFila()`** calcula cuánto mover para avanzar exactamente una ficha.
- **`mirarPuntas()`** apaga la flecha de un lado al llegar al extremo.
- **Avance automático**: cada 4,2 segundos (`CADA`) la fila avanza sola. Se
  detiene si el ratón, el dedo o el foco están encima (`vigilar`), si la
  pestaña está oculta, si el usuario pidió menos movimiento o si se pulsó
  pausa.

**Filtrar, ordenar y buscar**
- **`applyFilter()`** es el corazón: decide qué fichas se ven. Para cada ficha
  comprueba si es de la categoría abierta, si pasa el filtro de "solo
  disponibles", si pasa el de "Filtrar por" y si su nombre contiene lo buscado.
  Escribe "Mostrando X de Y productos" y el aviso para lectores de pantalla.
- **Ordenar** no mueve las fichas en el HTML: cambia su propiedad CSS `order`.
  Así el control de cantidad que llevan dentro no pierde su estado.
- **`plano(texto)`** quita tildes y pasa a minúsculas, para que buscar "limon"
  encuentre "limón".
- **`cambiarCategoria(cat)`**: hace la transición (las fichas se atenúan y
  luego entran las nuevas, con un retraso en diagonal calculado por
  `diagonalDelay`).

**La vista de categoría**
Al pulsar una categoría en Tienda, o "Ver el menú", la página cambia a otra
"vista":
- Se crea una cabecera (`.vista-cabeza`) con "Volver al inicio", el título y la
  barra: buscador, "Filtrar por", "Ordenar por" y "Mostrar". El buscador y
  "Filtrar por" llevan la clase `solo-catalogo`.
- **`pintarVista(cat)`** muestra u oculta esa cabecera, cambia el título de la
  pestaña y pone `es-catalogo` cuando es el catálogo completo.
- **`abrirCategoria(cat)`** reinicia los filtros y usa
  **`history.pushState`** para cambiar la dirección a `#tienda-panes`,
  `#tienda-catalogo`, etc. Eso hace que el botón **Atrás** del navegador
  funcione: el evento `popstate` llama a `pintarRuta()`, que lee la dirección
  y vuelve a la vista que corresponda.
- Al cargar, se recupera de `sessionStorage` el orden y el filtro que tenías,
  siempre que sigas en la misma categoría.

### 5.6 `ui.js` — piezas comunes

Lo que no pertenece a una pantalla concreta y usan todas.

- **`avisos`**: un párrafo invisible con `aria-live="polite"`. Todo lo que se
  escribe ahí lo lee en voz alta un lector de pantalla ("Empanada de queso
  añadido, 2 productos en la canasta").
- **Control del foco**:
  - `focosDe(caja)` lista los elementos alcanzables con Tab dentro de una caja.
  - `atraparFoco(panel, ...)` impide que el Tab salga de un panel abierto y
    hace que Escape lo cierre.
  - `enterAvanza(campos, alFinal)` hace que Enter en un campo pase al
    siguiente que se vea; en el último llama a `alFinal` (en las cuentas,
    lo mismo que el botón; en el pedido, solo llevar el foco a "Confirmar").
  - `apagarDetras(panel, true)` pone el atributo `inert` a todo lo que está
    detrás de un panel: ni se puede tabular ni se lee.
  - `flechasEnMenu(...)` permite recorrer un desplegable con las flechas,
    Inicio, Fin y Escape.
- **Cabecera pegajosa**: al bajar más de 40 px se añade `is-pegada`; si debajo
  pasa una sección oscura, `is-sobre-oscuro`.
- **Menú Tienda y menú del teléfono**: `abrirGrupo`, `closeMenu` y los eventos
  que los abren con clic o al pasar el ratón, y los cierran con Escape o al
  pulsar fuera.
- **El globo de ayuda** (tooltip): un único `div.globo` para toda la página.
  Cualquier elemento con `data-tip="texto"` lo muestra tras medio segundo con
  el cursor quieto, o al instante si se llega con el teclado. `colocarTip`
  calcula su posición para que no se salga de la ventana.
- **Horario**:
  - `easterSunday(año)` calcula el domingo de Pascua (algoritmo de Meeus/Jones/Butcher), del
    que dependen Carnaval y Viernes Santo.
  - `holidayKeys(año)` arma la lista de feriados de Ecuador.
  - `horarioDeHoy()` devuelve si hoy abre, a qué hora, si es feriado y si está
    abierto ahora.
  - `updateOpeningStatus()` usa eso para escribir "Abierto · cierra 20:00" en el
    pie, marcar la fila del horario de hoy y cambiar la nota de la portada.
- **Animaciones de entrada**: `motionMap` asigna a cada zona su animación, e
  `IntersectionObserver` añade `is-visible` cuando la zona entra en pantalla,
  que es lo que dispara la animación en el CSS.
- **`vigilarImagenes()`**: marca cada imagen con `is-loading` mientras baja e
  `is-loaded` al llegar; si falla, la esconde para no dejar el ícono de imagen
  rota.

### 5.7 `cart.js` — la canasta y la pantalla de confirmar

Es el módulo más largo porque maneja todo el recorrido del pedido.

**Guardar y recuperar**
- `leerGuardado()` lee de `localStorage` el pedido, la entrega y la factura, y
  revisa cada dato (longitudes, que las coordenadas sean números válidos)
  antes de usarlo.
- `guardar()` escribe todo de vuelta y actualiza la cookie con la fecha.
- `borrarGuardado()` lo elimina tras confirmar un pedido.

**El panel lateral (la "gaveta")**
Se crea un `<aside role="dialog">` con la lista de productos, el subtotal y el
botón "Ir a pagar". Funciones clave:
- **`pintar()`**: rehace la lista. Cada línea tiene −, la cantidad y +. Cuando
  solo queda una unidad, el − se convierte en un basurero y pregunta "¿Lo
  quitamos?" antes de borrar (`pedirQuitar`, `confirmarQuitar`,
  `cancelarQuitar`).
- **`pintarPie()`**: actualiza el subtotal, el contador del botón flotante y
  llama a `pintarDesglose`, `pintarResumen` y `pintarPago`, para que todo lo
  que depende del pedido quede al día. También llama a `guardar()`.
- **`abrir()` / `cerrar()`**: muestran el panel, bloquean el desplazamiento de
  la página y devuelven el foco a donde estaba.
- **Deshacer**: al quitar un producto aparece una barra con "Deshacer" durante
  12 segundos (`anotarBorrado`, `deshacerBorrado`, `olvidarBorrado`).

**Ir a pagar**
Si no hay una cuenta con el correo verificado (`puedePedir()`), se muestra un
aviso con el botón "Crear cuenta o entrar". Si la hay, se abre la pantalla de
confirmar.

**La pantalla de confirmar** (`<section id="confirmar">`)
No es un panel: es otra "página" dentro de `<main>`, con dirección propia
(`#confirmar` y luego `#comprobante`) y botón de volver. Tiene dos columnas:
- **Izquierda**: cómo lo quieres (retiro o domicilio), la dirección del local
  con su enlace "Cómo llegar" o los campos de tu dirección, cómo pagas y los
  datos de la factura.
- **Derecha** (`.checkout-resumen`): lo que llevas (solo lectura), el desglose
  (subtotal, envío, total), a dónde llega el comprobante y el botón de
  confirmar.

Funciones de navegación: `verVista(paso)`, `abrirCheckout()`,
`verComprobante()` (usa `replaceState` para que Atrás no vuelva al pago de un
pedido ya hecho), `cerrarCheckout()` y `recogerCheckout()`, que limpia lo
necesario se salga por donde se salga.

**El control de cantidad de las fichas**
`montarControlesDeFicha()` recorre las fichas y cambia el enlace "Pedir" por
`−  [número]  +`. El número es un campo editable: se puede escribir "12"
directamente. Si el producto tiene tamaños, cada tamaño es una línea distinta
en la canasta. Cada ficha deja una función en `refrescos` para repintarse
cuando el pedido cambia desde el panel.

**El botón flotante**
Se le quita el enlace de WhatsApp, se le pone el ícono de canasta y un contador
de productos.

### 5.8 `checkout.js` — pago simulado y comprobante

- **`piezasDePago()`**: devuelve los trozos de HTML que `cart.js` coloca en la
  pantalla de confirmar: el aviso de que es una demostración, la elección
  efectivo/tarjeta, los campos de la tarjeta, la factura, el correo del
  comprobante y el botón final.
- **`comprobanteHtml()`**: el HTML del recibo.

**La tarjeta**
- `luhn(digitos)`: el **algoritmo de Luhn**, la comprobación matemática que
  usan todas las tarjetas reales para detectar números mal escritos. Por eso
  4242 4242 4242 4242 pasa y un número inventado no.
- `fallosTarjeta()` revisa número, vencimiento (MM/AA y no vencida), CVV de 3
  cifras y titular.
- `reformatear(input, ...)` agrupa los dígitos mientras escribes (`4242 4242...`,
  `12/27`) sin que el cursor salte al final.
- Los errores solo aparecen cuando ya saliste del campo o intentaste pagar
  (`tocados`, `intentado`), no mientras escribes.

**La factura**
- Por defecto va "A mi nombre". Si se elige "A nombre de otra persona"
  aparecen nombre, cédula o RUC, correo y dirección.
- `revisarFactura()` exige nombre y una cédula de 10 dígitos o un RUC de 13,
  cuyos dos primeros dígitos sean una provincia (01 a 24).

**Confirmar**
Al pulsar el botón se revisa la dirección, después la factura y después la
tarjeta, y se lleva el foco al primer campo con error. Si todo está bien, se
simula un proceso de 1,5 segundos y se llama a `aprobar()`, que:
1. genera un número de pedido `ET-XXXX` (sin letras que se confundan, como O y 0),
2. llena el comprobante (`pintarComprobante`),
3. envía el correo (`mandarComprobante`),
4. guarda el pedido en el historial de IndexedDB,
5. borra la canasta guardada, limpia la tarjeta y la factura,
6. muestra el comprobante.

El botón "Copiar" usa `navigator.clipboard`, y si no está disponible recurre a
un método antiguo (`respaldoCopiar`).

### 5.9 `account.js` — la cuenta

Es una **maqueta**: sin servidor, la cuenta solo existe en el navegador. La
contraseña **no se guarda tal cual**: se guarda su huella (un hash PBKDF2 con
sal, hecho con `crypto.subtle`), y al entrar se calcula la huella de lo escrito
y se compara con la guardada.

**El panel** tiene cuatro pasos (`data-paso`): `crear`, `verificar`, `entrar` y
`sesion`; `verPaso(nombre)` muestra uno y oculta los demás.

**Crear la cuenta**
- `campoHtml(...)` genera cada campo con su etiqueta y su párrafo de error
  enlazado por `aria-describedby`.
- `REGLAS`: la lista de requisitos de la contraseña. Se usa dos veces: para
  dibujar la lista bajo el campo (que se va marcando mientras escribes) y para
  comprobar si vale.
- `fallosCuenta()` revisa nombre con apellido, correo (`fallaCorreo` dice
  exactamente qué falta: sin @ pide todo lo que va desde el @, con el @ pide
  lo que va después, luego el .com...; "Iniciar sesión" usa la misma
  función), teléfono de 9 cifras empezando por 9
  y que las dos contraseñas coincidan.
- `soloNueve()` limpia el teléfono y quita el 0 inicial, porque el +593 ya está
  delante.

**Verificar el correo**
- `nuevoCodigo()` genera un código de 6 cifras.
- `mandarCodigo()` lo envía por correo. Si el envío no está configurado o
  falla, lo muestra en pantalla dentro de un recuadro que imita el correo, para
  que el registro pueda continuar.
- `cuentaAtras()` obliga a esperar 45 segundos antes de pedir otro, para no
  agotar la cuota gratuita de correos.
- `comprobarCodigo()` compara lo escrito con el esperado y, si coincide, inicia
  la sesión.

**Entrar y salir**
- Entrar solo pide el correo y lo compara con el de la cuenta guardada en ese
  navegador.
- `entrarEnSesion()` guarda la cuenta, pinta el botón con tus iniciales y pasa
  tu dirección a la canasta si estaba vacía (`prellenarPedido`).
- Cerrar sesión no borra la cuenta: solo marca `sesionAbierta: false`.

**El botón de la cabecera** (`navCuenta`)
Fuera de sesión muestra una silueta y despliega "Iniciar sesión /
Registrarse". Dentro de sesión muestra las iniciales y abre directamente la
ficha con tus datos y tus últimos pedidos (`pintarPedidos`, que los lee de
IndexedDB).

### 5.10 `mail.js` — el correo

El único canal de mensajes que se puede usar gratis y sin servidor.

- **`BUZON`**: los tres identificadores de **EmailJS** (servicio, plantilla y
  clave pública). Son públicos a propósito: lo que impide que otro los use es
  la lista de dominios permitidos configurada en el panel de EmailJS.
- **`buzonListo()`**: dice si están configurados.
- **`enviarCorreo(para, nombre, asunto, cuerpo)`**: hace un `fetch` POST a la
  API de EmailJS. Una sola plantilla sirve para los dos mensajes (código y
  comprobante) porque el asunto y el cuerpo viajan como variables. Devuelve
  `true` o `false` y nunca lanza un error: si el correo falla, el pedido sigue
  siendo válido.

---

## 6. La publicación automática (`.github/workflows/ci-cd.yml`)

Cada vez que se sube un cambio a `main`, GitHub ejecuta este flujo antes de
publicar:

1. Comprueba que existan los archivos principales.
2. Comprueba que los 10 módulos tengan la sintaxis correcta (`node --check`).
3. Vuelve a generar `js/sin-servidor.js` y falla si no coincide con el subido,
   para que la versión de doble clic nunca se quede atrás.
4. Comprueba que todo lo que se importa exista con el nombre exacto
   (mayúsculas incluidas, porque el servidor las distingue y Windows no).
5. Valida `productos.json` con la misma función `revisar` del sitio, comprueba
   que cada categoría tenga su entrada en el menú Tienda y que existan las dos
   fotos de cada producto.
6. Rechaza el cambio si aparecen las palabras café, cafetería o cóctel (el
   proyecto es de una panadería, no de una cafetería), incluso en comentarios.
7. Si todo pasa, publica en GitHub Pages.

Si alguna comprobación falla, el sitio publicado **no cambia** y se queda con la
última versión buena.

---

## 7. Conceptos que aparecen en todo el código

- **Módulos ES** (`import` / `export`): cada archivo tiene su propio ámbito, y
  solo comparte lo que exporta.
- **Plantillas de texto** (`` `Hola ${nombre}` ``): se usan para armar HTML y
  mensajes.
- **`dataset`**: los atributos `data-algo="..."` del HTML se leen en
  JavaScript como `elemento.dataset.algo`. Se usan para guardar datos en los
  elementos (la categoría de una ficha, el paso de un panel, el texto de un
  globo de ayuda).
- **`history.pushState` / `popstate`**: cambian la dirección de la página sin
  recargarla, y permiten que el botón Atrás funcione entre vistas.
- **`aria-*` y `role`**: atributos de accesibilidad que le dicen al lector de
  pantalla qué es cada cosa (`role="dialog"`), si está abierta
  (`aria-expanded`), qué texto la describe (`aria-describedby`) o si hay un
  error (`aria-invalid`).
- **`inert`**: hace que una zona de la página no se pueda usar ni leer mientras
  hay un panel abierto encima.
- **`IntersectionObserver`**: avisa cuando un elemento entra en pantalla, sin
  tener que revisar la posición en cada desplazamiento.
- **Promesas y `async` / `await`**: para lo que tarda (leer el JSON, enviar un
  correo, abrir IndexedDB) sin congelar la página.
