# Auditoría del sitio: El Tradicional

Archivo único. Reúne las nueve auditorías que antes estaban sueltas: la general,
estética y animaciones, accesibilidad, responsive, rendimiento, SEO y contenido.

**Rondas originales:** 2026-09-22 a 2026-09-24.
**Estado verificado contra el código actual:** 2026-10-05.

Esa diferencia de fechas importa. Las auditorías originales se hicieron sobre un
sitio de tres archivos (`index.html`, `styles.css`, `script.js`) con nueve
productos fijos y una barra de filtros. Después el sitio se rehizo: el catálogo
sale de `data/productos.json`, el JavaScript son diez módulos ES en `js/`, y hay
canasta, pago simulado, cuenta de cliente y mapa de reparto. Así que buena parte
de los hallazgos viejos dejaron de aplicar, no porque se arreglaran sino porque
desapareció el código que los tenía.

Lo que sigue está comprobado contra el código de hoy. Cada punto abierto lleva el
archivo y la línea donde está.

---

## 1. Lo que está abierto ahora mismo

### Crítico

#### El sitio le dice a Google que su página real está en otro dominio

Tres sitios apuntan a `https://www.ejemplo.com/`, un dominio de ejemplo que no
existe, mientras el sitio se publica en `https://arielnoob24.github.io/Panaderia/`:

| Dónde | Etiqueta |
|---|---|
| [index.html:10](index.html#L10) | `<link rel="canonical">` |
| [index.html:16](index.html#L16) | `og:url` |
| [index.html:36](index.html#L36) | `url` del JSON-LD |

El `canonical` es la instrucción más fuerte que se le puede dar a un buscador
sobre qué indexar, y está diciendo que la página buena es otra que no responde.
Es el tipo de error que hace que un sitio publicado simplemente no aparezca en
las búsquedas, por bien hecho que esté todo lo demás. El `og:url` tiene el mismo
problema al compartir el enlace.

Arreglo: poner las tres a la URL real. Si algún día hay dominio propio, cambiarlas
a la vez que se configure el redireccionamiento, nunca antes.

### Alto

#### El JSON-LD publica un teléfono inventado como si fuera verificado

[index.html:35](index.html#L35) declara `"telephone": "+593 99 000 0000"`.

El pie ya avisa de que los contactos son de ejemplo, y eso resuelve el problema
de cara a quien lee la página. Pero el JSON-LD no lo lee una persona: alimenta la
ficha de negocio local del buscador, donde ese número aparecería como dato bueno,
sin el aviso al lado. Un `Bakery` sin `telephone` es válido; uno con un teléfono
falso, no es honesto.

Arreglo: retirar el campo del JSON-LD mientras no haya número real. El aviso del
pie se queda como está.

#### Dos enlaces abren pestaña nueva sin avisarlo

El resto del sitio ya lo resuelve con `<span class="sr-only"> (abre en una pestaña
nueva)</span>`. Faltan dos:

- El botón flotante, [index.html:104](index.html#L104): tiene
  `aria-label="Pedir por WhatsApp"` pero no menciona el cambio de ventana.
- El `order-button` que genera [js/view.js:51](js/view.js#L51), que es el enlace
  de reserva para cuando no hay JavaScript.

Quien navega con lector de pantalla pulsa, el foco desaparece a otra ventana y el
botón «atrás» deja de funcionar, sin que nada lo haya anunciado. Es la técnica
G201 de WCAG, criterio 3.2.5.

### Medio

#### No hay `robots.txt` ni `sitemap.xml`

Ninguno de los dos existe. Para una sola página no es determinante, pero el
sitemap es donde se declara la fecha de última modificación y el `robots.txt` es
donde se enlaza el sitemap. Dos archivos muy cortos en la raíz. Ojo: GitHub Pages
sirve el sitio bajo `/Panaderia/`, así que las rutas tienen que incluir ese
segmento.

#### Falta el dato estructurado de menú, que es justo lo que este sitio tiene

El JSON-LD describe el negocio pero no el catálogo. Hay productos con nombre,
categoría, precio y tamaños en `data/productos.json`, y ninguno está declarado
como dato estructurado. Schema.org tiene `Menu`, `MenuSection` y `MenuItem` con
`offers` y `price`, que es lo que hace que los productos y sus precios salgan en
resultados enriquecidos. Para una panadería que quiere que la encuentren buscando
«pan de queso Tena», es exactamente lo que hace falta.

Se puede generar desde el JSON del catálogo, que ya tiene todos los campos.

#### La imagen para compartir es de banco y no declara dimensiones

`og:image` y `twitter:image` apuntan a la misma foto de Unsplash que usa el hero,
sin `og:image:width` ni `og:image:height`. Sin dimensiones, algunas plataformas
tardan más en componer la vista previa o la recortan mal. Y el enlace se presenta
con una imagen que no es del negocio.

#### El año del pie está congelado en 2024

[index.html:103](index.html#L103): «© 2024 El Tradicional · Tena, Ecuador». Un año
viejo en el pie sugiere que el sitio está abandonado, que es lo contrario de lo
que interesa. Generarlo desde JavaScript o quitarlo.

#### Las fotos del catálogo siguen siendo enlaces a Unsplash

25 referencias a `images.unsplash.com`. Están optimizadas (`srcset`, `auto=format`,
calidades afinadas), así que no es un problema de peso. Es de control: si Unsplash
cambia o retira una foto, la tarjeta se queda sin imagen. Solo la foto de la
sección de historia y la mascota son locales.

#### Los precios no dicen la unidad

`$0.25`, `$1.00`. En Ecuador el dólar se entiende sin explicar, pero no se dice si
es por unidad, por funda o por docena, y en panadería eso no siempre es obvio.

### Bajo

- **Ni el título ni la descripción mencionan Tena.** Para un negocio local es
  probablemente la palabra que más tráfico útil traería. Merece probarlo.
- **Faltan 24 px de área táctil en algunos enlaces del pie.** El criterio 2.5.8 de
  WCAG 2.2 AA pide 24×24 px mínimo. No hace falta agrandar el texto: basta
  `padding-block` o `min-height: 24px` con `display: inline-flex`.
- **No hay un «Saltar el mostrador».** El catálogo son unas 18 paradas de
  tabulación antes de llegar al pie. Hay «Saltar al contenido» y los encabezados
  dan estructura, así que no es un fallo, pero el trecho es largo.
- **El botón flotante es un `<a role="button" tabindex="0">`,** no un `<button>`.
  Funciona con Enter y Espacio porque se le escribieron los dos a mano. Es deuda,
  no fallo: sin JavaScript ese mismo elemento sigue siendo el enlace de WhatsApp.
- **La aguja del mapa no se mueve con las flechas.** Se marca el centro y ya; para
  corregir el punto hay que mover el mapa y volver a marcar. Arrastrar sigue
  siendo solo de ratón.
- **`CORREO_REAL.md` dice «rellenar tres claves en `script.js`»,** y ese archivo ya
  no existe: las claves van en `js/mail.js`.
- **Módulo destacado en el catálogo** con `grid-column: span 2`. Está sin hacer a
  propósito: cambia la jerarquía del contenido, no solo la forma, así que primero
  hay que decidir qué producto se destaca.
- **La mascota como SVG.** Con 8 KB ya no es urgente, pero un vector escalaría
  perfecto en sus cuatro tamaños.

---

## 2. Lo que ya está arreglado

Registro compacto. Se conserva porque saber qué estaba mal es lo que evita
repetirlo.

### Rendimiento: de 945 KB a 333 KB, un 65 % menos

Medido sobre el sitio publicado, a 1418 px y densidad 1.

| | Antes | Después |
|---|---:|---:|
| **Total de la página** | **945 KB** | **333 KB** |
| Imagen del hero | 138 KB | 71 KB |
| Foto más pesada del catálogo | 304 KB | 55 KB |
| Mascota | 216 KB | **8 KB** |
| HTML, CSS y JS, ya comprimidos | — | 15 KB |

Qué se hizo: `srcset` con cuatro anchuras y `sizes`; la mascota redimensionada a
224 px y cuantizada a 128 colores conservando transparencia, de 216 925 a 8 277
bytes, indistinguible del original a 44, 52, 72 y 104 px; la foto que comprimía
mal bajada a `q=58`; el hero con `image-set()` 1x y 2x; `preconnect` a Unsplash y
`preload` del hero con `fetchpriority="high"`; y la foto de historia sustituida por
una propia y local, recortada a 4:5 y servida en dos tamaños.

Lo sano del proyecto, que conviene no estropear: **cero fuentes web** (Georgia y
Arial son del sistema, así que no hay descarga ni parpadeo de texto), **cero
dependencias y cero JavaScript de terceros**, y todo el movimiento anima solo
`transform` y `opacity`, que son las propiedades baratas.

### Paleta: de 27 colores sueltos a 5 con 9 tonos derivados

El sitio tenía 18 hexadecimales y 9 bases `rgb` distintas, dos tokens que eran el
mismo color con nombres diferentes (`--ink` y `--petroleum`), y nombres que ya no
describían nada (`--petroleum` era marrón, `--coral` era terracota, `--sage` era un
verde usado una sola vez).

Quedó en `--masa`, `--horno`, `--ambar`, `--corteza` y `--papel`, más nueve tonos
derivados con nombre. **Cero valores de color escritos a mano fuera de `:root`.**
Los once pares nuevos se comprobaron con WCAG antes de aplicarlos.

El reparto 60-30-10: el 60 y el 30 estaban bien; el problema era el acento, que
ocupaba menos del 1 %. El ámbar pasó de 8 a 18 elementos y de 2 de 5 tipos de CTA
a 4 de 5. Los nueve botones «Pedir», el botón del hero y el flotante quedaron en
el color de marca; el enlace del mapa se dejó en marrón a propósito, como acción
secundaria, para que la jerarquía siga significando algo.

### Geometría: el sitio dejó de verse cuadrado

El diagnóstico con datos: en 231 líneas de CSS había **6 radios declarados**, cinco
de ellos círculos decorativos, más un valor huérfano de 2 px. Todo lo demás tenía
radio 0, y la página era una pila de seis bandas a sangre con cortes rectos.

Se aplicó una escala de radios tokenizada, hombros de 40 px en la sección de
historia, un separador curvo bajo la franja coral, y tres gestos orgánicos
escasos: radio de masa en la foto de historia, sello circular girado en las
etiquetas y cinta con esquina cortada en el pie de foto.

### Movimiento: dejó de animarse todo igual

El diagnóstico: existía **un único patrón de entrada** (opacidad más desplazamiento
vertical) aplicado a seis tipos de componente, con dos `@keyframes` de contenido
idéntico, y las once declaraciones de movimiento usaban la misma curva `ease`.

Se crearon tokens de duración y cinco curvas de easing, se eliminó `ease` de toda
la hoja, se fusionaron los dos `@keyframes` en uno con amplitud por variable, y se
repartieron patrones distintos por zona: revelado por máscara en la foto de
historia, entrada lateral en el texto, secuencia numerada en los principios,
stagger diagonal en el catálogo, solo opacidad en el mapa. Un hook muerto
(`.is-filtering` existía en el JS y no en el CSS) quedó escrito.

### Accesibilidad y teclado

- 18 pares de color medidos, todos cumplen AA. El peor fallo, un eyebrow con
  **1,73:1**, quedó en 5,76:1, y se resolvió con una regla estructural para que
  ningún eyebrow en sección oscura pueda repetirlo.
- Contraste medido también **sobre fotografía**, muestreando un píxel de cada dos
  y quedándose con el peor, no con la media. Encontró el eyebrow del hero a 3,85
  frente al 4,5 exigido: el 100 % de los píxeles fallaba. Quedó en 6,49.
- El mapa de reparto era **imposible de usar sin ratón**. Ahora hay botón «Marcar
  el centro del mapa», Enter sobre el mapa, flechas para moverlo, `role="application"`
  con `aria-label` que dice qué teclas funcionan, y anillo de foco en el recuadro,
  porque Leaflet no marca su lienzo.
- Los tres paneles (canasta, pago, cuenta) son diálogos modales de verdad: foco
  atrapado, `inert` en la página de detrás, Esc desde cualquier sitio, y el foco
  vuelve al control que los abrió.
- Flechas, Inicio y Fin en los desplegables; abrir el menú del teléfono mete el
  foco dentro (sin eso el siguiente Tab se lo saltaba, porque la navegación va
  antes del botón en el documento); `↑ ↓` en el campo de cantidad.
- Las cuatro imágenes de la mascota declaran `width` y `height`.
- Los productos agotados no tienen botón, así que el tabulador se los salta.
- La fila del mostrador se adelanta sola cada 4,2 s, pero **se detiene en cuanto el
  foco entra** y respeta `prefers-reduced-motion`.

### Responsive

- **Desbordamiento horizontal entre 681 y 900 px**, 718 px de contenido en 698 de
  viewport. La causa era un patrón de entrada que desplazaba 18 px en el eje X.
  Corregido con `overflow-x: clip` en la sección.
- **Barra de filtros que desbordaba sin ninguna señal**, con dos categorías
  invisibles en móvil. Resuelto sin JavaScript: capas de fondo con
  `background-attachment: local` que se mueven con el contenido y descubren una
  sombra cuando queda algo fuera.
- Rejilla del catálogo con `auto-fill` y `minmax(260px, 1fr)`, así que se recompone
  sola al filtrar en lugar de dejar huecos.
- El botón flotante respeta `env(safe-area-inset-bottom)`.

### Contenido

- **El pedido pasa a ser una canasta.** Antes cada botón abría WhatsApp con un
  mensaje de un producto: para pedir tres cosas había que mandar tres mensajes.
  Ahora se acumula con cantidades, sobrevive a recargar la página, y sale en un
  solo mensaje con las líneas y el total redactados. Hecho como mejora
  progresiva: el HTML conserva los enlaces `wa.me` originales y es el JavaScript
  el que los convierte en botones de añadir.
- **«Audio-PhoneComputer» retirado** del texto visible y del `streetAddress` del
  JSON-LD, donde alimentaba la ficha de negocio local. Parecía el nombre del
  negocio, y suena a tienda de electrónica.
- **El aviso de frescura ya es cierto siempre.** Decía «Sale a las 17:00» con texto
  fijo, así que a las 19:00 seguía diciéndolo. Ahora dice «Pan recién hecho a lo
  largo del día».
- **El indicador de disponibilidad tiene origen de datos.** Antes el JavaScript
  escribía «Agotado» con `data-available="false"` y ningún producto lo declaraba,
  así que los nueve anunciaban «Disponible» sin que nadie lo hubiera decidido.
  Ahora sale de `disponible` en `data/productos.json`.
- **Las tildes del texto visible,** incluidas las dos que más dolían: el botón
  principal («Ver el menu») y la frase de marca («No hacemos pan rapido»).
- **La foto de bebidas alojada en un tercero,** con botellas de Coca-Cola, Pepsi,
  Red Bull y Monster, retirada. Eran tres problemas a la vez: de marca, de
  derechos de imagen y de control técnico.
- **Cómo se pide, cómo se paga y si hay entrega** ya está resuelto por el pago
  simulado: hay retiro en local o domicilio, y efectivo, tarjeta o transferencia.
- **Diez fotos distintas para diez espacios.** Antes había cuatro, una de ellas
  repetida siete veces, incluida la del hero. Era la causa de que la foto de
  historia «no se acabara de ver bien»: no era el encuadre, era que ya se había
  visto esa hogaza tres veces. Y una devolvía 404.
- **Duplicados retirados:** dos enlaces que llevaban a la misma URL carácter por
  carácter, el `tel:` que repetía el número de WhatsApp, el WhatsApp de la
  navegación, el «01» de un único local, «Tena» repetido en título y dirección.

### La sección de historia

El usuario dijo «creo que está demasiado texto». Medido: 85 palabras, 572
caracteres, 5,5 % de cobertura de tinta, cuando un muro de texto real ronda el
12-20 %. En volumen era de las zonas más escuetas del sitio.

La impresión era correcta y la causa era otra. **La foto llevaba todo ese tiempo
renderizándose en 1:2,23 en lugar de 4:5**, con 429 px de altura muerta. El `<img>`
llevaba `width="760" height="950"`, y aunque `width: 100%` anulaba la anchura,
nada anulaba la altura; y `aspect-ratio` solo se aplica cuando una de las dos
dimensiones es `auto`, así que se ignoraba en silencio. La foto medía 293 px más
que la columna de texto, y dejaba unos 146 px de vacío encima y debajo del texto.
**Ese vacío era lo que hacía parecer el texto abundante.** Corregido solo eso, sin
tocar una palabra, la sección pasó de 1158 px a 767 px, un 34 % menos.

Lo segundo sí era texto, pero por repetición, no por extensión: la idea de
lentitud aparecía cuatro veces y «masa madre viva» estaba repetido palabra por
palabra. Se recortó de 85 a 64 palabras, y el principio 03 recuperó literalmente
la frase que se quitó del párrafo, así que no se perdió información ni se inventó
nada.

---

## 3. Decisiones tomadas, con su motivo

Lo que conviene no deshacer sin releer por qué se hizo así.

- **Nada ligado al scroll: ni parallax ni animación scroll-driven.** El motivo es
  técnico, no de gusto: la textura de `body::before` es una capa fija a pantalla
  completa que el navegador recompone en cada desplazamiento, y el iframe del mapa
  lleva `filter`. Sumar scroll encima de eso es el camino al jank.
- **Un solo bucle infinito en todo el sitio,** el pulso del aviso de frescura.
  Cualquier bucle adicional compite con esa textura fija.
- **Las tarjetas del catálogo llevan un solo patrón de entrada.** Son nueve
  elementos simultáneos: la variedad va en el stagger, no en el patrón.
- **La navegación superior no se desplaza en hover,** solo crece un subrayado. El
  header es absoluto sobre la fotografía: mover enlaces sobre un fondo de
  contraste variable agravaría la legibilidad.
- **El estado oculto de las animaciones se añade siempre desde JavaScript,** nunca
  en el CSS base. Si se declarara en el CSS, un fallo de JS dejaría esos elementos
  invisibles para siempre. Es por lo que el hero sigue visible sin JavaScript.
- **Los nueve tonos derivados se quedan como hexadecimales, no como `color-mix()`.**
  Se eligieron uno a uno para cumplir AA y se verificaron los once pares.
  Calcularlos desplazaría varios lo bastante como para tener que volver a
  comprobarlos todos, a cambio de una propagación automática que una paleta
  estática de cinco colores rara vez necesita.
- **El carrito sigue saliendo por WhatsApp, y no puede ser de otro modo.** El sitio
  es estático: no hay servidor ni pasarela. El carrito organiza el pedido, no lo
  cobra.
- **La tarjeta de local no tiene botones propios de WhatsApp ni de llamada,** aunque
  las guías de fichas locales los recomiendan. Decisión del usuario: esos
  contactos ya están en el pie y en el botón flotante, y repetirlos sería la misma
  duplicación que se acaba de retirar.
- **La tarjeta de producto no lleva `overflow: hidden`.** La sombra de hover se
  dibuja en un `::after` con `inset: 0`, fuera de la caja: recortarla le quitaría
  la elevación. El radio se resuelve dando radio completo a la tarjeta y radio
  superior a la imagen, que ya tiene su propio `overflow`.
- **La columna de texto de historia es más estrecha que la rejilla de principios,**
  y se deja así. El párrafo mide 69 caracteres por línea a 530 px; a 640 px pasaría
  de 80, por encima del máximo editorial de 75. Es una decisión editorial normal,
  no un descuadre.
- **Por debajo de 40 px la mascota deja de leerse.** Comprobado renderizándola a 28,
  32, 40, 48, 56 y 72 px. Por eso la marca de cabecera está a 44 px y la de la
  franja a 52, y van dentro de un círculo de fondo: el círculo es lo que le da
  silueta reconocible en tamaño pequeño.
- **Si algún día hay más de un local, probablemente haya que reponer el
  `min-height` de la dirección,** que se retiró. Su función era alinear las
  tarjetas entre sí.
- **El contacto general de WhatsApp quedó solo en el pie,** al retirar el de la
  navegación y convertir el flotante en canasta. Es coherente con quitar
  duplicados, pero significa que quien quiera **preguntar** algo mirando el
  catálogo tiene que bajar hasta el final. Si molesta en uso real, la solución no
  es devolver el botón idéntico sino decidir dónde vive la consulta.

---

## 4. Lecciones de método

Errores de medición que ya se cometieron una vez. Están escritos para no repetirlos.

- **Sumar el peso de cada URL del HTML da un número falso,** porque cuenta todas las
  versiones de `srcset` y el navegador descarga una. Y la API de rendimiento da 0
  para los archivos propios, porque GitHub Pages no envía `Timing-Allow-Origin`.
  El número bueno combina las dos fuentes.
- **Un fondo tintado baja el contraste del texto que lleva encima,** y a ojo no se
  nota. Dos versiones del distintivo de horario fallaron AA por muy poco (4,48 y
  4,33 frente a 4,5) con fondos ámbar al 14 y al 16 %. Se barrieron opacidades y
  se fijó el 10 %, que da 4,79.
- **Leer reglas de CSS con la API de hojas de estilo devuelve cero si la hoja es de
  otro origen o es local, y eso no significa que el CSS esté roto.** Dos intentos
  se dieron por rotos antes de caer en que la comprobación válida era mucho más
  simple: preguntar si el selector encuentra el elemento.
- **Un movimiento de 2 o 3 px en un glifo pequeño no se percibe.** El usuario avisó
  dos veces de que «no se nota nada» y el mecanismo funcionaba: el problema era de
  magnitud. Subido a 6 px y 4 px.
- **Un tono solo un poco más claro no se lee como estado distinto.**
  `--horno-suave` era 3,5 veces más luminoso que `--horno`, demasiado poco. Se
  barrió la mezcla buscando el punto más claro que siguiera cumpliendo AA con
  texto blanco: al 60 % ya falla, así que quedó el 66 %, 6,2 veces más luminoso.
- **En la fila de locales, cada vez que se quita contenido de la tarjeta hay que
  revisar el `min-height` del mapa,** o el ahorro no se nota: la tarjeta se estira
  a la altura de la fila y el hueco se traslada a su borde inferior en lugar de
  desaparecer. Pasó dos veces seguidas.
- **Cuando un bloque se siente vacío, a veces el problema no es cuánto espacio hay
  sino cómo está repartido el contenido.** El pie se recortó de 315 a 258 px y
  seguía sobrando sitio, porque el hueco había pasado de vertical a horizontal.
  Reordenarlo a una sola fila, con el lema ocupando el centro que estaba vacío, lo
  dejó en 203 px.
- **Cualquier patrón de animación que desplace en el eje X necesita que su sección
  lo recorte,** o el desplazamiento se convierte en scroll de página en algún punto
  de ruptura.
- **Todo `js/` son módulos ES, y un error en ejecución se lleva la página entera
  por delante sin que `node --check` lo vea.** Cualquier cambio hay que probarlo
  cargando la página, no solo comprobando que compila.

---

## 5. Cómo se midió, y qué no se ha probado

Los números de este archivo vienen de medir, no de leer código:

- Renderizado en navegador sin interfaz a 512, 698 y 1418 px, con capturas de cada
  sección y comprobación de `scrollWidth` frente al viewport.
- Relación de contraste WCAG de 29 pares de color plano, más muestreo píxel a
  píxel sobre fotografía, quedándose con el peor píxel.
- Código de respuesta HTTP de todas las imágenes.
- `transferSize` por recurso con la API de rendimiento, y tamaño servido real para
  los archivos del repositorio.
- Tamaño de los objetivos táctiles con `getBoundingClientRect`, y recuento de
  paradas de tabulación sobre la página, no deducido del marcado.

**Lo que no se ha hecho, y conviene saberlo:**

- Ningún lector de pantalla real: ni NVDA, ni JAWS, ni VoiceOver. Todo lo que este
  archivo dice sobre lectores de pantalla se basa en la estructura del marcado, no
  en haberlo escuchado.
- Ningún dispositivo físico, ninguna entrada táctil real, ningún móvil en
  horizontal, ninguna anchura por debajo de 512 px con contenido real.
- Ningún navegador que no sea Chrome.
- Ni Lighthouse, ni limitación de red o de procesador, ni métricas de experiencia
  de carga. Las afirmaciones sobre coste de pintado se basan en qué propiedad se
  anima, no en una traza.
- Ni la herramienta de resultados enriquecidos de Google, ni Search Console. El
  diagnóstico del `canonical` se basa en lo que significa esa etiqueta, no en haber
  observado al buscador.
- **Ningún dato de negocio verificado con nadie:** ni teléfono, ni dirección, ni
  horarios, ni precios, ni catálogo. Lo que aquí se marca como marcador se deduce
  de su forma, por ejemplo un número que es todo ceros. Puede haber datos que
  parezcan correctos y no lo sean, y esta auditoría no los detectaría.

---

## 6. Archivos relacionados

- [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md): el recorrido completo del
  sitio sin ratón, tecla por tecla. No es una auditoría: no busca hallazgos,
  explica cómo se maneja. Sirve para la demostración.
- [CORREO_REAL.md](CORREO_REAL.md): cómo conectar EmailJS para que el código de
  verificación y el comprobante salgan de verdad.
- [README.md](README.md): cómo está repartido el proyecto y qué está simulado.
