# Reto 4 · Entregable 1 — Las 10 heurísticas de Nielsen

5 de los 20 puntos. Criterio literal: *"Aplicación documentada de las 10 heurísticas de usabilidad con ejemplos del prototipo."*

Materia prima, no texto para entregar. Los bloques `> ESCRIBE TÚ` son tuyos; márcalos con `<!-- LISTO PARA REVISAR -->` cuando quieras que los mire.

---

## 1. El enunciado te da a elegir, y conviene saber qué eliges

Literal: *"Análisis de las 10 Heurísticas de Nielsen **o** Presentar un cuadro donde explique cómo su prototipo aplica las heurísticas."*

Son dos cosas distintas y la "o" es una trampa de esfuerzo:

| Opción | Qué es | Qué arriesga |
|---|---|---|
| **Cuadro de aplicación** | Diez filas: heurística → cómo la cumple mi prototipo | Más barato. Pero un cuadro donde las diez filas dicen "lo cumplo" se lee como un cuadro que no se verificó |
| **Análisis heurístico** | El método de Nielsen: recorrer la interfaz buscando **violaciones**, clasificarlas por severidad y proponer arreglo | Más trabajo. Pero es lo que la palabra "análisis" significa, y encaja con cómo te califican |

**Mi recomendación: las dos, en ese orden.** El cuadro cumple la letra del enunciado; el inventario de violaciones es lo que convence. Y hay una razón de nota, no de pureza metodológica:

> *"Por cada error de usabilidad encontrado son 2 puntos menos."*

Si el profesor encuentra un problema que tú ya documentaste con su severidad y su arreglo, deja de ser un error suyo y pasa a ser un hallazgo tuyo. **Encontrarlos primero es la jugada.** De eso va la §4 de este archivo: tengo 16 para ti.

> **DECIDE TÚ:** ¿cuadro, análisis, o los dos?
>
> `<!-- -->`

---

## 2. La escala de severidad, para que puedas clasificar

Nielsen la define en cinco grados y la severidad **no es el gusto del evaluador**: sale de cruzar tres factores.

| Grado | Significado |
|---|---|
| 0 | No estoy de acuerdo en que sea un problema |
| 1 | **Cosmético.** Se arregla si sobra tiempo |
| 2 | **Menor.** Baja prioridad |
| 3 | **Mayor.** Alta prioridad, hay que arreglarlo |
| 4 | **Catástrofe.** Imperativo arreglarlo antes de publicar |

Los tres factores que la determinan:

- **Frecuencia** — ¿le pasa a todo el mundo o a un caso raro?
- **Impacto** — ¿cuesta un segundo superarlo o bloquea la tarea?
- **Persistencia** — ¿se aprende a esquivar una vez, o molesta cada vez?

Esto importa porque en el informe **tienes que justificar cada severidad con esos tres factores**. Una tabla de severidades sin justificar vale lo mismo que ninguna. En §4 te propongo una severidad por hallazgo, pero es mi propuesta: la tuya puede ser otra y lo que se califica es el argumento.

---

## 3. Los cumplimientos: ya están reunidos

No los duplico aquí. La evidencia de las diez, con referencias a archivo y línea, está en **[RETO4_CUADERNO.md](RETO4_CUADERNO.md) §3**. De ahí sale el cuadro de aplicación.

Resumen de cuál sostiene mejor cada heurística, para que sepas dónde apoyarte:

| # | Heurística | Tu mejor prueba |
|---|---|---|
| H1 | Visibilidad del estado del sistema | El horario se calcula contra la hora real: "Cerrado · abre 08:00" |
| H2 | Correspondencia con el mundo real | El `−` **se convierte en papelera** cuando queda una unidad: la metáfora cambia con lo que la acción significa |
| H3 | Control y libertad del usuario | El botón "atrás" del navegador funciona en las vistas de categoría (`pushState` + `popstate`) |
| H4 | Consistencia y estándares | Un solo anillo de foco en todo el sitio; los dos paneles siguen el mismo patrón ARIA |
| H5 | Prevención de errores | El número no se corrige mientras escribes, porque corregirlo al vuelo impide teclear un 12 |
| H6 | Reconocer antes que recordar | La cuenta precarga la dirección **solo si está vacía**: lo que escribiste manda |
| H7 | Flexibilidad y eficiencia | Escribir "20" en vez de pulsar `+` veinte veces |
| H8 | Diseño estético y minimalista | El `−` no existe hasta que hay algo pedido |
| H9 | Recuperarse de los errores | "Revisa el correo, algo le falta" en vez de "formato inválido" |
| H10 | Ayuda y documentación | El cuadrito sale inmediato con teclado y a los 500 ms con ratón |

---

## 4. Las violaciones. Dieciséis, verificadas sobre el código

Esto es lo que le faltaba al cuaderno. Cada una la comprobé en el código o en el HTML; donde no pude, lo digo.

### Severidad 3 — mayores

#### V1 · La fila del mostrador se mueve sola y no hay cómo pararla
**Heurísticas: H1, H3 · WCAG 2.2.2 (nivel A)**

Avanza una ficha cada 4,2 s, indefinidamente, en paralelo con el resto del contenido. Se detiene con el ratón encima, con el dedo, o si el foco entra en ella, y respeta `prefers-reduced-motion`. Pero **no hay ningún control visible de pausa**: `productGrid.andarSola = { arrancar, parar }` existe en [script.js:407](script.js#L407) y nada en la interfaz lo llama.

- Frecuencia: todo el mundo, es lo primero que se ve. Impacto: pierdes el producto que estabas mirando. Persistencia: no se aprende a esquivar.
- Nivel A es el escalón más bajo de WCAG: el que no se perdona.

#### V2 · El comprobante no se puede guardar, y al cerrar desaparece
**Heurísticas: H3, H6**

El paso final da un número de pedido (`ET-0000`) y dos botones: "Avisar por WhatsApp" y "Cerrar". No hay copiar, ni imprimir, ni descargar. Y cerrar **vacía la canasta**: si no apuntaste el número a mano, se fue.

Lo curioso es que el botón de copiar **ya existe en el proyecto**: `.pago-copiar` copia el número de cuenta bancaria ([script.js:1042](script.js#L1042)). El patrón está construido y no se aplicó donde más falta.

- Frecuencia: todo pedido acaba ahí. Impacto: pierdes el comprobante de tu compra. Persistencia: total.

#### V3 · El foco puede quedar tapado por la cabecera fija
**Heurística: H1 · WCAG 2.4.11 (nivel AA, nuevo en 2.2)**

La cabecera es `position: fixed` y mide ~96 px ([styles.css:69](styles.css#L69)). Hay `scroll-margin-top` en las secciones con `id` ([styles.css:57](styles.css#L57)), que arregla el salto de los enlaces internos pero **no protege al elemento que recibe el foco al tabular**.

⚠️ **No lo pude confirmar: hace falta un navegador.** Baja media página, pulsa `Shift+Tab` varias veces y mira si algún elemento enfocado se mete bajo la barra. Si no pasa, baja esta violación a severidad 0 y dilo.

#### V4 · El teléfono y el WhatsApp son marcadores de posición
**Heurísticas: H1, H2**

`+593 99 000 0000` en el pie, en la navegación y en los 15 enlaces de pedido. Ya estaba como hallazgo crítico C1 en [AUDITORIA_CONTENIDO_CONVERSION.md](AUDITORIA_CONTENIDO_CONVERSION.md) y sigue vivo.

- Severidad 3 si se presenta como sitio real. **Baja a 1 si lo declaras** como dato ficticio de la maqueta, igual que ya haces con el QR y con los datos bancarios. Esa decisión es tuya y es exactamente el tipo de criterio que se evalúa.

### Severidad 2 — menores

#### V5 · El rótulo "Los más pedidos" no describe lo que hay debajo
**Heurística: H2**

El rótulo de la fila dice *"Los más pedidos"* ([script.js:331](script.js#L331)), pero en la portada la fila contiene **los 18 productos**, no una selección. No hay ningún dato de ventas detrás: es el catálogo entero puesto de lado.

- Es el caso más limpio de violación de H2 que tienes: un rótulo que afirma algo que el sistema no sabe.

#### V6 · La nota del hero finge ser un dato en vivo
**Heurísticas: H1, H4**

*"Recién salido del horno — Pan redondo · Sale a las 17:00"*, con un punto de estado (`.status-dot`) al lado. Es **texto fijo en el HTML**: a las nueve de la mañana y a las ocho de la noche dice lo mismo.

Lo que lo convierte en violación de H4 además de H1: el horario del pie **sí** se calcula contra la hora real. Dos indicadores con la misma pinta, uno verdadero y otro decorativo. El usuario no tiene cómo saber cuál es cuál.

#### V7 · El grupo de tamaños no dice que es un grupo de tamaños
**Heurística: H6 · WCAG 1.3.1 (nivel A)**

Los tamaños viven en un `<div class="card-tamanos">` ([styles.css:275](styles.css#L275)) sin `fieldset`, sin `legend`, sin `role="radiogroup"` y sin `aria-label`. Con lector de pantalla se oye *"500 ml, botón de radio, 1 de 3"* y nada dice que eso sea un tamaño.

- Interesante para el informe: los grupos **del panel de la canasta** sí llevan `fieldset` + `legend` ("¿Cómo lo quieres?", "¿Cómo quieres pagar?"). El patrón correcto está en el proyecto y no se aplicó en las fichas. Eso es una violación de H4 también.

#### V8 · Quitar un producto no se puede deshacer
**Heurística: H3**

La papelera borra la línea al instante. Se anuncia (*"Pan redondo quitado. 2 productos en la canasta"*) pero no hay deshacer, ni confirmación, ni papelera de la papelera. Si tenías 30 unidades y pulsas, se van las 30.

- Nielsen es explícito en H3: las acciones destructivas necesitan una salida de emergencia. No hay ninguna en todo el sitio.

#### V9 · El campo de contraseña no comprueba nada
**Heurísticas: H5, H8**

El panel lo declara en pantalla: *"Maqueta académica. Sin servidor no hay contraseña que comprobar: entra cualquiera."* Declararlo te cubre de ocultarlo, y es más honrado que inventar un "correo o contraseña incorrectos".

Pero deja viva la pregunta: **si no comprueba nada, ¿por qué pedirlo?** Un campo que invita a escribir una contraseña real y la descarta es exceso de interfaz (H8) y una invitación al error (H5).

- Tiene defensa en las dos direcciones. Lo que no tiene defensa es que te lo pregunten y no lo hayas pensado.

#### V10 · No hay forma de ver todo el catálogo ordenado
**Heurísticas: H7, H6**

Ordenar y filtrar solo existen **dentro** de una categoría ([script.js:437](script.js#L437) y siguientes). El menú Tienda ofrece tres categorías y ninguna opción de "todos". Así que puedes ordenar los 7 panes por precio, pero no los 18 productos.

La portada sí muestra los 18 — en una fila horizontal, sin mandos de orden.

- Frecuencia: cualquiera que quiera lo más barato del local. Impacto: tiene que mirar tres categorías y comparar de memoria, que es justo lo que H6 dice que no se debe pedir.

#### V11 · Cuatro enlaces abren pestaña nueva sin avisarlo
**Heurística: H1 · WCAG 3.2.5 / técnica G201**

Con JavaScript funcionando quedan 4: los tres del pie y el "Avisar por WhatsApp" del comprobante. La flecha `↗` lo dice visualmente; no hay nada que lo diga a un lector de pantalla.

### Severidad 1 — cosméticas

#### V12 · Salir de la cuenta aterriza en "Crear cuenta"
**Heurística: H3**

`.cuenta-salir` hace `verPaso('crear')`. Acabas de cerrar tu sesión y lo que se te ofrece es registrar una cuenta nueva, no volver a entrar en la que ya tienes.

#### V13 · El tope de 100 recorta en silencio
**Heurística: H9**

Escribe 500 en el campo de cantidad y al salir se queda en 100. El aviso dice *"100 de Pan redondo"* — no dice que se recortó ni por qué. El cuadrito de ayuda sí avisa del tope *antes* (*"Escribe cuántos quieres, hasta 100"*), lo que atenúa pero no corrige: quien no vio el cuadrito solo ve que el sistema le cambió el número.

#### V14 · Un par de color falla AA por 0,01
**WCAG 1.4.3 (nivel AA)**

El `small` de "Gratis" / "Desde $1.00" en las opciones de entrega: `--horno-claro` sobre `--masa` da **4,49** y AA exige 4,5. Texto de 0,72 rem, así que no se salva como texto grande. Arreglo: usar `--horno-suave`, que da 6,79 sobre el mismo fondo.

#### V15 · Una instrucción tapa un problema de descubribilidad
**Heurísticas: H10, H8**

El aviso visible bajo el encabezado del catálogo dice: *"18 productos, 3 agotados en el mostrador. Entra en Tienda para ver una categoría completa."*

Nielsen dice que lo mejor es que el sistema no necesite documentación. Esa frase es documentación: existe porque la fila no deja claro que hay más detrás. Es la ayuda haciendo de parche.

### Sin severidad asignada todavía

#### V16 · Objetivos táctiles por debajo de 24×24
**WCAG 2.5.8 (nivel AA, nuevo en 2.2)**

**Sin medir.** No lo puedo hacer yo: jsdom no calcula layout. El snippet está en [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §8.1 — dos minutos en la consola del navegador, tres veces (escritorio, teléfono, panel abierto).

> **MIDE TÚ:** escritorio `<!-- -->` · teléfono `<!-- -->` · panel `<!-- -->`

---

## 5. El inventario consolidado

Esta tabla es el centro del entregable. Ordénala por severidad, que es como se presenta una evaluación heurística.

| # | Violación | Heurísticas | WCAG | Sev. propuesta | Verificado |
|---|---|---|---|---|---|
| V1 | La fila se mueve sola sin control de pausa | H1, H3 | 2.2.2 (A) | 3 | ✅ código |
| V2 | El comprobante no se puede guardar y al cerrar desaparece | H3, H6 | — | 3 | ✅ código |
| V3 | El foco puede quedar tapado por la cabecera fija | H1 | 2.4.11 (AA) | 3 | ⚠️ falta navegador |
| V4 | Teléfono y WhatsApp son marcadores | H1, H2 | — | 3 ó 1 | ✅ HTML |
| V5 | "Los más pedidos" rotula los 18 productos | H2 | — | 2 | ✅ código |
| V6 | La nota del hero finge ser dato en vivo | H1, H4 | — | 2 | ✅ HTML |
| V7 | El grupo de tamaños no está rotulado | H6, H4 | 1.3.1 (A) | 2 | ✅ HTML |
| V8 | Quitar un producto no se puede deshacer | H3 | — | 2 | ✅ código |
| V9 | El campo de contraseña no comprueba nada | H5, H8 | — | 2 | ✅ código |
| V10 | No hay vista de todo el catálogo ordenable | H7, H6 | — | 2 | ✅ código |
| V11 | Cuatro enlaces abren pestaña nueva sin avisarlo | H1 | 3.2.5 | 2 | ✅ medido |
| V12 | Salir de la cuenta lleva a "Crear cuenta" | H3 | — | 1 | ✅ código |
| V13 | El tope de 100 recorta en silencio | H9 | — | 1 | ✅ código |
| V14 | Contraste 4,49 sobre 4,5 en un `small` | — | 1.4.3 (AA) | 1 | ✅ calculado |
| V15 | Una instrucción tapa un problema de descubribilidad | H10, H8 | — | 1 | ✅ HTML |
| V16 | Objetivos táctiles | — | 2.5.8 (AA) | ? | ❌ sin medir |

Las diez heurísticas tienen al menos una violación, lo que es buena señal de que el recorrido se hizo de verdad:

| H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 |
|---|---|---|---|---|---|---|---|---|---|
| V1 V3 V4 V6 V11 | V4 V5 | V1 V2 V8 V12 | V6 V7 | V9 V13 | V2 V7 V10 | V10 | V9 V15 | V13 | V15 |

> **DECIDE TÚ:** ¿aceptas mis severidades? Cambia las que quieras, pero justifica cada una con frecuencia, impacto y persistencia (§2).
>
> `<!-- -->`

---

## 6. La tabla cruzada: heurísticas × WCAG

Esto no lo pide el enunciado y es lo que más te puede distinguir. Seis de las dieciséis violaciones son **a la vez** problema de usabilidad y de accesibilidad: V1, V3, V7, V11, V14 y V16.

El argumento que sostiene: usabilidad y accesibilidad no son dos trabajos sobre el mismo sitio. V1 es la misma decisión mirada dos veces — un carrusel sin pausa molesta a cualquiera (H3) y excluye a quien necesita más tiempo (WCAG 2.2.2).

Y el caso al revés, que es tu mejor material: **el arreglo del mapa de reparto** ([ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md) §3) no fue añadir un atributo. Hubo que inventar una interacción que no existía — marcar el centro — y esa interacción **también** sirve a quien usa el teléfono y no quiere pelearse con el pulgar. Accesibilidad que mejora la usabilidad de todos.

> **ESCRIBE TÚ** (el argumento de la intersección, con dos o tres ejemplos de los seis):
> `<!-- -->`

---

## 7. Esqueleto del apartado, para que no te pierdas escribiendo

Propuesta de orden. Son títulos de sección, no contenido:

1. **Método.** Qué es una evaluación heurística, cuántos evaluadores, sobre qué versión del prototipo y en qué fecha. Dos párrafos.
2. **Cuadro de aplicación de las 10 heurísticas.** Diez filas, con el ejemplo concreto de §3 de este archivo.
3. **Inventario de violaciones**, ordenado por severidad, con la tabla de §5.
4. **Las violaciones mayores en detalle.** Una página por cada severidad 3 (V1 a V4): qué pasa, a quién, por qué esa severidad según los tres factores, y el arreglo propuesto.
5. **Intersección con WCAG.** La tabla cruzada de §6.
6. **Qué se arregló y qué queda.** Si arreglas alguna, va aquí con el antes y el después.

Dos avisos sobre el punto 1, porque es donde se cae la gente:

- Nielsen recomienda **de tres a cinco evaluadores**, porque uno solo encuentra alrededor del 35 % de los problemas. Tú eres uno. **Dilo** en el método como limitación del estudio: reconocer el límite vale más que fingir que no existe.
- Declara que evaluaste tu propio diseño. Es lo habitual en un trabajo individual, pero el sesgo existe y nombrarlo es parte del método.

> **ESCRIBE TÚ — método:**
> `<!-- -->`

---

## 8. Correcciones a datos que te di antes

Dos errores míos, encontrados verificando para este archivo. Los dos estaban en documentos que podrías haber citado.

### 8.1 La Powerade **no** es un callejón sin salida. Retira ese hallazgo

En [RETO4_ANALISIS_NOTA.md](RETO4_ANALISIS_NOTA.md) §3.3 escribí que la Powerade agotada deja tabular sus dos tamaños sin ofrecer botón. **Es falso.** Sus dos radios llevan `disabled` en el HTML, así que el tabulador no las toca. Las tres fichas agotadas tienen **cero** controles tabulables.

Mi volcado del orden de tabulación no excluía los elementos deshabilitados y las contó. Error de mi medición, no del sitio. Ese apartado ya está corregido en el archivo.

### 8.2 Las paradas de tabulación son ~36, no 44

Dos fallos acumulados en el mismo número:

- Contaba los dos radios deshabilitados de la Powerade.
- Contaba **cada radio como una parada**, y un navegador trata un grupo de radios con el mismo `name` como **una sola**: `Tab` entra en el que está marcado y las flechas se mueven por dentro.

Hay 11 radios en 5 grupos, así que 40 controles − 11 + 5 = 34, más las dos flechas de la fila que aparecen cuando hay algo que desplazar = **36**.

Si llegaste a citar el 44, cámbialo. Ya está corregido en los dos documentos.

---

## 9. Resumen: cómo se cumple cada heurística

Veredicto de las diez, con el motivo. Cruza los cumplimientos de §3 con las violaciones de §4, así que cada veredicto sale de evidencia verificada, no de impresión.

Tres grados: **cumple** (ninguna violación relevante), **cumple parcialmente** (la mecánica está, falla en casos concretos), **no cumple del todo** (las violaciones son el patrón, no la excepción).

### H1 · Visibilidad del estado del sistema → **cumple parcialmente**

**Por qué se cumple:** el sistema habla casi todo el tiempo. El horario no es un texto escrito a mano: se calcula contra la hora real y dice *"Abierto"*, *"Cerrado · abre 08:00"* o *"Cerrado · abre mañana"*. Hay siete regiones que anuncian cambios, dos de ellas para lector de pantalla, así que añadir un producto suena como *"Pan redondo añadido. 3 productos en la canasta"*. El botón flotante lleva el número encima. Entrar en una categoría escribe *"Mostrando 5 de 7 productos"*. Y la cabecera cambia de fondo al desplazarse, que es una forma de decir "ya no estás arriba".

**Por qué solo parcialmente:** en dos sitios el sistema **muestra un estado que no tiene**. La nota del hero (V6) dice *"Recién salido del horno · Sale a las 17:00"* con un punto de estado al lado, y es texto fijo: a las nueve de la mañana afirma lo mismo. Y cuatro enlaces abren una pestaña nueva sin anunciarlo (V11), que es un cambio de contexto del que no se avisa. Si además se confirma V3, hay un tercer caso: el elemento que recibe el foco puede quedar invisible bajo la cabecera.

### H2 · Correspondencia entre el sistema y el mundo real → **cumple, con una excepción**

**Por qué se cumple:** el vocabulario entero es de panadería y no de software. "Tu canasta" y no "carrito". "El mostrador" y "la vitrina" y no "productos destacados". "Paso retirando" y no "recogida en tienda". "Vuelve mañana" y no "sin stock". Y la mejor prueba no es una palabra sino un icono que cambia: el botón de quitar es un signo `−` mientras hay varias unidades y **se convierte en papelera** cuando queda una, porque ahí la acción ya no es restar, es borrar el producto. La metáfora sigue al significado.

**La excepción:** el rótulo de la fila dice *"Los más pedidos"* y debajo están los 18 productos del catálogo (V5). No hay ningún dato de ventas detrás. Es un rótulo que afirma algo que el sistema no sabe, y eso es exactamente lo contrario de esta heurística. A eso se suma el teléfono de relleno (V4) si no lo declaras.

### H3 · Control y libertad del usuario → **no cumple del todo. Es la más débil de las diez**

**Lo que sí hace:** cada paso del panel vuelve **al anterior**, no siempre al principio: "Volver a la canasta", "Volver a cómo lo recibes". `Esc` cierra cualquier panel y devuelve el foco a donde estaba. El botón "atrás" del navegador funciona en las vistas de categoría, porque cada una tiene su URL (`#tienda-panes`). `Esc` dentro del campo de cantidad recupera el valor anterior. Y cerrar a mitad del pago no deja nada atascado: se corta el temporizador, se borran los datos de la tarjeta y el pedido sigue entero.

**Por qué falla:** cuatro violaciones, y entre ellas la única del sitio que deja al usuario sin salida. **No hay deshacer en ninguna parte** (V8): la papelera borra la línea al instante, y si tenías 30 unidades se van las 30 sin confirmación. El comprobante desaparece al cerrar y no se puede guardar (V2), así que el final de la compra es irreversible y además no deja rastro. La fila se mueve sola y no hay cómo pararla (V1). Y salir de la cuenta te deja en "Crear cuenta" (V12).

Nielsen es explícito en esta heurística: las acciones destructivas necesitan una salida de emergencia. Aquí no hay ninguna. **Esta es la heurística que conviene reconocer como incumplida en el informe**: reconocer una bien argumentada vale más que afirmar diez a medias.

### H4 · Consistencia y estándares → **cumple hacia fuera, falla hacia dentro**

**Por qué se cumple:** los estándares externos se siguen. Los dos paneles usan el patrón modal de WAI-ARIA completo: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, foco contenido y devuelto. Hay **un solo** anillo de foco en todo el sitio. Todo el diseño sale de variables en `:root`: ocho colores con nombre, radios, duraciones y curvas, sin valores sueltos. Los dos desplegables de la barra se comportan igual entre sí. Y los campos de la tarjeta y los de la cuenta siguen la misma regla: no se marcan en rojo hasta que los tocaste.

**Por qué falla hacia dentro:** las dos violaciones son casos donde **el proyecto hace lo correcto en un sitio y no en otro**. Los grupos de radio del panel llevan `fieldset` + `legend` ("¿Cómo lo quieres?", "¿Cómo quieres pagar?"), pero los grupos de tamaño de las fichas no llevan nada (V7). Y el horario del pie es un estado calculado mientras la nota del hero es decoración con la misma pinta (V6): dos indicadores idénticos a la vista, uno verdadero y otro no.

### H5 · Prevención de errores → **cumple**

**Por qué se cumple:** es de las mejor resueltas, y lo interesante es que hay dos tipos de prevención trabajando. Los que **impiden** el error: tope de 100 unidades, "Confirmar" deshabilitado con la canasta vacía, guarda que no deja pasar al pago sin dirección. Y los que lo **hacen difícil de cometer**: el `+593` fijo delante del campo, que se come el cero de quien escribe `09…` de memoria; la tarjeta de prueba escrita en pantalla; el número de pedido generado sin caracteres que se confundan al dictarlo por teléfono.

Hay dos decisiones especialmente finas. El campo de cantidad es `type="text"` con `inputmode="numeric"` **a propósito**, porque un `type="number"` trae sus flechitas y acepta signos y comas. Y el número **no se corrige mientras escribes**, porque corregirlo al vuelo impide teclear un 12: al pasar por el 1 ya sería válido y saltaría solo. Eso es prevenir un error que la propia prevención habría creado.

**La mancha:** el campo de contraseña que no comprueba nada (V9) invita a escribir una contraseña real en un campo que la descarta.

### H6 · Reconocimiento antes que recuerdo → **cumple parcialmente**

**Por qué se cumple:** la lista de requisitos de la contraseña está debajo del campo y **se repinta en cada tecla**, así que no hay que recordar qué pedía ni adivinar qué falta. El precio va junto al botón de pedir, no en una lista aparte. El desglose subtotal / envío / total se escribe cuando ya se sabe cómo se recibe el pedido. El título de la pestaña cambia con la vista. Y la mejor: con sesión abierta la dirección se precarga **solo si el campo está vacío**, así que lo que tú escribiste manda sobre lo guardado — precargar sin pisar.

**Por qué solo parcialmente:** tres violaciones piden memoria. El número de pedido hay que **apuntarlo a mano** porque no se puede copiar ni guardar (V2), que es el caso de libro de esta heurística. El grupo de tamaños no dice que sea un grupo de tamaños, así que con lector de pantalla hay que deducirlo (V7). Y como no existe una vista de todo el catálogo ordenable, comparar precios entre categorías obliga a recordar lo que viste en la anterior (V10).

### H7 · Flexibilidad y eficiencia de uso → **cumple**

**Por qué se cumple:** casi cada tarea tiene camino largo para el que llega por primera vez y atajo para el que ya sabe. Veinte panes se piden escribiendo "20" o con `↑` repetido, no con veinte clics. El punto de entrega se marca moviendo el mapa o de golpe con "Usar mi ubicación". A una categoría se llega bajando o por el menú, y esa vista tiene URL propia, así que se puede guardar. El pedido sobrevive al cierre del navegador. La cuenta precarga la dirección. Y la fila se recorre con las flechas si usas ratón o tabulando si no, porque el navegador trae a la vista la ficha que recibe el foco.

Un detalle que cuenta aquí: Leaflet **solo se descarga si eliges domicilio**. Quien pasa a retirar no baja un mapa que no va a mirar.

**Lo que falta:** no se puede ordenar el catálogo completo (V10). Ordenar existe dentro de panes, dentro de dulces y dentro de bebidas, nunca sobre los 18.

### H8 · Diseño estético y minimalista → **cumple, con dos excesos**

**Por qué se cumple:** hay una regla detrás, y no es gusto: **lo que no hace falta todavía, no está**. El contador de cantidad nace solo con el `+`; el `−` y el número aparecen cuando ya hay algo pedido. Las flechas de la fila se esconden si no hay nada que desplazar y se deshabilitan al llegar a una punta. Ordenar y filtrar no existen en la portada, porque ordenar un escaparate de seis no le hace falta a nadie. No hay barra de filtros: la categoría es un estado de la página. Y una animación dominante por zona, no una por elemento.

**Los dos excesos:** un campo de contraseña que no comprueba nada es interfaz que no hace nada (V9). Y la frase *"Entra en Tienda para ver una categoría completa"* es texto que existe para tapar un problema (V15): si hay que explicarlo, no se explica solo.

### H9 · Ayudar a reconocer, diagnosticar y recuperarse de los errores → **cumple**

**Por qué se cumple:** los mensajes dicen **qué falta**, no que algo esté mal. *"Revisa el correo, algo le falta"* en vez de "formato inválido". *"Escribe la dirección para poder llevarlo"*, que da la consecuencia y no la regla. Hay cuatro regiones `role="alert"` y doce elementos con `aria-describedby` uniendo cada campo con su mensaje. Tras un error, **el foco va al primer campo que falta**, no a un resumen arriba.

Y dos casos de recuperación que van más allá del formulario: si el mapa no carga —sin red o con el CDN caído— no se rompe nada, queda la dirección escrita y se cobra la tarifa de salida, y la pantalla lo explica. Y el panel de entrar **admite que no puede comprobar ninguna contraseña** en vez de inventar un "correo o contraseña incorrectos", que sería diagnosticar un error que no ocurrió.

**La mancha:** escribe 500 en el campo de cantidad y se queda en 100 sin decir que se recortó ni por qué (V13).

### H10 · Ayuda y documentación → **cumple, pero con una señal de alarma**

**Por qué se cumple:** la ayuda llega sin estorbar. Los botones que son solo un dibujo explican lo que hacen en un cuadrito: medio segundo de espera con el ratón e **inmediato con teclado**, porque quien tabula hasta un botón ya decidió mirarlo. Hay instrucciones donde hacen falta (*"Marca a dónde va el pedido: toca el mapa, o muévelo con las flechas y pulsa Enter"*) y notas que anticipan el paso siguiente (*"Después eliges cómo lo recibes y cómo pagas"*). La naturaleza académica se declara **tres veces** a lo largo del pago, no en una letra pequeña.

**La señal de alarma:** Nielsen dice que lo ideal es que el sistema no necesite documentación. Dos de tus ayudas existen porque algo no se explica solo: la instrucción del catálogo (V15) y el `aria-label` que dicta las teclas del mapa. La segunda es inevitable —un mapa no puede anunciar sus teclas de otra forma—; la primera no.

### Cuadro de veredictos

| # | Heurística | Veredicto | Violaciones |
|---|---|---|---|
| H1 | Visibilidad del estado del sistema | cumple parcialmente | V6, V11, (V3) |
| H2 | Correspondencia con el mundo real | cumple, con una excepción | V5, V4 |
| H3 | Control y libertad del usuario | **no cumple del todo** | V1, V2, V8, V12 |
| H4 | Consistencia y estándares | cumple fuera, falla dentro | V6, V7 |
| H5 | Prevención de errores | cumple | V9 |
| H6 | Reconocimiento antes que recuerdo | cumple parcialmente | V2, V7, V10 |
| H7 | Flexibilidad y eficiencia de uso | cumple | V10 |
| H8 | Diseño estético y minimalista | cumple, con dos excesos | V9, V15 |
| H9 | Recuperarse de los errores | cumple | V13 |
| H10 | Ayuda y documentación | cumple, con una alarma | V15 |

Cuatro cumplen limpio (H5, H7, H9, H10), cinco cumplen con reservas, y una no cumple (H3).

---

## 10. Para cumplir las heurísticas que se quedan cortas

Dieciséis acciones. La columna que importa es la de "resuelve": **varias arreglan más de una heurística a la vez**, y por ahí conviene empezar.

### Para cumplir H3 (control y libertad del usuario) — la que más falta

| | Acción | Resuelve | Esfuerzo |
|---|---|---|---|
| A1 | **Botón visible de pausa en la fila.** `productGrid.andarSola = { arrancar, parar }` ya existe en [script.js:407](script.js#L407): falta el botón que lo llame y que alterne entre pausar y reanudar | H3, H1, WCAG 2.2.2 (A) | bajo |
| A2 | **Botón de copiar el número de pedido** en el comprobante. El patrón ya está construido: `.pago-copiar` copia el número de cuenta bancaria tres pasos antes | H3, H6 | bajo |
| A3 | **Deshacer al quitar.** Lo más barato: la región de avisos ya anuncia *"Pan redondo quitado"* — añadir ahí un "Deshacer" que reponga la cantidad anterior | H3 | medio |
| A4 | **Salir de la cuenta debe llevar a "Entrar"**, no a "Crear cuenta". Es cambiar `verPaso('crear')` por `verPaso('entrar')` | H3 | trivial |

A1 y A2 son las dos mejores de toda la lista: esfuerzo bajo, y las dos aprovechan código que ya existe. Eso además es un buen argumento para el informe — el arreglo no fue inventar nada, fue aplicar en un sitio lo que ya funcionaba en otro.

### Para cumplir H1 (visibilidad del estado del sistema)

| | Acción | Resuelve | Esfuerzo |
|---|---|---|---|
| A5 | **La nota del hero: o la haces real o le quitas el disfraz.** O calcula la próxima hornada como ya calculas el horario, o quítale el punto de estado y redáctala como lo que es (*"Horneamos a lo largo del día"*) | H1, H4 | bajo o trivial |
| A6 | **Avisar la pestaña nueva** en los 4 enlaces. Un `<span class="sr-only"> (abre en una pestaña nueva)</span>`; la clase ya existe | H1, WCAG 3.2.5 | trivial |
| A14 | **`scroll-margin-top` para el foco.** Si confirmas V3 en el navegador: una regla que dé al elemento enfocado el margen de la cabecera | H1, WCAG 2.4.11 (AA) | bajo |

A5 es una decisión, no una tarea: **la versión trivial (reescribir el texto) cumple igual que la versión completa.** Un texto honesto vale lo mismo que un dato real, y aquí es lo que la heurística pide.

### Para cumplir H6 (reconocimiento antes que recuerdo)

| | Acción | Resuelve | Esfuerzo |
|---|---|---|---|
| A2 | Copiar el número de pedido (arriba) | H3, H6 | bajo |
| A7 | **Rotular el grupo de tamaños.** `role="radiogroup"` + `aria-label="Tamaño"` en `.card-tamanos`, o un `fieldset` con `legend` visualmente oculto. El patrón correcto ya está en los grupos del panel | H6, H4, WCAG 1.3.1 (A) | bajo |
| A10 | **Vista de todo el catálogo ordenable**, o los mandos de orden en la portada | H6, H7 | medio |

### Para cumplir H4 (consistencia)

A7 y A5, las dos ya listadas. No hace falta nada más: las dos violaciones de H4 son las mismas que las de H6 y H1 mirándolas desde otro ángulo. **Eso es lo que hay que decir en el informe**, en vez de tratarlas como cuatro problemas distintos.

### Para cumplir H2 (correspondencia con el mundo real)

| | Acción | Resuelve | Esfuerzo |
|---|---|---|---|
| A8 | **Que el rótulo de la fila diga la verdad.** Dos salidas: renombrarlo (*"Nuestro mostrador"*, *"Todo lo que horneamos"*) o hacer que sea verdad limitando la fila a seis y marcando cuáles | H2 | trivial o medio |
| A9 | **Declarar el teléfono como ficticio**, igual que ya declaras el QR y los datos bancarios. O poner uno real | H2, H1 | trivial |

A8 por la vía del renombrado es el mejor cambio por esfuerzo de toda la lista: una cadena de texto, y una violación de severidad 2 desaparece.

### Para cumplir H8 (minimalista) y H5 (prevención)

| | Acción | Resuelve | Esfuerzo |
|---|---|---|---|
| A11 | **Decidir el campo de contraseña.** Tres salidas: quitarlo del paso de entrar y dejar solo el correo (coherente con que no se comprueba nada); dejarlo y explicar junto al campo por qué se pide; o convertirlo en texto informativo sin campo | H8, H5 | bajo |
| A13 | **Resolver la descubribilidad en vez de instruirla.** Si la fila no deja claro que hay más detrás, lo que falta es un afordance —un "ver todo" al final de la fila, por ejemplo— no una frase que lo explique | H8, H10, H6 | medio |

A11 es la más interesante del informe porque **no tiene respuesta correcta**. Quitar el campo es más honesto y más minimalista; dejarlo es más fiel a cómo se ve un inicio de sesión real, que es lo que un prototipo debería enseñar. Elige y defiende: esa defensa es justo lo que valen los 5 puntos de conclusiones.

### Para cumplir H9 (recuperarse de los errores)

| | Acción | Resuelve | Esfuerzo |
|---|---|---|---|
| A12 | **Explicar el recorte.** Cuando el tope muerda, que el aviso lo diga: *"El máximo es 100 por producto; se ajustó a 100"* en vez de *"100 de Pan redondo"* | H9 | trivial |

### Para cumplir H7 (flexibilidad)

A10, ya listada.

### Lo que no es de ninguna heurística pero está pendiente

| | Acción | Resuelve | Esfuerzo |
|---|---|---|---|
| A15 | Cambiar `--horno-claro` por `--horno-suave` en el `small` de las opciones de entrega: 4,49 → 6,79 | WCAG 1.4.3 (AA) | trivial |
| A16 | **Medir** los objetivos táctiles (§4, V16) | WCAG 2.5.8 (AA) | 2 minutos |

### Si solo vas a hacer cinco

Por puntos ganados contra esfuerzo: **A4** (trivial, cierra V12), **A8** (una cadena de texto, cierra V5), **A6** (cierra V11 y un criterio WCAG), **A2** (cierra V2, que es severidad 3, reutilizando código existente) y **A1** (cierra V1, el único nivel A de la lista).

Con esas cinco, H3 pasa de "no cumple" a "cumple parcialmente", H2 queda limpia, y desaparecen las dos violaciones de severidad 3 que se arreglan con código.

### Y el recordatorio de siempre

**Arreglar sin documentar no da ningún punto.** El orden que paga dos veces: documentas la violación con su severidad y su justificación, *después* la arreglas, y documentas el antes y el después. El mismo trabajo cuenta en el criterio de heurísticas y en el de accesibilidad.

Las secciones 9 y 10 son mi lectura del código, no tu informe: la explicación está aquí para que decidas y escribas, no para viajar tal cual.
