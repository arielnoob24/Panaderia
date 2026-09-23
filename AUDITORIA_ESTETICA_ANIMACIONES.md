# Auditoría estética y de animaciones: El Tradicional

Primera ronda: 2026-09-22. Segunda ronda, geometría y variedad de animación: 2026-09-23.

## Por qué separar las auditorías

Sí conviene trabajar por tipos. Una auditoría completa sirve para tener el mapa general, pero las revisiones especializadas permiten pensar con más profundidad en un objetivo concreto sin mezclarlo con datos de negocio, SEO o infraestructura.

Orden recomendado para futuras auditorías:

1. Estética y animaciones.
2. Accesibilidad.
3. Responsive y experiencia móvil.
4. Rendimiento y recursos.
5. SEO y datos estructurados.
6. Contenido y conversión.

Este archivo cubre únicamente estética, movimiento y sensación de interacción. No evalúa precios, teléfonos, URLs, horarios, direcciones, imágenes provisionales ni otros datos de negocio.

## Resumen

La interfaz tiene una identidad visual clara y apropiada para una panadería artesanal. La mezcla de crema, petróleo, coral y amarillo, junto con serif editorial y sans-serif funcional, crea una dirección reconocible.

El movimiento actual es contenido: existe un reveal al hacer scroll, hover moderado en tarjetas y soporte para `prefers-reduced-motion`. La siguiente mejora no debería consistir en añadir animaciones por todas partes, sino en darles un ritmo narrativo más coherente: una entrada escalonada del hero, filtros más suaves y una secuencia más completa para las tarjetas.

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

- [ ] Medir formalmente todos los colores con WCAG AA sobre las imágenes más claras.
- [ ] Reducir selectivamente la jerarquía tipográfica y el espacio vertical si las pruebas visuales lo recomiendan.
- [ ] Añadir un desfase específico entre imagen y texto en la sección de historia.
- [ ] Añadir un pulso sutil al indicador de frescura, solo si no distrae.
- [ ] Probar el posible solapamiento del aviso del hero y WhatsApp en alturas móviles cortas.
- [ ] Evaluar una indicación de desplazamiento horizontal para filtros en pantallas estrechas.
- [ ] Considerar parallax únicamente después de medir rendimiento y experiencia.

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

Sigue pendiente, por decisión explícita:

- [ ] Indicador de píldora deslizante en la barra de filtros. Necesita medición desde JavaScript y recálculo al hacer scroll horizontal; se dejó solo la forma de píldora y las transiciones.
- [ ] Pulso del indicador de frescura. Es el único bucle infinito propuesto y el de mayor riesgo; se decide aparte.
- [ ] Módulo destacado en el catálogo con `grid-column: span 2`. Cambia la jerarquía del contenido, no solo la forma.
- [ ] Hombros de banda en el límite entre locales y footer. Ver la nota de implementación.

### Notas de implementación

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
