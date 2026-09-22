bu# Auditoría estética y de animaciones: El Tradicional

Fecha de revisión: 2026-09-22

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
