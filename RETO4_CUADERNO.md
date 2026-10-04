# Reto 4 — cuaderno de trabajo

RDA1, Criterio 1. Enunciado: `RDA1 - Criterio 2 - Reto 4.pdf.md`. Abierto el 2026-10-04.

## Cómo se usa este archivo

**Aquí no hay texto para copiar, y es a propósito.** El enunciado penaliza con la mitad del puntaje pasar del 5 % de texto generado por IA, así que este cuaderno guarda **datos medidos, evidencia con referencia al archivo y línea, y preguntas sin contestar**. Todo está en forma de nota telegráfica, no de frase: si lo pegaras en el informe se vería lo que es.

El reparto de trabajo:

- **Yo pongo**: qué hay en el código, dónde está, los números medidos, los agujeros que encuentro, y preguntas que apuntan a lo que el profesor va a buscar.
- **Tú escribes**: todo lo que vaya al informe. Los bloques marcados `> ESCRIBE TÚ` son tuyos.
- **Yo reviso después**: cuando llenes un bloque, dime y te lo reviso — si contradice al código te lo digo, y si está flojo también.

Marca cada bloque con `<!-- LISTO PARA REVISAR -->` cuando quieras que lo mire.

---

## 0. Estado

| # | Entregable | Puntos | Materia prima | Tu texto |
|---|---|---|---|---|
| 1 | 10 heurísticas de Nielsen con ejemplos del prototipo | 5 | §3 lista | ⬜ |
| 2 | Los 4 principios WCAG 2.2 evidenciados funcionalmente | 5 | §4 lista | ⬜ |
| 3 | Modelo mental: flujo, secuencia de tareas, feedback | 5 | §5 lista | ⬜ |
| 4 | Cinco conclusiones | 5 | §6 ángulos | ⬜ |
| — | Prototipo de baja fidelidad | — | ⚠️ §1 | ⬜ |
| — | Arreglar los defectos de §2 antes de entregar | — | §2 | ⬜ |

---

## 1. Dos decisiones de encuadre, antes de escribir una línea

Esto hay que resolverlo primero porque cambia todo el informe, y ninguna de las dos la puedo decidir yo.

### 1.1 El enunciado pide un prototipo de **baja fidelidad**. Tú tienes un sitio terminado.

Literal: *"diseñará el prototipo de baja fidelidad de un sistema informático"*. Lo que tienes es alta fidelidad y funcional: 3.167 líneas entre `script.js` (2.299) y `styles.css` (868), pago simulado, mapa con cálculo de distancia, cuentas en `localStorage`.

Esto puede ser una ventaja o un error de entrega de 2 puntos, según cómo lo presentes. Tres salidas posibles:

| Salida | Qué implica |
|---|---|
| **A.** Dibujar wireframes de baja fidelidad *a posteriori*, presentándolos como el paso de diseño del que salió el sitio | Trabajo extra de dibujo. Es lo que el enunciado pide literalmente |
| **B.** Entregar el sitio y argumentar que supera el requisito | Riesgo: el profesor puede leerlo como que no hiciste el paso que pedía |
| **C.** Preguntar al profesor | Lo más barato de todo. Una pregunta |

> **DECIDE TÚ:** ¿A, B o C?
>
> `<!-- tu decisión aquí -->`

### 1.2 "Análisis heurístico **previo**"

El enunciado dice *previo*, y tus auditorías son posteriores al diseño: [AUDITORIA_ACCESIBILIDAD.md](AUDITORIA_ACCESIBILIDAD.md) es del 2026-09-23, el sitio ya existía.

No es necesariamente un problema: puedes contar la verdad, que el proyecto se auditó por rondas y cada ronda cambió el diseño, y eso es un proceso iterativo real. Pero tienes que decidir si lo cuentas así o si lo reencuadras.

> **DECIDE TÚ:** ¿cuentas el proceso iterativo real, o reencuadras?
>
> `<!-- tu decisión aquí -->`

---

## 2. Defectos vivos. Cada uno vale **−2 puntos** si lo encuentra el profesor

Medidos hoy, 2026-10-04, sobre el sitio actual. Arréglalos antes de entregar y el informe se vuelve mucho más fácil de defender.

### 2.1 Cuatro enlaces abren pestaña nueva sin avisarlo

WCAG 3.2.5 / técnica G201. Con JavaScript funcionando quedan **4** (sin JavaScript son 19, porque los 15 "Pedir" todavía no se han convertido en contadores):

| Enlace | Dónde |
|---|---|
| "Ver en el mapa ↗" | pie |
| "@eltradicional" | pie |
| "+593 99 000 0000" | pie |
| "Avisar a la panadería por WhatsApp ↗" | panel del comprobante |

Arreglo: un `<span class="sr-only"> (abre en una pestaña nueva)</span>` dentro de cada uno. La clase `sr-only` ya existe en la hoja de estilos. La flecha `↗` ya lo dice visualmente; falta el canal que oye un lector de pantalla.

**Corrección a tu auditoría vieja:** [AUDITORIA_ACCESIBILIDAD.md](AUDITORIA_ACCESIBILIDAD.md) dice "15 enlaces". Ese número es del 2026-09-23 y **ya no es cierto**: el control de cantidad reemplazó los 15 botones "Pedir". Si citas el 15 en el informe, citas un dato falso.

### 2.2 Un par de color falla AA por 0,01

| Dónde | Colores | Ratio | Exige |
|---|---|---|---|
| El `small` de "Gratis" / "Desde $1.00" en las opciones de entrega — [styles.css:597](styles.css#L597) sobre el fondo de [styles.css:785](styles.css#L785) | `--horno-claro` #7a6c65 sobre `--masa` #f7f1e7 | **4.49** | 4.5 |

Texto de 0,72 rem (≈11,5 px), así que cuenta como texto normal y no como texto grande. Arreglo: cambiar ese `color` a `--horno-suave` (#5e514a), que da 6.79 sobre el mismo fondo y ya se usa en el `span` de arriba.

### 2.3 Objetivos táctiles: **sin medir**

WCAG 2.2 añadió el criterio 2.5.8 (24×24 px mínimo). Tu auditoría de septiembre encontró 7 por debajo, pero el inventario de controles cambió entero desde entonces. **No lo puedo medir yo**: jsdom no calcula layout. Instrucciones en §8.1 para que lo midas tú en dos minutos.

---

## 3. Materia prima: las 10 heurísticas de Nielsen

Para cada una: lo que tu sitio hace, y la pregunta que el informe tiene que contestar. **La respuesta la escribes tú.**

### H1. Visibilidad del estado del sistema

Lo que tienes:
- Región `role="status" aria-live="polite"` que anuncia el resultado de filtrar: *"18 productos, 3 agotados en el mostrador"*.
- Segunda región `sr-only` que anuncia cada cambio de la canasta: *"Pan redondo añadido. 3 productos en la canasta."*
- Contador numérico encima del botón flotante.
- "Mostrando X de Y productos" al entrar en una categoría, visible y `aria-hidden` para no oírlo dos veces.
- El horario se calcula contra la hora real y el pie dice *"Abierto"* / *"Cerrado · abre 08:00"* / *"Cerrado · abre mañana"*.
- `.hero-note`: *"Recién salido del horno · Pan redondo · Sale a las 17:00"*.
- La cabecera cambia de fondo al desplazarse (`is-pegada`), que dice "ya no estás arriba".
- 7 regiones que anuncian en total: 2 `status`, 4 `alert`, 1 `status/polite`.

> **PREGUNTA:** de esos siete canales, ¿cuál es redundante? Un aviso que se oye dos veces es peor que uno que no se oye. ¿Por qué el recuento de la vista de categoría está `aria-hidden`?
>
> **ESCRIBE TÚ:**
> `<!-- -->`

### H2. Correspondencia entre el sistema y el mundo real

Lo que tienes — el vocabulario es de panadería, no de software:

| En el sitio | Lo que diría un sitio genérico |
|---|---|
| "Tu canasta" | "Carrito" |
| "El mostrador" / "La vitrina" | "Productos destacados" |
| "Paso retirando" | "Recogida en tienda" |
| "¿A dónde lo llevamos?" | "Dirección de envío" |
| "Vuelve mañana" (agotado) | "Sin stock" |
| "Hecho a mano, como en casa" | "Nuestros productos" |

- El icono de quitar es una **papelera solo cuando queda una unidad**; con dos o más es un signo `−`. La metáfora cambia con lo que la acción significa de verdad.
- Los iconos son todos del mismo trazo (1.4–1.9 px, puntas redondeadas): canasta de mimbre, espiga de trigo, pala de panadero.

> **PREGUNTA:** esta heurística es la más fácil de documentar con tu proyecto y la que más se nota. ¿Qué palabra del sitio te costó más elegir, y cuál descartaste?
>
> **ESCRIBE TÚ:**
> `<!-- -->`

### H3. Control y libertad del usuario

Lo que tienes:
- Cada paso del panel tiene su propio "volver", y vuelve **al paso anterior, no siempre a la canasta**: "Volver a la canasta", "Volver a cómo lo recibes".
- `Esc` cierra cualquier panel y devuelve el foco al control que lo abrió.
- El botón "atrás" del navegador funciona en las vistas de categoría: `history.pushState` con `#tienda-panes` y un `popstate` que repinta. Una categoría es un sitio al que se puede volver.
- `Esc` en el campo de cantidad recupera el valor anterior en vez de dejar lo tecleado a medias.
- Cerrar el panel a mitad del pago no deja nada atascado: se corta el temporizador, se borran los datos de la tarjeta y se vuelve a la canasta con el pedido intacto.
- El pedido sobrevive al cierre del navegador (`localStorage`), la contraseña **no** — se pide, se comprueba y se tira.

> **PREGUNTA:** la última es una decisión de diseño, no un descuido. ¿Por qué guardar el pedido y no la contraseña? Contéstalo en una frase que no sea "por seguridad".
>
> **ESCRIBE TÚ:**
> `<!-- -->`

### H4. Consistencia y estándares

Lo que tienes:
- **Un solo** anillo de foco en todo el sitio: 3 px marrón + halo ámbar de 5 px ([styles.css:475](styles.css#L475)).
- Variables de diseño en `:root`: 8 colores con nombre, radios (`--r-btn`, `--r-chip`, `--r-card`), duraciones (`--dur-fast`, `--dur-base`, `--dur-slow`) y curvas (`--ease-ui`, `--ease-out`). Nada de valores sueltos.
- Los dos paneles (canasta y cuenta) usan el mismo patrón: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, título con `tabindex="-1"` que recibe el foco, botón de cerrar arriba a la derecha.
- Los dos desplegables de la barra se comportan igual: clic, flechas, `Esc`, cierre al salir el foco.
- Los campos de la tarjeta y los de la cuenta siguen la misma regla: **no se marcan en rojo hasta que los tocaste o intentaste enviar**.

> **PREGUNTA:** ¿cuál es el estándar externo que estás siguiendo en los paneles? (Busca "WAI-ARIA Authoring Practices, dialog modal" y cita el patrón por su nombre: eso vale más que decir "es consistente".)
>
> **ESCRIBE TÚ:**
> `<!-- -->`

### H5. Prevención de errores

Lo que tienes:
- Tope duro de 100 unidades por producto ([script.js:834](script.js#L834)). Más que eso se habla por teléfono, no se teclea.
- El campo de cantidad es `type="text"` con `inputmode="numeric"` **a propósito**: un `type="number"` trae sus propias flechitas y acepta signos y comas.
- Mientras escribes solo se limpian los caracteres que no son cifras; el número **no se corrige hasta que terminas**, porque corregirlo al vuelo impide escribir un 12 (al pasar por el 1 ya sería válido y saltaría solo).
- Validación de Luhn en la tarjeta antes de "cobrar" nada: es lo que separa un número inventado de uno con forma de tarjeta.
- "Confirmar el pedido" está `disabled` + `aria-disabled` con la canasta vacía.
- El `+593` es un prefijo fijo delante del campo, así que quien escriba `09…` de memoria no se equivoca: se le come el cero.
- La tarjeta de prueba está escrita en pantalla: *"4242 4242 4242 4242 … No escribas una tarjeta de verdad."*
- Sin dirección no se puede pasar al pago: se avisa y **el foco va al campo que falta**.
- El número de pedido se genera sin caracteres que se confundan al dictarlo por teléfono.

> **PREGUNTA:** hay dos tipos de prevención aquí mezclados: el que **impide** el error (el tope, el `disabled`) y el que **lo hace difícil de cometer** (el prefijo, la tarjeta de prueba anunciada). Clasifica cinco de los ejemplos en uno u otro grupo. Esa distinción es exactamente lo que se evalúa.
>
> **ESCRIBE TÚ:**
> `<!-- -->`

### H6. Reconocimiento antes que recuerdo

Lo que tienes:
- La lista de requisitos de la contraseña está **debajo del campo y se repinta en cada tecla**. No hay que recordar qué pedía ni adivinar qué falta.
- El desglose subtotal / envío / total se escribe recién cuando se sabe cómo se recibe el pedido, porque hasta entonces el total no existe.
- La ficha del producto lleva el precio al lado del botón: no hay que volver a la lista a mirarlo.
- Con sesión abierta, la dirección de la cuenta pasa a la canasta — **pero solo si está vacía**. Lo que ya escribiste manda sobre lo guardado.
- El título del documento cambia con la vista: *"Bebidas | El Tradicional"*. La pestaña dice dónde estás.
- Los botones que son solo un dibujo explican lo que hacen en un cuadrito, y con teclado sale inmediatamente.

> **PREGUNTA:** el caso de la dirección (precargar, pero no pisar) es la mejor evidencia de esta heurística que tienes. ¿Por qué precargar *sin* pisar es reconocimiento, y pisar sería un error de la heurística 3 (control del usuario)?
>
> **ESCRIBE TÚ:**
> `<!-- -->`

### H7. Flexibilidad y eficiencia de uso

Lo que tienes — cada tarea tiene un camino para el novato y un atajo para el que ya sabe:

| Tarea | Camino largo | Atajo |
|---|---|---|
| Pedir 20 panes | 20 clics en `+` | escribir `20` en el campo, o `↑` repetido |
| Marcar el punto de entrega | mover el mapa y marcar | botón "Usar mi ubicación" (geolocalización) |
| Llegar a una categoría | bajar al catálogo | menú Tienda → vista con su URL propia |
| Recorrer el mostrador | flechas ← → del ratón | tabular por las fichas (el navegador las trae a la vista) |
| Recuperar un pedido | volver a armarlo | ya está: `localStorage` lo restaura |
| Rellenar la dirección | escribirla | la cuenta la precarga |

- Leaflet (el mapa) **solo se descarga si eliges domicilio**: quien pasa a retirar no baja un mapa que no va a mirar.

> **PREGUNTA:** el enunciado valora "eficiencia en la navegación" dentro de los 5 puntos de diseño de interacción. Cuenta los clics mínimos de un pedido completo, de portada a comprobante. Mídelo de verdad, no lo estimes.
>
> **ESCRIBE TÚ:** clics mínimos = `<!-- -->`
> `<!-- -->`

### H8. Diseño estético y minimalista

Lo que tienes:
- El mostrador de la portada es un escaparate en fila, no el catálogo entero: ordenar y filtrar **no aparecen ahí**, solo dentro de una categoría. Ordenar seis cosas no le hace falta a nadie.
- No hay barra de filtros: la categoría es un estado de la página.
- El contador de cantidad nace **solo con el signo `+`**; el `−` y el número aparecen recién cuando hay algo pedido.
- Las flechas de la fila se esconden si no hay nada que desplazar, y se deshabilitan al llegar a una punta.
- El QR de DeUna es de adorno y **lo dice**: *"tiene la forma de un QR … pero no codifica nada"*.
- Una animación dominante por zona, no una por elemento.

> **PREGUNTA:** esta heurística es la más fácil de documentar mal, porque "minimalista" suena a opinión. Tus tres mejores pruebas son que **algo aparece solo cuando hace falta**: el `−`, las flechas, los mandos de ordenar. Formúlalo como regla, no como gusto.
>
> **ESCRIBE TÚ:**
> `<!-- -->`

### H9. Reconocer, diagnosticar y recuperarse de los errores

Lo que tienes — 4 regiones `role="alert"`, y los mensajes dicen **qué** falta, no que "algo está mal":

| Mensaje real | Qué hace bien |
|---|---|
| *"Revisa el correo, algo le falta."* | no dice "formato inválido" |
| *"Escribe la dirección para poder llevarlo."* | dice la consecuencia, no la regla |
| *"Este navegador no sabe decir dónde estás; marca el punto a mano"* | da la salida alternativa |
| *"No se pudo cargar el mapa. Escribe la dirección y cobramos la tarifa de salida"* | el fallo tiene plan B y lo explica |

- Tras un error de formulario **el foco va al primer campo que falta**, no a un resumen arriba.
- Si el mapa no carga (sin red o CDN caído), no se rompe nada: queda la dirección escrita y se cobra la tarifa de salida.
- 12 elementos con `aria-describedby` uniendo cada campo con su mensaje.
- El panel de "entrar" **dice en voz alta que no puede comprobar ninguna contraseña**, porque no hay servidor con qué compararla, en vez de fingir que sí.

> **PREGUNTA:** la última es la más interesante de todo el proyecto: una maqueta que admite ser una maqueta en lugar de simular que funciona. ¿Es eso honestidad de diseño o es un defecto de la maqueta? Defiende tu respuesta.
>
> **ESCRIBE TÚ:**
> `<!-- -->`

### H10. Ayuda y documentación

Lo que tienes:
- Los cuadritos de los botones-dibujo: medio segundo de espera para el ratón, **inmediato para el teclado**, porque quien tabula hasta un botón ya decidió mirarlo.
- Instrucciones escritas donde hacen falta: *"Marca a dónde va el pedido: toca el mapa, o muévelo con las flechas y pulsa Enter"*.
- Notas que anticipan el paso siguiente: *"Después eliges cómo lo recibes y cómo pagas."*
- La naturaleza académica se declara en tres sitios distintos del flujo de pago, no en una letra pequeña: *"Esto es una demostración"*, *"Simulación académica: no se cobra ni un centavo"*, *"Pedido simulado … la panadería todavía no ha recibido nada"*.
- `aria-label` en el mapa que dicta las teclas en voz alta.

> **PREGUNTA:** Nielsen dice que lo mejor es que el sistema no necesite documentación. ¿Cuál de tus ayudas es señal de que algo no se explica solo? (Pista honesta: el `aria-label` del mapa.)
>
> **ESCRIBE TÚ:**
> `<!-- -->`

---

## 4. Materia prima: los 4 principios WCAG 2.2 (la matriz)

El enunciado pide **evidenciarlos funcionalmente**, no describirlos. Es decir: una columna de "cómo se comprueba", no solo de "qué es".

Propuesta de columnas para la matriz, para que sea una matriz de *cumplimiento* y no una tabla de definiciones:

`Principio | Criterio WCAG (número y nombre) | Qué hace el sitio | Cómo lo compruebas | Resultado`

### Perceptibilidad

| Evidencia | Dato medido |
|---|---|
| Imágenes con texto alternativo | **22 imágenes, 0 sin atributo `alt`** |
| Decorativas marcadas como tales | 2 con `alt=""` |
| Todas con `width`/`height` (evitan salto de maquetado) | 0 sin ellos |
| SVG decorativos ocultos a tecnologías asistidas | **19 de 19** con `aria-hidden="true"` + `focusable="false"` |
| Imagen de fondo del hero con texto equivalente | `role="img"` + `aria-label` descriptivo |
| Contraste de texto | 14 de 17 pares medidos pasan AA; ver §7.2 y el fallo de §2.2 |
| El QR decorativo con alternativa textual que explica que no codifica nada | `.pago-qr-alt` |

Criterios que puedes citar: 1.1.1 (contenido no textual), 1.4.3 (contraste mínimo), 1.4.11 (contraste de elementos no textuales).

> **ESCRIBE TÚ** (la fila de "cómo lo compruebas" de cada una):
> `<!-- -->`

### Operabilidad

Esta la tienes completamente cubierta y documentada aparte: **[ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md)**. De ahí sale la evidencia:

| Evidencia | Dato |
|---|---|
| Todo alcanzable con teclado | 38 paradas de tabulación en la portada, orden medido, ninguna trampa |
| Foco visible | anillo doble 3 px + halo 5 px, un solo estilo en todo el sitio |
| Enlace para saltar al contenido | sí, `.skip-link`, visible al recibir foco |
| Paneles modales con el foco contenido y `Esc` | 2 diálogos, los 2 con `aria-modal="true"` + `aria-labelledby` |
| Al cerrar, el foco vuelve a donde estaba | sí, con salida de emergencia si ese control ya no se ve |
| El carrusel se detiene al recibir el foco | sí (`focusin`), y respeta `prefers-reduced-motion` |
| Preferencia de movimiento reducido, con escucha en vivo | [script.js:703](script.js#L703) — reacciona si la cambias a mitad de sesión |
| Objetivos táctiles 24×24 | ⚠️ **sin medir**, ver §8.1 |

Criterios que puedes citar: 2.1.1 (teclado), 2.1.2 (sin trampas de foco), 2.4.1 (saltar bloques), 2.4.3 (orden del foco), 2.4.7 (foco visible), 2.4.11 (foco no tapado — nuevo en 2.2), 2.5.8 (tamaño del objetivo — nuevo en 2.2), 2.2.2 (pausar movimiento).

**El ángulo fuerte:** el mapa de reparto era imposible de usar sin ratón y eso bloqueaba el pedido a domicilio entero. Está contado en ACCESIBILIDAD_TECLADO.md §3. Es la mejor evidencia que tienes de los cuatro principios, porque es un fallo **encontrado, diagnosticado y arreglado**, no una casilla marcada.

> **ESCRIBE TÚ:**
> `<!-- -->`

### Comprensibilidad

| Evidencia | Dato |
|---|---|
| Idioma declarado | `lang="es"` |
| Campos con rótulo asociado | **49 campos, 0 sin rótulo** |
| Agrupaciones con `fieldset` + `legend` | 7 campos dentro de grupos rotulados |
| Lenguaje llano | *"¿Cómo lo quieres?"*, *"¿A dónde lo llevamos?"*, *"Vuelve mañana"* |
| Los errores no aparecen antes de tiempo | un campo solo se marca cuando ya lo tocaste o ya intentaste enviar |
| La contraseña nunca se marca en rojo mientras escribes | la lista de requisitos de abajo ya va diciendo lo que falta |
| Navegación consistente entre vistas | la barra no cambia al entrar en una categoría |

Criterios: 3.1.1 (idioma), 3.2.3 (navegación consistente), 3.3.1 (identificación de errores), 3.3.2 (etiquetas e instrucciones), 3.3.3 (sugerencia ante error).

> **ESCRIBE TÚ:**
> `<!-- -->`

### Robustez

| Evidencia | Dato |
|---|---|
| Landmarks | `header` 1, `nav` 1, `main` 1, `footer` 1 |
| HTML semántico | 4 `section`, 18 `article` (una por producto) |
| Jerarquía de encabezados | 30 encabezados, **0 saltos de nivel** |
| ARIA correcto en los diálogos | 2 de 2 con `role="dialog"` + `aria-modal` + `aria-labelledby` |
| Estado comunicado por ARIA | 3 `aria-expanded`, 3 `aria-controls`, 12 `aria-describedby` |
| Nombre accesible en todo control | **0 controles sin nombre**, de 59 en pantalla |
| Datos estructurados | JSON-LD, `@type: Bakery` |
| Mejora progresiva | sin JavaScript los "Pedir" siguen siendo enlaces de WhatsApp que funcionan |

Criterios: 4.1.2 (nombre, función, valor), 4.1.3 (mensajes de estado), 1.3.1 (información y relaciones).

**El ángulo fuerte:** la mejora progresiva. Sin JavaScript el sitio no se rompe, **cambia**: los 15 contadores vuelven a ser 15 enlaces de WhatsApp, la fila vuelve a ser cuadrícula, y los enlaces de Tienda bajan al catálogo en lugar de abrir una vista. Eso es robustez de verdad y casi nadie la entrega.

> **ESCRIBE TÚ:**
> `<!-- -->`

---

## 5. Materia prima: el modelo mental

### 5.1 Flujo de navegación — las máquinas de estados que ya existen en el código

Son tres, y están implementadas de verdad. Esto es el esqueleto del diagrama; **dibújalo tú**.

**Máquina A — la vista del catálogo** (`categoria`, con URL propia e historial):

```
todos  ──Tienda>Panes──▶  panes          (URL: #tienda-panes)
  ▲    ──Tienda>Dulces─▶  dulces         (URL: #tienda-dulces)
  │    ──Tienda>Bebidas▶  bebidas-frias  (URL: #tienda-bebidas-frias)
  └──────"Volver al inicio" / botón atrás del navegador───┘
```
En `todos`: fila horizontal, sin mandos de ordenar. En una categoría: cuadrícula + ordenar (4 opciones) + filtrar (todos / solo disponibles). Cada categoría se entra limpia: lo elegido en panes no sigue puesto en bebidas.

**Máquina B — el pedido** (4 pasos, `canasta-paso`):

```
canasta ──"Confirmar el pedido"──▶ entrega ──"Seguir al pago"──▶ pago ──"Confirmar"──▶ comprobante
   ◀────"Volver a la canasta"─────    ◀──"Volver a cómo lo recibes"──
```
- `entrega` se bifurca: `retiro` (gratis, muestra la dirección del local) o `domicilio` (abre mapa + campo de dirección, y recién ahí carga Leaflet).
- `pago` se bifurca en 4: efectivo, tarjeta, transferencia, DeUna. Cada uno muestra su propio bloque.
- De `entrega` a `pago` hay una **guarda**: sin dirección no se pasa.
- Al llegar a `comprobante` el pedido se da por cumplido: cerrar vacía la canasta.

**Máquina C — la cuenta** (3 pasos): `crear` ⇄ `entrar` → `sesion`.

> **PREGUNTA:** ¿por qué "cómo lo recibes" es un paso propio y no una opción dentro de la canasta? (La razón está en el código: hasta no saber si hay envío no se puede escribir el total. Dilo tú con tus palabras, es un argumento de arquitectura cognitiva.)
>
> **ESCRIBE TÚ:**
> `<!-- -->`

### 5.2 Secuencia de tareas — el objetivo completo

Camino mínimo de "quiero pan" a "pedido registrado". Recórrelo tú y anota los clics reales:

1. Portada → el mostrador en fila
2. `+` en un producto → aparece el contador, suena el aviso, sube el número del botón flotante
3. Botón flotante → se abre la canasta
4. "Confirmar el pedido" → paso de entrega
5. Elegir retiro o domicilio → (si domicilio: marcar en el mapa + escribir dirección)
6. "Seguir al pago" → paso de pago, con el desglose ya calculado
7. Elegir método → (si tarjeta: 4 campos)
8. "Confirmar el pedido" → comprobante con número de pedido
9. (opcional) "Avisar a la panadería por WhatsApp"

> **ESCRIBE TÚ:** clics del camino de retiro + efectivo = `<!-- -->` · del camino de domicilio + tarjeta = `<!-- -->`

### 5.3 Respuesta del sistema — las microinteracciones, una por una

| Acción | Lo que devuelve el sistema |
|---|---|
| Pulsar `+` | el contador se abre (aparecen `−` y el número), el número del botón flotante sube, se anuncia *"X añadido. N productos en la canasta."* |
| Bajar a 1 unidad | el `−` **se convierte en papelera** y su rótulo cambia a "Quitar de la canasta" |
| Quitar el último | el producto sale, **el foco salta al `+`** para no quedarse en el aire |
| Cambiar el tamaño de una bebida | el precio de la ficha se reescribe y se anuncia *"Coca-Cola 1 L, $1.25"* |
| Entrar en una categoría | transición de salida (acelerada) → entrada (desacelerada), el título recibe el foco, cambia el título de la pestaña y la URL |
| Filtrar dentro de una categoría | *"Mostrando 5 de 7 productos"* + aviso para lector de pantalla |
| Marcar un punto en el mapa | *"A 2.3 km del local · envío $2.15"* y el total se recalcula |
| Elegir domicilio | aparecen mapa y dirección, se descarga Leaflet, el foco va al campo de dirección |
| Intentar pagar sin dirección | `role="alert"` + el foco al campo que falta |
| Escribir el número de tarjeta | se formatea en grupos de 4 **manteniendo la posición del cursor contada en dígitos**, no en caracteres |
| Pulsar "Confirmar" en el pago | el panel pasa a "procesando" con el cursor en `progress`, luego comprobante |
| Llegar al pago | el panel deja de ser gaveta lateral y **se planta en el centro** con el resto desenfocado |
| Abrir un panel | el fondo se apaga (`inert`), el foco entra, `Esc` lo cierra y lo devuelve |
| Dejar el cursor quieto sobre un botón-dibujo | cuadrito a los 500 ms; con teclado, inmediato |

> **PREGUNTA:** la fila del panel que se planta en el centro al llegar al pago es la microinteracción más deliberada que tienes. ¿Qué le comunica al usuario un cambio de **forma** del contenedor, que no le comunicaría un cambio de contenido dentro de la misma gaveta?
>
> **ESCRIBE TÚ:**
> `<!-- -->`

---

## 6. Las cinco conclusiones

El enunciado es muy específico y aquí se pierden 5 puntos enteros con facilidad: *"Al menos cinco, sobre el uso coherente de los principios de usabilidad, arquitecturas cognitivas, diseño de la interacción"*. Y avisa: *"Enviar una sola conclusión que no esté escrita como una conclusión o que no tenga relación al trabajo entregado, serán penalizados los 5 puntos."*

Es decir: cada una tiene que ser **una afirmación tuya sobre lo que aprendiste diseñando esto**, no una descripción de una función. "El sitio tiene un mapa accesible" no es una conclusión. "Hacer accesible el mapa obligó a cambiar el modelo de interacción, no solo a añadir un botón" sí lo es.

Siete ángulos que tu proyecto sostiene con evidencia real. **Elige cinco y escríbelos tú**; no los uses todos ni los copies como título.

1. **Accesibilidad como rediseño, no como capa.** El mapa no se arregló añadiendo un atributo: hubo que inventar una interacción que no existía (marcar el centro). Evidencia: ACCESIBILIDAD_TECLADO.md §3.
2. **El orden del documento es el orden del pensamiento.** El menú del teléfono iba antes de su botón en el HTML, y eso solo se nota con teclado. Un fallo que es invisible para quien usa ratón.
3. **Las auditorías caducan.** Tu propio dato de "15 enlaces" dejó de ser cierto en tres semanas. Evidencia: §2.1.
4. **Vocabulario como arquitectura cognitiva.** "Canasta", "mostrador", "paso retirando": el modelo mental de una panadería, no el de una tienda en línea. H2.
5. **Progresión en lugar de densidad.** El `−` que no existe hasta que hace falta, el desglose que no se puede escribir hasta saber cómo se recibe el pedido. La interfaz revela estado en vez de mostrarlo todo.
6. **Honestidad del prototipo.** El panel de entrar admite que no puede comprobar contraseñas. ¿Es mejor eso que simular que funciona? Tiene defensa en ambas direcciones; elige una.
7. **La degradación es diseño.** Sin JavaScript el sitio cambia en vez de romperse; el mapa que no carga tiene tarifa de respaldo. Decidir qué pasa cuando algo falla es parte del diseño, no una excepción.

> **ESCRIBE TÚ — conclusión 1:**
> `<!-- -->`
>
> **conclusión 2:**
> `<!-- -->`
>
> **conclusión 3:**
> `<!-- -->`
>
> **conclusión 4:**
> `<!-- -->`
>
> **conclusión 5:**
> `<!-- -->`

---

## 7. Datos medidos — la tabla de evidencia

Medido el **2026-10-04** sobre el sitio actual, cargando `index.html` + `script.js` de verdad. Estos números reemplazan a los de [AUDITORIA_ACCESIBILIDAD.md](AUDITORIA_ACCESIBILIDAD.md), que es del 2026-09-23 y está desactualizada.

### 7.1 Inventario

| Comprobación | Sin JavaScript | Con JavaScript |
|---|---|---|
| Imágenes | 22 | 22 |
| — sin atributo `alt` | **0** | **0** |
| — decorativas (`alt=""`) | 2 | 2 |
| — sin `width`/`height` | **0** | **0** |
| Enlaces | 30 | — |
| — sin nombre accesible | **0** | **0** |
| — con `target="_blank"` | 19 | **4** |
| — de esos, que lo avisan | **0** | **0** ⚠️ |
| Controles interactivos | — | 119 en total, 59 en pantalla |
| — sin nombre accesible | — | **0** |
| Campos de formulario | — | 49 (22 texto, 19 radio, 3 contraseña, 2 correo, 1 teléfono, 2 `select`) |
| — sin rótulo asociado | — | **0** |
| — dentro de `fieldset` con `legend` | — | 7 |
| Encabezados | — | 30, **0 saltos de nivel** |
| Landmarks | header 1, nav 1, main 1, footer 1 | igual |
| `section` / `article` | 4 / 18 | igual |
| Diálogos | 0 | 2, los 2 con `aria-modal` + `aria-labelledby` |
| Regiones que anuncian | 1 | 7 (2 `status`, 4 `alert`, 1 `status/polite`) |
| `aria-expanded` / `aria-controls` / `aria-describedby` | — | 3 / 3 / 12 |
| SVG decorativos bien ocultos | — | **19 de 19** |
| Fichas de producto | 18 (3 agotadas, 6 con tamaños) | igual |
| Paradas de tabulación en la portada | — | **38** (42 controles, los 11 radios forman 5 grupos de una parada cada uno, más 2 flechas). Eran 36 antes de los arreglos del 2026-10-04 |

### 7.2 Contraste de color

Calculado sobre los tokens de `:root` con la fórmula de WCAG. Texto normal exige 4.5, texto grande y elementos no textuales 3.

| Par | Ratio | AA |
|---|---|---|
| Texto principal (`--horno` sobre `--masa`) | 12.41 | pasa (y AAA) |
| Texto en tarjeta (`--horno` sobre `--papel`) | 13.71 | pasa (y AAA) |
| Texto claro sobre barra oscura | 11.10 | pasa (y AAA) |
| Botón amarillo hover/foco | 8.91 | pasa (y AAA) |
| Texto tenue sobre barra oscura | 8.70 | pasa (y AAA) |
| Aviso "cerrado" sobre barra oscura | 7.61 | pasa (y AAA) |
| Texto secundario sobre papel | 7.51 | pasa (y AAA) |
| Corteza oscura sobre masa | 7.18 | pasa (y AAA) |
| Texto secundario sobre masa | 6.79 | pasa |
| Botón amarillo (`--horno` sobre `--ambar`) | 5.76 | pasa |
| Enlace ámbar sobre barra oscura | 5.76 | pasa |
| `--horno-claro` sobre papel | 4.97 | pasa |
| `--corteza` sobre masa — solo en el `h1` del hero | 4.26 | pasa **como texto grande** (exige 3) |
| **`--horno-claro` sobre masa** — el `small` de las opciones de entrega | **4.49** | **FALLA por 0.01** ⚠️ §2.2 |
| Anillo de foco, línea marrón | 12.41 | pasa |

Dos notas para que no te las corrijan:
- El **halo ámbar** del anillo de foco da solo 2.15 sobre masa, pero el anillo es **doble**: la línea marrón de 3 px es la que cumple, el halo es refuerzo. No es un fallo, pero conviene explicarlo antes de que te lo pregunten.
- El borde de tarjeta (`--masa-linea`) da 1.33. No es fallo de 1.4.11 porque la tarjeta no se identifica por su borde, sino por su sombra, su imagen y su contenido.

---

## 8. Lo que falta medir, y cómo lo mides tú

### 8.1 Objetivos táctiles (WCAG 2.5.8, nuevo en 2.2)

No lo puedo medir yo: hace falta un navegador que calcule layout. Abre el sitio, pulsa `F12`, pestaña **Console**, y pega esto:

```js
[...document.querySelectorAll('a[href],button,input,select,[tabindex]:not([tabindex="-1"])')]
  .filter(e => e.offsetParent)
  .map(e => ({ r: e.getBoundingClientRect(), e }))
  .filter(o => o.r.width < 24 || o.r.height < 24)
  .forEach(o => console.log(Math.round(o.r.width) + '×' + Math.round(o.r.height),
    o.e.className || o.e.tagName, '|', (o.e.textContent.trim() || o.e.getAttribute('aria-label') || '').slice(0, 40)));
```

Hazlo **dos veces**: a 1440 px de ancho y a 390 px (modo teléfono, `Ctrl+Shift+M`). Y una tercera con la canasta abierta, para medir los controles del panel. Anota los resultados aquí:

> **ESCRIBE TÚ:**
> - escritorio: `<!-- -->`
> - teléfono: `<!-- -->`
> - panel abierto: `<!-- -->`

### 8.2 Contraste sobre la foto del hero

El `h1` va encima de una fotografía con un velo oscuro. Los números de §7.2 son sobre colores planos y **ahí no valen**. Mídelo con el cuentagotas de DevTools (inspecciona el `h1` → pasa el ratón por el valor de `color` → te da el ratio contra lo que haya detrás).

> **ESCRIBE TÚ:** ratio del `h1` sobre la foto = `<!-- -->`

### 8.3 Prueba con lector de pantalla

Windows trae **Narrador** (`Ctrl + Win + Enter`). NVDA es gratis y mejor. Diez minutos recorriendo el sitio valen más que cualquier tabla, y si el profesor pregunta "¿lo probaste?", la respuesta tiene que ser sí.

> **ESCRIBE TÚ:** qué sonó raro = `<!-- -->`

---

## 9. Bitácora

| Fecha | Qué pasó |
|---|---|
| 2026-10-04 | Accesibilidad por teclado completa: arreglado el mapa (era inalcanzable sin ratón), flechas en los desplegables, `inert` de fondo, foco al abrir el menú del teléfono. Documentado en [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md). Commit `f301a0d` |
| 2026-10-04 | Remedida la accesibilidad del sitio actual (§7). La auditoría de septiembre quedó obsoleta: "15 enlaces con pestaña nueva" son ahora 4 |
| 2026-10-04 | Calculados los 17 pares de contraste. Un fallo real por 0.01 (§2.2) |
| | `<!-- siguiente entrada -->` |
