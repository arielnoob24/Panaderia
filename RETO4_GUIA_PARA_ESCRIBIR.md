# Reto 4 · Guía para escribir el informe

Hecha el 2026-10-04. **Yo no escribo el informe: esta guía te dice qué escribir, dónde está el dato y cómo saber si lo que escribiste está bien.**

---

## Parte 0. Lo que el enunciado pide, línea por línea

Esta es la tabla que hay que tener al lado mientras escribes. La columna de la izquierda es **literal del enunciado**; la de la derecha, dónde tienes el material.

> ⚠️ **Corrección importante del 2026-10-04.** Antes te dije que el enunciado te daba a elegir entre "análisis de las heurísticas" **o** "un cuadro". **Era un error mío:** esa "o" del PDF no es la conjunción, es el símbolo de viñeta del segundo nivel. Hay que hacer **las dos cosas**. Lo mismo pasa con los cuatro principios WCAG y con las tres partes del modelo mental: son sub-puntos obligatorios, no alternativas.

### Entregable 1 — Las 10 heurísticas de Nielsen *(criterio: 5 pts)*

| Lo que pide, literal | Dónde está | Estado |
|---|---|---|
| "Análisis de las 10 Heurísticas de Nielsen" | [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §4, §5 y §11: 15 violaciones con severidad, 14 cerradas | ✅ |
| "Presentar un cuadro donde explique cómo su prototipo aplica las heurísticas" | [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §3 y §9 | ✅ |

### Entregable 2 — Los cuatro principios WCAG 2.2 *(criterio: 5 pts)*

El enunciado no dice solo "los cuatro principios": para cada uno dice **qué quiere ver**. Asegúrate de que tu apartado contesta esas palabras exactas.

| Principio | Lo que pide, literal | Lo que tienes que enseñar | Dónde |
|---|---|---|---|
| **Perceptibilidad** | *"Alternativas textuales para iconos y contrastes conceptuales"* | Los 21 SVG con `aria-hidden` + `focusable="false"`; los botones-dibujo con `aria-label`; el QR con su texto equivalente. Y los 17 pares de contraste medidos, más el `h1` sobre la foto | [RETO4_02_ACCESIBILIDAD.md](RETO4_02_ACCESIBILIDAD.md) §2 |
| **Operabilidad** | *"El diseño debe ser navegable mediante teclado (foco visible)"* | El recorrido completo del pedido sin ratón, las 38 paradas, y el anillo doble de foco. **Enseña el foco visible con una captura** | [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md) entero |
| **Comprensibilidad** | *"Mensajes de ayuda claros y lenguaje sencillo"* | La tabla de "en el sitio / lo que diría un sitio genérico". Los mensajes que dicen qué falta, no "formato inválido" | [RETO4_02_ACCESIBILIDAD.md](RETO4_02_ACCESIBILIDAD.md) §2 y [RETO4_CUESTIONARIO_TECNICO.md](RETO4_CUESTIONARIO_TECNICO.md) §4 |
| **Robustez** | *"Estructura que permita la interpretación correcta por tecnologías asistidas (Ej. lectores de pantalla en imágenes)"* | Los landmarks, los 30 encabezados sin saltos, los 2 diálogos ARIA. **Y el ejemplo que el profesor nombra: las imágenes.** 22 con `alt`, 0 sin él, con textos descriptivos | [RETO4_02_ACCESIBILIDAD.md](RETO4_02_ACCESIBILIDAD.md) §2 |

**Ojo al paréntesis de Robustez:** el profesor pone como ejemplo *"lectores de pantalla en imágenes"*. Eso es una pista de lo que va a mirar. Dedícale una fila propia a los textos alternativos, con un ejemplo real del tuyo, y **pruébalo con Narrador** (Parte 1D).

### Entregable 3 — El modelo mental *(criterio: 5 pts)*

| Lo que pide, literal | Lo que tienes que entregar | Dónde |
|---|---|---|
| *"Flujo de navegación: Diagrama de estados que muestre el camino del usuario"* | **Un diagrama dibujado.** Tres máquinas con cada transición verificada | [RETO4_03_INTERACCION.md](RETO4_03_INTERACCION.md) §2 |
| *"Secuencia de tareas: Pasos lógicos para completar un objetivo (ej. una compra o un registro)"* | Los 12 pasos del pedido, más los clics contados: 5 / 13 / 7 | [RETO4_03_INTERACCION.md](RETO4_03_INTERACCION.md) §3 |
| *"Respuesta del sistema: Qué feedback recibe el usuario tras cada interacción (microinteracciones)"* | La tabla de 18 microinteracciones por acción y por canal | [RETO4_CUESTIONARIO_TECNICO.md](RETO4_CUESTIONARIO_TECNICO.md) §3 |

El enunciado dice *"ej. una compra o un registro"*: tú tienes **la compra completa**, que es la más larga. Úsala.

### Entregable 4 — Las conclusiones *(criterio: 5 pts)*

| Lo que pide, literal | Dónde |
|---|---|
| *"Al menos cinco, sobre el uso coherente de los principios de usabilidad, arquitecturas cognitivas, diseño de la interacción"* | Siete ángulos en [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §6. **Elige cinco y escríbelas tú** |

Fíjate en los tres temas que nombra: **usabilidad**, **arquitecturas cognitivas** y **diseño de la interacción**. Lo más seguro es que tus cinco conclusiones cubran los tres, no cinco variaciones del mismo.

### Y el prototipo de baja fidelidad

| Lo que pide, literal | Estado |
|---|---|
| *"El estudiante diseñará el prototipo de baja fidelidad de un sistema informático, integrando obligatoriamente un análisis heurístico previo y una matriz de cumplimiento de accesibilidad"* | ⚠️ **Sin resolver.** Tu prototipo es de alta fidelidad. Parte 1A |

---

## Parte 0 bis. Cómo sacar los 5 puntos de cada criterio

Los criterios de evaluación no son los mismos que los entregables. Esto es lo que cada uno premia:

| Criterio | 5 puntos se dan por | Lo que lo sube | Lo que lo hunde |
|---|---|---|---|
| **Heurísticas de Nielsen**: *"Aplicación documentada de las 10 heurísticas con ejemplos del prototipo"* | Que cada heurística tenga un **ejemplo concreto y verificable**, no una definición | Las violaciones con severidad justificada. Una evaluación que no encuentra nada parece no hecha | Celdas que valen para cualquier web ("el sistema es intuitivo") |
| **Accesibilidad**: *"Cumplimiento de los principios: percepción, operabilidad, comprensión y robustez"* | Que esté **evidenciado funcionalmente**, con la columna "cómo lo compruebas" | Los números medidos y los dos casos en detalle (el mapa y el arreglo que no servía) | Definir los principios en vez de demostrarlos |
| **Diseño de interacción**: *"Claridad del flujo de tareas, eficiencia en la navegación y coherencia funcional"* | Las **tres** cosas: flujo claro (el diagrama), eficiencia (los clics) y coherencia (§5 del entregable 3) | Contar los clics de verdad. La coherencia es la que todos olvidan | Entregar el diagrama y dar por hecho lo demás |
| **Conclusiones** | Cinco, cada una con afirmación + evidencia + consecuencia | Que se note que son sobre **tu** proyecto | Una sola mal escrita penaliza **los 5 puntos** |

Y las restas: **−2 por cada error** de usabilidad, de interfaz o de interacción que encuentre. Por eso el inventario de violaciones de [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §5 es tu mejor defensa: lo que documentaste tú ya no es un error suyo.

---

## Parte 0 ter. ¿Está listo?

| Criterio | Puntos | ¿Puedes escribirlo ya? | Su archivo |
|---|---|---|---|
| 1. Las 10 heurísticas de Nielsen | 5 | ✅ **Sí, del todo** | [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) |
| 2. Principios de accesibilidad | 5 | ✅ **Sí, del todo.** Las cuatro mediciones que faltaban están hechas | [RETO4_02_ACCESIBILIDAD.md](RETO4_02_ACCESIBILIDAD.md) |
| 3. Diseño de interacción | 5 | ✅ **Sí**, con una cosa manual: el diagrama. Los clics ya están contados | [RETO4_03_INTERACCION.md](RETO4_03_INTERACCION.md) |
| 4. Las cinco conclusiones | 5 | ✅ **Sí.** Siete ángulos propuestos; elegir y escribir es tuyo | [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §6 |

**Los cuatro criterios están listos para escribir.** Actualizado el 2026-10-04, después de medir en Chrome lo que faltaba.

Lo único que queda sin hacer y que no es escribir: **dibujar el diagrama de estados** ([RETO4_03_INTERACCION.md](RETO4_03_INTERACCION.md) §2) y preguntarle al profesor lo del prototipo de baja fidelidad (Parte 1A).

**Empieza por el criterio 1**, que es el más largo.

### Lo de las heurísticas, en concreto

Esto es lo que tienes y que nadie más de tu clase va a tener:

- Las 10 heurísticas con un ejemplo real de tu prototipo cada una, con archivo y línea
- **15 violaciones** encontradas y verificadas sobre el código, con severidad propuesta
- **14 de las 15 arregladas**, con el antes y el después
- 38 comprobaciones automáticas que demuestran que los arreglos funcionan
- Un veredicto por heurística: las 10 cumplen, con dos reservas que conviene declarar

---

## Parte 1. Cuatro decisiones, antes de escribir una sola palabra

Si empiezas a escribir sin resolver estas, reescribes después.

### A. El enunciado pide un prototipo de **baja** fidelidad y el tuyo es de alta

Esto no lo puedo decidir yo y cambia el informe entero.

**Qué hacer:** pregúntale al profesor. Literalmente: *"Profesor, el reto pide un prototipo de baja fidelidad. Yo tengo el sitio ya funcionando. ¿Entrego el sitio, o necesito además los wireframes de baja fidelidad?"*

Es una pregunta de treinta segundos que te puede salvar 2 puntos o más. Las tres salidas posibles están en [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §1.1.

> **Escribe aquí su respuesta:** `__________`

### B. El teléfono de relleno: ¿lo declaras o lo cambias?

`+593 99 000 0000` aparece en todo el sitio. Ya le puse una nota en el pie que dice que es de ejemplo, así que **la severidad baja de 3 a 1**. Pero si tienes un número real que quieras usar, mejor.

> **Decide:** ⬜ dejo la nota · ⬜ pongo un número real

### C. ¿Aceptas mis severidades?

En [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §5 hay una tabla con una severidad propuesta por violación. **Son mi propuesta, no la verdad.** Lo que se califica es que justifiques cada una con los tres factores (frecuencia, impacto, persistencia).

Revisa al menos las cuatro de severidad 3 y decide si estás de acuerdo. Si cambias alguna, mejor: demuestra que pensaste.

> **Cambios que haces:** `__________`

### D. Las mediciones: cuatro hechas, una te queda

Las tres que te había dejado pendientes **ya están medidas**, en el Chrome que tienes instalado, en siete escenarios y dos tamaños de pantalla. Resultados en [RETO4_02_ACCESIBILIDAD.md](RETO4_02_ACCESIBILIDAD.md) §1 y §7.

| Qué | Resultado |
|---|---|
| Objetivos táctiles de 24×24 (2.5.8) | **Cumple** en los 7 escenarios: 6 controles pequeños, todos exentos por la excepción de espaciado |
| Contraste del `h1` sobre la foto | **11,13** el titular, **3,82** el `<em>`. Los dos pasan |
| Foco tapado por la cabecera (2.4.11) | **Cumple**, y también a nivel AAA — pero hubo que arreglar dos cosas que no sabía que estaban mal |

| **Zoom al 200 %** (1.4.4) y reflujo (1.4.10) | **Cumple.** Sin desplazamiento horizontal a ningún nivel, ni siquiera a 320 px CSS. Detalle en [RETO4_02_ACCESIBILIDAD.md](RETO4_02_ACCESIBILIDAD.md) §5 |

Lo mismo con los clics del pedido: **contados**, 5 / 13 / 7 según el camino ([RETO4_03_INTERACCION.md](RETO4_03_INTERACCION.md) §3.1).

**Sobre tu captura del zoom al 200 %:** lo que viste —la cabecera tapando el texto del hero— es el comportamiento normal de una cabecera fija al desplazar la página, no un incumplimiento: el contenido sigue siendo alcanzable. Y la nota que aparecía decía *"Pan redondo · Sale a las 17:00"*, que es el **texto viejo**: estabas viendo una versión cacheada. Fuerza la recarga con `Ctrl + F5`.

**Lo único que te queda**, y son diez minutos:

| # | Qué | Cómo | Tiempo |
|---|---|---|---|
| 1 | **Lector de pantalla** | Narrador (`Ctrl + Win + Enter`) o NVDA. Diez minutos recorriendo el sitio, anotando qué sonó raro | 10 min |

> **Resultado:** `______`

**No te la saltes.** El enunciado nombra expresamente los lectores de pantalla en el principio de Robustez (*"Ej. lectores de pantalla en imágenes"*), así que es lo que más probabilidades tiene de que te pregunten.

---

## Parte 2. Las reglas que te quitan puntos

Léelas antes de escribir, no después.

### Regla 1: máximo 5 % de texto de IA

El enunciado: *"Permitido el 5% máximo de texto generado por la IA. Si se supera este porcentaje, se calificará sobre la mitad del puntaje."*

**Qué significa en la práctica:**

| ✅ Puedes usar | ❌ No puedes usar |
|---|---|
| Los **datos** de mis archivos (números, rutas, recuentos, ratios de contraste) | Mis **párrafos**, tal cual o reordenados |
| Los **fragmentos de código** del proyecto (los escribió el proyecto, no la IA) | Mis explicaciones de por qué el código es así |
| Las **tablas de datos** (contrastes, recuentos, inventario) | Mis frases de análisis |
| La **estructura** de secciones que propongo | Mis conclusiones |

Un dato no es texto: "12.41 de contraste" es un hecho medido. Una frase sobre ese dato sí es texto, y esa la escribes tú.

**La prueba del algodón:** lee en voz alta una frase que hayas escrito. Si no suena a cómo hablas tú, reescríbela.

### Regla 2: cada error que encuentre el profesor son −2

Por eso el inventario de violaciones es tu mejor arma. **Un problema que tú documentaste no es un error suyo, es un hallazgo tuyo.** Y si además lo arreglaste, mejor.

No esconder nada. Si algo quedó sin arreglar (V16, los objetivos táctiles), **dilo tú primero** y di por qué.

### Regla 3: las conclusiones son 5 puntos y se pierden enteros

El enunciado: *"Enviar una sola conclusión que no esté escrita como una conclusión o que no tenga relación al trabajo entregado, serán penalizados los 5 puntos."*

Una conclusión **no** es:
- Un resumen de lo que hiciste ("Se aplicaron las 10 heurísticas…")
- Una descripción de una función ("El sitio tiene un mapa accesible")
- Una frase general sobre diseño ("La usabilidad es importante")

Una conclusión **sí** es: algo que aprendiste, que puedes defender, y que se apoya en algo concreto de tu proyecto.

---

## Parte 3. El informe, sección por sección

Esta es la estructura que propongo. Cada apartado dice **qué tiene que probar**, **qué escribir**, **cuánto** y **de dónde sacas los datos**.

Total estimado: **12–16 páginas** con las tablas y el diagrama.

---

### Sección 1 · Portada e introducción

**Qué tiene que probar:** que el lector sepa qué está evaluando antes de leer la evaluación.

**Qué escribir:**
- Nombre del sistema, qué hace, para quién
- Qué tecnología es (sin stack, HTML/CSS/JS, estático)
- En qué fecha y sobre qué versión se evaluó

**Cuánto:** media página.

**Datos:** [RETO4_CUESTIONARIO_TECNICO.md](RETO4_CUESTIONARIO_TECNICO.md) §1.

**Cómo sabes que está bien:** alguien que no conoce el proyecto entiende, en un párrafo, qué es y en qué se puede usar.

---

### Sección 2 · Método de la evaluación heurística

**Qué tiene que probar:** que sabes **qué es** una evaluación heurística y que la hiciste siguiendo un método, no mirando la pantalla y opinando.

**Qué escribir, en este orden:**

1. Qué son las 10 heurísticas de Nielsen y para qué sirven (dos o tres frases, con tus palabras)
2. Qué es la escala de severidad 0–4 y qué tres factores la determinan
3. Sobre qué se evaluó: todas las pantallas, la fecha, el navegador
4. **Las dos limitaciones del estudio** (esto es lo importante, ver abajo)

**Las dos limitaciones que tienes que declarar:**

| Limitación | Por qué declararla te suma |
|---|---|
| **Un solo evaluador.** Nielsen recomienda de 3 a 5, porque uno solo encuentra alrededor del 35 % de los problemas | Si no lo dices, parece que no sabes el método. Si lo dices, demuestras que sí |
| **Evalué mi propio diseño.** Hay sesgo, y es inevitable en un trabajo individual | Nombrar el sesgo es parte del método |

**Cuánto:** una página.

**Datos:** [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §2 y §7.

**Cómo sabes que está bien:** el apartado explica el método **antes** de dar resultados, y admite sus límites.

---

### Sección 3 · Cuadro de aplicación de las 10 heurísticas

**Qué tiene que probar:** que cada heurística tiene un ejemplo **concreto y verificable** de tu prototipo. Esto es lo que el enunciado pide literalmente.

**Qué escribir:** una tabla de 10 filas. Tres columnas:

| Heurística | Cómo la aplica el prototipo | Dónde se ve |
|---|---|---|
| H1. Visibilidad del estado del sistema | *(tu frase)* | *(elemento concreto + archivo:línea)* |

**La anatomía de una buena celda del medio.** Tres partes, en este orden:

1. **El elemento concreto.** No "el sistema", sino "el indicador de horario del pie".
2. **Qué hace exactamente.** No "informa al usuario", sino "se calcula contra la hora real y muestra *Cerrado · abre 08:00*".
3. **Por qué eso cumple la heurística.** No "por eso es visible", sino qué pregunta del usuario responde.

Compara las dos formas:

- ❌ *"El sistema mantiene informado al usuario en todo momento mediante elementos visuales adecuados."* → no dice nada verificable
- ✅ *El indicador del pie calcula el horario contra la hora real y dice si está abierto y hasta cuándo, porque la pregunta del usuario no es "¿está abierto?" sino "¿me da tiempo a ir?"* → nombra el elemento, dice qué hace, dice por qué

**Cuánto:** una o dos páginas (es una tabla).

**Datos:** [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §3 tiene la mejor prueba de cada heurística ya elegida. El [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §3 tiene la lista larga por si quieres otro ejemplo.

**Cómo sabes que está bien:** cada celda nombra algo que se puede abrir y comprobar. Si una celda vale para cualquier sitio web, está mal.

---

### Sección 4 · Inventario de violaciones

**Qué tiene que probar:** que la evaluación encontró problemas. **Una evaluación que no encuentra nada se lee como una que no se hizo.**

**Qué escribir:** la tabla de [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §5, ordenada por severidad, con una columna más: tu justificación de la severidad.

| # | Violación | Heurística | Severidad | Por qué esa severidad |
|---|---|---|---|---|
| V1 | … | H1, H3 | 3 | *(frecuencia + impacto + persistencia)* |

**Cómo justificar una severidad.** Tres frases cortas, una por factor. Para V1 (la fila que se movía sola), por ejemplo, los hechos son: le pasa a todo el mundo porque es lo primero de la página; pierdes de vista el producto que estabas mirando; y no se aprende a esquivarlo. Esos son los hechos — **las frases las escribes tú**.

**Cuánto:** una página de tabla, más la justificación.

**Cómo sabes que está bien:** las severidades no son todas iguales. Si pusiste 2 en las quince, no clasificaste nada.

---

### Sección 5 · Las violaciones mayores, en detalle

**Qué tiene que probar:** profundidad. Que no solo listaste problemas, los entendiste.

**Qué escribir:** media página por cada una de las cuatro de severidad 3 (V1, V2, V3, V4). Cinco partes:

1. **Qué pasa.** La descripción, sin adornos.
2. **A quién le pasa y cuándo.** El caso concreto.
3. **Qué heurística viola y por qué.** Y si además viola un criterio WCAG, cítalo con número y nombre.
4. **Por qué esa severidad.**
5. **Qué se hizo.**

**Cuánto:** dos páginas las cuatro.

**Datos:** [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §4 (el detalle de cada una) y §11 (lo que se hizo).

**Cómo sabes que está bien:** cada una se lee como un caso cerrado: problema, diagnóstico, arreglo.

---

### Sección 6 · Qué se corrigió

**Qué tiene que probar:** que la evaluación sirvió para algo. Es la diferencia entre un informe y un trámite.

**Qué escribir:**
- La tabla de §11 de [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md): 14 cerradas, 1 pendiente
- La tabla de veredictos antes/ahora
- **Lo que quedó sin arreglar y por qué** (V16, y la reserva de V3)

**Y un párrafo que vale más que la tabla.** Hay un patrón en lo que se arregló: **tres de las violaciones eran cosas que el proyecto ya hacía bien en otro sitio.** El botón de copiar existía para el número de cuenta bancaria pero no para el número de pedido. El `fieldset` con `legend` estaba en los grupos del panel. El horario del pie se calculaba de verdad mientras la nota del hero fingía calcularse.

Eso no es casualidad y da para un párrafo tuyo sobre consistencia interna. Pregúntate: *¿por qué se me escapó aplicar en un sitio lo que ya había resuelto en otro?* La respuesta a eso es análisis de verdad.

**Cuánto:** una página y media.

---

### Sección 7 · Matriz de cumplimiento de accesibilidad *(criterio 2)*

**Qué tiene que probar:** los cuatro principios WCAG 2.2 **evidenciados funcionalmente**, no definidos.

**Qué escribir:** una matriz con cinco columnas. La cuarta es la que distingue un informe bueno:

| Principio | Criterio (nº y nombre) | Qué hace el sitio | **Cómo lo compruebas** | Resultado |
|---|---|---|---|---|

Esa cuarta columna convierte una tabla de definiciones en una matriz de **cumplimiento**. Ejemplos de qué poner ahí: *"tabular desde el inicio sin tocar el ratón"*, *"con el cuentagotas de DevTools"*, *"con el snippet de la consola"*.

**La matriz ya está construida**, con 25 filas y las cuatro columnas rellenas: [RETO4_02_ACCESIBILIDAD.md](RETO4_02_ACCESIBILIDAD.md) §2. Cubre los cuatro principios e incluye los cuatro criterios nuevos de WCAG 2.2 (2.4.11, 2.5.8, 2.5.7 y 3.3.8). Lo que escribes tú es el párrafo de entrada —sobre qué versión, con qué herramienta, en qué escenarios— y el de cierre con lo que no se midió.

**Tus dos mejores materiales aquí**, los dos en [RETO4_02_ACCESIBILIDAD.md](RETO4_02_ACCESIBILIDAD.md):

1. **El mapa de reparto** (§4). Era imposible de usar sin ratón y eso bloqueaba el pedido a domicilio entero. No se arregló añadiendo un atributo: hubo que **inventar una interacción que no existía**. Y esa interacción también sirve a quien usa el teléfono.
2. **El arreglo que no servía de nada** (§3). Había puesto `scroll-margin-top` bajo `:focus-visible` para que la cabecera fija no tapara el foco. Al medirlo, no funcionaba: el navegador calcula el desplazamiento cuando la pseudoclase todavía no casa. Y al arreglarlo apareció un segundo tapador que no había visto, el botón flotante. **Una regla CSS que parece correcta puede no hacer nada, y solo medir el resultado lo dice.**

**Cuánto:** dos o tres páginas.

**Cómo sabes que está bien:** un profesor podría coger tu matriz, hacer lo que dice la columna "cómo lo compruebas", y obtener el mismo resultado.

---

### Sección 8 · Modelo mental *(criterio 3)*

Tres partes, y el enunciado las nombra una por una.

Todo el material está en **[RETO4_03_INTERACCION.md](RETO4_03_INTERACCION.md)**.

#### 8.1 Flujo de navegación — **el diagrama de estados**

**Es lo único del informe que no se escribe: se dibuja.**

Ya no partes de cero. En §2.1 están las tres máquinas con **cada transición verificada contra el código**, y en §2.2 el código en Mermaid, que se convierte en diagrama pegándolo en mermaid.live.

**Mi recomendación: redibújalo tú**, usando §2.1 como especificación y el Mermaid solo para comprobar que no te falta ninguna flecha. No es por la regla del 5 % —un diagrama no es texto—, es porque el criterio se llama "claridad del flujo": un diagrama que colocaste tú se lee mejor que uno autogenerado, y si te preguntan por una flecha, la sabrás. La lista de lo que no debe faltar está en §2.3.

#### 8.2 Secuencia de tareas

**Los clics ya están contados**, conduciendo la interfaz de verdad en Chrome: **5** el camino de retiro con efectivo, **13 + 76 teclas** el de domicilio con tarjeta, **7** el de transferencia. Los tres llegan al comprobante con su número. Desglose en §3.1.

Lo que escribes tú es el párrafo de eficiencia: **por qué son 5 clics y no 8** (§3.2). La respuesta corta es que retiro y efectivo vienen marcados por defecto porque son el caso frecuente, y eso ahorra dos clics que nadie da.

Un detalle de método que conviene declarar: conté como clic **enfocar un campo de texto**. Sin contarlo, el camino B son 8 clics. Di qué criterio usaste.

#### 8.3 Respuesta del sistema (microinteracciones)

La tabla de 18 filas, por acción y por canal, está en [RETO4_CUESTIONARIO_TECNICO.md](RETO4_CUESTIONARIO_TECNICO.md) §3. El argumento que la acompaña está en [RETO4_03_INTERACCION.md](RETO4_03_INTERACCION.md) §4: el feedback va por **tres canales a la vez** y cada uno sirve a alguien distinto.

Y un párrafo tuyo sobre **una** de las tres microinteracciones de §4, con su pregunta ya planteada.

#### 8.4 Coherencia funcional

Es el tercer trozo del criterio y el que más se olvida. §5 de [RETO4_03_INTERACCION.md](RETO4_03_INTERACCION.md), con el argumento fuerte: dos de las violaciones de la evaluación heurística eran **fallos de coherencia interna** — el proyecto ya hacía lo correcto en un sitio y no lo había aplicado en otro.

**Cuánto:** de 4 a 5 páginas con el diagrama a página completa.

---

### Sección 9 · Las cinco conclusiones *(criterio 4)*

**Esta es la que más cuidado necesita y la única donde no te puedo ayudar nada.**

**Qué tiene que probar:** que aprendiste algo diseñando esto, sobre usabilidad, arquitecturas cognitivas y diseño de la interacción.

**La anatomía de una conclusión.** Tres partes, y si falta una no es una conclusión:

1. **La afirmación.** Algo que sostienes, no algo que hiciste.
2. **La evidencia.** Qué de tu proyecto lo demuestra.
3. **Qué se sigue de ahí.** Para qué sirve saber eso.

Compara:

- ❌ *"Se logró que el sitio fuera accesible por teclado."* → es un resumen de tarea, no una conclusión
- ❌ *"La accesibilidad es fundamental en el diseño web moderno."* → es una generalidad; vale para cualquier trabajo
- ✅ Afirmación: hacer accesible el mapa obligó a cambiar el modelo de interacción, no a añadir un atributo. Evidencia: hubo que inventar "marcar el centro", una acción que antes no existía. Y lo que se sigue: tratar la accesibilidad como una capa final no funciona cuando el problema es la interacción misma.

Los siete ángulos posibles están en [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §6. **Elige cinco, no los uses todos**, y no copies los títulos: son nombres de conclusión, no conclusiones.

**Cuánto:** un párrafo de 80 a 120 palabras por conclusión. Página y media las cinco.

**Cómo sabes que está bien:** tapa el resto del informe y lee solo la conclusión. ¿Se entiende? ¿Dice algo que no sea obvio? ¿Se nota que es sobre **tu** proyecto y no sobre cualquiera?

---

### Sección 10 · Anexos

**Qué poner:**
- Las capturas de pantalla
- La tabla completa de los 17 pares de contraste
- El inventario de accesibilidad medido (recuentos de ARIA, etiquetas, campos)
- El diagrama de estados a tamaño grande

**Datos:** [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §7 y [RETO4_CUESTIONARIO_TECNICO.md](RETO4_CUESTIONARIO_TECNICO.md) §4.

---

## Parte 4. Cómo escribir para que no suene a IA

No es solo por la regla del 5 %: es que un texto que suena a IA se lee peor.

### Palabras y giros que te delatan

| No escribas | Escribe |
|---|---|
| "Es importante destacar que…" | directamente lo que destacas |
| "En el mundo actual del diseño…" | nada, empieza por el hecho |
| "robusto", "intuitivo", "amigable", "óptimo" | qué hace exactamente |
| "permite al usuario visualizar" | "muestra" |
| "se implementó una solución que…" | "puse", "cambié", "quité" |
| "cabe mencionar", "en este sentido", "por otro lado" | el conector que usarías hablando |
| "mejora significativamente la experiencia" | qué mejora, para quién, y cómo lo sabes |

### Tres hábitos que hacen que suene tuyo

1. **Escribe en primera persona cuando hablas de decisiones.** "Decidí quitar el campo de contraseña" es tuyo. "Se decidió eliminar el campo" es de nadie.
2. **Usa números.** "12.41 de contraste", "38 paradas de tabulación", "14 de 15 violaciones". Un dato concreto hace que todo el párrafo suene medido.
3. **Admite lo que no sabes.** "No pude medir los objetivos táctiles porque hace falta un navegador" suena a persona. Un informe sin ninguna duda suena a máquina.

### La prueba de las tres preguntas

Para cada párrafo que escribas:

1. ¿Nombra algo concreto de **mi** proyecto? (si vale para cualquier web, fuera)
2. ¿Podría defenderlo si me preguntan "¿por qué?"
3. ¿Suena a cómo hablo yo? (léelo en voz alta)

---

## Parte 5. El orden en que hacerlo

No escribas de arriba abajo. Este orden:

| Paso | Qué | Tiempo |
|---|---|---|
| 1 | **Pregúntale al profesor** lo del prototipo de baja fidelidad (Parte 1A) | 1 día de espera |
| 2 | **Prueba con lector de pantalla** (Parte 1D). Es la única medición que queda, y el enunciado la nombra en Robustez | 10 min |
| 3 | **Dibuja el diagrama de estados** (Sección 8.1). Hazlo pronto: dibujarlo te obliga a entender el flujo, y eso te ayuda a escribir todo lo demás | 1–2 h |
| 4 | ~~Contar los clics~~ — ya están contados (§3.1 del entregable 3) | — |
| 5 | **Escribe las secciones 3 y 4** (el cuadro y el inventario). Son tablas: es lo más mecánico y te mete en materia | 2–3 h |
| 6 | **Escribe las secciones 5 y 6** (las mayores en detalle y lo corregido) | 2 h |
| 7 | **Monta la matriz de accesibilidad** (sección 7) | 2 h |
| 8 | **Escribe las secciones 8.2 y 8.3** | 1 h |
| 9 | **Escribe el método** (sección 2). Ahora, no antes: ya sabes qué hiciste | 1 h |
| 10 | **Escribe las conclusiones** (sección 9). Las últimas, siempre | 2 h |
| 11 | **Escribe la introducción** (sección 1). Lo último de todo | 30 min |
| 12 | **Relee con la prueba de las tres preguntas** (Parte 4) | 1 h |

**Por qué el método y la introducción al final:** se escriben mejor cuando ya sabes qué contienen. Escribirlos primero es la forma más rápida de tener que reescribirlos.

---

## Parte 6. Lista de comprobación antes de entregar

Marca cada casilla. Si alguna queda vacía, no entregues todavía.

**Contenido obligatorio — contrastado con el enunciado, línea por línea**

Entregable 1:
- ⬜ **Análisis** de las 10 heurísticas (el inventario de violaciones con severidad justificada)
- ⬜ **Cuadro** donde explico cómo mi prototipo aplica las heurísticas — *son las dos cosas, no una*

Entregable 2, y cada principio con lo que el enunciado pide de él:
- ⬜ **Perceptibilidad**: alternativas textuales para iconos **y** contrastes
- ⬜ **Operabilidad**: navegable con teclado, **con el foco visible enseñado en una captura**
- ⬜ **Comprensibilidad**: mensajes de ayuda claros y lenguaje sencillo
- ⬜ **Robustez**: estructura para tecnologías asistidas, **con el ejemplo de las imágenes que nombra el profesor**

Entregable 3:
- ⬜ **Diagrama de estados** dibujado, con el camino del usuario
- ⬜ **Secuencia de tareas** de un objetivo completo (la compra), con los clics
- ⬜ **Respuesta del sistema**: la tabla de microinteracciones

Entregable 4:
- ⬜ **Cinco** conclusiones, cada una con afirmación + evidencia + consecuencia
- ⬜ Entre las cinco se tocan los tres temas que nombra: usabilidad, arquitecturas cognitivas y diseño de la interacción

**Lo que te quita puntos si falta**

- ⬜ Declaré que soy un solo evaluador y que evalué mi propio diseño
- ⬜ Dije qué quedó sin arreglar (V16) y por qué
- ⬜ Dije que V3 (el foco tapado) quedó **medido y corregido**, no solo "aplicado"
- ⬜ Probé con lector de pantalla y lo escribí (el enunciado lo nombra en Robustez)
- ⬜ Resolví lo del prototipo de baja fidelidad
- ⬜ Declaré en el método del criterio 2 con qué se midió: Chrome, 7 escenarios, 2 tamaños de pantalla

**Lo del 5 %**

- ⬜ Ningún párrafo de mis archivos está copiado
- ⬜ Leí el informe en voz alta y suena a mí
- ⬜ Pasé cada párrafo por las tres preguntas
- ⬜ No aparece ninguna de las palabras de la tabla de la Parte 4

**Formato**

- ⬜ PDF
- ⬜ Las tablas caben en la página y se leen
- ⬜ Las capturas se leen
- ⬜ Mi nombre está en la portada

---

## Parte 7. Cuándo pedirme algo

**Pídeme:**
- Que organice el criterio 4 (las conclusiones) en su propio archivo, si lo quieres aparte
- Datos que no tengas: un recuento, una línea de código, un ratio
- Que mida cualquier cosa en el navegador: ya está montado y puedo conducir tu Chrome
- Que **revise** lo que escribiste: te digo si contradice al código, si está flojo o si suena a IA
- Que arregle V16 si la medición te sale mal
- Que te haga el guion de la demostración en vivo con teclado, con las preguntas probables

**No me pidas** (porque te costaría la mitad de la nota):
- Que escriba las conclusiones
- Que redacte un apartado
- Que "mejore la redacción" de un párrafo tuyo — si lo reescribo yo, ya es mío

La diferencia: **puedo decirte que un párrafo está flojo y por qué. Si lo arreglo yo, deja de ser tuyo.**
