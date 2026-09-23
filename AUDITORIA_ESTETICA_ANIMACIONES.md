# Auditoría estética y de animaciones: El Tradicional

Primera ronda: 2026-09-22. Segunda ronda, geometría y variedad de animación: 2026-09-23. Tercera ronda, paleta, color e imágenes: 2026-09-23.

Este es el archivo 1 de 6. Índice de todas las auditorías: [AUDITORIAS.md](AUDITORIAS.md).

## Por qué separar las auditorías

Sí conviene trabajar por tipos. Una auditoría completa sirve para tener el mapa general, pero las revisiones especializadas permiten pensar con más profundidad en un objetivo concreto sin mezclarlo con datos de negocio, SEO o infraestructura.

Orden recomendado para futuras auditorías, y estado actual:

1. [Estética y animaciones](AUDITORIA_ESTETICA_ANIMACIONES.md): este archivo. Tres rondas hechas.
2. [Accesibilidad](AUDITORIA_ACCESIBILIDAD.md): primera ronda hecha el 2026-09-23.
3. [Responsive y experiencia móvil](AUDITORIA_RESPONSIVE_MOVIL.md): primera ronda hecha el 2026-09-23.
4. [Rendimiento y recursos](AUDITORIA_RENDIMIENTO_RECURSOS.md): primera ronda hecha el 2026-09-23.
5. [SEO y datos estructurados](AUDITORIA_SEO_DATOS_ESTRUCTURADOS.md): primera ronda hecha el 2026-09-23.
6. [Contenido y conversión](AUDITORIA_CONTENIDO_CONVERSION.md): primera ronda hecha el 2026-09-23.
<!--  -->
Este archivo cubre únicamente estética, movimiento y sensación de interacción. No evalúa precios, teléfonos, URLs, horarios, direcciones, imágenes provisionales ni otros datos de negocio.

## Resumen

La interfaz tiene una identidad visual clara y apropiada para una panadería artesanal. La mezcla de crema, petróleo, coral y amarillo, junto con serif editorial y sans-serif funcional, crea una dirección reconocible.

El movimiento actual es contenido: existe un reveal al hacer scroll, hover moderado en tarjetas y soporte para `prefers-reduced-motion`. La siguiente mejora no debería consistir en añadir animaciones por todas partes, sino en darles un ritmo narrativo más coherente: una entrada escalonada del hero, filtros más suaves y una secuencia más completa para las tarjetas.

La tercera ronda mide la paleta contra dos reglas concretas: máximo cinco colores, tres principales y dos secundarios, y el reparto 60-30-10 con el color primario en los elementos dominantes, los encabezados, los CTA clave y el logotipo. El sitio no cumple ninguna de las dos. Hay unos 27 valores de color distintos en lugar de 5, dos tokens son el mismo color con nombres diferentes, y el reparto medido es 66 / 34 / 1,4, con el color de marca por debajo del 1 % cuando debería rondar el 10 %. De paso aparecieron dos defectos que no eran de gusto sino de funcionamiento: un texto con 1,73:1 de contraste y una fotografía que devolvía 404 en dos tarjetas. Ambos quedaron corregidos.

La segunda ronda confirma con datos dos percepciones que quedaban como sensación. Primera: el sitio se ve cuadrado porque en 231 líneas de CSS solo hay 6 radios declarados, cinco de ellos círculos decorativos, y la página es una pila de seis bandas a sangre con cortes perfectamente rectos. Segunda: todo se anima igual porque existe **un único patrón de entrada** (opacidad más desplazamiento vertical) aplicado a seis tipos de componente distintos, con dos `@keyframes` de contenido idéntico, y porque las once declaraciones de movimiento usan la misma curva `ease`. El detalle está en la sección "Segunda ronda", con 12 hallazgos de geometría y 13 de movimiento, un mapa de animación por zona y una escala de radios propuesta.

## Estado de implementación

### Ya realizado

- [x] Contraste estable en la navegación superior con fondo petróleo semitransparente.
- [x] CTA de WhatsApp con fondo y borde propios.
- [x] Transición suave al cambiar categorías del catálogo.
- [x] Stagger dinámico para todas las tarjetas visibles, con retraso máximo controlado.
- [x] Entrada escalonada del hero para mascota, eyebrow, título, texto y acciones.
- [x] Menú móvil con `opacity`, `transform`, `visibility` y `pointer-events`.
- [x] Icono del menú transformado en una X al abrirse.
- [x] Textura global reducida y enviada detrás del contenido.
- [x] Transición de carga para la imagen del hero.
- [x] Estado visual de carga y fallback del mapa.
- [x] Transición de entrada para imágenes lazy y fallback de imagen no disponible.
- [x] Estados de hover y foco con transiciones coherentes.
- [x] Separación visual del filtro sticky mediante sombra.
- [x] Uso de `safe-area-inset-bottom` para el botón flotante.
- [x] Neutralización de transformaciones y zoom bajo `prefers-reduced-motion`.

### Pendiente de comprobar o mejorar

Revisado el 2026-09-23: varios de estos puntos se resolvieron en la segunda y la tercera ronda sin que esta lista se actualizara. Estado real:

- [x] Desfase entre imagen y texto en la sección de historia. La foto entra con revelado por máscara y el texto 140 ms después, con entrada lateral.
- [x] Pulso sutil en el indicador de frescura. Es el único bucle del sitio y solo actúa en el aviso del hero.
- [x] Indicación de desplazamiento horizontal en los filtros. Resuelta con capas de fondo, sin JavaScript.
- [x] Solapamiento del aviso del hero con el botón de WhatsApp. Medido y descartado: el aviso ocupa de y 608 a 669 y el botón de y 1039 a 1082. Queda por comprobar en alturas cercanas a 650 px.
- [x] Parallax. Decidido que no, con motivo técnico: la textura fija a pantalla completa y el filtro del iframe del mapa lo hacen caro. Está razonado en "Dónde no conviene añadir variedad".
- [x] Jerarquía tipográfica: los títulos de sección bajan a `clamp(2.8rem, 5.4vw, 4.6rem)`, reservando el tamaño máximo al hero.
- [x] **Espacio vertical**, aplicado el 2026-09-23. `.section-pad` baja de 8 a 6,5 rem, y de 5,5 a 4,5 rem en móvil. El catálogo recibe además un `padding-top` propio de 4,5 rem, 3 rem en móvil, porque la franja coral ya lo separa del hero. El documento pasa de 5409 a 4894 px de alto, un 10 % menos, y el catálogo empieza en y 796 en lugar de y 1000.
- [x] **Contraste sobre las fotografías más claras**, medido el 2026-09-23. Ver la sección siguiente. Encontró un fallo real y se corrigió.

### Segunda ronda, aplicado el 2026-09-23

Geometría:

- [x] Tokens de radio en `:root` y eliminación del radio huérfano de 2 px (G1, G9).
- [x] Radios en tarjetas de producto, tarjetas de local, botones, panel del mapa, botón flotante, menú móvil, aviso del hero, enlace del mapa y skip-link (G2, G7).
- [x] Hombros de 40 px en la sección de historia y separador curvo bajo la franja coral (G3).
- [x] Grilla del catálogo con `auto-fill` y `minmax(260px, 1fr)` (G4, parcial).
- [x] Tres niveles de sombra tokenizados y tintes azul y verde eliminados (G5).
- [x] Mascota sin aro punteado, con halo radial, tamaños 104 y 72 px, y blob difuminado detrás en el hero (G6).
- [x] Gestos orgánicos: radio de masa en la foto de historia, sello circular girado en las etiquetas y cinta con esquina cortada en el pie de foto (G8).
- [x] Escala de diámetros de las marcas circulares unificada (G12).

Movimiento:

- [x] Tokens de duración y las cinco curvas de easing; `ease` eliminado de toda la hoja (M2).
- [x] Los dos `@keyframes` idénticos fusionados en `rise`, con amplitud por variable (M1).
- [x] Mapa de zona a clase en lugar de la lista plana de `revealItems`, con `data-motion` (M1, M6).
- [x] Estado de salida de `.is-filtering` escrito en CSS, con fase real de salida de 160 ms antes del cambio (M3).
- [x] Transición en `.order-button`, enlaces de navegación y footer, y filtros, con duración distinta para hover y para `:checked` (M4, M5).
- [x] Panel del mapa sin `transform`, solo opacidad (M7).
- [x] Sombra de hover de las tarjetas movida a un pseudo-elemento animado por `opacity` (M8).
- [x] Listener de `change` en `prefers-reduced-motion` y neutralización por `[data-motion]` en lugar de la lista manual (M9).
- [x] Eje X en la franja de identidad y en el texto de historia, y revelado por máscara en la foto (M10).
- [x] Stagger del hero desacoplado de `nth-child`, con amplitud por peso tipográfico (M11).
- [x] `scroll-margin-top` en las secciones con `id` (M12).
- [x] Stagger diagonal por fila más columna en el catálogo, tanto en la entrada inicial como al filtrar.
- [x] Acento único de amasado en la mascota, subrayado que crece en la navegación, secuencia numerada en los principios y entrada diferida del botón flotante.

Cerrado el 2026-09-23, en la misma tanda que el bloque de rendimiento:

- [x] **Señal de desplazamiento en la barra de filtros.** No se hizo el indicador deslizante que proponía el mapa de zonas, porque exigía medir desde JavaScript y recalcular al arrastrar. Se resolvió mejor y sin JavaScript: cuatro capas de fondo, dos ancladas al contenido con `background-attachment: local` y dos ancladas al elemento, de modo que las primeras tapan a las segundas cuando no queda nada fuera y las descubren cuando sí. Verificado: `background-attachment: local, local, scroll, scroll, scroll`. Esto cierra también el hallazgo R2 de la auditoría de responsive.
- [x] **Pulso del indicador de frescura.** Aplicado como único bucle infinito del sitio, y solo en el aviso del hero, no en la etiqueta de estado de locales, tal como pedía el mapa de zonas. Es un halo que crece de `scale(1)` a `scale(2.8)` desvaneciéndose, en 2400 ms. Queda desactivado explícitamente bajo `prefers-reduced-motion`, sin depender de que la neutralización general lo cubra.
- [x] **Hombros de banda entre locales y pie.** Resuelto el problema que lo había bloqueado: el pie se monta 40 px sobre la sección de locales con margen negativo, compensando con el mismo valor de relleno superior. Así sus esquinas redondeadas descubren el papel de la sección de encima y no la crema del `body`. Verificado en render: no aparece la cuña de color que se temía.
- [x] **Jerarquía tipográfica.** Los títulos de sección bajan de `clamp(3rem, 6vw, 5.3rem)` a `clamp(2.8rem, 5.4vw, 4.6rem)`, de modo que el tamaño máximo queda reservado al titular del hero. Era un pendiente de la primera ronda.

Sigue pendiente, por decisión explícita:

- [ ] Módulo destacado en el catálogo con `grid-column: span 2`. Cambia la jerarquía del contenido, no solo la forma, así que es una decisión de negocio: hay que elegir qué producto se destaca.

### Tercera ronda, estado

Corregido el 2026-09-23:

- [x] Contraste del eyebrow "Nuestra manera": de 1,73:1 a 5,76:1, con una regla estructural para que ningún eyebrow en sección oscura pueda repetir el fallo (C2).
- [x] Foto con respuesta 404 sustituida; las dos tarjetas que mostraban "Imagen no disponible" ya cargan (I1).
- [x] Diez fotografías distintas para diez espacios, en lugar de cuatro repetidas; todas comprobadas con respuesta 200 (I2).
- [x] Foto de la sección de historia cambiada por una que sí ilustra el texto, con los textos alternativos reescritos para describir lo que aparece (I3).

Paleta consolidada el 2026-09-23:

- [x] `--ink` y `--petroleum` unificados en un solo token (C1).
- [x] El ámbar pasa de 8 a 18 elementos, repartidos por todas las secciones, y de 2 de 5 tipos de CTA a 4 de 5 (C3).
- [x] CTA unificados en el color de marca: los nueve botones "Pedir", el WhatsApp de la navegación, el botón del hero y el flotante. El enlace del mapa se queda en marrón a propósito, como acción secundaria, para que la jerarquía siga significando algo (C4).
- [x] El símbolo del logotipo lleva color de marca en sus dos apariciones, header y footer (C5).
- [x] Los seis colores ajenos sustituidos: el verde salvia del aviso del hero pasa a ámbar, el verde grisáceo y el rosa de los estados pasan a tonos de la paleta, el azul de la capa del mapa pasa a crema, y los dos halos de estado usan ahora el ámbar y la corteza reales en lugar de dos colores propios (C6).
- [x] Los diez tintes sueltos convertidos en tonos con nombre. **Cero valores de color escritos a mano fuera de `:root`** (C7).
- [x] Tokens renombrados al vocabulario nuevo: `--masa`, `--horno`, `--ambar`, `--corteza`, `--papel` (C8).
- [x] La franja de identidad pasa a la corteza clara, que es el papel que le asigna la paleta. Verificado: blanco sobre ese fondo da 4,79:1, cumple AA.
- [x] Una sola marca: la mascota sustituye al monograma "ET" en la cabecera y en la franja, y se retira el "ET" duplicado del pie. Tamaños subidos a 44 y 52 px, porque por debajo de 40 px la ilustración no se lee (C11).

Resultado: **5 colores y 9 tonos derivados de ellos**, frente a los 27 valores sueltos del inicio. Los 11 pares de color nuevos se comprobaron con WCAG antes de aplicarlos y todos cumplen AA.

Pendiente:

- [ ] Derivar los nueve tonos con `color-mix()` en lugar de fijarlos como hexadecimales. **Se evaluó el 2026-09-23 y se decidió no hacerlo por ahora**, con este motivo: los nueve tonos se eligieron uno a uno para cumplir contraste AA, y se verificaron los once pares resultantes. Sustituirlos por mezclas calculadas desplaza varios de ellos lo bastante como para tener que volver a comprobar los once pares, a cambio de una ventaja, la propagación automática al cambiar un color base, que en una paleta estática de cinco colores rara vez se necesita. Queda anotado como mejora posible, no como deuda.
- [ ] Sustituir la imagen enlazada a un tercero y evaluar alojar las fotografías en el repositorio (I4, I5).

### Medición de contraste sobre imagen

Hecha el 2026-09-23. Es el caso que faltaba: hasta ahora se habían medido 29 pares de color, pero todos de texto sobre fondo plano. Aquí el fondo es una fotografía, y cambia píxel a píxel.

Método: se renderizó la página dos veces, una normal para obtener los límites reales de cada texto con `Range.getClientRects`, y otra con esos textos en `visibility: hidden` para ver el fondo exacto que hay debajo. Después se muestreó un píxel de cada dos dentro de esas regiones y se calculó la relación de contraste de cada uno contra el color del texto, quedándose con **el peor píxel**, no con la media.

### El fallo que encontró

| Zona | Antes | Umbral | Después |
|---|---:|---:|---:|
| Eyebrow del hero, "PANADERÍA Y PASTELERÍA EL TRADICIONAL" | **3,85** | 4,5 | **6,49** |

Causa: `.hero .eyebrow` usaba `--corteza`, la terracota clara, sobre la zona crema del hero. **El 100 % de los píxeles muestreados fallaba.**

Esto corrige además un error de esta misma auditoría. El hallazgo C9 decía que la terracota clara "hoy es correcto, porque solo se usa en el `<em>` del titular del hero, que ronda los 7 rem". Era falso: también se usaba en el eyebrow, que mide 0,7 rem. El aviso de C9 era acertado y el diagnóstico de dónde se aplicaba, no. Corregido usando `--corteza-oscura`, el tono que C9 ya señalaba como el adecuado para texto pequeño.

### El resto, verificado

Peor píxel de cada zona, en escritorio a 1418 px y en móvil a 512 px, donde el degradado del hero es vertical y llega a dejar ver la foto al 40 %.

| Zona | Escritorio | Móvil | Umbral |
|---|---:|---:|---:|
| Marca en la cabecera, sobre la foto | 9,69 | 9,69 | 3,0 |
| Enlaces de navegación, sobre la foto | 9,94 | — | 4,5 |
| Eyebrow del hero, ya corregido | 6,49 | 6,23 | 4,5 |
| Titular `h1` | 11,57 | 10,49 | 3,0 |
| `h1` en cursiva, en terracota clara | 4,16 | — | 3,0 |
| Párrafo del hero | 12,41 | 9,39 | 4,5 |
| Enlace "Encuentra tu local" | 12,41 | 7,45 | 4,5 |
| Zona baja del hero en móvil, la peor del degradado | — | 5,76 | 4,5 |

La cursiva del titular queda en 4,16, que cumple el umbral de texto grande pero no llegaría al de texto pequeño. Está bien donde está, a 7 rem, y no debe reutilizarse ese color en tamaños menores.

## Notas de implementación

Cuatro puntos donde lo aplicado se aparta de lo que proponía la auditoría, con el motivo.

1. **La tarjeta de producto no lleva `overflow: hidden`.** La auditoría proponía usarlo para que la imagen heredase las esquinas superiores. Pero M8 mueve la sombra de hover a un `::after` con `inset: 0`, y su sombra se dibuja fuera de la caja: con `overflow: hidden` quedaría recortada y el hover perdería la elevación. La solución aplicada da radio completo a `.product-card` y radio superior a `.product-image`, que ya tenía su propio `overflow: hidden`. Los dos ejes se resuelven sin conflicto.

2. **La franja de identidad no usa `clip-path`.** El patrón propuesto era un despliegue en altura con `inset(0 0 100% 0)`. Es incompatible con el separador curvo de G3, porque ese separador es un pseudo-elemento que sobresale 26 px por debajo de la franja y `inset()` no admite valores negativos: al terminar la animación en `inset(0)` el separador quedaría recortado para siempre. Se conservó el separador, que es el gesto de forma más visible, y la franja entra solo con el movimiento horizontal de sus tres hijos. Sigue siendo un patrón distinto al del resto del sitio, que es lo que pedía M10.

3. **El radio de masa se recalibró.** El valor propuesto, con porcentajes verticales cercanos al 50 %, convierte una foto de proporción 4/5 en un óvalo puntiagudo. Se comprobó en render y se sustituyó por `46% 54% 44% 56% / 7% 8% 7% 8%`: porcentajes horizontales amplios y verticales pequeños, que curvan los bordes superior e inferior dejando los laterales rectos. La foto se lee como una hogaza, no como una elipse.

4. **Los hombros de banda solo se aplicaron a la sección de historia.** Redondear una sección revela el fondo del `body`, no el de la sección vecina. Funciona en historia porque encima está el catálogo, que también es crema. En el límite entre locales, que es papel, y el footer, aparecería una cuña de crema visible. Queda pendiente hasta decidir si se unifica ese fondo.

Además, el radio de 3 px para `.availability` se omitió porque ese elemento no tiene fondo ni borde, así que el radio no sería visible.

## Hallazgos priorizados

### Observaciones confirmadas por la captura

#### Navegación superior con contraste variable

En la captura, `El menú`, `Nuestra historia`, `Locales` y `WhatsApp` están directamente sobre la fotografía del hero. El texto blanco funciona cuando detrás hay una zona oscura, pero pierde fuerza cuando coincide con el pan claro, las semillas o las zonas de harina.

El problema no es la paleta general del sitio: el petróleo, crema, coral y amarillo funcionan bien en el resto de la composición. El problema es que la navegación no tiene una superficie estable detrás y el fondo cambia constantemente.

Recomendaciones, de menor a mayor intervención:

1. Añadir al encabezado una capa de fondo petróleo semitransparente, con `backdrop-filter` opcional y fallback sólido.
2. Añadir un degradado oscuro más concentrado en la franja superior del hero, sin oscurecer innecesariamente el contenido principal.
3. Mantener el CTA de WhatsApp con fondo y borde propios, para que siempre se lea como acción independiente.
4. Verificar el contraste con la imagen más clara y no solo con la captura actual.
5. En móvil, conservar el panel petróleo del menú abierto, porque ahí el contraste ya es más estable.

#### Cambio de categoría del catálogo demasiado brusco

Al cambiar entre categorías, los productos se ocultan y aparecen de forma inmediata. La cuadrícula cambia su contenido sin una transición, por lo que el movimiento se percibe tosco aunque el resto del sitio tenga revelados suaves.

La transición recomendada es un fundido corto con un desplazamiento vertical pequeño: los productos actuales bajan su opacidad y los nuevos entran desde 6–10 píxeles abajo. La cuadrícula no debe animar toda su altura ni dejar un espacio vacío prolongado.

Recomendaciones:

- Aplicar una clase temporal al catálogo durante el cambio.
- Actualizar el filtro y después revelar únicamente las tarjetas visibles.
- Usar una duración aproximada de 240–320 ms.
- Añadir un retraso muy pequeño entre tarjetas, no mayor a 40–60 ms.
- Mantener el contador de productos y el foco del filtro inmediatamente disponibles.
- Respetar `prefers-reduced-motion` mostrando el resultado sin transición.

### Alto

No se encontraron problemas graves de estética o movimiento. No hay una animación invasiva, un bucle permanente dominante ni un efecto que bloquee la lectura.

### Medio

#### 1. Stagger incompleto en el catálogo

Evidencia: [styles.css](styles.css#L155) define retrasos solo hasta `:nth-child(6)`, aunque el catálogo contiene más tarjetas.

Impacto: las primeras tarjetas aparecen escalonadas y las siguientes entran juntas, rompiendo el ritmo visual.

Recomendación:

- Aplicar retrasos a todas las tarjetas visibles.
- Mantener el retraso máximo alrededor de 400–500 ms para que el catálogo no se sienta lento.
- Usar variables CSS o calcular el retraso desde JavaScript para no escribir muchos selectores manuales.

#### 2. Cambio brusco al usar filtros

Evidencia: [script.js](script.js#L35) cambia `product.hidden` directamente.

Impacto: el catálogo desaparece y reaparece sin continuidad, aunque el resto de la página tenga transiciones suaves.

Recomendación:

- Añadir un fundido corto con desplazamiento de 6–10 px al mostrar productos filtrados.
- Mantener la eliminación de elementos ocultos sin animar la altura completa de la cuadrícula.
- Evitar animar tarjetas ocultas durante demasiado tiempo.

#### 3. Entrada del hero demasiado monolítica

Evidencia: [script.js](script.js#L75) aplica la entrada a todo `.hero-content` como un bloque.

Impacto: mascota, eyebrow, título, descripción y botones aparecen al mismo tiempo. Se pierde la oportunidad de construir una primera impresión más artesanal y narrativa.

Recomendación:

- Revelar mascota, eyebrow, titular, copy y acciones en secuencia.
- Usar intervalos de 80–120 ms.
- Mantener la duración total entre 700 y 900 ms.
- No retrasar la disponibilidad del título ni ocultarlo a usuarios con movimiento reducido.

#### 4. Menú móvil sin transición progresiva

Evidencia: [styles.css](styles.css#L173) alterna `display: none` y `display: flex` con `.is-open`.

Impacto: el menú aparece de golpe y no puede animarse mediante `opacity` o `transform` mientras conserve `display: none`.

Recomendación:

- Mantener el panel en el flujo de renderizado con `visibility`, `opacity` y `transform`.
- Desactivar `pointer-events` cuando esté cerrado.
- Usar una entrada de 180–240 ms, sin rebote.
- Mantener el estado accesible del botón sincronizado.

#### 5. Textura fija con posible coste visual

Evidencia: [styles.css](styles.css#L6) aplica una textura `feTurbulence` fija a toda la ventana.

Impacto: aporta papel y carácter, pero puede suavizar textos pequeños y aumentar el trabajo de composición en equipos modestos.

Recomendación:

- Mantener una opacidad muy baja.
- Considerar una textura estática ligera en lugar de ruido generado.
- No aplicarla sobre zonas donde se necesite máxima legibilidad.

#### 6. Reduced motion debe neutralizar también hover

Evidencia: [styles.css](styles.css#L200) desactiva reveal y hero, pero los estados hover todavía pueden cambiar escala o posición.

Impacto: el movimiento se vuelve instantáneo, pero no desaparece por completo para quien pidió reducirlo.

Recomendación:

- Dentro de `prefers-reduced-motion`, neutralizar también `transform` de hover y zoom de imágenes.
- Conservar cambios de color o foco, porque siguen siendo útiles como feedback.

### Bajo

#### 7. Jerarquía tipográfica repetitiva

Evidencia: [styles.css](styles.css#L45) y [styles.css](styles.css#L68) usan titulares muy grandes en varias secciones.

Recomendación: reservar el tamaño máximo para el hero y reducir ligeramente los títulos posteriores para que las secciones mantengan jerarquía.

#### 8. Ritmo vertical generoso

Evidencia: `.section-pad` usa `8rem`.

Recomendación: conservar el aire editorial, pero reducir selectivamente el espacio antes del catálogo para que los productos aparezcan antes después del hero.

#### 9. Hover desigual entre componentes

- Las tarjetas tienen elevación y zoom.
- El botón amarillo cambia de posición, pero conviene declarar una transición propia.
- Los enlaces de texto solo cambian de color.

Recomendación: usar una familia de microinteracciones coherente: 180–250 ms, desplazamientos pequeños y cambios de color previsibles.

#### 10. Historia con entrada simultánea

Evidencia: [script.js](script.js#L72) aplica reveal a `.story-photo` y `.story-copy`.

Recomendación: hacer entrar primero la imagen y después el texto con aproximadamente 100 ms de desfase.

## Hallazgos adicionales

### Medio

#### 11. La textura global puede quedar sobre la interfaz

Evidencia: [styles.css](styles.css#L16) fija `body::before` con `z-index: 5`, mientras el filtro sticky usa un nivel inferior.

Impacto: el ruido puede aparecer sobre textos pequeños, imágenes, filtros y tarjetas, reduciendo la nitidez durante el scroll.

Recomendación:

- Mantener la textura detrás del contenido mediante una capa inferior.
- Reducir su opacidad por debajo de `.05` o limitarla a fondos decorativos.
- Evitar que cubra botones, navegación, filtros y textos pequeños.

#### 12. El hero puede cambiar bruscamente al cargar la imagen

Evidencia: [styles.css](styles.css#L38) carga la fotografía como `background-image` sin una transición de disponibilidad.

Impacto: en una conexión lenta puede verse primero el fondo petróleo y luego entrar la imagen de golpe.

Recomendación:

- Mantener el petróleo como fallback estable.
- Precargar la imagen principal cuando sea una decisión de rendimiento aceptable.
- Aplicar una transición breve de opacidad cuando la imagen esté lista.

#### 13. El mapa no tiene estado visual de carga

Evidencia: [index.html](index.html#L111) usa un iframe lazy y [script.js](script.js#L65-L69) solo muestra fallback cuando ocurre un error.

Impacto: el panel puede parecer vacío mientras carga y el reveal de la sección puede terminar antes que el mapa.

Recomendación:

- Añadir un estado `is-loading` discreto para el panel.
- Retirarlo cuando el iframe termine de cargar.
- Mantener visible el enlace de mapas desde el inicio.

### Bajo

#### 14. El botón flotante puede competir con el aviso del hero en móviles bajos

Evidencia: [styles.css](styles.css#L55) fija el aviso del hero cerca del borde inferior y [styles.css](styles.css#L149) fija el botón flotante sobre el viewport.

Impacto: en alturas móviles cercanas a 650 px pueden ocupar la misma zona visual o tapar acciones inferiores.

Recomendación: probar alturas móviles cortas, reservar espacio inferior con `env(safe-area-inset-bottom)` y considerar un estado compacto cuando el aviso del hero sea visible.

#### 15. El icono del menú no comunica su estado visualmente

Evidencia: [styles.css](styles.css#L34-L35) define las tres barras sin transición; el estado abierto depende del texto accesible.

Recomendación: transformar las barras a una X cuando `.is-open` esté activo, con una transición de 180–220 ms y sin movimiento para `prefers-reduced-motion`.

#### 16. Foco y hover no tienen una respuesta visual equivalente

Evidencia: existe un outline global, pero no una versión equivalente de los estados hover para `.order-button`, `.nav-cta`, `.floating-whatsapp` y `.button-yellow`.

Recomendación: compartir transición y elevación entre `:hover` y `:focus-visible`, manteniendo el anillo de foco como refuerzo.

#### 17. El filtro sticky necesita una señal de separación

Evidencia: [styles.css](styles.css#L72-L74) mantiene fondo y bordes, pero no una sombra o estado visual al quedar fijado.

Impacto: puede confundirse con el contenido de la sección o parecer que tapa la página al desplazarse.

Recomendación: añadir una sombra muy sutil o un estado sticky, y revisar la indicación de desplazamiento horizontal en móvil.

#### 18. Las imágenes lazy aparecen sin transición de carga

Evidencia: [index.html](index.html#L94-L108) usa `loading="lazy"` y [styles.css](styles.css#L81-L82) solo define el fondo del contenedor.

Impacto: después del reveal, una imagen puede permanecer plana y entrar abruptamente cuando termina de cargar.

Recomendación: usar un fondo tonal o placeholder discreto y una transición corta de opacidad al completar la imagen, sin que parezca un estado de error.

## Segunda ronda: geometría y variedad de animación

Fecha de revisión: 2026-09-23. Auditoría de solo lectura sobre [index.html](index.html), [styles.css](styles.css) y [script.js](script.js), centrada en dos preguntas concretas: por qué el sitio se percibe cuadrado y por qué todo parece animarse igual. Ambas percepciones quedan confirmadas con datos, no son subjetivas.

### Inventario base

Radios declarados en todo [styles.css](styles.css): **6 en 231 líneas.**

| Línea | Selector | Valor |
|---|---|---|
| 32 | `.brand-mark` | `50%` |
| 36 | `.nav-cta` | `2px` |
| 71 | `.status-dot` | `50%` |
| 78 | `.sign-mark` | `50%` |
| 168 | `.mascot-hero` | `50%` |
| 169 | `.mascot-footer` | `50%` |

Cinco círculos decorativos de 8 a 88 px, más un valor huérfano de 2 px. **Todo lo demás del sitio tiene radio 0.** No hay `mask`, ni `border-image`, ni radios multivalor, ni porcentajes distintos de 50 %. El único `clip-path` del archivo ([styles.css](styles.css#L90)) es la utilidad de accesibilidad del input de filtro, no una forma.

Movimiento declarado: **9 `transition`, 2 `animation`, 2 `@keyframes`. Las 11 declaraciones usan la palabra clave `ease`.** Cero `cubic-bezier`, cero `ease-out`, cero `ease-in`, cero `linear`.

| Línea | Declaración | Duración | Easing |
|---|---|---|---|
| 39 | `.menu-toggle span` transform/opacity | .2s | ease |
| 45 | `.hero-image` opacity | .45s | ease |
| 49 | `.hero-content.is-ready > *` anima `hero-item-enter` | .55s | ease |
| 55 | `@keyframes hero-item-enter` | opacidad + `translateY(8px)` | — |
| 95 | `.product-card` transform/box-shadow | .25s | ease |
| 96 | `.product-card.catalog-enter` anima `catalog-enter` | .28s | ease |
| 97 | `@keyframes catalog-enter` | opacidad + `translateY(8px)` | — |
| 99 | `.product-image` background-color | .25s | ease |
| 101 | `.product-image img` opacity/transform | .35s / .5s | ease |
| 104 | `.story-photo img, .mascot-slot img` opacity | .35s | ease |
| 173 | `.floating-whatsapp` bg/transform/shadow | .2s | ease |
| 174 | 5 selectores de botones y enlaces | .2s | ease |
| 179 | `.reveal` opacity/transform (`translateY(22px)`) | .7s | ease |
| 198 | `.main-nav` móvil (`translateY(-8px)`) | .2s | ease |
| 225–231 | bloque `prefers-reduced-motion` | `.01ms !important` | — |

### Eje A — Geometría y forma

#### Alto

##### G1. No existe escala de radios: el sistema es binario, 0 px o círculo

Evidencia: las 6 declaraciones del inventario son las únicas del proyecto.

Impacto: ningún contenedor, superficie, botón o imagen tiene esquina suavizada. Los únicos elementos curvos son adornos de 8 a 38 px, así que el ojo lee el sitio entero como una retícula de rectángulos con tres lunares circulares.

Recomendación: introducir tokens de radio en `:root` (junto a `--shadow`, [styles.css](styles.css#L12)) y usarlos en todos los componentes. Regla: ningún componente debe quedarse en 0 por omisión; si debe ser recto, que sea una decisión explícita y documentada.

##### G2. Los componentes estructurales principales tienen radio 0

Evidencia: `.product-card` [L95](styles.css#L95), `.product-image` [L98](styles.css#L98), `.location-card` [L137](styles.css#L137), `.featured-location` [L138](styles.css#L138), `.map-panel` [L154](styles.css#L154) y su iframe [L156](styles.css#L156), `.button`/`.button-yellow` [L64-L65](styles.css#L64-L65), `.order-button` [L117](styles.css#L117), `.floating-whatsapp` [L173](styles.css#L173), `.product-tag` [L106](styles.css#L106), `.image-caption` [L124](styles.css#L124), `.hero-note` [L70](styles.css#L70), `.map-link` [L158](styles.css#L158), `.skip-link` [L26](styles.css#L26).

Impacto: las nueve tarjetas del catálogo son nueve rectángulos blancos idénticos con la misma sombra dentro de una grilla de 4 columnas. Eso es un panel de administración, no una vitrina de panadería. El caso más grave es `.floating-whatsapp`, porque está fijo sobre el contenido durante todo el scroll y hoy es un rectángulo amarillo de esquina viva.

Recomendación, con valores concretos:

- `.product-card`: `border-radius: 18px` más `overflow: hidden`. Con eso la imagen hereda las esquinas superiores sin tocar `.product-image`, y el zoom `scale(1.04)` de [L186](styles.css#L186) sigue recortado correctamente.
- `.location-card` y `.featured-location`: `18px`.
- `.map-panel`: `26px`. Ya tiene `overflow: hidden`, así que una sola línea redondea también el iframe.
- `.button` y `.button-yellow`: `12px`. `.order-button`: `8px`.
- `.floating-whatsapp`: `999px`, píldora, con padding `.85rem 1.15rem`.
- `.product-tag` y `.availability`: `3px`.
- `.hero-note`: `0 18px 18px 0`, para mantener plano el filo del `border-left` y curvar solo los cantos libres. Radio asimétrico justificado, no decorativo.
- `.skip-link`: `0 0 12px 12px`.

##### G3. Seis bandas a sangre con seis cortes horizontales perfectamente rectos

Evidencia: la página es una pila de franjas de ancho completo que cambian de fondo sin ninguna transición de forma: `.hero` [L44](styles.css#L44), `.sign-band` [L74](styles.css#L74), `.catalog` [L81](styles.css#L81), `.story` [L120](styles.css#L120), `.locations` [L135](styles.css#L135), `.site-footer` [L163](styles.css#L163).

Impacto: seis líneas horizontales de 100 % de ancho y 0 px de radio dominan la silueta de la página. Aunque se redondeen todas las tarjetas, el esqueleto seguirá leyéndose como franjas de dashboard, porque la estructura mayor es la que define la forma percibida. Este es el hallazgo que más explica la sensación de "muy cuadrado".

Recomendación: elegir una o dos opciones, no las tres.

1. **Bandas con hombros**, la más segura: `border-radius: 40px 40px 0 0` en `.story` y `.site-footer`, y `0 0 40px 40px` en `.locations`. Coste: dos líneas. Riesgo nulo.
2. **Separador de corteza**: pseudo-elemento en `.sign-band` con `border-radius: 0 0 50% 50% / 0 0 26px 26px` y `margin-bottom: -26px`, para que la franja coral gotee sobre el catálogo.
3. **Máscara orgánica**: `clip-path` de 6 a 8 vértices con desviación máxima de 18 px en el borde superior de `.story`. Riesgo medio: hay que comprobar que no recorte el `padding: 8rem 0` de `.section-pad` ni el texto en móvil, donde baja a `5.5rem` ([L209](styles.css#L209)).

#### Medio

##### G4. Retícula rígida de 4 columnas con 9 tarjetas: fila huérfana y módulo único

Evidencia: `.product-grid` [L93](styles.css#L93) usa `repeat(4, 1fr)` frente a las 9 tarjetas de [index.html](index.html#L94-L102), todas con el mismo `aspect-ratio: 4 / 3` ([L98](styles.css#L98)).

Impacto: 4 + 4 + 1 deja la última tarjeta sola con tres huecos vacíos a su derecha. Al filtrar "Dulces y galletas" (2 productos) o "Bebidas frías" (1 producto), la fila queda casi vacía pero conserva el ancho de columna de cuatro. Y como los nueve módulos son idénticos, ningún producto se lee como destacado.

Recomendación: `repeat(auto-fill, minmax(260px, 1fr))` para que la fila se recomponga al filtrar. Además, dar a una o dos tarjetas de la categoría "Todo" un módulo distinto (`grid-column: span 2` con `aspect-ratio: 16/10` en su imagen). Alternativa de menor riesgo: alternar un radio asimétrico en una de cada cuatro tarjetas para introducir irregularidad de horno sin tocar el layout.

##### G5. Una sola sombra difusa replicada, con cuatro tintes incoherentes

Evidencia: `--shadow: 0 18px 38px rgba(58, 40, 34, .14)` ([L12](styles.css#L12), tinte marrón correcto) conviven con `.hero-note` `rgba(58,40,34,.1)` ([L70](styles.css#L70)), `.filter-bar` `rgba(25, 52, 59, .06)` ([L87](styles.css#L87), **azul petróleo**), `.product-card:hover` `rgba(39, 49, 42, .16)` ([L185](styles.css#L185), **verde**) y `.floating-whatsapp` `rgba(0, 0, 0, .18)` ([L173](styles.css#L173), **negro puro**).

Impacto: cuatro familias de sombra, dos con tintes fríos heredados de la paleta anterior que ya no existe en `:root`. Y todas son sombras grandes y difusas de tipo elevación material: ese es justamente el lenguaje de un dashboard. Una vitrina artesanal necesita sombras cortas y cálidas que sugieran contacto con una superficie, no flotación.

Recomendación: tokenizar tres niveles y eliminar los tintes fríos.

- `--shadow-contact: 0 2px 6px rgba(58, 40, 34, .10)` para tarjetas en reposo.
- `--shadow-lift: 0 10px 22px rgba(58, 40, 34, .14)` para hover, sustituyendo [L185](styles.css#L185).
- `--shadow-float: 0 10px 28px rgba(58, 40, 34, .20)` para el botón flotante y el menú móvil.

Bajar el desenfoque base de 38 px a 6–10 px es el cambio que más rápido mueve la percepción de "panel" a "objeto sobre una mesa".

##### G6. Conflicto de forma en la mascota: aro punteado sobre PNG transparente

Evidencia: `.mascot-slot` [L166](styles.css#L166) declara `overflow: hidden` y `border: 1px dashed`; `.mascot-hero` [L168](styles.css#L168) solo cambia el color del borde, **no el estilo**, así que sigue siendo punteado. El contenido es un PNG recortado con `object-fit: contain` ([L167](styles.css#L167)).

Impacto: un aro punteado alrededor de una ilustración recortada se lee como marco de placeholder sin terminar, no como sello de marca. Además `overflow: hidden` con `border-radius: 50%` recorta las extremidades de la ilustración en las cuatro diagonales, y con `contain` a 88 px queda mucho aire vacío dentro del círculo.

Recomendación: quitar el borde y poner el círculo como fondo, `radial-gradient(circle, rgba(215, 155, 74, .18) 62%, transparent 63%)`, subiendo el tamaño a 104 px en el hero y 72 px en el footer. Si se quiere un blob orgánico detrás, **no puede colgar de `.mascot-slot`** porque su `overflow: hidden` lo recortaría: hay que colgarlo de `.hero-content` ([L48](styles.css#L48), ya es `position: relative`) con radio multivalor, `filter: blur(14px)` y `opacity: .35`.

##### G7. El panel del mapa es la esquina más dura del sitio y cuesta una línea

Evidencia: `.map-panel` [L154](styles.css#L154) con `min-height: 330px` y borde de 1 px, su iframe [L156](styles.css#L156), la capa de carga [L155](styles.css#L155) y `.map-link` [L158](styles.css#L158).

Impacto: un bloque de 330 px de alto con contenido cartográfico a escuadra, junto a una `.location-card` también a escuadra: el par domina la sección Locales con dos rectángulos de esquina viva.

Recomendación: `border-radius: 26px` en `.map-panel`. El `overflow: hidden` ya existente propaga el recorte al iframe, al estado de carga y al fallback. Y `999px` en `.map-link`, para que la píldora contraste con el panel curvo.

##### G8. Ausencia total de recursos de forma propios del oficio

Evidencia: 7 coincidencias de `border-radius|clip-path|mask|border-image` en todo [styles.css](styles.css), de las cuales 6 son los radios del inventario y 1 es accesibilidad. No hay radios multivalor, ni máscaras, ni gradientes usados como forma, ni elementos rotados, ni sellos.

Impacto: no hay un solo gesto de forma que hable de masa, harina, corteza o trabajo manual. Toda la identidad artesanal recae en la tipografía y la paleta; la geometría trabaja en contra.

Recomendación: cuatro piezas bastan, y no conviene añadir más para no caricaturizar.

1. **Radio de masa** en `.story-photo img` ([L123](styles.css#L123)): `58% 42% 52% 48% / 46% 54% 46% 54%`. La única imagen grande del sitio pasa de rectángulo a forma orgánica. Es el gesto con mejor relación impacto/riesgo.
2. **Sello girado** en `.product-tag` ([L106](styles.css#L106)): círculo de 58 px con `place-items: center` y `rotate(-8deg)`. Aplicarlo solo a las tarjetas que hoy llevan etiqueta, para que funcione como distintivo escaso.
3. **Cinta con esquina cortada** en `.image-caption` ([L124](styles.css#L124)): `12px 12px 12px 0`, con el vértice recto apuntando a la foto.
4. **Separador curvo** entre la franja de identidad y el catálogo, según G3.

#### Bajo

##### G9. El radio de 2 px de `.nav-cta` es peor que 0

Evidencia: [styles.css](styles.css#L36), único radio no circular del archivo.

Impacto: a tamaño de botón, 2 px es imperceptible, así que no aporta suavidad pero sí rompe la coherencia. Es la firma típica de un valor puesto a mano y olvidado.

Recomendación: igualarlo al radio de `.button-yellow` para que las dos llamadas a la acción de la parte superior compartan silueta.

##### G10. Los chips de filtro se leen como pestañas de dashboard

Evidencia: `.filter` [L88](styles.css#L88) sin radio, con estado activo en [L89](styles.css#L89), dentro de un `.filter-bar` sticky con filetes de 1 px arriba y abajo ([L87](styles.css#L87)).

Impacto: cinco rectángulos en una barra fija con dos filetes horizontales es, literalmente, una barra de pestañas de aplicación. Es el componente que más aleja la sección del registro de vitrina.

Recomendación: `border-radius: 999px` en `.filter` y mantener `.filter-bar` **sin** radio. Una barra sticky con esquinas redondeadas se ve flotando mal al pegarse al borde superior; el contraste de barra recta con píldoras curvas es el correcto.

##### G11. El anillo de foco es cuadrado porque los elementos lo son

Evidencia: [styles.css](styles.css#L177) usa `outline` con `outline-offset` y un `box-shadow` amarillo de 5 px; el equivalente de los filtros está en [L91](styles.css#L91).

Impacto: un halo amarillo perfectamente cuadrado alrededor de cada enlace refuerza la retícula justo en el momento de mayor atención visual.

Recomendación: no hay que tocar nada. Tanto `outline` como `box-shadow` siguen el `border-radius` del elemento, así que al aplicar G2 el anillo se curva solo. La única excepción a revisar es `.text-link` ([L66](styles.css#L66)), que usa `border-bottom` como subrayado y quedaría con anillo curvo sobre filete recto: ahí conviene `4px 4px 0 0`.

##### G12. Las marcas circulares no tienen relación de escala entre sí

Evidencia: `.status-dot` 8 px, `.brand-mark` 31 px, `.sign-mark` 38 px, `.mascot-footer` 64 px, `.mascot-hero` 88 px.

Impacto: cinco diámetros sin progresión reconocible. No se percibe como error, pero impide que los círculos se lean como una familia de sellos.

Recomendación: llevarlos a una escala de 1,5×: 8 / 12 / 32 / 48 / 72 / 104 px.

### Eje B — Variedad y semántica de las animaciones

#### Alto

##### M1. Existe un único patrón de entrada, repetido tres veces con distinta amplitud

Evidencia: los tres mecanismos de entrada son geométricamente idénticos, opacidad 0→1 más `translateY` positivo→0.

- `.reveal` [L179](styles.css#L179): `translateY(22px)` en 700 ms.
- `@keyframes hero-item-enter` [L55](styles.css#L55): `translateY(8px)`.
- `@keyframes catalog-enter` [L97](styles.css#L97): **el mismo contenido byte por byte** que el anterior; solo cambian el nombre y la duración.

Y [script.js](script.js#L106) aplica ese patrón único a seis tipos de componente muy distintos de una sola vez: `.section-heading`, `.product-card`, `.story-photo`, `.story-copy`, `.location-card`, `.map-panel`.

Impacto: la percepción de que "todo tiene la misma animación" es correcta y verificable. Hay dos `@keyframes` con contenido idéntico y una transición que gobierna seis componentes heterogéneos. Un titular editorial, una fotografía en retrato, una tarjeta de producto y un mapa embebido entran exactamente igual. El movimiento no informa de nada: no distingue jerarquía, ni tipo de contenido, ni dirección de lectura. Como la única variable que cambia es el retraso ([L181](styles.css#L181)), la página se percibe como una sola cortina que sube seis veces.

Recomendación: conservar `.reveal` como patrón **por defecto**, pero dejar de usarlo como patrón **único**. Sustituir la lista plana de [script.js](script.js#L106) por un mapa de zona a clase y definir un `@keyframes` propio por zona, según la tabla de más abajo. Las dos keyframes idénticas deben fusionarse en una sola con amplitud por variable: `@keyframes rise { from { opacity: 0; transform: translateY(var(--rise, 8px)); } to { opacity: 1; transform: none; } }`.

##### M2. No existe vocabulario de easing: las 11 declaraciones usan `ease`

Evidencia: [L39](styles.css#L39), [L45](styles.css#L45), [L49](styles.css#L49), [L95](styles.css#L95), [L96](styles.css#L96), [L99](styles.css#L99), [L101](styles.css#L101), [L104](styles.css#L104), [L173](styles.css#L173), [L174](styles.css#L174), [L179](styles.css#L179), [L198](styles.css#L198). Ningún `cubic-bezier` en todo el proyecto; [script.js](script.js) no define ninguna curva.

Impacto doble:

1. **Semántico**: no hay diferencia de curva entre una entrada, que debería desacelerar, una salida, que debería acelerar, un hover, que debería responder de inmediato, y una microinteracción. Todo se siente igual aunque las duraciones difieran.
2. **Perceptivo**: `ease` equivale a `cubic-bezier(.25, .1, .25, 1)`, una curva simétrica que arranca despacio. En un movimiento de 700 ms como el de `.reveal`, los primeros 150 ms apenas hay desplazamiento, así que el reveal se percibe como retraso y no como entrada. Es la causa técnica de que el sitio se sienta a la vez monótono y algo lento.

Recomendación: cinco tokens en `:root`, y prohibir `ease` a partir de ahí.

| Token | Valor | Uso |
|---|---|---|
| `--ease-out` | `cubic-bezier(.16, 1, .3, 1)` | todas las entradas |
| `--ease-in` | `cubic-bezier(.4, 0, 1, 1)` | salidas: cierre de menú, productos que se filtran |
| `--ease-ui` | `cubic-bezier(.2, 0, 0, 1)` | hover y foco |
| `--ease-soft` | `cubic-bezier(.22, 1, .36, 1)` | secuencias editoriales: historia, principios |
| `--ease-accent` | `cubic-bezier(.34, 1.24, .64, 1)` | un solo acento con rebote mínimo, nunca dos |

##### M3. El hook de animación del filtrado está muerto: `.is-filtering` no existe en el CSS

Evidencia: [script.js](script.js#L41) añade `is-filtering` y [script.js](script.js#L65) la quita. La clase aparece 2 veces en el proyecto, ambas en el JS, y **0 veces en [styles.css](styles.css)**.

Impacto: el cambio de categoría solo anima la **entrada** de los productos que quedan visibles. Los que salen desaparecen de golpe, porque `product.hidden` ([script.js](script.js#L44)) junto con `.product-card[hidden] { display: none }` ([L94](styles.css#L94)) es un corte seco. El resultado es asimétrico: nada se va, todo aparece. La recomendación de la primera ronda, aplicar una clase temporal durante el cambio, está implementada a medias: existe el JS, falta el CSS. Y el `setTimeout` de 700 ms de [script.js](script.js#L67) mantiene durante todo ese tiempo una clase que no hace nada.

Recomendación: definir el estado de salida en el CSS, junto a `catalog-enter`.

```css
.product-grid.is-filtering .product-card { opacity: .35; transform: scale(.985); transition: opacity .16s var(--ease-in), transform .16s var(--ease-in); }
.product-grid.is-filtering .product-card.catalog-enter { opacity: 1; transform: none; }
```

Y bajar el `setTimeout` de 700 ms a unos 640 ms, o mejor sustituirlo por un `animationend` en la última tarjeta para eliminar el número mágico.

#### Medio

##### M4. `.order-button` es el único elemento con `transform` y sin transición

Evidencia: el hover de [L118](styles.css#L118) aplica `translateY(-2px)` y cambia el fondo, pero la lista de transiciones de [L174](styles.css#L174) **no incluye `.order-button`**, y [L117](styles.css#L117) no declara transición propia.

Impacto: el botón "Pedir", la conversión principal del catálogo y repetido nueve veces, salta 2 px y cambia de color de forma instantánea mientras el resto de la interfaz responde en 200 ms. Es un defecto puntual, no una preferencia: rompe la familia de microinteracciones exactamente en el elemento más pulsado.

Recomendación: añadir `.order-button` a la lista de [L174](styles.css#L174), o declararle su propia transición con `--ease-ui`.

##### M5. Tres grupos de hover cambian de color sin transición

Evidencia: los enlaces de navegación y de footer ([L35](styles.css#L35) sobre [L34](styles.css#L34) y [L171](styles.css#L171)) y los filtros ([L89](styles.css#L89) sobre [L88](styles.css#L88)) no declaran transición. Solo la tienen los cinco selectores de [L174](styles.css#L174).

Impacto: conviven dos sistemas de respuesta. Cuando el puntero recorre la navegación superior, el amarillo aparece y desaparece de golpe sobre la fotografía del hero, lo que acentúa el problema de contraste ya identificado en la primera ronda.

Recomendación: ampliar [L174](styles.css#L174) a `.main-nav a`, `.footer-links a` y `.filter` con 160 ms y `--ease-ui`. El estado `:checked` del filtro debe usar una duración mayor, unos 280 ms, porque es un cambio de estado y no un hover: dos duraciones distintas para dos semánticas distintas dentro del mismo componente.

##### M6. Cinco zonas quedan fuera del sistema de movimiento sin criterio explícito

Evidencia: [script.js](script.js#L106) enumera seis selectores. Quedan sin ninguna entrada `.sign-band` ([L74](styles.css#L74)), `.principles` ([L129](styles.css#L129)), `.site-footer` ([L163](styles.css#L163)), `.filter-bar` ([L87](styles.css#L87)) y `.hero-note` ([L70](styles.css#L70)).

Impacto: la página alterna bloques que entran con bloques que ya están ahí, y la alternancia no responde a ninguna lógica de jerarquía: la franja de identidad, que es un mensaje de marca, no se mueve, pero el panel del mapa sí. El caso más visible es `.principles`: son tres bloques numerados 01, 02 y 03 dentro de `.story-copy`, que entra como un bloque único, de modo que los tres aparecen a la vez y el movimiento contradice la lectura secuencial que propone el contenido.

Recomendación: decidir explícitamente zona por zona. `.principles` y `.sign-band` **deben** entrar, con patrones propios. `.site-footer`, `.filter-bar` y `.hero-note` **no deben** entrar, y conviene dejarlo escrito en un comentario del CSS para que no se añadan por inercia en la próxima iteración.

##### M7. Se anima `transform` sobre un contenedor con iframe

Evidencia: `.map-panel` está en la lista de [script.js](script.js#L106), así que recibe `.reveal` con `translateY(22px)` durante 700 ms ([L179](styles.css#L179)). El iframe está en [index.html](index.html#L111) y su CSS en [L156](styles.css#L156), con un `filter: sepia(.2) saturate(.7)`.

Impacto: transformar un contenedor que aloja un documento embebido fuerza su recomposición durante 700 ms, acumulado con un `filter` que ya obliga a un pase extra de pintado y con la textura fija de `body::before` ([L20](styles.css#L20)). En equipos modestos es la peor combinación de la página. Además el mapa suele entrar en viewport todavía en estado `is-loading`, así que se anima un panel vacío.

Recomendación: excluir `.map-panel` de `.reveal` y darle una clase propia que anime **solo opacidad**. La `.location-card` contigua conserva el desplazamiento y el desfase entre ambas sigue funcionando.

##### M8. `box-shadow` en transición en tres puntos

Evidencia: `.product-card` ([L95](styles.css#L95)) con el hover de [L185](styles.css#L185), `.floating-whatsapp` ([L173](styles.css#L173)) y los cinco selectores de [L174](styles.css#L174).

Impacto: interpolar `box-shadow` obliga a repintar en cada fotograma el área desenfocada. Con un desenfoque de 42 px y nueve tarjetas es el efecto más caro del sitio.

Recomendación: mover la sombra de hover a un pseudo-elemento y animar `opacity`, que es una propiedad de composición.

```css
.product-card { position: relative; }
.product-card::after { content: ''; position: absolute; inset: 0; border-radius: inherit; box-shadow: var(--shadow-lift); opacity: 0; transition: opacity .2s var(--ease-ui); pointer-events: none; }
.product-card:hover::after { opacity: 1; }
```

El `border-radius: inherit` liga este arreglo a G2: los dos ejes se resuelven en el mismo bloque.

##### M9. `prefers-reduced-motion` se lee una vez y nunca se vuelve a consultar

Evidencia: [script.js](script.js#L35) crea el `matchMedia` y lo consulta en las líneas 41, 47, 63 y 112. No existe ningún `addEventListener('change', ...)`.

Impacto: si el usuario activa la reducción de movimiento a mitad de sesión, el `IntersectionObserver` sigue vivo y sigue añadiendo clases. Hoy no se rompe nada solo porque el bloque CSS de [L225-L231](styles.css#L225-L231) es agresivo, no por diseño del JS. Más importante: [L228](styles.css#L228) enumera las clases **a mano**, así que cada patrón nuevo tendría que añadirse ahí.

Recomendación: añadir el listener `change` que marque todo como visible y desconecte el observer, y sustituir la lista manual de [L228](styles.css#L228) por un selector estructural, por ejemplo `[data-motion]`, para que la neutralización no quede obsoleta al crecer el sistema.

#### Bajo

##### M10. Direccionalidad casi nula: 10 de los 11 movimientos ocurren en el eje Y

Evidencia: `translateY` en [L179](styles.css#L179), [L49](styles.css#L49), [L55](styles.css#L55), [L97](styles.css#L97), [L118](styles.css#L118), [L175](styles.css#L175), [L184](styles.css#L184), [L185](styles.css#L185) y en el icono de menú ([L40](styles.css#L40), [L42](styles.css#L42)). El único movimiento que llega desde arriba es el menú móvil. No hay ni un `translateX`, la única escala es el zoom `1.04` de imagen y la única rotación son los 45° de la hamburguesa.

Impacto: no hay variedad ni siquiera de eje dentro del único patrón existente. Todo sube. Esto refuerza la lectura de cortina única y desperdicia la dirección como recurso para describir la forma de cada zona: una franja horizontal pide movimiento horizontal, una foto en retrato pide revelado por máscara.

Recomendación: introducir eje X solo en dos sitios, la franja de identidad y el texto de la historia, y revelado por máscara en uno, la foto de la historia. Tres excepciones bastan para romper la monotonía sin convertir el sitio en un carrusel de efectos.

##### M11. El stagger del hero está acoplado a `nth-child` 1..5

Evidencia: [L50-L54](styles.css#L50-L54) declara retrasos para los cinco primeros hijos, y `.hero-content` tiene exactamente cinco ([index.html](index.html#L65-L69)).

Impacto: hoy funciona, pero un sexto elemento heredaría `animation-delay: 0ms` y entraría antes que el título, invirtiendo la jerarquía sin que nada lo señale. Además la amplitud es idéntica para los cinco: el titular de `clamp(4rem, 8vw, 7rem)` se mueve los mismos 8 px que el eyebrow de `.7rem`, así que visualmente el titular parece no moverse.

Recomendación: pasar el retraso a una variable asignada desde JS, como ya se hace con `--reveal-delay` ([script.js](script.js#L109)), y escalar la amplitud con el peso tipográfico: eyebrow 6 px, título 16 px, copy 10 px, acciones 8 px.

##### M12. `scroll-behavior: smooth` es la única animación de navegación y no es controlable

Evidencia: [styles.css](styles.css#L18). Los anclajes son `#catalogo`, `#historia`, `#locales` e `#inicio`, y el CTA principal del hero apunta a `#catalogo` ([index.html](index.html#L69)).

Impacto: la animación más larga y más visible del sitio, recorrer varias pantallas hasta el catálogo, tiene curva y duración decididas por el navegador, ajenas al sistema. Con el `padding: 8rem 0` de `.section-pad` el recorrido es muy largo.

Recomendación: mantener `scroll-behavior: smooth`, que ya está correctamente anulado bajo movimiento reducido, pero añadir `scroll-margin-top: 96px` a las secciones con `id` para compensar el header de 86 px ([L30](styles.css#L30)) y evitar que el titular quede debajo de la barra al terminar el desplazamiento.

##### M13. Detalles verificados como correctos

No requieren acción y conviene no "arreglarlos".

- La transición de `visibility` en `.main-nav` ([L198](styles.css#L198)) es correcta: interpola de forma discreta y mantiene el panel visible durante el cierre. No hace falta el truco de `visibility 0s .2s`.
- `animation-iteration-count: 1 !important` ([L227](styles.css#L227)) ya neutraliza cualquier bucle futuro bajo movimiento reducido: la base para el pulso del indicador de frescura está protegida.
- Todo el movimiento actual usa solo `transform`, `opacity`, `color`, `background-color` y `box-shadow`. No se anima `width`, `height`, `top` ni `margin`. Es la parte más sana del sistema y debe mantenerse como regla.
- `.hero-content.is-ready` se añade desde JS ([script.js](script.js#L110)), así que sin JS el hero es visible. La mejora progresiva está bien resuelta y los patrones nuevos deben seguir el mismo criterio.

### Mapa de animación por zona

Principio rector: **una animación dominante por zona**, y una sola excepción de acento con rebote en todo el sitio.

| Zona | Patrón propuesto | Propiedad | Duración | Easing | Retraso | Por qué encaja ahí | Riesgo |
|---|---|---|---|---|---|---|---|
| Hero, imagen | Asentamiento: la foto se posa | opacidad `.78→1` y `scale(1.035)→1` | 1200 ms | `--ease-out` | 0 | Ocupa el 52 % del ancho: no puede desplazarse sin descuadrar el overlay. Ya existe la transición de opacidad, es un cambio de una línea | Medio |
| Hero, contenido | Stagger actual, con amplitud proporcional al peso tipográfico | opacidad y `translateY` de 6/16/10/8 px | 550 ms | `--ease-out` | 0/70/140/220/300 ms | Conserva la narración ya implementada y corrige M11 | Bajo |
| Mascota | **Acento único**: amasado, inclinación que se endereza | `rotate(-3.5deg)→0` y `scale(.96)→1` | 700 ms | `--ease-accent` | 180 ms | Es el único elemento ilustrado del sitio: concentrar aquí el único rebote le da un protagonismo que ningún otro elemento reclama | Medio |
| Franja de identidad | Apertura: la franja se despliega en altura, sello desde la izquierda y nota desde la derecha | `clip-path` en la franja, `translateX(∓12px)` en los hijos | 600 / 420 ms | `--ease-soft` | 0 / 120 / 180 ms | Es una franja horizontal a sangre: el movimiento horizontal describe su forma y se lee como un cartel que se despliega. Hoy no tiene animación | Bajo |
| Filtros | Sin entrada. Indicador de píldora que se desplaza al cambiar de categoría | `translateX` y ancho de un `::after` | 220 ms | `--ease-ui` | 0 | Es un control, no contenido: debe sentirse mecánico. Animar su entrada retrasaría el acceso al catálogo, y es sticky, así que reaparece constantemente | Bajo |
| Catálogo, grilla | Horneado: mismo fade con escala mínima y **stagger diagonal** por fila más columna | opacidad, `translateY(10px)`, `scale(.985)→1` | 420 ms | `--ease-out` | `(fila+col) × 40 ms`, máx. 320 ms | El stagger lineal actual recorre las tarjetas como celdas de una tabla y refuerza el aspecto de dashboard; la diagonal se lee como una bandeja que se llena | Medio |
| Catálogo, cambio de categoría | Cross-fade real: salida acelerada y entrada decelerada | salientes opacidad `.35` y `scale(.98)`; entrantes opacidad y `translateY(8px)` | 160 / 260 ms | `--ease-in` y `--ease-out` | 40 ms de stagger en la entrada | Es el único lugar del sitio con una salida real, y hoy no existe (M3). Usar dos curvas distintas aquí es lo que enseña al ojo que el sistema tiene gramática | Bajo |
| Tarjeta, hover | Conservar elevación y zoom, cambiar curva y mover la sombra a `::after` | `translateY(-5px)`, opacidad del `::after`, `scale(1.04)` | 200 ms | `--ease-ui` | 0 | Es una microinteracción: la respuesta más rápida del sistema y la que menos debe repintar (M8) | Bajo |
| Historia, foto | **Revelado por máscara**: se descubre de abajo arriba mientras se asienta | `clip-path: inset(0 0 14% 0)→inset(0)` y `scale(1.03)→1` | 900 ms | `--ease-out` | 0 | Única sección oscura y editorial, con foto en retrato. El revelado por máscara se lee como un corte de pan y es el patrón que más diferencia esta zona | Medio |
| Historia, texto | Entrada lateral, después de la foto | opacidad y `translateX(18px)→0` | 700 ms | `--ease-soft` | 140 ms tras la foto | La rejilla es de dos columnas: mover el texto en X refuerza la relación foto→texto y resuelve el desfase pendiente de la primera ronda | Bajo |
| Principios 01·02·03 | Conteo secuencial: el filete crece y cada número escala | `scaleX(0)→1` de un `::before`, opacidad y `scale(.85)→1` del número | 500 ms | `--ease-soft` | 110 ms entre bloques | El contenido es explícitamente una secuencia numerada; hoy los tres aparecen a la vez. El movimiento debe comunicar orden, no aparición | Bajo |
| Locales, tarjeta | Fade-up estándar, el patrón por defecto | opacidad y `translateY(18px)` | 600 ms | `--ease-out` | 0 | Es contenido informativo: aquí la variedad no aporta, y el patrón por defecto hace de línea base contra la que se perciben los patrones especiales | Bajo |
| Locales, mapa | **Solo opacidad**, sin `transform` | opacidad | 500 ms | `--ease-out` | 120 ms tras la tarjeta | Resuelve M7: no se recompone el iframe. Y la ausencia de desplazamiento hace que el mapa se sienta anclado al territorio | Bajo |
| Indicador de frescura | Pulso de halo, **único bucle del sitio** | `scale(1)→2.2` y opacidad `.35→0` de un `::after` | 2400 ms, infinito | `ease-out` | 0 | El aviso de recién salido del horno es la única afirmación en tiempo real de la página; un latido lo hace creíble | Medio-alto |
| Navegación de escritorio | Subrayado que crece desde la izquierda, sin desplazamiento | `scaleX(0)→1` de un `::after` de 1 px, y color | 180 ms | `--ease-ui` | 0 | El header es absoluto sobre la fotografía: cualquier desplazamiento de los enlaces agravaría el problema de contraste. Un subrayado no mueve la caja | Bajo |
| Menú móvil | Conservar `translateY(-8px)` y nacer de la esquina del botón | opacidad, `translateY(-8px)`, `scale(.98)→1` con `transform-origin: top right` | 200 ms entrada / 160 ms salida | `--ease-ui` y `--ease-in` | 0 | El panel está anclado bajo el botón: nacer de esa esquina establece la relación causal. Es el caso didáctico de easing asimétrico | Bajo |
| Botón flotante | Entrada diferida, una sola vez | opacidad y `scale(.9)→1` | 300 ms | `--ease-out` | 1200 ms tras la carga | No debe competir con la entrada del hero; aparecer después lo convierte en invitación en lugar de mobiliario | Bajo |
| Footer | **Sin entrada.** Solo microinteracción de color en los enlaces | color | 160 ms | `--ease-ui` | — | Es el cierre de lectura y suele entrar en viewport a media velocidad de scroll: animarlo añade coste sin comunicar nada | Ninguno |

### Escala de radios propuesta

| Token | Valor | Uso |
|---|---|---|
| `--r-hair` | `3px` | `.product-tag`, `.availability` |
| `--r-chip` | `8px` | `.order-button`, `.location-index` si recibe fondo |
| `--r-btn` | `12px` | `.button`, `.button-yellow`, `.nav-cta` (sustituye el `2px`), `.skip-link` como `0 0 12px 12px`, `.text-link` como `4px 4px 0 0` |
| `--r-card` | `18px` | `.product-card` con `overflow: hidden`, `.location-card`, `.featured-location`, `.main-nav` móvil, `.hero-note` como `0 18px 18px 0`, `.image-caption` como `12px 12px 12px 0` |
| `--r-panel` | `26px` | `.map-panel` (ya tiene `overflow: hidden`, redondea el iframe sin regla extra), `.story-photo`, `.image-unavailable` |
| `--r-band` | `40px` | Esquinas superiores de `.story` y `.site-footer`, inferiores de `.locations`. Rompe las seis bandas rectas de G3 |
| `--r-pill` | `999px` | `.filter`, `.floating-whatsapp`, `.map-link` |
| `--r-circle` | `50%` | Ya en uso y correcto: `.brand-mark`, `.status-dot`, `.sign-mark`, `.mascot-hero`, `.mascot-footer` |
| `--r-dough` | `62% 38% 55% 45% / 45% 55% 38% 62%` | Uso escaso: blob difuminado detrás de la mascota, colgado de `.hero-content` y no de `.mascot-slot` |
| `--r-mass` | `58% 42% 52% 48% / 46% 54% 46% 54%` | Uso único: `.story-photo img`. Es el gesto orgánico principal; repetirlo lo banaliza |

Regla de anidamiento para evitar esquinas en conflicto: radio interior igual a radio exterior menos el padding. Como `.product-image` va a sangre dentro de `.product-card`, la solución correcta no es darle su propio radio, sino `overflow: hidden` en la tarjeta. Y las sombras de hover deben usar `border-radius: inherit`, o dibujarán un halo cuadrado alrededor de una caja curva.

### Dónde no conviene añadir variedad

1. **Tarjetas del catálogo: un solo patrón, siempre.** Son nueve elementos simultáneos. Dar a cada tarjeta un patrón distinto produce ruido. La variedad debe estar en el stagger, no en el patrón.
2. **Ningún segundo bucle infinito.** El pulso del indicador de frescura debe ser el único. Cualquier bucle adicional, mascota respirando, flecha rebotando o brillo en el botón flotante, suma repintado permanente y compite con la textura fija de `body::before`, que ya es una capa a pantalla completa que se recompone en cada scroll.
3. **Nada ligado al scroll**, ni parallax ni animación scroll-driven. Además del riesgo ya señalado en la primera ronda, la razón técnica concreta es la combinación de esa textura fija con el `filter` del iframe del mapa. Y `scroll-behavior: smooth` ya introduce movimiento durante la navegación por anclas.
4. **Navegación superior sin desplazamiento.** El header es absoluto sobre la fotografía; mover enlaces sobre un fondo de contraste variable agrava la legibilidad.
5. **Barra de filtros sin animación de entrada.** Es `position: sticky; top: 0`: un elemento que reaparece constantemente no debe animarse al reaparecer.
6. **Nada de texto palabra por palabra ni máquina de escribir.** Además del riesgo de mareo, `body` tiene `user-select: none`: un texto que además aparece fragmentado se percibe como no disponible.
7. **Movimiento reducido.** El bloque actual aplica la neutralización correcta, pero enumera las clases a mano: cada patrón nuevo debe añadirse ahí o, mejor, migrar a un selector estructural. Los patrones con `clip-path` son los más peligrosos: si el estado inicial se declara en el CSS base, un fallo de JS dejaría la franja o la foto **invisibles**. Regla obligatoria: el estado oculto se añade siempre desde JS, como ya se hace con `.reveal` y con `.is-ready`.
8. **Botón flotante: nunca desplazamiento en hover.** Está anclado al borde inferior con `safe-area-inset`; moverlo verticalmente cerca del gesto de inicio se siente inestable y aumenta el riesgo de toque errado.

Sobre los tokens: sí hacen falta. Hoy hay 8 duraciones y 1 sola curva repartidas entre 12 declaraciones de CSS, más 4 constantes numéricas en el JS. Sin tokens, el mapa de arriba es inmantenible: cada zona añadiría dos o tres valores nuevos y el sistema pasaría de 8 duraciones a unas 20. Con `--dur-*` y `--ease-*` en `:root`, el mapa se expresa como composición de 6 duraciones por 5 curvas, y la regla de una animación dominante por zona se vuelve verificable: si una zona necesita más de un `@keyframes`, es señal de sobre-animación.

### Orden de aplicación sugerido

Por relación entre impacto percibido y riesgo:

1. Tokens de radio, easing, duración y sombra en `:root`. Sin esto, todo lo demás se dispersa.
2. G2 y G7: radios de tarjetas, botones, panel del mapa y botón flotante. Es el cambio que más rápido quita la sensación de cuadrado.
3. G3 opción 1: hombros de 40 px en las bandas. Dos líneas, riesgo nulo, cambia la silueta de toda la página.
4. M2: sustituir `ease` por `--ease-out` en las entradas. Sin tocar ninguna estructura, el movimiento deja de sentirse lento.
5. M3, M4 y M5: cerrar los tres defectos concretos de microinteracción, incluido el hook muerto del filtrado.
6. G5 y M8: sombras cálidas de contacto y hover mediante `opacity` de un pseudo-elemento.
7. M1 y M6: mapa de zona a clase en el JS, con los patrones diferenciados de historia, principios, franja de identidad y mapa.
8. G8 y el acento de la mascota: los gestos orgánicos, solo al final y de forma escasa.
9. Opcional y evaluable aparte: pulso del indicador de frescura, y G4, el módulo destacado del catálogo.

### Preguntas abiertas de esta ronda

1. ¿Existe una referencia física, rótulo del local, bolsas o etiquetas, que fije un radio o una forma? Antes de inventar la escala conviene copiar la geometría del rótulo real.
2. ¿Se aceptan formas orgánicas, radios multivalor y `clip-path`, o se prefiere una lectura más sobria? Con G3 opción 1 más G2 ya se resuelve la mayor parte de la sensación de cuadrado, sin ningún gesto orgánico.
3. ¿Cuál es el soporte mínimo de navegador? El `clip-path` animado de la franja de identidad depende de ello.
4. ¿Los nueve productos son el catálogo definitivo? El número condiciona la fila huérfana de G4 y el stagger diagonal.
5. ¿Se puede reescribir la lista plana de `revealItems` en [script.js](script.js#L106)? Todo el Eje B depende de sustituirla por un mapa de zona a clase; si el JS debe quedar congelado, la variedad tendría que lograrse solo con selectores por sección, que es más frágil.

## Tercera ronda: paleta, color e imágenes

Fecha de revisión: 2026-09-23. Esta ronda nace de una observación externa: la paleta debería tener como máximo cinco colores, tres principales y dos secundarios, y el color primario de marca debería ocupar los elementos dominantes, los encabezados principales, los CTA clave y el logotipo, siguiendo la regla 60-30-10.

La conclusión es que el sitio no cumple ninguna de las dos reglas, y que la causa no es el gusto sino la acumulación: la paleta creció por añadidos sueltos y nunca se consolidó.

### Inventario de color

En [styles.css](styles.css) hay **18 valores hexadecimales distintos y 9 bases `rgb` distintas**, es decir, alrededor de 27 colores frente a los 5 que pide la regla. Solo 10 están declarados como token en `:root`; el resto son valores escritos a mano dentro de las reglas.

| Token | Valor | Tono real | Observación |
|---|---|---|---|
| `--cream` | `#f7f1e7` | crema cálido | Fondo dominante. Correcto. |
| `--paper` | `#fffdf8` | blanco cálido | Superficies elevadas. Correcto. |
| `--ink` | `#3a2822` | marrón muy oscuro | **Idéntico a `--petroleum`.** |
| `--petroleum` | `#3a2822` | marrón muy oscuro | **Duplicado exacto de `--ink`.** El nombre ya no describe el color. |
| `--coral` | `#7a4030` | marrón rojizo oscuro | No es coral. Es el tono oscuro de la terracota. |
| `--yellow` | `#d79b4a` | ámbar | Es el color de marca real, pero apenas se usa. |
| `--muted` | `#5e514a` | marrón grisáceo | Tono de `--ink`, no un color propio. |
| `--line` | `#ded2c2` | arena | Tono de `--cream`, no un color propio. |
| `--terracotta` | `#a85f45` | terracota | Mismo tono que `--coral`, más claro. |
| `--sage` | `#71806a` | verde salvia | **Único verde del sitio. Se usa una sola vez.** |

Fuera de `:root`, sin token: `#efece6`, `#e7ded2`, `#e1d4c5`, `#e5ddd2`, `#eee4d8`, `#d8cabe`, `#f2ca68`, `#d5dfd6`, `#ffd0c9`, y las bases `rgba(220, 231, 231)`, `rgba(231, 184, 75)`, `rgba(169, 79, 72)`, `rgba(168, 95, 69)`.

### Reparto real frente a la regla 60-30-10

Medición hecha en el navegador sobre la página completa, sumando la altura de cada sección a sangre y dividiéndola por la altura total del documento. A 1418 px de ancho, sobre un documento de 5409 px:

| Familia | Secciones | Altura | Reparto real | Regla |
|---|---|---:|---:|---:|
| Claro, crema y papel | hero, catálogo, locales | 3552 px | **65,7 %** | 60 % |
| Oscuro, marrón | header, historia, footer | 1868 px | **34,5 %** | 30 % |
| Terracota | franja de identidad | 76 px | **1,4 %** | — |
| Ámbar, el color de marca | botón del hero, botón flotante, pie de foto | 0,35 % del área | **residual** | 10 % |

El 60 y el 30 están razonablemente cerca del objetivo. **El problema está localizado por completo en el acento**: el color que debería funcionar como marca es el que menos aparece de todos.

#### Cómo se mide el 10 %, y cómo no

Una corrección a la primera redacción de esta sección, que comparaba el área en píxeles del ámbar con el 10 % de la regla como si fueran la misma magnitud. No lo son, y la medición posterior lo dejó claro.

El 60 y el 30 sí son área: son fondos, y se miden sumando superficie. **El 10 no es área.** Un color que ocupara el 10 % de los píxeles de una página dejaría de ser un acento y pasaría a ser un tercer fondo. En una maqueta con fotografía, un acento bien aplicado rara vez pasa del 1 % de píxeles.

Lo que el 10 % describe es **presencia y consistencia**: que el color de marca aparezca en cada pantalla, y que marque siempre lo mismo. Así que el criterio correcto para auditarlo no es el área sino la cobertura:

- Cuántos de los tipos de acción primaria llevan el color de marca.
- En cuántas de las apariciones del logotipo aparece.
- Cuántos elementos del acento hay y si están repartidos por todas las secciones o concentrados en una.

Contra ese criterio, el estado inicial era: **2 de 5 tipos de CTA**, **0 de 2 logotipos**, y 8 elementos concentrados casi todos en el hero y en el pie.

Es una medición por área de sección, no por píxel, así que no cuenta las fotografías. Sirve para ver el orden de magnitud, no para auditar un decimal.

### Hallazgos

#### Alto

##### C1. `--ink` y `--petroleum` son el mismo color

Evidencia: [styles.css](styles.css#L4) y [styles.css](styles.css#L5), ambos `#3a2822`.

Impacto: la paleta aparenta tener un color más de los que tiene. Y quien cambie `--ink` creyendo que ajusta solo el color del texto cambiará también el header, la sección de historia y el footer, porque son el mismo valor con otro nombre. Es una trampa esperando a la próxima edición.

Recomendación: dejar un único token y usarlo en los dos sitios. Si en el futuro el fondo oscuro debe separarse del color de texto, esa separación debe nacer como una decisión, no heredarse de un duplicado accidental.

##### C2. El eyebrow de la sección de historia fallaba el contraste con 1,73:1

Evidencia: `.eyebrow` ([styles.css](styles.css#L86)) usa `--coral` `#7a4030`, y en la sección de historia el fondo es `#3a2822`. El `<p class="eyebrow">Nuestra manera</p>` de [index.html](index.html#L108) no llevaba el modificador `.light`.

Impacto: 1,73:1 frente al 4,5:1 que exige WCAG AA para texto pequeño. Era el peor contraste del sitio con diferencia, y encima en un texto de 0,7 rem en mayúsculas con espaciado ancho, que ya es el caso más difícil de leer.

Estado: **corregido en esta ronda.** En lugar de añadir la clase en el HTML, se resolvió con una regla estructural, para que ningún eyebrow futuro en una sección oscura pueda repetir el fallo. El ámbar sobre el marrón oscuro da 5,76:1, que cumple AA.

##### C3. El acento de marca ocupa menos del 1 % en lugar del 10 %

Evidencia: la medición de la sección anterior.

Impacto: la regla 60-30-10 no es decorativa; su función es que exista un color que el ojo asocie a "esto es de la marca y esto se puede pulsar". Hoy ese papel no lo cumple nadie: el ámbar aparece en el botón del hero, en el botón flotante, en los números de los principios y en el pie de foto, y en ningún sitio más. Entre esos puntos hay pantallas enteras sin una sola aparición del color de marca.

Recomendación: subir el ámbar hasta ocupar entre el 8 y el 10 % concentrándolo donde significa algo, no repartiéndolo: todas las acciones primarias, los números y contadores, el símbolo de la marca, y el subrayado o el filete que marca la sección activa. No usarlo en párrafos ni en fondos grandes, porque entonces deja de leerse como acento.

##### C4. Los CTA están repartidos entre dos colores distintos

Evidencia: en ámbar, `.button-yellow` ([styles.css](styles.css#L92)) y `.floating-whatsapp` ([styles.css](styles.css#L203)). En marrón oscuro, `.nav-cta` ([styles.css](styles.css#L63)), `.order-button` ([styles.css](styles.css#L146)) y `.map-link` ([styles.css](styles.css#L188)).

Impacto: es el incumplimiento más concreto de la guía recibida. De los cinco tipos de llamada a la acción, dos usan el color de marca y tres usan el mismo marrón que el texto del cuerpo. El caso grave es `.order-button`: es el botón "Pedir", se repite nueve veces, es la conversión real del catálogo, y hoy tiene exactamente el mismo color que el texto que lo rodea. No destaca como acción.

Recomendación: el ámbar pasa a ser el color de toda acción primaria, empezando por "Pedir". El marrón oscuro queda para acciones secundarias, y el borde o el texto bastan para las terciarias. Esto por sí solo resuelve buena parte de C3, porque son nueve botones repartidos por la zona más larga de la página.

##### C5. El logotipo no lleva el color de marca

Evidencia: `.brand-mark` ([styles.css](styles.css#L55)) usa `border: 1px solid currentColor`, y el color heredado es blanco tanto en el header como en el footer.

Impacto: la guía pide explícitamente que el color primario aparezca en el logotipo. Hoy el símbolo "ET" es blanco en sus dos apariciones, así que la marca no tiene color propio en el único elemento que la representa siempre.

Recomendación: el aro y las iniciales en ámbar sobre los fondos oscuros. Comprobado: 5,76:1, cumple AA.

#### Medio

##### C6. Seis colores que no pertenecen a ninguna familia

Evidencia y uso:

| Color | Dónde | Problema |
|---|---|---|
| `--sage` `#71806a` | borde izquierdo del aviso del hero ([styles.css](styles.css#L97)) | Único verde del sitio, usado una sola vez. |
| `#d5dfd6` | texto de "Abierto hoy" y dirección destacada ([styles.css](styles.css#L171), [L175](styles.css#L175)) | Verde grisáceo, ajeno a la paleta cálida. |
| `#ffd0c9` | estado "Cerrado hoy" ([styles.css](styles.css#L172)) | Rosa, ajeno a la paleta. |
| `rgba(220, 231, 231)` | capa de carga del mapa ([styles.css](styles.css#L185)) | Azul grisáceo frío sobre una paleta cálida. |
| `rgba(231, 184, 75)` | halo del indicador de frescura ([styles.css](styles.css#L98)) | Es un ámbar **distinto** de `--yellow`, sin motivo. |
| `rgba(169, 79, 72)` | halo del indicador cerrado ([styles.css](styles.css#L99)) | Un rojo que no existe en la paleta. |

Impacto: son seis tonos que nadie eligió como parte de la identidad; llegaron como valores de conveniencia. Aisladamente ninguno se nota, pero juntos son la razón de que la paleta se sienta imprecisa aunque los colores grandes estén bien.

Recomendación: el verde y el rosa de los estados abierto y cerrado se sustituyen por ámbar y por el tono oscuro de terracota, que ya existen. El halo del indicador usa `--yellow` en lugar de su propio ámbar. La capa de carga del mapa usa crema con transparencia. El `--sage` desaparece.

##### C7. Diez tintes escritos a mano, sin token

Evidencia: `#efece6`, `#e7ded2`, `#e1d4c5`, `#e5ddd2`, `#eee4d8`, `#d8cabe`, `#ded2c2`, `#f2ca68`, más los dos de C6.

Impacto: casi todos son variaciones legítimas de crema o de ámbar, así que el problema no es que existan sino que no se derivan de nada. Si mañana cambia la crema, estos diez valores se quedan donde están y la paleta se parte en dos.

Recomendación: expresarlos como tonos de los cinco colores base, con `color-mix()` o con `rgba` sobre la base correspondiente, de forma que un cambio en el color raíz arrastre a sus derivados.

##### C8. Los nombres de los tokens ya no describen los colores

Evidencia: `--petroleum` es marrón, `--coral` es marrón rojizo, `--sage` es un verde que ya no se usa, `--yellow` es ámbar.

Impacto: son restos de una paleta anterior, la de tonos fríos, que se sustituyó por la de horno sin renombrar los tokens. Cualquiera que lea el CSS esperando un azul petróleo se encontrará un marrón. Es la misma clase de deuda que los tintes azul y verde de las sombras que ya detectó la segunda ronda en G5.

Recomendación: renombrar a nombres que describan la función o la materia: `--masa`, `--horno`, `--miga`, `--corteza`, `--ambar`.

#### Bajo

##### C9. La terracota solo alcanza AA para texto grande

Evidencia: `--terracotta` `#a85f45` sobre crema da **4,26:1**, por debajo del 4,5 que exige AA para texto pequeño.

Impacto: hoy es correcto, porque solo se usa en el `<em>` del titular del hero, que ronda los 7 rem. Pero no hay nada que impida que mañana se use en un texto de 0,7 rem, y ahí fallaría.

Recomendación: dejar escrito que la terracota clara es un color de titular y de superficie, y que para texto pequeño se usa su tono oscuro `#7a4030`, que da 7,18:1 sobre crema.

##### C10. Los estados abierto y cerrado se comunican con colores de otra paleta

Evidencia: [styles.css](styles.css#L171-L172) y [styles.css](styles.css#L98-L99).

Impacto: el verde y el rosa son la convención habitual para disponible y no disponible, pero aquí chocan con una paleta enteramente cálida y además no se apoyan en ningún otro elemento del sistema. Se solapa con C6.

Recomendación: mantener la distinción con ámbar para abierto y terracota oscura para cerrado, y reforzarla con el texto, que ya existe, para no depender solo del color.

##### C11. El sitio tenía dos marcas distintas compitiendo

Evidencia: convivían dos símbolos. El monograma "ET" en un círculo aparecía en la cabecera, en la franja de identidad y en el pie. La mascota panadera aparecía en el hero y en el pie. En el pie estaban **los dos, uno al lado del otro**.

Impacto: una marca debe tener un símbolo, no dos. Con dos, ninguno se fija en la memoria, y el caso del pie era el más claro: la mascota de 72 px y justo debajo el círculo "ET", como si fueran cosas distintas.

Estado: **corregido el 2026-09-23.** La mascota es ahora la única marca del sitio, en las cuatro apariciones. El monograma se retiró por completo, y con él sus reglas de CSS.

Dos consecuencias que conviene tener presentes, porque son el precio de elegir un símbolo ilustrado:

1. **Por debajo de 40 px la mascota deja de leerse.** Se comprobó renderizándola a 28, 32, 40, 48, 56 y 72 px: a 32 px, que era el tamaño del monograma en la cabecera, la ilustración es una mancha, mientras que "ET" se leía nítido. Por eso la marca de cabecera se subió a 44 px y la de la franja a 52 px, y ambas van dentro del círculo de fondo que ya usaba el hero. El círculo es lo que le da silueta reconocible en tamaño pequeño; sin él, la figura flota y no se lee como marca.

2. **La ilustración trae colores que no están en la paleta de cinco.** La mascota tiene blanco, un rojo en el pantalón y varios tonos de piel y de pan. Antes eso aparecía en dos sitios; ahora aparece en cuatro. No es grave a estos tamaños, pero significa que la regla de los cinco colores se cumple en la interfaz y no en la ilustración. Si en algún momento se quiere cumplir del todo, habría que redibujar la mascota con la paleta o crear una versión monocroma para los tamaños pequeños.

Esto sustituye la recomendación de C5. Aquel hallazgo proponía dar color de marca al monograma; al desaparecer el monograma, lo que mantiene el vínculo con la paleta es el círculo ámbar de fondo, no el símbolo.

### Paleta propuesta: tres principales y dos secundarios

Cada color admite tonos derivados. Un tono más claro o más oscuro del mismo matiz **no cuenta como un color nuevo**, siempre que se derive del valor base y no se escriba a mano.

| Papel | Nombre propuesto | Valor | Uso | Reparto |
|---|---|---|---|---|
| Principal 1 | `--masa` | `#f7f1e7` | Fondo dominante de la página | 60 % |
| Principal 2 | `--horno` | `#3a2822` | Texto, header, sección de historia, footer | 30 % |
| Principal 3 | `--ambar` | `#d79b4a` | **Color de marca.** Acciones primarias, símbolo, números, acentos | 10 % |
| Secundario 1 | `--corteza` | `#a85f45` | Franja de identidad, énfasis tipográfico, eyebrows sobre fondo claro | puntual |
| Secundario 2 | `--papel` | `#fffdf8` | Superficies elevadas: tarjetas, panel del mapa | puntual |

Tonos derivados admitidos, que no suman colores nuevos:

- `--corteza-oscura` `#7a4030`, el actual `--coral`: la terracota bajada de luminosidad para texto pequeño sobre fondo claro, donde el tono claro no llega a AA. Ver C9.
- `--ambar-claro` `#f2ca68`, el actual hover del botón amarillo.
- `--horno-suave` `#5e514a`, el actual `--muted`: texto secundario.
- `--masa-linea` `#ded2c2`, el actual `--line`: bordes y filetes.
- Los fondos de imagen pendiente y las capas de carga, como crema con transparencia.

Los que desaparecen: `--petroleum` por duplicado, `--sage` por ajeno, y los seis tonos de C6.

### Imágenes

Hallazgos surgidos al revisar la fotografía de la sección de historia.

##### I1. Una de las fotos devolvía 404 y dejaba dos tarjetas vacías

Evidencia: `photo-1585478259715-876acc5be8eb` respondía **404** en Unsplash y se usaba en "Pan enrollado" y "Pan de queso con cebolla".

Impacto: las dos tarjetas mostraban el texto "Imagen no disponible" en producción. El fallback funcionaba correctamente, que es la buena noticia, pero el contenido estaba roto.

Estado: **corregido en esta ronda.**

##### I2. Cuatro fotos distintas para once espacios, una de ellas repetida siete veces

Evidencia: antes de esta ronda, `photo-1636378126357-7e5f200771c5` aparecía 7 veces, entre ellas el fondo del hero, la foto de la sección de historia y dos productos.

Impacto: es la causa directa de que la foto de historia "no se acabara de ver bien". No era un problema de encuadre sino de repetición: el lector ya había visto esa misma hogaza en el hero y en dos tarjetas, así que al llegar a la sección de historia la imagen no aportaba nada nuevo. Una vitrina que enseña el mismo pan con cuatro nombres distintos también daña la credibilidad del catálogo.

Estado: **corregido en esta ronda.** Ahora hay diez fotos distintas para diez espacios visibles, todas comprobadas con respuesta 200, y la única repetición que queda es intencionada: la foto del hero se reutiliza en las etiquetas `og:image`, `twitter:image` y en el JSON-LD, que es exactamente para lo que sirven.

##### I3. La foto de historia no ilustraba lo que dice el texto

Evidencia: el texto alternativo decía "Manos trabajando una masa sobre una mesa en la panadería", pero la imagen era un primer plano de miga, sin manos ni mesa.

Impacto: además del desajuste visual, el texto alternativo describía algo que no estaba en la imagen, lo que es un fallo de accesibilidad: quien use lector de pantalla recibía una descripción falsa.

Estado: **corregido en esta ronda.** La foto nueva muestra unas manos sosteniendo un pan sobre un paño, y todos los textos alternativos de las imágenes sustituidas se reescribieron para describir lo que realmente aparece.

##### I4. La imagen de bebidas depende de un tercero sin control

Evidencia: [index.html](index.html#L102) enlaza `revistamercado.do`.

Impacto: es el único recurso que no viene de Unsplash. No hay garantía de permanencia, de licencia ni de rendimiento, y si ese sitio la borra o la renombra, la tarjeta queda con el fallback.

Recomendación: sustituirla por una fotografía propia del producto real, que además es lo correcto para un catálogo, o por una de banco con licencia comprobada.

##### I5. Todas las fotos son enlaces externos, sin copia local

Evidencia: las diez imágenes de producto y de sección son peticiones a `images.unsplash.com`; el único archivo propio del repositorio es la mascota.

Impacto: el sitio depende por completo de un servicio externo para su contenido visual. El fallback de imagen no disponible está bien resuelto, pero un fallo de Unsplash dejaría la vitrina entera sin fotos. También implica que el recorte y la calidad se deciden por parámetros de URL, no por archivos optimizados.

Recomendación: cuando existan fotografías reales del local, alojarlas en el repositorio y servirlas en varios tamaños. Mientras tanto, conviene dejar constancia de que las imágenes son provisionales.

### Orden de aplicación sugerido para la paleta

1. Unificar `--ink` y `--petroleum` en un solo token. Es un cambio sin efecto visual y quita la trampa.
2. Pasar `.order-button` a ámbar. Es el cambio que más mueve el reparto 60-30-10 y el que más ayuda a la conversión, porque son nueve botones en la sección más larga.
3. Pasar `.nav-cta` y `.map-link` a la jerarquía nueva, y dar color de marca al símbolo del logotipo.
4. Sustituir los seis colores ajenos de C6 por tonos de la paleta.
5. Derivar los diez tintes sueltos de los cinco colores base.
6. Renombrar los tokens al vocabulario nuevo, en último lugar, cuando ya no queden valores sueltos que renombrar.

## Cuarta ronda: la sección de historia

Fecha: 2026-09-23. Auditoría dirigida a una sola sección, `#historia`, a partir de una observación del usuario mirándola en escritorio: **"creo que está demasiado texto"**.

### Veredicto: no sobra texto, sobraba un fallo de maqueta

La sección tiene **85 palabras y 572 caracteres**, y la cobertura de tinta de la columna es del **5,5 %**. Un muro de texto real ronda el 12-20 %. En volumen es de las zonas más escuetas del sitio.

La impresión era correcta, pero la causa no era la extensión. Eran dos cosas medibles:

1. **Un fallo de maqueta que añadía 429 px de altura muerta.** Ver H1.
2. **Repetición**: de las 65 palabras de texto corrido, unas 19 dicen algo que ya se ha dicho.

Corregido solo el fallo de maqueta, sin tocar una palabra, la sección pasa de **1158 px a 767 px de alto, un 34 % menos**.

### H1. La fotografía llevaba todo este tiempo renderizándose en 1:2,23, no en 4:5

Evidencia: `.story-photo img` declaraba `aspect-ratio: 4 / 5`, y el `<img>` lleva `width="760" height="950"`.

Medido a 1418 px, antes de corregir: la foto renderizaba **439 × 978 px, ratio 1:2,23**, con la altura computada en **950 px**. La desviación respecto al 4:5 previsto era de **429 px**.

Causa: los atributos `width` y `height` del HTML actúan como pistas de presentación de CSS. La regla de autor `width: 100%` anula la de anchura, pero **nada anulaba la de altura**, así que quedaba fijada en 950 px. Y `aspect-ratio` solo se aplica cuando una de las dos dimensiones es `auto`; con ambas definidas, se ignora en silencio.

Impacto, y es mayor de lo que parece:

- La foto medía 293 px más que la columna de texto, así que gobernaba la retícula y dejaba unos 146 px de fondo vacío encima y otros tantos debajo del texto. Ese hueco es lo que hacía que el texto pareciera abundante: estaba rodeado de vacío.
- `object-fit: cover` recortaba los lados para llenar una caja mucho más alta de lo previsto. **Esto explica retroactivamente por qué las dos primeras fotografías de esta sección no se veían bien**: no era la elección de la foto ni el recorte del archivo, era que el hueco no tenía la proporción que decía tener. El trabajo de recortar el archivo a 4:5 se estaba anulando en el navegador.
- El radio orgánico se calculaba sobre una caja del doble de alto, así que la curva superior salía más pronunciada de lo diseñado.

Corrección: `height: auto` en `.story-photo img`. Verificado después a 1418 y 1898 px: **439 × 549 y 433 × 542, ratio 1:1,25 exacto**. El desfase entre foto y columna baja de 293 px a 10 px.

Lección: **añadir `width` y `height` a una imagen para reservar el hueco es correcto, pero si el CSS usa `aspect-ratio` hay que acompañarlo de `height: auto`**, o el atributo gana y el ratio no se aplica nunca. Conviene revisar si esto afecta a otras imágenes del sitio.

### H2. El titular se partía en tres líneas dejando "nuestro" huérfano

Evidencia: el titular usa un salto de línea manual y `clamp(2.8rem, 5.4vw, 4.6rem)`. A 1418 px, la segunda línea necesitaba unos 650 px en una columna de 640, así que desbordaba por 10 px y se rompía en tres líneas, con una huérfana de 8 caracteres.

Medido: dos líneas hasta 1300 px de viewport; **tres líneas a partir de 1320**, es decir en la mayoría de escritorios reales: 1366, 1440, 1512 y 1920.

Corrección: bajar el techo del `clamp` a `4.25rem`. Verificado a 1418 y 1898 px: dos líneas en ambos. Se probó también `4.4rem`, que no basta, y re-partir el salto de línea, que tampoco.

### H3. El lead y el titular son el mismo ámbar, la misma cursiva y la misma familia

Evidencia: el `em` del titular y el lead usaban ambos `var(--ambar)` en cursiva Georgia. Solo cambiaba el tamaño, y el salto era de 22,4 a 16 px, un ×1,4, por debajo del ×1,5 habitual entre entradilla y cuerpo.

Impacto: se veían **cinco líneas ámbar cursiva seguidas**. El lead no contrastaba con el titular, lo prolongaba. El **31,4 % de la tinta de la columna era ámbar**, contra el 10 % que fija el reparto 60-30-10 del propio sistema.

Corrección parcial aplicada: el lead sube a `1.5rem` con interlínea `1.35`, lo que lleva el salto a ×1,5 y lo deja en una sola línea. **Queda pendiente decidir si además debe dejar de ser ámbar**, para que el color de marca sea exclusivo del titular.

### H4. La regla del lead era silenciosamente inefectiva

Evidencia: el selector `.story-copy > p:not(.eyebrow)` tiene especificidad 0-2-1 y ganaba a `.story-copy .lead`, que es 0-2-0. Por eso el color necesitaba `!important`. Y cualquier otra propiedad que ambas reglas fijaran, como `max-width`, simplemente no surtía efecto desde la regla del lead.

Corrección: el selector pasa a `.story-copy > p.lead` y se retira el `!important`.

### H5. Repetición: la misma idea dicha cuatro veces

Evidencia literal, dentro de la misma sección:

- La idea de lentitud aparece **cuatro veces**: en el titular "El **tiempo** es nuestro ingrediente", en el lead "no hacemos pan **rápido**… vale la **espera**", en el principio 02 "**Tiempo**, temperatura y **paciencia**", y en el pie de foto "**Despacio** sabe mejor".
- Los tres pilares se enuncian **dos veces seguidas**: el párrafo dice "trabajamos con masa madre viva, fermentaciones largas y productores que conocemos por su nombre", y 48 px más abajo los tres principios repiten lo mismo **en el mismo orden**.
- "Masa madre viva" está repetido **palabra por palabra** entre el párrafo y el título 01.

Impacto: unas 19 de las 65 palabras de texto corrido son redundantes. El lector procesa el mismo mensaje tres veces y lo contabiliza como volumen. **Esta es la causa real de la impresión del usuario**, una vez descontado el fallo de maqueta.

Recomendación: repartir funciones sin solape. El lead dice el porqué, el párrafo dice el quién y el cuándo, los principios dicen el qué. La propuesta concreta de recorte está pendiente de aprobación, porque es texto de marca y la decisión es del usuario.

### H6. Otros hallazgos menores

- **Tres bordes derechos distintos** en la misma columna: el titular llega a 401 px, el párrafo está topado a 530 px por `max-width`, y los principios y el filete ocupan los 640 px completos. El filete sobresale 110 px respecto al párrafo que tiene encima.
- **Las descripciones de los principios miden 32-34 caracteres por línea**, un 24 % por debajo del mínimo editorial de 45, con interlínea de 1,17 frente al 1,55 del párrafo. Son el texto más pequeño, más estrecho y más apretado de la sección a la vez.
- **Seis reglas usan la abreviatura `font:` sin indicar interlínea**, lo que reinicia el interlineado a `normal` y descarta el 1,55 heredado del `body`.
- **"Ingredientes locales" y "Conoce nuestros locales"** quedan a 48 px, con la misma palabra en dos significados distintos.
- **La entrada lateral se ejecuta casi entera fuera de pantalla**: con umbral de 0,12 sobre una columna de 657 px, arranca cuando solo son visibles unos 150 px, el 23 %. El resto de la transición termina antes de entrar en el viewport.
- **Faltan cuatro tildes** en la sección: rápido, todavía, días, Fermentación. Se recoge también en la auditoría de contenido.

### Lo que ya funciona en esta sección

- **El contraste, sin excepción**: ocho comprobaciones, mínimo 5,76:1 sobre el fondo oscuro.
- **El ritmo vertical entre bloques**, con saltos que crecen a medida que baja la jerarquía, y un 25 % de aire en la columna. No había muro de texto por falta de aire.
- **El filete que se dibuja de izquierda a derecha** antes de los principios: describe lo que hace el elemento.
- **La secuencia numerada 01, 02, 03** con retardos escalonados.
- **El pie de foto** sobresaliendo 14 px: comprobado que no colisiona, quedan 99 px de holgura, y el recorte de la sección impide barras horizontales.
- **La medida del párrafo largo**, 69 caracteres por línea, está dentro de la referencia editorial.

### Estado de la cuarta ronda

- [x] H1, ratio de la fotografía corregido.
- [x] H2, titular en dos líneas.
- [x] H4, especificidad del lead y `!important` retirado.
- [x] H3, tamaño e interlínea del lead.
- [x] H3, el lead deja de ser ámbar y pasa a crema. El color de marca queda reservado al titular, y el lead se distingue por cursiva y tamaño.
- [x] H5, texto recortado. De **85 a 64 palabras, un 25 % menos**, y de 572 a 410 caracteres. Se quitó del párrafo la frase que enumeraba los tres pilares, porque están 48 px más abajo, y su contenido se recuperó en el principio 03, así que no se perdió información. Detalle abajo.
- [x] H6, parte: interlíneas declaradas en las cinco reglas de la sección que usaban `font:` sin ellas; descripciones de los principios a `.85rem` con `1.45`; "Ingredientes locales" pasa a "Origen cercano" para no chocar con "Conoce nuestros locales"; y las cuatro tildes corregidas, junto con otras cuatro del resto del sitio.
- [x] H7, los tres principios dejan de ser solo texto: iconos de línea en ámbar. Detalle abajo.
- [ ] H6, resto. Dos puntos se revisaron y **se decidió no aplicarlos**, con motivo:
  - **Bordes derechos.** La recomendación era unificar la columna a 640 px, pero eso contradice la propia medición del informe: el párrafo mide 69 caracteres por línea a 530 px, y a 640 px pasaría de 80, por encima del máximo editorial de 75. Que el texto corrido sea más estrecho que la rejilla de principios es una decisión editorial normal, no un descuadre. Se deja como está.
  - **Umbral de la animación de entrada.** Tras corregir H1 la columna mide 559 px en vez de 657, así que el problema se reduce solo. Cambiar el umbral afecta a los veinte elementos animados del sitio para una mejora marginal en uno. Se deja anotado por si algún día se anima por bloques.

### H7. Los tres principios eran solo texto

Observación del usuario tras aplicar el recorte: el bloque de principios "solo con texto me parece aburrido".

Es cierto y es consecuencia del propio recorte: al quitar la repetición, los tres principios quedaron reducidos a título más una frase corta cada uno, sin ningún elemento que los distinguiera entre sí ni del párrafo de arriba. Tres columnas de texto seguidas.

Se plantearon cuatro salidas: iconos de línea, numeral grande editorial, número dentro de un aro, y fotografía pequeña por principio. **El usuario eligió iconos de línea.**

Aplicado: tres iconos dibujados a medida, un tarro de masa madre con burbujas, un reloj y una espiga, a 38 px y con el número al lado formando una sola marca.

Decisiones que respetan el sistema ya establecido:

- **SVG en línea, no archivos.** Cero peticiones nuevas, coherente con que el sitio no tenga dependencias ni fuentes web.
- **`stroke="currentColor"`**, de modo que heredan el ámbar de `.principle-mark`. No introducen ningún color fuera de los cinco de la paleta.
- **`aria-hidden="true"` y `focusable="false"`**: son decorativos, porque el título de al lado ya dice lo mismo. Si no, el lector de pantalla anunciaría dos veces cada principio.
- **La animación de entrada pasa del número a la marca completa**, así que el escalonado 01, 02, 03 sigue funcionando, y la neutralización bajo `prefers-reduced-motion` se actualizó al selector nuevo.
- Se comprobó el dibujo a 110, 48 y 38 px antes de fijarlo. La primera versión de la espiga se empastaba por debajo de 40 px y se redibujó con los granos más abiertos.

Nota de coherencia: esto **estrena un lenguaje de iconos** que antes no existía en el sitio. Si en el futuro se añaden iconos en otra sección, tienen que seguir el mismo trazo de 1,4, el mismo encuadre de 24 y el mismo ámbar, o la familia se rompe.

### H8. La tarjeta de local y el enlace al mapa

Tres cambios pedidos por el usuario sobre la tarjeta de la sección de locales, aplicados el 2026-09-23.

- **Fuera el "01".** Numerar un único local no aportaba nada, y el número competía con el indicador de abierto. Al quitarlo, `.location-card-top` pasa de `space-between` a `flex-end` para que el estado siga a la derecha, y la regla `.location-index` se retira por quedar muerta.
- **Fuera "Audio-PhoneComputer".** Parecía el nombre del negocio. Es el hallazgo C2 de la auditoría de contenido, y se retiró también del `streetAddress` del JSON-LD, donde alimentaba la ficha de negocio local.
- **Chincheta en el enlace al mapa.** El enlace "Google Maps / Waze" solo tenía la flecha de enlace externo, que indica que se abre fuera pero no qué se va a ver. Se añadió una chincheta de 18 px, **primera aplicación de la familia de iconos de H7 fuera de los principios**: mismo encuadre de 24, mismo trazo de 1,4, mismo ámbar heredado por `currentColor`, y también decorativa, porque el texto del enlace ya dice a dónde lleva.

### H9. La tarjeta de local tenía un tercio de su altura en huecos

Observación del usuario: "me gusta la información que muestra pero creo que hay muchos espacios en blanco".

Medido antes de tocar nada, sumando el hueco anterior a cada elemento: la tarjeta medía 335 × 338 px y **107 px eran huecos, el 32 % de su altura**.

| Hueco | Antes | Causa |
|---|---:|---|
| Antes del título "Tena" | **38 px** | `margin-top: 2.4rem`, heredado de cuando había que separarlo del "01" |
| Alto de la dirección | 54 px | `min-height: 54px`, dimensionado para tres líneas cuando ahora son dos |
| Antes y después del horario | 24 px cada uno | `margin: 1.5rem 0` |
| Entre filas del horario | 6,4 px cada una | `margin: .4rem 0` |

Es decir, dos de los cuatro huecos eran restos de decisiones anteriores: el margen del título existía por el número que acabábamos de quitar, y el `min-height` por una dirección de tres líneas que ya no lo es.

Aplicado:

- Margen superior del título de `2.4rem` a `1.2rem`.
- `min-height` de la dirección retirado. **Si algún día hay más de un local, probablemente haya que reponerlo**, porque su función era alinear las tarjetas entre sí.
- Márgenes del horario de `1.5rem` a `1.1rem`, y de sus filas de `.4rem` a `.25rem`.
- Interlíneas declaradas en las tres reglas que usaban `font:` sin ellas, igual que en la sección de historia.

Resultado: la tarjeta pasa de **338 a 315 px**, y los huecos del 32 % al **24 %**.

**Un segundo efecto que había que resolver, y que no era evidente:** la tarjeta y el mapa comparten fila de rejilla, y por defecto los elementos se estiran a la altura de la fila. El mapa tenía `min-height: 330px`, así que al encoger el contenido de la tarjeta el hueco no desaparecía: **se trasladaba al final de la tarjeta**, que seguía estirándose hasta 340 px. Bajando el mínimo del mapa a 300 px, la altura de la fila la marca ahora el contenido real de la tarjeta, y el hueco desaparece de verdad en lugar de moverse de sitio.

Queda una decisión abierta: el enlace "Ver en el mapa" que flota sobre el propio mapa hace lo mismo y no lleva chincheta. Se dejó sin ella a propósito, porque ahí el contexto ya es un mapa y el icono sería redundante, pero conviene revisarlo si algún día se separan los dos enlaces.

### H10. La tarjeta seguía siendo plana, y el horario era el texto más pequeño

Observación del usuario tras comprimir los huecos: la tarjeta "se ve como aburrida", y el horario "se ve muy pequeño".

Ambas cosas eran ciertas y la segunda era medible: el horario estaba a `.75rem`, **12 px, el texto más pequeño de toda la tarjeta**, siendo el dato que más gente va a consultar. La dirección, que se lee una vez, era mayor que el horario, que se lee cada vez.

Aplicado el 2026-09-23:

- **El horario sube de `.75rem` a `.85rem`** y las horas usan `font-variant-numeric: tabular-nums`, de modo que las cifras de las dos filas quedan alineadas en columna en lugar de bailar.
- **El estado pasa de texto suelto a distintivo con fondo**: píldora con fondo ámbar al 10 %, borde y texto ámbar. Da un ancla visual en la esquina superior, que antes estaba vacía.
- **Se señala la fila del horario que corresponde a hoy**, en ámbar y con una etiqueta "hoy". No es decoración: reutiliza el día que [script.js](script.js) ya calcula para decidir si está abierto, así que no añade lógica nueva ni una segunda fuente de verdad. Las filas declaran sus días en `data-dias` y el JavaScript marca la que toca.

La etiqueta se inserta como texto real desde JavaScript, no con `content` en CSS, para que un lector de pantalla la anuncie como parte del contenido.

**Un tropiezo que la medición evitó:** las dos primeras versiones del distintivo y de la etiqueta usaban fondos ámbar al 14 % y al 16 %, y **fallaban AA por muy poco**, 4,48 y 4,33 frente al 4,5 exigido. La causa es que un fondo tintado aclara la tarjeta y reduce el contraste con el texto ámbar que lleva encima, algo que no se aprecia a ojo. Se barrieron opacidades del 6 al 14 % y se fijó el 10 %, que da **4,79**. Es el tipo de fallo que un fondo decorativo introduce sin que nadie lo note.

### H11. Dos enlaces distintos que llevaban exactamente a la misma URL

Observación del usuario: el enlace "Google Maps / Waze" de la tarjeta sobra teniendo el mapa al lado.

Comprobado, y era más redundante de lo que parecía a simple vista: **los dos enlaces apuntaban a la misma dirección, carácter por carácter**, `google.com/maps/dir/?api=1&destination=-1.004033,-77.812690`. No eran dos acciones parecidas, eran la misma acción duplicada. El texto distinto, "Google Maps / Waze" frente a "Ver en el mapa", hacía pensar que ofrecían cosas diferentes.

Aplicado el 2026-09-23:

- Retirado el enlace de la tarjeta, con sus reglas `.location-link` y `.featured-location .location-link`, que quedaban muertas, y su entrada en la lista de transiciones.
- **La chincheta se trasladó al enlace que sobrevive**, en lugar de eliminarse con el enlace que la alojaba. La señal visual que se había pedido dos cambios antes sigue cumpliendo su función, ahora sobre la única acción que queda.

**Y otra vez hubo que reequilibrar la fila.** Al quitar el enlace, la tarjeta se quedó en unos 276 px mientras el mapa mantenía 300 px de mínimo, así que la tarjeta volvía a estirarse y **el hueco reaparecía en su borde inferior**, el mismo problema de H9. Se retiró el margen inferior del horario, que existía para separarlo del enlace retirado, y el mínimo del mapa bajó a 270 px.

Resultado medido: **tarjeta 280 px, mapa 280 px, desfase 0**. La tarjeta ha pasado de 338 px al principio de esta serie a 280, un 17 % menos, sin perder ninguna información.

Patrón que conviene recordar: en esta rejilla, **cada vez que se quita contenido de la tarjeta hay que revisar el mínimo del mapa**, o el ahorro no se nota porque el estiramiento lo absorbe. Ha pasado dos veces seguidas.

### H12. La jerarquía de la tarjeta de local estaba invertida

Observación del usuario: "Tena se repite, no sé si eso se debería corregir". Se repetía, y al comprobarlo apareció algo de fondo.

**La repetición:** el título decía "Tena" y dos líneas más abajo la dirección decía "Tena, Ecuador". Mismo problema que el del texto de historia, en pequeño.

**Lo de fondo, medido:**

| Dato | Tamaño | Tono | ¿Lo necesita quien lee? |
|---|---|---|---|
| "Tena", la ciudad | **2 rem, 32 px** | el más brillante | No: ya sabe en qué ciudad está |
| La calle | **0,88 rem, 14 px** | `--sobre-horno-tenue`, **el más apagado de la tarjeta** | Sí: es lo que hay que leer para llegar |

Es decir, el dato prescindible se mostraba con el doble de tamaño y el máximo contraste, y el dato imprescindible con el mínimo de ambos. Eso explica mejor que nada por qué la tarjeta se sentía plana: no era falta de adornos, era que **lo importante no parecía importante**.

Aplicado el 2026-09-23:

- La dirección pierde la línea "Tena, Ecuador". **La localidad y el país siguen declarados en el JSON-LD**, así que no se pierde nada de cara a buscadores ni a la ficha de negocio local; solo desaparece de la lectura, donde sobraba.
- La calle sube de `.88rem` a `1rem`, pasa a peso 500 y al tono `--sobre-horno`, que da **11,10:1** de contraste frente a los 8,70 de antes.
- El nombre de la ciudad baja de `2rem` a `1.7rem`, para que deje de competir con la línea que ahora manda.

La tarjeta sigue midiendo 280 px y el desfase con el mapa sigue en 0, así que esta vez no hubo que reequilibrar la fila.

**Descartado a propuesta del usuario:** añadir botones de WhatsApp y de llamada a la tarjeta, que es lo que recomiendan las guías de fichas de local. Su argumento es que esos contactos ya están en el pie y en el botón flotante, y es razonable: repetirlos aquí sería el mismo tipo de duplicación que acabamos de retirar con el enlace al mapa. Queda anotado que la tarjeta no tiene ninguna acción propia, por si en el futuro se decide lo contrario.

### El recorte de texto aplicado

| Bloque | Antes | Después |
|---|---|---|
| Lead | "No hacemos pan rapido. Hacemos pan que vale la espera." | "No hacemos pan **rápido**. Hacemos pan que vale la espera." |
| Párrafo | "**Desde que abrimos nuestras puertas, trabajamos con masa madre viva, fermentaciones largas y productores que conocemos por su nombre.** Cada madrugada, nuestro equipo llega cuando la ciudad todavia duerme." | "Cada madrugada, nuestro equipo llega cuando la ciudad **todavía** duerme." |
| Principio 01 | "Un cultivo que cuidamos todos los dias **y que da sabor real**." | "Un cultivo que cuidamos todos los **días**." |
| Principio 02 | "**Fermentacion** natural" · "**Tiempo**, temperatura y **paciencia** para una miga inolvidable." | "**Fermentación** natural" · "Temperatura y **reposo** para una miga inolvidable." |
| Principio 03 | "**Ingredientes locales**" · "Elegimos origen, estacionalidad y relaciones honestas." | "**Origen cercano**" · "Productores que conocemos por su nombre." |

El principio 03 recupera literalmente la frase que se quitó del párrafo. No se inventó contenido nuevo en ninguna parte.

## Qué ya funciona

- La paleta crema, petróleo, coral y amarillo tiene identidad clara.
- El hero tiene buena jerarquía entre imagen, overlay, titular, llamada principal y aviso contextual.
- El contraste general es sólido en el hero y en la sección oscura de historia.
- La serif editorial y la sans-serif funcional separan marca, navegación y texto auxiliar.
- El reveal usa `IntersectionObserver`, un umbral razonable y `rootMargin`, según [script.js](script.js#L77).
- Las tarjetas tienen un hover contenido con elevación y zoom de imagen de `1.04`.
- Las imágenes tienen dimensiones y `aspect-ratio`, reduciendo saltos de layout.
- Existe una implementación explícita para `prefers-reduced-motion`.
- El responsive conserva la estructura y simplifica las columnas en móvil.

## Ideas de animación

| Zona | Comportamiento | Duración aproximada | Riesgo |
|---|---|---:|---|
| Hero | Entrada escalonada de mascota, eyebrow, titular, copy y acciones | 500–700 ms | Bajo |
| Hero | Desplazamiento vertical corto durante la entrada | 600–800 ms | Bajo |
| Imagen hero | `scale(1.03)` a `scale(1)` al cargar | 1.2–1.6 s | Medio |
| Mascota | Inclinación leve al pasar el cursor, sin bucle permanente | 180–240 ms | Bajo |
| Franja de identidad | Texto y símbolo entran desde lados opuestos | 450–600 ms | Medio |
| Filtros | Fundido y desplazamiento de 6–10 px al cambiar categoría | 240–320 ms | Bajo |
| Tarjetas | Stagger completo de todas las tarjetas visibles | 500–700 ms | Medio |
| Botones | Elevación y transición de color coherentes | 180–250 ms | Bajo |
| Historia | Imagen primero y texto después con 100 ms de desfase | 600–750 ms | Bajo |
| Principios | Revelado secuencial de los tres principios | 450–600 ms | Bajo |
| Indicador de frescura | Pulso muy sutil de `.status-dot` | 2–2.5 s | Medio |
| Locales | Tarjeta y mapa con pequeño desfase | 500–650 ms | Bajo |
| Móvil | Menú con `opacity` y `translateY`, sin rebote | 180–240 ms | Bajo |
| Fondo de historia | Parallax máximo de 6–8 px en escritorio | Según scroll | Alto |

## Dirección visual recomendada

La personalidad debería sentirse cálida, pausada y artesanal, no tecnológica ni excesivamente dinámica. Para conservarla:

- Priorizar entradas suaves y lentas frente a rebotes.
- Usar movimiento para guiar la mirada, no para decorar cada elemento.
- Mantener una sola animación dominante por zona.
- Reservar el parallax para una prueba posterior, porque tiene más riesgo de distraer y consumir recursos.
- Evitar texto apareciendo palabra por palabra.
- Mantener los productos visibles y accionables incluso si una animación no se ejecuta.

## Próximas auditorías sugeridas

Después de esta revisión conviene hacer auditorías separadas de:

- Accesibilidad y navegación con teclado.
- Responsive y experiencia móvil.
- Rendimiento, imágenes y fuentes.
- SEO, metadatos y datos estructurados.
- Contenido, claridad de precios y conversión a WhatsApp.

## Nota de validación

Esta es una auditoría estática centrada en estética y movimiento. Se revisaron [index.html](index.html), [styles.css](styles.css) y [script.js](script.js). No se modificó ningún archivo durante la auditoría.

Comprobaciones de la segunda ronda: lectura íntegra de los tres archivos; búsqueda de `border-radius|clip-path|border-image|mask` en el CSS, con 7 coincidencias, 6 radios más un `clip-path` de accesibilidad; búsqueda de `transition|animation|@keyframes|cubic-bezier|ease`, con 28 líneas y el 100 % de las curvas en `ease`; búsqueda de `is-filtering` en todo el proyecto, con 2 coincidencias en el JS y ninguna en el CSS; búsqueda de `style=` en el HTML, sin coincidencias, lo que confirma que el inventario es completo; recuento cruzado de 9 tarjetas contra `repeat(4, 1fr)` y de 5 hijos del hero contra `nth-child(1..5)`; y verificación de dónde existe `overflow: hidden` para saber qué correcciones de radio cuestan una sola línea.

No se abrió el sitio en un navegador: no hay medición de FPS, Lighthouse ni contraste real. Las afirmaciones sobre coste de pintado se basan en la propiedad animada, no en una medición.

Comprobaciones de la tercera ronda, esta vez sí con navegador: inventario de color por búsqueda de valores hexadecimales y `rgb` en la hoja de estilos, con 18 y 9 valores únicos respectivamente; cálculo de la relación de contraste WCAG de 18 pares de color de primer plano y fondo, que localizó el fallo de 1,73:1 y confirmó que el resto cumple AA; comprobación del código de respuesta HTTP de las once imágenes del sitio, que encontró un 404; medición en el navegador del reparto de área por sección, a 1418 px y a 738 px de ancho; y renderizado de la página completa, de la sección de historia y de la vista móvil para verificar cada cambio antes de publicarlo. Las fotografías candidatas se revisaron visualmente, ya recortadas a la proporción real del hueco, antes de elegirlas.
