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
