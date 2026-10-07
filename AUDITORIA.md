# Auditoría del sitio: El Tradicional

Reúne las auditorías que antes estaban sueltas: general, estética y animaciones,
accesibilidad, responsive, rendimiento, SEO y contenido.

**Rondas originales:** 22 al 24 de septiembre de 2026.
**Revisado contra el sitio actual:** 6 de octubre de 2026.

Las rondas originales se hicieron sobre un sitio de tres archivos con nueve productos
escritos a mano. Desde entonces se rehízo entero (catálogo en un archivo de datos, módulos,
canasta, pago simulado y cuenta), así que muchos hallazgos viejos dejaron de aplicar.
Lo de abajo está comprobado contra el sitio de hoy.

---

## 1. Lo que sigue abierto

### Alto

- **Los datos estructurados publican un teléfono inventado como verificado.** El pie avisa
  de que es de ejemplo, pero el buscador lo lee sin ese aviso y lo pondría en la ficha del
  negocio.
- **Dos enlaces abren otra ventana sin avisarlo:** el botón flotante y el «Pedir» de reserva
  que sale si el JavaScript no carga. El resto del sitio sí lo avisa al lector de pantalla.

### Medio

- **No hay `robots.txt` ni mapa del sitio**, así que no hay forma de avisar al buscador de
  que algo cambió.
- **Falta declarar el menú como dato estructurado.** Es lo que haría salir los productos y
  sus precios en resultados como «pan de queso Tena».
- **La imagen para compartir el enlace no declara su tamaño**, y algunas redes la recortan
  mal.
- **Los precios no dicen la unidad:** por pieza, por funda o por docena.

### Bajo

- Ni el título ni la descripción mencionan Tena, la palabra que más visitas locales traería.
- El enlace «Ver en el mapa» del pie mide unos 18 px de alto, menos de los 24 que pide la
  norma para el dedo. Basta con darle margen.
- Antes del pie hay 17 paradas de tabulación (una por producto). No es un fallo, porque
  existe «Saltar al contenido», pero un segundo atajo ayudaría.
- Falta decidir si se destaca algún producto más grande. Está sin hacer a propósito: primero
  hay que elegir cuál.

---

## 2. Lo que ya está arreglado

Se conserva como registro, para no repetir los errores.

- **Abrir sin servidor.** Con doble clic la página salía en blanco, porque el navegador
  bloquea los módulos y la lectura del catálogo en `file://`. Ahora carga una versión en un
  solo archivo con el catálogo dentro. El año del pie, que seguía en 2024, ya dice 2026.
- **Buscadores.** La dirección canónica apuntaba a un dominio de ejemplo inexistente, lo que
  podía dejar el sitio fuera de Google. Ya apunta a GitHub Pages.
- **Peso: de 945 KB a 333 KB (−65 %).** Las fotos se pedían al doble del tamaño mostrado y
  la mascota era enorme. Ahora cada pantalla pide su tamaño. No hay fuentes ni librerías
  descargadas al inicio.
- **Fotos propias.** El catálogo dependía de un servicio externo; ahora las fotos están en el
  repositorio y se ven sin internet. Antes había cuatro fotos para once espacios y una
  devolvía error.
- **Paleta: de 27 colores sueltos a 5 con sus tonos.** El color de marca pasó de casi no
  aparecer a marcar todas las acciones principales.
- **Forma y movimiento.** Había seis esquinas redondeadas en toda la hoja y una sola animación
  para todo. Ahora cada zona tiene su movimiento: la foto de historia se descubre como un
  corte de pan y los principios entran en orden.
- **Contraste.** Todos los pares cumplen la norma, medidos también sobre las fotos con el peor
  píxel de la zona. Así apareció un rótulo del hero que fallaba.
- **Teclado.** Los paneles atrapan el foco, Escape los cierra y el foco vuelve a su botón. La
  fila de productos se detiene cuando el foco entra.
- **Responsive.** Se quitó una barra de desplazamiento horizontal en tabletas y una barra de
  categorías que escondía dos opciones en el móvil.
- **Canasta.** Antes cada botón abría WhatsApp con un solo producto. Ahora se acumula con
  cantidades, sobrevive a recargar y termina en un pedido con comprobante.
- **Textos y datos.** Se quitó «Audio-PhoneComputer» de la dirección. El aviso «Sale a las
  17:00» era fijo y ahora depende del horario real. «Disponible» salía en todos los productos
  sin que nadie lo decidiera.
- **Historia.** Parecía tener demasiado texto, pero solo eran 85 palabras. La causa era la
  foto, que se estiraba al doble de alto y dejaba huecos. Corregirla acortó la sección un
  34 %, y el texto se recortó a 64 palabras.

---

## 3. Decisiones tomadas, con su motivo

Antes de deshacer cualquiera de estas, conviene leer por qué se tomó.

- **Sin parallax y con un solo movimiento en bucle.** El fondo de papel es una capa fija que
  se recompone en cada scroll; sumarle más lo vuelve entrecortado.
- **Las fichas del catálogo entran todas con la misma animación.** La variedad está en el
  orden en que aparecen.
- **Los enlaces de la barra no se mueven al pasar el cursor.** Mover texto sobre una foto
  empeora la lectura.
- **Lo oculto se oculta desde JavaScript, nunca desde el CSS.** Si el JavaScript falla, todo
  sigue visible.
- **El pago es simulado.** El sitio es estático, sin servidor ni pasarela de pago.
- **El WhatsApp general solo está en el pie.** Se quitó de la barra y el botón flotante pasó
  a ser la canasta. Si hace falta preguntar desde el catálogo, hay que decidir dónde va, no
  volver a duplicarlo.
- **La columna de texto de historia es más estrecha que los principios.** Más ancha pasaría
  de 80 caracteres por línea.

---

## 4. Lecciones de método

- Sumar todas las fotos que nombra la página da un peso falso: el navegador descarga una
  versión de cada una.
- Un fondo claro baja el contraste del texto de encima, y a ojo no se nota.
- Que el navegador no deje leer una regla de estilo no significa que esté rota.
- Un cambio de 2 o 3 píxeles, o dos tonos parecidos, no se perciben. Dos veces «no se nota»
  fue un problema de magnitud, no de código.
- Si un bloque se ve vacío, a veces lo que falla es cómo se reparte el contenido. El pie se
  acortó un 36 % reordenándolo en una fila.
- Toda animación lateral necesita que su sección la recorte, o crea scroll horizontal.
- Un error de ejecución en JavaScript tumba la página entera y compilar no lo detecta. Hay
  que cargarla de verdad.

---

## 5. Cómo se midió, y qué no se ha probado

Se midió, no se dedujo del código: la página se renderizó a varias anchuras, se calculó el
contraste de cada par (también píxel a píxel sobre las fotos), se comprobó que todas las
imágenes cargan y se midió el peso real y el tamaño de cada botón.

**No se ha probado:**

- Ningún lector de pantalla real ni dispositivo físico (táctil, móvil en horizontal,
  pantallas muy estrechas).
- Ninguna conexión lenta, herramienta de puntuación de rendimiento ni indexación real.
- **Ningún dato del negocio verificado** (teléfono, dirección, horario, precios). El relleno
  se detecta por su forma, como un número todo en ceros; un dato falso que parezca real no
  se detectaría.

---

## 6. Archivos relacionados

- [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md): cómo se maneja el sitio sin ratón,
  tecla por tecla.
- [README.md](README.md): cómo está repartido el proyecto y qué está simulado.
- [EXPLICACION_DEL_CODIGO.md](EXPLICACION_DEL_CODIGO.md): el código explicado archivo por
  archivo.
