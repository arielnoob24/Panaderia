# Auditoría de accesibilidad: El Tradicional

Primera ronda: 2026-09-23. Índice de auditorías: [AUDITORIAS.md](AUDITORIAS.md).

Este archivo cubre solo accesibilidad: percepción, navegación por teclado, lectores de pantalla y objetivos táctiles. El contraste de color se trata aquí en lo que afecta a la legibilidad, pero las decisiones de paleta viven en [AUDITORIA_ESTETICA_ANIMACIONES.md](AUDITORIA_ESTETICA_ANIMACIONES.md).

## Resumen

La base es mejor de lo habitual en un sitio de este tamaño. Hay landmarks correctos, un enlace para saltar al contenido, jerarquía de encabezados sin saltos, todas las imágenes con texto alternativo, una región `aria-live` para anunciar el resultado del filtro, y soporte real de `prefers-reduced-motion` incluido un listener que reacciona si el usuario cambia la preferencia a mitad de sesión.

Los dos problemas de verdad son de interacción, no de estructura: **quince enlaces abren una pestaña nueva sin avisarlo**, y **siete objetivos táctiles quedan por debajo del mínimo de WCAG 2.2**.

## Medición

Hecha en navegador sobre la página completa.

| Comprobación | Resultado |
|---|---|
| Imágenes | 14 en total, **0 sin atributo `alt`** |
| Imágenes con `alt=""` (decorativas) | 2 |
| Imágenes sin `width`/`height` | **4** |
| Enlaces | 25, **0 sin nombre accesible** |
| Enlaces que abren pestaña nueva | **15, ninguno lo avisa** |
| Jerarquía de encabezados | `1,2,3,3,3,3,3,3,3,3,3,2,3,3,3,2,3` — **0 saltos de nivel** |
| Landmarks | `header` 1, `nav` 1, `main` 1, `footer` 1 |
| Elementos interactivos | 31 |
| Por debajo de 24×24 px (WCAG 2.2 AA) | **7** |
| Por debajo de 44×44 px (WCAG AAA) | 27 |

## Hallazgos

### Alto

#### A1. Quince enlaces abren pestaña nueva y ninguno lo advierte

Evidencia: 15 de los 25 enlaces de [index.html](index.html) llevan `target="_blank"`. Son los nueve botones "Pedir", el WhatsApp de la navegación, el flotante, el del pie, los dos de Google Maps y el del mapa. Ninguno lo indica en su texto ni en su `aria-label`.

Impacto: quien navega con lector de pantalla o con teclado pierde la referencia. Pulsa un enlace, el foco desaparece a una ventana nueva y el botón "atrás" deja de funcionar, sin que nada haya anunciado el cambio de contexto. Es la técnica G201 de WCAG y afecta al criterio 3.2.5 (Cambio a petición).

Recomendación: añadir al nombre accesible una indicación que el lector de pantalla lea y la vista no repita. Por ejemplo, un `<span class="sr-only"> (abre en una pestaña nueva)</span>` dentro del enlace, que ya existe como utilidad en la hoja de estilos. La flecha `↗` que ya llevan estos enlaces comunica lo mismo visualmente, así que el arreglo solo tiene que cubrir el canal que hoy falta.

#### A2. Siete objetivos táctiles por debajo del mínimo de WCAG 2.2

Evidencia, medido a 698 px de ancho:

| Elemento | Tamaño |
|---|---|
| Enlaces de navegación | 52×16, 99×16, 49×16 px |
| `.location-link` "Google Maps / Waze" | 133×14 px |
| Enlaces del pie | 183×18, 183×16 px |

Impacto: el criterio 2.5.8 de WCAG 2.2, de nivel AA, pide 24×24 px como mínimo. Estos enlaces tienen entre 14 y 18 px de alto. Hay una excepción por espaciado cuando alrededor del objetivo cabe un círculo de 24 px que no toca otro objetivo, y **algunos se salvan por ahí**: los enlaces de navegación tienen 2 rem de separación. Pero los del pie están apilados con 0,5 rem de separación, así que no se salvan, y `.location-link` con 14 px de alto es el más justo de todos.

Es un problema real en móvil, donde el dedo no tiene la precisión del puntero, y afecta especialmente a personas con temblor o con movilidad reducida.

Recomendación: no hace falta agrandar el texto. Basta con dar área táctil sin cambiar el aspecto:

- A los enlaces del pie, `padding: .35rem 0` y subir el `gap` del contenedor, o `min-height: 24px` con `display: inline-flex; align-items: center`.
- A `.location-link` y a los enlaces de navegación, `padding-block: .5rem` y un `display` que lo respete.
- Comprobar después que ningún objetivo quede a menos de 24 px de otro.

### Medio

#### A3. Cuatro imágenes sin `width` ni `height`

Evidencia: las cuatro apariciones de la mascota. Las diez fotografías de producto y de sección sí los declaran.

Impacto: sin esas dimensiones el navegador no puede reservar el hueco antes de descargar la imagen, así que el contenido salta cuando llega. Es desplazamiento acumulativo de diseño, y molesta especialmente a quien usa lupa o tiene dificultades motrices, porque el objetivo que iba a pulsar se mueve. En la cabecera la mascota está justo al lado del enlace de inicio.

Recomendación: añadir `width="516" height="484"` a las cuatro, que son las dimensiones reales del archivo. El CSS sigue mandando sobre el tamaño de presentación; los atributos solo sirven para reservar la proporción.

#### A4. El texto alternativo de la mascota es inconsistente entre sus cuatro apariciones

Evidencia: en el hero y en el pie lleva una descripción completa; en la cabecera y en la franja de identidad lleva `alt=""`.

Impacto: la decisión es defendible, porque en la cabecera el enlace ya tiene `aria-label="El Tradicional, inicio"` y describir además la mascota haría que el lector de pantalla anunciara dos veces lo mismo. Pero no está escrito en ningún sitio, así que la próxima edición puede "arreglarlo" y empeorarlo.

Recomendación: dejar el criterio anotado en un comentario del HTML: la mascota es decorativa cuando acompaña a un texto que ya nombra la marca, y descriptiva cuando aparece sola. Verificar además que el `aria-label` del enlace de la cabecera sigue siendo el nombre accesible efectivo.

#### A5. El indicador de disponibilidad se genera desde JavaScript y siempre dice lo mismo

Evidencia: [script.js](script.js) crea el `<span class="availability">` y escribe "Agotado" cuando `data-available` vale `false`. Ningún producto de [index.html](index.html) declara ese atributo.

Impacto: los nueve productos anuncian siempre "Disponible", incluido a los lectores de pantalla, sin que nadie lo haya decidido. Si algún día se agota algo y no se toca el HTML, la página afirmará lo contrario. Es información de estado que se anuncia como cierta sin serlo.

Recomendación: o declarar `data-available` en cada producto de forma explícita, o retirar el indicador hasta que haya un origen de datos real. Se trata con más detalle en [AUDITORIA_CONTENIDO_CONVERSION.md](AUDITORIA_CONTENIDO_CONVERSION.md).

### Bajo

#### A6. La falta de tildes afecta a la pronunciación de los lectores de pantalla

Evidencia: "El menu", "Ver el menu", "Categorias del menu", "No hacemos pan rapido", "la ciudad todavia duerme", "Fermentacion natural", "todos los dias".

Impacto: además de la impresión de descuido, un sintetizador de voz en español pronuncia distinto "menu" y "menú", y "rapido" y "rápido". No impide entender, pero degrada la experiencia de quien depende de la voz. Se detalla en la auditoría de contenido.

#### A7. No se ha comprobado el recorrido completo por teclado

Evidencia: existe `:focus-visible` con un anillo de 3 px más un halo de 5 px, existe el enlace para saltar al contenido, y el menú móvil sincroniza `aria-expanded` y devuelve el foco al botón al cerrarse con Escape.

Impacto: la base está bien construida, pero no se ha recorrido la página entera con el tabulador para verificar el orden real, ni se ha comprobado si el foco queda atrapado dentro del menú móvil abierto, que es el punto donde suele fallar.

Recomendación: recorrer con tabulador desde la barra de direcciones hasta el pie, con el menú móvil abierto y cerrado, y comprobar que el anillo de foco se ve sobre la fotografía del hero, que es el fondo menos predecible.

## Lo que ya está bien

No conviene tocarlo.

- Landmarks completos y un solo `main`.
- Enlace "Saltar al contenido" que aparece al recibir foco.
- Jerarquía de encabezados sin saltos, con un único `h1`.
- Todas las imágenes tienen `alt`, y el fallback de imagen rota muestra un texto en lugar de un hueco.
- El filtro del catálogo es un `fieldset` con `legend`, con radios reales en vez de botones falsos, así que funciona con teclado sin código adicional.
- El contador de resultados usa `role="status"` y `aria-live="polite"`, de modo que el cambio de categoría se anuncia.
- `prefers-reduced-motion` está implementado de verdad, y desde la segunda ronda hay un listener que reacciona si la preferencia cambia a mitad de sesión.
- El estado abierto o cerrado del local no depende solo del color: el texto lo dice.
- La relación de contraste de los 18 pares de color medidos cumple AA, después de corregir el fallo de 1,73:1 que se detalló en la auditoría de estética.

## Pendiente

- [ ] Avisar del cambio de contexto en los quince enlaces que abren pestaña nueva (A1).
- [ ] Llevar los siete objetivos táctiles a 24 px de alto como mínimo (A2).
- [ ] Añadir `width` y `height` a las cuatro imágenes de la mascota (A3).
- [ ] Dejar escrito el criterio de texto alternativo de la mascota (A4).
- [ ] Decidir qué hacer con el indicador de disponibilidad (A5).
- [ ] Recorrer la página con teclado y con un lector de pantalla real (A7).
- [ ] Comprobar el anillo de foco sobre la fotografía del hero.

## Nota de validación

Revisión estática más medición en navegador sin interfaz, sobre [index.html](index.html), [styles.css](styles.css) y [script.js](script.js). Los tamaños de objetivo y los recuentos se midieron con `getBoundingClientRect` a 698 px de ancho; a otras anchuras los números cambian, sobre todo en la navegación.

**No se ha probado con un lector de pantalla real** (NVDA, JAWS o VoiceOver), ni con navegación por teclado completa, ni con herramientas automáticas tipo axe o Lighthouse. Los hallazgos sobre lectores de pantalla se basan en la estructura del marcado, no en escuchar el resultado.
