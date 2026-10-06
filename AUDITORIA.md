# Auditoría del sitio: El Tradicional

Archivo único. Reúne las nueve auditorías que antes estaban sueltas: la general, estética
y animaciones, accesibilidad, responsive, rendimiento, SEO y contenido.

**Rondas originales:** del 22 al 24 de septiembre de 2026.
**Revisado contra el sitio actual:** 5 de octubre de 2026.

Esa diferencia de fechas importa. Las auditorías originales se hicieron sobre un sitio de tres
archivos, con nueve productos escritos a mano y una barra de filtros. Después el sitio se
rehizo: el catálogo sale de un archivo de datos, el JavaScript está en módulos, y hay
canasta, pago simulado, cuenta y mapa de reparto. Muchos hallazgos viejos dejaron de aplicar,
no porque se arreglaran sino porque desapareció la parte del sitio que los tenía. Lo que
sigue está comprobado contra el sitio de hoy.

---

## 1. Lo que sigue abierto

### Crítico

**El sitio le dice a Google que su página de verdad está en otro sitio.** El encabezado
declara como dirección oficial un dominio de ejemplo que no existe. Esa declaración es la
instrucción más fuerte que se le puede dar a un buscador sobre qué indexar, y apunta a la
nada: es el tipo de error que hace que un sitio publicado simplemente no aparezca en las
búsquedas, por bien hecho que esté todo lo demás. Afecta también a la vista previa al
compartir el enlace.

### Alto

**Los datos estructurados publican un teléfono inventado como si estuviera verificado.** El
pie ya avisa de que los contactos son de ejemplo, y eso basta para quien lee la página. Pero
los datos estructurados no los lee una persona: alimentan la ficha de negocio del buscador,
donde ese número saldría como dato bueno y sin el aviso al lado.

**Dos enlaces abren una ventana nueva sin avisarlo:** el botón flotante y el enlace de
reserva que aparece si el JavaScript no carga. El resto del sitio sí lo avisa con un texto
que solo oye el lector de pantalla. Sin ese aviso se pulsa, el foco desaparece a otra
ventana y el botón «atrás» deja de funcionar.

### Medio

- **No hay archivo de rastreo ni mapa del sitio.** El mapa es donde se declara la fecha de
  última modificación, y sin él no hay forma de avisar al buscador de que algo cambió.
- **Falta declarar el menú como dato estructurado, que es justo lo que este sitio tiene.** Es
  lo que hace que los productos y sus precios salgan en los resultados enriquecidos, y para
  una panadería a la que se busca por «pan de queso Tena» es exactamente lo que hace falta.
- **La imagen con la que se comparte el enlace es de banco de fotos y no declara su
  tamaño,** así que algunas redes la recortan mal y no es una foto del negocio.
- **El año del pie está congelado en 2024,** lo que sugiere que el sitio está abandonado.
- **Las fotos del catálogo siguen siendo enlaces a un servicio externo.** No es problema de
  peso sino de control: si retiran una foto, la tarjeta se queda vacía. Solo la de historia
  y la mascota son propias.
- **Los precios no dicen la unidad:** por pieza, por funda o por docena.

### Bajo

- Ni el título ni la descripción mencionan Tena, que para un negocio local es probablemente
  la palabra que más visitas útiles traería.
- El enlace «Ver en el mapa» del pie queda en unos 18 px de alto, por debajo del mínimo de
  24 que pide la norma para pulsarlo con el dedo. Los dos contactos de al lado sí llegan,
  porque su icono es más grande. No hace falta agrandar el texto, solo darle margen.
- No hay atajo para saltarse el catálogo: son unas dieciocho paradas de tabulación antes del
  pie. Hay atajo para saltar al contenido, así que no es un fallo. Y el botón flotante es un
  enlace al que se le escribieron a mano Enter y Espacio para que abra la canasta: deuda, no
  fallo, porque así sigue llevando a WhatsApp cuando el JavaScript no carga.
- La aguja del mapa no se mueve con las flechas: se marca el centro y ya. Y la guía del
  correo menciona un archivo que ya no existe.
- Falta decidir si se destaca algún producto haciéndolo más grande. Está sin hacer a
  propósito: cambia la jerarquía del contenido, así que primero hay que elegir cuál.

---

## 2. Lo que ya está arreglado

Se conserva como registro, porque saber qué estaba mal es lo que evita repetirlo.

**Peso: de 945 KB a 333 KB, un 65 % menos.** El problema estaba en las fotos, no en cómo está
hecho el sitio: se pedían al doble del tamaño en que se mostraban, y la mascota era un archivo
enorme que nunca se ve grande. Ahora cada pantalla pide la foto en su tamaño, y la mascota
quedó un 96 % más ligera e indistinguible del original. Lo sano, que conviene no estropear:
ninguna fuente descargada, así que no hay parpadeo al cargar el texto, y ninguna librería.

**Paleta: de 27 colores sueltos a 5 con sus tonos.** Dos eran el mismo color con dos nombres,
y los nombres ya no describían nada: el llamado «petróleo» era marrón, resto de una paleta
anterior. El color de marca pasó de aparecer en menos del 1 % del sitio a marcar todas las
acciones principales, que era su trabajo: que el ojo aprenda que significa «esto se pulsa».

**Forma y movimiento.** Las dos cosas eran medibles, no impresiones. El sitio se veía cuadrado
porque en toda la hoja de estilos había seis esquinas redondeadas, cinco de ellas círculos
decorativos, y la página era una pila de franjas con cortes rectos. Y todo parecía animarse
igual porque había un solo patrón de entrada para seis tipos de elemento, con la misma curva
en las once animaciones. Ahora cada zona tiene el movimiento que le toca: la foto de historia
se descubre como un corte de pan, y los principios entran en orden porque son una secuencia.

**Contraste.** Todos los pares de color cumplen la norma; el peor fallo era un texto pequeño
en mayúsculas sobre fondo oscuro, casi ilegible. También se midió **sobre las fotografías**,
que es el caso difícil porque el fondo cambia en cada píxel: se tomó el peor píxel de la
zona, no la media. Así apareció un rótulo del hero que fallaba en todos.

**Teclado.** El mapa de reparto era imposible de usar sin ratón: el punto de entrega solo se
marcaba con un clic o arrastrando. Ahora un botón marca el centro, las flechas mueven el
mapa, y el mapa dice en voz alta qué teclas funcionan; antes solo se oía «mapa». Los paneles
se comportan como ventanas de verdad: el tabulador da vueltas dentro, Escape cierra y el
foco vuelve al botón que lo abrió. Y la fila de productos se detiene en cuanto el foco
entra: nadie va a perseguir un producto que se mueve mientras lo elige.

**Responsive.** Había una barra de desplazamiento horizontal en tabletas, por una animación
que empujaba texto hacia la derecha. Y la barra de categorías se desbordaba sin avisar: en
móvil dos categorías eran invisibles.

**El pedido pasó a ser una canasta.** Antes cada botón abría WhatsApp con un mensaje de un
solo producto: para pedir tres cosas había que mandar tres mensajes. Ahora se acumula con
cantidades, sobrevive a recargar la página y sale en un solo mensaje con el total redactado;
si el JavaScript falla, los botones funcionan como antes. El pago simulado resolvió además
cómo se pide, cómo se paga y si hay entrega.

**Datos, textos y fotos.** Se retiró «Audio-PhoneComputer» de la dirección, porque parecía
ser el nombre del negocio y suena a tienda de electrónica. El aviso de frescura decía «Sale
a las 17:00» con texto fijo, así que a las siete de la tarde seguía diciéndolo. El indicador
de disponibilidad anunciaba «Disponible» en los nueve productos sin que nadie lo hubiera
decidido, porque la lógica existía pero el dato no. Se repasaron las tildes y se quitaron
los duplicados. De fotos había cuatro para once espacios, una repetida siete veces incluida
la del hero, y otra que devolvía error y dejaba dos tarjetas vacías. También se retiró la de
bebidas, alojada en un medio ajeno y con botellas de marcas conocidas: un sitio que
argumenta masa madre no puede cerrar la vitrina con bebidas industriales.

**La sección de historia.** El usuario dijo «creo que está demasiado texto». Medido tenía 85
palabras y una mancha de tinta del 5,5 %, cuando un muro de texto de verdad ronda el 12-20 %:
en volumen era de las zonas más escuetas. La impresión era correcta y la causa era otra.
**La fotografía llevaba todo ese tiempo estirándose al doble de alto del que debía,** porque
el tamaño que traía el archivo mandaba sobre la proporción que pedían los estilos. Medía
casi trescientos píxeles más que la columna de texto y dejaba un hueco grande encima y
debajo: **ese vacío alrededor era lo que hacía parecer el texto abundante.** Corregido solo
eso, sin tocar una palabra, se acortó un 34 %. Lo segundo sí era texto, pero por repetir:
se recortó a 64 palabras sin perder información, porque uno de los principios recuperó la
frase que se quitó del párrafo.

---

## 3. Decisiones tomadas, con su motivo

Lo que conviene no deshacer sin leer antes por qué se hizo así.

- **Nada de parallax ni animación ligada al desplazamiento,** y un solo movimiento en bucle
  en todo el sitio. El motivo es técnico: el fondo de papel es una capa fija que el navegador
  recompone en cada scroll, y sumarle más es el camino a que vaya a saltos.
- **Las tarjetas del catálogo entran todas igual.** Son nueve a la vez: la variedad va en el
  orden en que aparecen, no en el movimiento de cada una.
- **Los enlaces de la barra superior no se mueven al pasar el cursor,** solo les crece un
  subrayado: la barra está sobre la fotografía, y mover texto sobre un fondo que cambia
  empeora la legibilidad.
- **Los elementos empiezan ocultos solo si el JavaScript lo dice, nunca desde los estilos.**
  Si estuviera en los estilos, un fallo del JavaScript los dejaría invisibles para siempre;
  por eso el hero se ve aunque el JavaScript no cargue.
- **El pedido sigue saliendo por WhatsApp, y no puede ser de otro modo.** El sitio es
  estático: no hay servidor ni pasarela. La canasta organiza el pedido, no lo cobra.
- **La tarjeta de local no lleva botones de WhatsApp ni de llamada,** aunque las guías los
  recomiendan: ya están en el pie y en el botón flotante, y repetirlos sería la misma
  duplicación que se acababa de retirar.
- **La columna de texto de historia es más estrecha que el bloque de principios, y se deja
  así:** a lo ancho de la rejilla el párrafo pasaría de ochenta caracteres por línea, por
  encima de lo que se lee cómodo. Y la mascota va más grande de lo previsto y dentro de un
  círculo, porque por debajo de cierto tamaño deja de leerse.
- **El contacto general de WhatsApp quedó solo en el pie,** al retirar el de la barra y
  convertir el flotante en canasta. Es coherente con quitar duplicados, pero quien quiera
  **preguntar** algo mirando el catálogo tiene que bajar hasta el final. Si molesta, no se
  trata de devolver el botón sino de decidir dónde vive la consulta.

---

## 4. Lecciones de método

Errores de medición ya cometidos una vez, escritos para no repetirlos.

- **Sumar el peso de todas las fotos que nombra la página da un número falso,** porque
  cuenta todas las versiones de cada foto y el navegador descarga una sola.
- **Un fondo de color claro baja el contraste del texto que lleva encima, y a ojo no se
  nota:** dos versiones de la etiqueta de horario fallaron la norma por poco.
- **Que no se puedan leer las reglas de estilo desde el navegador no significa que estén
  rotas.** Dos veces se dio por roto algo que funcionaba; la comprobación válida era
  preguntar si la regla encuentra el elemento.
- **Un gesto de dos o tres píxeles no se percibe, y dos tonos parecidos no se leen como
  estados distintos.** El usuario avisó dos veces de que «no se nota nada» cuando el
  mecanismo funcionaba: el problema era la magnitud, no el código.
- **Cuando un bloque se siente vacío, a veces el problema no es cuánto espacio hay sino cómo
  está repartido el contenido dentro.** El pie se recortó dos veces y seguía sobrando sitio,
  porque el hueco había pasado de vertical a horizontal; reordenarlo a una fila lo acortó
  un 36 %.
- **Cualquier animación que mueva algo hacia los lados necesita que su sección lo recorte,**
  o acaba siendo una barra de desplazamiento en alguna anchura de pantalla.
- **Un error de ejecución en el JavaScript se lleva la página entera por delante, y
  comprobar que compila no lo detecta.** Hay que probarlo cargando la página.

---

## 5. Cómo se midió, y qué no se ha probado

Los números vienen de medir, no de leer código: la página se renderizó a varias anchuras,
se calculó el contraste de cada par de color (incluido el muestreo píxel a píxel sobre las
fotografías), se comprobó que todas las imágenes responden, y se pidió al navegador el peso
real de cada archivo y el tamaño de cada botón.

**Lo que no se ha hecho, y conviene saberlo:**

- Ningún lector de pantalla real: lo que este archivo dice sobre ellos se deduce de cómo está
  construido el sitio, no de haberlo escuchado. Tampoco ningún dispositivo físico, ninguna
  pantalla táctil, ningún móvil en horizontal, ni pantallas muy estrechas.
- Ningún navegador que no sea Chrome, ninguna conexión lenta, ninguna herramienta de las que
  puntúan el rendimiento, y ninguna comprobación de cómo indexa el buscador.
- **Ningún dato de negocio verificado con nadie:** ni teléfono, ni dirección, ni horarios,
  ni precios, ni catálogo. Lo que se marca como dato de relleno se deduce de su forma, por
  ejemplo un número que es todo ceros. Puede haber datos que parezcan correctos y no lo
  sean, y esta auditoría no los detectaría.

---

## 6. Archivos relacionados

- [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md): el recorrido del sitio sin ratón,
  tecla por tecla. No busca fallos, explica cómo se maneja; sirve para la demostración.
- [CORREO_REAL.md](CORREO_REAL.md): cómo conectar el envío de correo.
- [README.md](README.md): cómo está repartido el proyecto y qué está simulado.
