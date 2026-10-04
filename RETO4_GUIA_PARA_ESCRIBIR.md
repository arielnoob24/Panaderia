# Reto 4 · Guía para escribir el informe

Hecha el 2026-10-04. **Yo no escribo el informe: esta guía te dice qué escribir, dónde está el dato y cómo saber si lo que escribiste está bien.**

---

## Parte 0. ¿Está listo? Qué sí y qué no

| Criterio | Puntos | ¿Puedes escribirlo ya? |
|---|---|---|
| 1. Las 10 heurísticas de Nielsen | 5 | ✅ **Sí, del todo.** Material completo en [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) |
| 2. Principios de accesibilidad | 5 | ⚠️ **Casi.** Los datos están, pero faltan 3 mediciones que solo puedes hacer tú (Parte 1, punto D) |
| 3. Diseño de interacción | 5 | ⚠️ **Casi.** Las máquinas de estados están, pero el **diagrama hay que dibujarlo** |
| 4. Las cinco conclusiones | 5 | ✅ **Sí.** Siete ángulos propuestos; elegir y escribir es tuyo |

**Empieza por el criterio 1.** Es el único que no depende de nada más, y es el más largo. Cuando lo tengas, pídeme que organice el criterio 2 en su propio archivo como hice con las heurísticas.

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

### D. Las tres mediciones que faltan

**Hazlas antes de escribir el criterio 2**, porque sin ellas ese apartado queda con agujeros.

| # | Qué medir | Cómo | Tiempo |
|---|---|---|---|
| 1 | Objetivos táctiles de 24×24 px | El snippet de [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §8.1, en la consola del navegador (`F12`). Tres veces: a 1440 px, a 390 px y con la canasta abierta | 5 min |
| 2 | Contraste del `h1` sobre la foto | DevTools: inspecciona el `h1`, pasa el ratón por el valor de `color`, te da el ratio | 2 min |
| 3 | Si la cabecera fija tapa el foco | Baja media página y pulsa `Shift+Tab` seis o siete veces. Mira si algún elemento enfocado queda bajo la barra | 1 min |

> **Resultados:** 1) `______` 2) `______` 3) `______`

Y una cuarta que no es obligatoria pero vale mucho si te preguntan: **probar con lector de pantalla**. Windows trae Narrador (`Ctrl + Win + Enter`). Diez minutos recorriendo el sitio, y anota qué sonó raro.

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

**Cuántas filas:** de 12 a 16, tres o cuatro por principio. Los criterios que puedes citar están listados por principio en [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §4.

**Datos:** [RETO4_CUESTIONARIO_TECNICO.md](RETO4_CUESTIONARIO_TECNICO.md) §4 (todo medido y verificado) y [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md) para la operabilidad.

**Tu mejor material aquí:** el mapa de reparto. Era imposible de usar sin ratón y eso bloqueaba el pedido a domicilio entero. **No se arregló añadiendo un atributo: hubo que inventar una interacción que no existía** (marcar el centro del mapa). Es un fallo encontrado, diagnosticado y arreglado, no una casilla marcada.

**Cuánto:** dos o tres páginas.

**Cómo sabes que está bien:** un profesor podría coger tu matriz, hacer lo que dice la columna "cómo lo compruebas", y obtener el mismo resultado.

---

### Sección 8 · Modelo mental *(criterio 3)*

Tres partes, y el enunciado las nombra una por una.

#### 8.1 Flujo de navegación — **el diagrama de estados**

**Esto hay que dibujarlo.** Es lo único del informe que no se puede escribir.

Tienes tres máquinas de estados reales, con sus estados y transiciones, en [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §5.1. Dibújalas con lo que sepas usar: draw.io, Figma, PowerPoint, o a mano y escaneado.

Lo que **no** debe faltar en el diagrama:
- Los estados como cajas, con su nombre
- Las transiciones como flechas, **con el nombre del botón que las dispara**
- La **guarda** entre entrega y pago (sin dirección no pasa): se dibuja como un rombo o una flecha etiquetada
- Los puntos de vuelta atrás

#### 8.2 Secuencia de tareas

**Qué escribir:** los pasos del pedido completo, y **el número de clics mínimos, contado de verdad**.

Los 12 pasos están en [RETO4_CUESTIONARIO_TECNICO.md](RETO4_CUESTIONARIO_TECNICO.md) §2. **Los clics los cuentas tú** recorriéndolo: una vez el camino corto (retiro + efectivo) y una vez el largo (domicilio + tarjeta).

> **Clics:** retiro+efectivo `___` · domicilio+tarjeta `___`

#### 8.3 Respuesta del sistema (microinteracciones)

**Qué escribir:** la tabla de [RETO4_CUESTIONARIO_TECNICO.md](RETO4_CUESTIONARIO_TECNICO.md) §3, que ya está por acción y por canal (visual, foco, anunciado).

Y un párrafo tuyo sobre **una** microinteracción, la que más te interese defender. Mi sugerencia: en el paso de pago el panel deja de ser una gaveta lateral y se planta en el centro con el resto desenfocado. Pregúntate qué comunica un cambio de **forma** del contenedor que no comunicaría un cambio de contenido dentro de la misma gaveta.

**Cuánto:** tres páginas con el diagrama.

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
| 2 | **Haz las tres mediciones** (Parte 1D) | 10 min |
| 3 | **Dibuja el diagrama de estados** (Sección 8.1). Hazlo pronto: dibujarlo te obliga a entender el flujo, y eso te ayuda a escribir todo lo demás | 1–2 h |
| 4 | **Cuenta los clics** del pedido, los dos caminos | 10 min |
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

**Contenido obligatorio**

- ⬜ Las 10 heurísticas, cada una con un ejemplo concreto y verificable
- ⬜ Inventario de violaciones con severidad **justificada**
- ⬜ Matriz de accesibilidad con los 4 principios
- ⬜ Diagrama de estados **dibujado**
- ⬜ Secuencia de tareas con los clics contados
- ⬜ Tabla de microinteracciones
- ⬜ **Cinco** conclusiones, cada una con afirmación + evidencia + consecuencia

**Lo que te quita puntos si falta**

- ⬜ Declaré que soy un solo evaluador y que evalué mi propio diseño
- ⬜ Dije qué quedó sin arreglar (V16) y por qué
- ⬜ Confirmé o descarté V3 en el navegador, y lo escribí
- ⬜ Hice las tres mediciones
- ⬜ Resolví lo del prototipo de baja fidelidad

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
- Que organice el criterio 2, 3 o 4 en su archivo, como hice con las heurísticas
- Datos que no tengas: un recuento, una línea de código, un ratio
- Que **revise** lo que escribiste: te digo si contradice al código, si está flojo o si suena a IA
- Que arregle V16 si la medición te sale mal
- Que te haga el guion de la demostración en vivo con teclado, con las preguntas probables

**No me pidas** (porque te costaría la mitad de la nota):
- Que escriba las conclusiones
- Que redacte un apartado
- Que "mejore la redacción" de un párrafo tuyo — si lo reescribo yo, ya es mío

La diferencia: **puedo decirte que un párrafo está flojo y por qué. Si lo arreglo yo, deja de ser tuyo.**
