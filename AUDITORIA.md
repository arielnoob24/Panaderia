# Auditoría del sitio: El Tradicional

Archivo único. Reúne las nueve auditorías que antes estaban sueltas: la general,
estética y animaciones, accesibilidad, responsive, rendimiento, SEO y contenido.

**Rondas originales:** del 22 al 24 de septiembre de 2026.
**Revisado contra el sitio actual:** 5 de octubre de 2026.

Esa diferencia de fechas importa. Las auditorías originales se hicieron sobre un
sitio de tres archivos, con nueve productos escritos a mano y una barra de filtros.
Después el sitio se rehizo: el catálogo sale de un archivo de datos, el JavaScript
está repartido en módulos, y hay canasta, pago simulado, cuenta de cliente y mapa
de reparto. Así que muchos hallazgos viejos dejaron de aplicar, no porque se
arreglaran sino porque desapareció la parte del sitio que los tenía. Lo que sigue
está comprobado contra el sitio de hoy.

---

## 1. Lo que sigue abierto

### Crítico

**El sitio le dice a Google que su página de verdad está en otro sitio.** Tres
etiquetas del encabezado declaran que la dirección oficial de la página es un
dominio de ejemplo que no existe, mientras el sitio se publica en GitHub Pages. Esa
declaración es la instrucción más fuerte que se le puede dar a un buscador sobre
qué indexar, y apunta a la nada. Es el tipo de error que hace que un sitio
publicado simplemente no aparezca en las búsquedas, por bien hecho que esté todo lo
demás. Lo mismo afecta a la vista previa al compartir el enlace.

### Alto

**Los datos estructurados publican un teléfono inventado como si estuviera
verificado.** El pie ya avisa de que los contactos son de ejemplo, y eso resuelve
el problema para quien lee la página. Pero los datos estructurados no los lee una
persona: alimentan la ficha de negocio del buscador, donde ese número saldría como
dato bueno y sin el aviso al lado. Mejor retirar el campo mientras no haya número
real: una ficha sin teléfono es válida, una con teléfono falso no es honesta.

**Dos enlaces abren una ventana nueva sin avisarlo:** el botón flotante y el enlace
de reserva que aparece si el JavaScript no carga. El resto del sitio ya lo avisa con
un texto que solo oye el lector de pantalla. Sin ese aviso, quien navega así pulsa,
el foco desaparece a otra ventana y el botón «atrás» deja de funcionar.

### Medio

**No hay archivo de rastreo ni mapa del sitio.** Para una sola página no es
determinante, pero el mapa del sitio es donde se declara la fecha de última
modificación, y sin él no hay forma de avisar al buscador de que la página cambió.

**Falta declarar el menú como dato estructurado, que es justo lo que este sitio
tiene.** Los datos estructurados describen el negocio pero no el catálogo, y es lo
que hace que los productos y sus precios salgan en los resultados enriquecidos.
Para una panadería que quiere que la encuentren buscando «pan de queso Tena» es
exactamente lo que hace falta. Se puede generar desde el catálogo, que ya tiene
todos los campos.

**La imagen con la que se comparte el enlace es de banco de fotos y no declara su
tamaño.** Sin el tamaño, algunas redes tardan más en componer la vista previa o la
recortan mal. Y el enlace se presenta con una foto que no es del negocio.

**El año del pie está congelado en 2024,** lo que sugiere que el sitio está
abandonado: lo contrario de lo que interesa.

**Las fotos del catálogo siguen siendo enlaces a un servicio externo.** Están
optimizadas, así que no es un problema de peso sino de control: si ese servicio
retira una foto, la tarjeta se queda vacía. Solo la foto de historia y la mascota
son propias.

**Los precios no dicen la unidad,** y en panadería no siempre se deduce si es por
pieza, por funda o por docena.

### Bajo

- Ni el título ni la descripción mencionan Tena, que para un negocio local es
  probablemente la palabra que más visitas útiles traería.
- Algunos enlaces del pie quedan por debajo del área mínima que pide la norma para
  pulsarlos con el dedo. No hace falta agrandar el texto, solo darles más margen.
- No hay atajo para saltarse el catálogo: son unas dieciocho paradas de tabulación
  antes del pie. Hay atajo para saltar al contenido, así que no es un fallo, pero el
  trecho es largo.
- El botón flotante está construido como un enlace que se comporta como botón, con
  las teclas escritas a mano. Es deuda, no fallo: así sigue funcionando sin
  JavaScript.
- La aguja del mapa no se mueve con las flechas: se marca el centro y ya. Para
  corregir el punto hay que mover el mapa y volver a marcar.
- La guía del correo menciona un archivo que ya no existe, de cuando el JavaScript
  estaba todo junto.
- Falta decidir si se destaca algún producto haciéndolo más grande. Está sin hacer a
  propósito: cambia la jerarquía del contenido, así que primero hay que elegir cuál.

---

## 2. Lo que ya está arreglado

Se conserva como registro, porque saber qué estaba mal es lo que evita repetirlo.

**Peso: de 945 KB a 333 KB, un 65 % menos.** Todo el problema estaba en las fotos,
no en cómo está hecho el sitio: se pedían al doble del tamaño en que se mostraban, y
la mascota era un archivo enorme que nunca se ve grande. Ahora cada pantalla pide la
foto en su tamaño, y la mascota quedó un 96 % más ligera e indistinguible del
original. Lo sano del proyecto, que conviene no estropear: ninguna fuente
descargada, así que no hay parpadeo al cargar el texto; ninguna librería ni
JavaScript de terceros; y todo el movimiento usa las propiedades que al navegador le
cuestan poco.

**Paleta: de 27 colores sueltos a 5 con sus tonos.** Dos eran el mismo color con dos
nombres, y los nombres ya no describían nada: el llamado «petróleo» era marrón y el
llamado «coral» era terracota, restos de una paleta anterior. El color de marca pasó
de aparecer en menos del 1 % del sitio a marcar todas las acciones principales, que
era su trabajo: que el ojo aprenda que ese color significa «esto se puede pulsar».

**Forma: el sitio dejó de verse cuadrado.** Era medible, no una impresión: en toda la
hoja de estilos había seis esquinas redondeadas, cinco de ellas círculos
decorativos, y la página era una pila de franjas con cortes perfectamente rectos.
Se añadió una escala de redondeos, hombros curvos entre secciones y tres gestos
tomados del oficio, entre ellos la foto de historia recortada como una hogaza.

**Movimiento: dejó de animarse todo igual.** También medible: había un solo patrón
de entrada aplicado a seis tipos de elemento, y las once animaciones usaban la misma
curva. Ahora cada zona tiene el movimiento que le toca: la foto de historia se
descubre de abajo arriba como un corte de pan, el texto entra de lado porque la
rejilla es de dos columnas, los tres principios entran en orden porque son una
secuencia numerada, y el mapa solo aparece sin moverse, porque es un territorio.

**Contraste.** Se midió el de todos los pares de color y cumplen la norma. El peor
fallo era un texto pequeño en mayúsculas sobre fondo oscuro, casi ilegible. También
se midió **sobre las fotografías**, que es el caso difícil porque el fondo cambia en
cada píxel: se muestreó la zona entera y se tomó el peor píxel, no la media. Así se
encontró un rótulo del hero que fallaba en el 100 % de los píxeles.

**El mapa de reparto era imposible de usar sin ratón:** el punto de entrega solo se
podía marcar con un clic o arrastrando. Ahora hay un botón que marca el centro, las
flechas mueven el mapa, y el mapa se presenta diciendo en voz alta qué teclas
funcionan. Antes, al tabular hasta ahí, solo se oía «mapa».

**Los paneles se comportan como ventanas de verdad.** En canasta, pago y cuenta el
tabulador da vueltas dentro y no se escapa, la página de detrás queda apagada
también para el lector de pantalla, Escape cierra desde cualquier sitio y el foco
vuelve al botón que lo abrió. Además, abrir el menú del teléfono mete el foco
dentro: sin eso el siguiente tabulador se saltaba el menú que acababas de abrir. Y
la fila de productos, que se adelanta sola, se detiene en cuanto el foco entra en
ella: nadie va a perseguir un producto que se mueve mientras lo elige.

**Responsive.** Había una barra de desplazamiento horizontal en toda la página en
tabletas y ventanas a media anchura, causada por una animación que empujaba un
bloque de texto hacia la derecha. Y la barra de categorías se desbordaba sin ninguna
señal de que se podía arrastrar, así que en móvil dos categorías eran invisibles:
quien no arrastrara por casualidad creía que el catálogo tenía tres.

**El pedido pasó a ser una canasta.** Antes cada botón abría WhatsApp con un mensaje
de un solo producto: para pedir tres cosas había que mandar tres mensajes. Ahora se
acumula con cantidades, sobrevive a recargar la página y sale en un solo mensaje con
el total ya redactado. Si el JavaScript falla, los botones siguen funcionando como
antes.

**Datos y textos corregidos.** Se retiró «Audio-PhoneComputer» de la dirección,
porque parecía ser el nombre del negocio y suena a tienda de electrónica. El aviso
de frescura decía «Sale a las 17:00» con texto fijo, así que a las siete de la tarde
seguía diciéndolo; ahora dice que se hornea a lo largo del día. El indicador de
disponibilidad anunciaba «Disponible» en los nueve productos sin que nadie lo
hubiera decidido, porque la lógica existía pero el dato no; ahora sale del catálogo.
Se repasaron las tildes del texto visible. Y se quitaron los duplicados: dos enlaces
que iban a la misma dirección, un teléfono que repetía el número de WhatsApp, el
WhatsApp de la barra superior y «Tena» dicho dos veces en la misma tarjeta.

**Fotos.** Había cuatro para once espacios, una repetida siete veces incluida la del
hero, y otra que devolvía error y dejaba dos tarjetas vacías en el sitio publicado.
También se retiró la foto de bebidas, que estaba alojada en un medio ajeno y
mostraba botellas de marcas conocidas: era un problema de marca, de derechos y de
control a la vez. Un sitio que argumenta masa madre y fermentación lenta no puede
terminar la vitrina con bebidas industriales.

**Cómo se pide, cómo se paga y si hay entrega** quedó resuelto con el pago simulado:
retiro en local o a domicilio, y efectivo, tarjeta o transferencia.

**La sección de historia.** El usuario dijo «creo que está demasiado texto». Medido,
la sección tenía 85 palabras y la mancha de tinta era del 5,5 %, cuando un muro de
texto de verdad ronda el 12-20 %: en volumen era de las zonas más escuetas del
sitio. La impresión era correcta pero la causa era otra. **La fotografía llevaba
todo ese tiempo estirándose al doble de alto del que debía,** porque el tamaño que
traía el archivo mandaba sobre la proporción que pedía la hoja de estilos. La foto
medía casi trescientos píxeles más que la columna de texto y dejaba un hueco grande
encima y debajo: **ese vacío alrededor era lo que hacía parecer el texto
abundante.** Corregido solo eso, sin tocar una palabra, la sección se acortó un
34 %. Lo segundo sí era texto, pero por repetir: la idea de lentitud aparecía cuatro
veces y una frase estaba repetida palabra por palabra. Se recortó a 64 palabras, y
uno de los principios recuperó literalmente la frase que se quitó del párrafo, así
que no se perdió información ni se inventó nada.

---

## 3. Decisiones tomadas, con su motivo

Lo que conviene no deshacer sin leer antes por qué se hizo así.

- **Nada de parallax ni animación ligada al desplazamiento.** El motivo es técnico,
  no de gusto: el fondo de papel es una capa fija del tamaño de la ventana que el
  navegador recompone en cada scroll. Sumarle más es el camino a que vaya a saltos.
- **Un solo movimiento en bucle en todo el sitio,** el latido del aviso de recién
  horneado. Cualquier otro compite con ese fondo fijo.
- **Las tarjetas del catálogo entran todas igual.** Son nueve a la vez: la variedad
  va en el orden en que aparecen, no en darle a cada una un movimiento distinto.
- **Los enlaces de la barra superior no se mueven al pasar el cursor,** solo les
  crece un subrayado. La barra está sobre la fotografía, y mover texto sobre un
  fondo que cambia empeora la legibilidad.
- **Los elementos empiezan ocultos solo si el JavaScript lo dice, nunca desde la
  hoja de estilos.** Si estuviera en los estilos, un fallo del JavaScript los
  dejaría invisibles para siempre. Por eso el hero se ve aunque el JavaScript no
  cargue.
- **El pedido sigue saliendo por WhatsApp, y no puede ser de otro modo.** El sitio
  es estático: no hay servidor ni pasarela. La canasta organiza el pedido, no lo
  cobra.
- **La tarjeta de local no lleva botones propios de WhatsApp ni de llamada,** aunque
  las guías los recomiendan. Decisión del usuario, y es razonable: esos contactos ya
  están en el pie y en el botón flotante, y repetirlos sería la misma duplicación
  que se acababa de retirar.
- **La columna de texto de historia es más estrecha que el bloque de principios, y
  se deja así.** A lo ancho de la rejilla el párrafo pasaría de ochenta caracteres
  por línea, por encima de lo que se lee cómodo. Que el texto corrido sea más
  estrecho es una decisión editorial normal, no un descuadre.
- **Por debajo de cierto tamaño la mascota deja de leerse.** Comprobado dibujándola
  a seis tamaños: pequeña es una mancha. Por eso las marcas van más grandes de lo
  previsto y dentro de un círculo de fondo, que es lo que le da silueta reconocible.
- **Si algún día hay más de un local, hay que reponer la altura mínima de la
  dirección,** que se quitó. Servía para alinear las tarjetas entre sí.
- **El contacto general de WhatsApp quedó solo en el pie,** al retirar el de la barra
  y convertir el flotante en canasta. Es coherente con quitar duplicados, pero
  significa que quien quiera **preguntar** algo mirando el catálogo tiene que bajar
  hasta el final. Si molesta en uso real, la solución no es devolver el botón
  idéntico, sino decidir dónde vive la consulta.

---

## 4. Lecciones de método

Errores de medición ya cometidos una vez, escritos para no repetirlos.

- **Sumar el peso de todas las fotos que nombra la página da un número falso,**
  porque cuenta todas las versiones de cada foto y el navegador descarga una sola.
  El número bueno hay que pedírselo al navegador.
- **Un fondo de color claro baja el contraste del texto que lleva encima, y a ojo no
  se nota.** Dos versiones de la etiqueta de horario fallaron la norma por muy poco;
  hubo que probar varias intensidades hasta encontrar la que cumple.
- **Que no se puedan leer las reglas de estilo desde el navegador no significa que
  los estilos estén roto.** Dos veces se dio por roto algo que funcionaba. La
  comprobación válida era más simple: preguntar si la regla encuentra el elemento.
- **Un movimiento de dos o tres píxeles en un icono pequeño no se percibe.** El
  usuario avisó dos veces de que no se notaba nada y el mecanismo funcionaba: el
  problema era el tamaño del gesto, no el código. Lo mismo con los colores: el
  primer intento de distinguir «el cursor está encima» de «esto está seleccionado»
  usó dos tonos demasiado parecidos.
- **Al quitar contenido de la tarjeta de local hay que revisar la altura mínima del
  mapa de al lado,** o el ahorro no se nota: la tarjeta se estira a la altura de la
  fila y el hueco se traslada a su borde inferior en lugar de desaparecer. Pasó dos
  veces seguidas.
- **Cuando un bloque se siente vacío, a veces el problema no es cuánto espacio hay
  sino cómo está repartido el contenido dentro.** El pie se recortó dos veces y
  seguía sobrando sitio, porque el hueco había pasado de vertical a horizontal.
  Reordenarlo a una sola fila, con el lema ocupando el centro vacío, lo dejó un 36 %
  más corto.
- **Cualquier animación que mueva algo hacia los lados necesita que su sección lo
  recorte,** o ese movimiento se convierte en barra de desplazamiento en alguna
  anchura de pantalla.
- **Un error de ejecución en el JavaScript se lleva la página entera por delante, y
  comprobar que compila no lo detecta.** Cualquier cambio hay que probarlo cargando
  la página.

---

## 5. Cómo se midió, y qué no se ha probado

Los números vienen de medir, no de leer código: la página se renderizó en un
navegador a varias anchuras, se calculó el contraste de cada par de color (incluido
el muestreo píxel a píxel sobre las fotografías), se comprobó que todas las imágenes
responden, se pidió al navegador el peso real de cada archivo, y se midió el tamaño
de cada botón y el número de paradas de tabulación sobre la página, no deducido del
código.

**Lo que no se ha hecho, y conviene saberlo:**

- Ningún lector de pantalla real. Lo que este archivo dice sobre lectores de
  pantalla se deduce de cómo está construido el sitio, no de haberlo escuchado.
- Ningún dispositivo físico, ninguna pantalla táctil real, ningún móvil en
  horizontal, ninguna pantalla muy estrecha con contenido real.
- Ningún navegador que no sea Chrome.
- Ninguna medición con conexión lenta ni con las herramientas que puntúan el
  rendimiento. Lo que se dice sobre coste de dibujado se basa en qué se anima, no en
  haberlo cronometrado.
- Ninguna comprobación de cómo indexa el buscador de verdad.
- **Ningún dato de negocio verificado con nadie:** ni teléfono, ni dirección, ni
  horarios, ni precios, ni catálogo. Lo que aquí se marca como dato de relleno se
  deduce de su forma, por ejemplo un número que es todo ceros. Puede haber datos que
  parezcan correctos y no lo sean, y esta auditoría no los detectaría.

---

## 6. Archivos relacionados

- [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md): el recorrido completo del
  sitio sin ratón, tecla por tecla. No es una auditoría: no busca fallos, explica
  cómo se maneja. Sirve para la demostración.
- [CORREO_REAL.md](CORREO_REAL.md): cómo conectar el envío de correo para que el
  código de verificación y el comprobante salgan de verdad.
- [README.md](README.md): cómo está repartido el proyecto y qué está simulado.
