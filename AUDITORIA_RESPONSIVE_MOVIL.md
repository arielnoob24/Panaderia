# Auditoría de responsive y experiencia móvil: El Tradicional

Primera ronda: 2026-09-23. Índice de auditorías: [AUDITORIAS.md](AUDITORIAS.md).

Este archivo cubre cómo se comporta la maqueta al cambiar de anchura, y qué se siente distinto al usar el sitio con el dedo en lugar del ratón. Los objetivos táctiles se tratan a fondo en [AUDITORIA_ACCESIBILIDAD.md](AUDITORIA_ACCESIBILIDAD.md); aquí solo se señalan donde el problema es de maqueta.

## Resumen

La estructura responde bien: dos puntos de ruptura, 900 px y 680 px, y una rejilla de catálogo que desde la segunda ronda usa `auto-fill`, de modo que se recompone sola al filtrar en lugar de dejar huecos.

La medición encontró **un desbordamiento horizontal real** en la franja de anchuras entre 681 y 900 px, causado por una animación que yo mismo introduje en la segunda ronda. Ya está corregido. El resto son afinados, no fallos.

## Medición

Hecha en navegador sobre la página completa, a varias anchuras.

| Anchura | Scroll horizontal | Barra de filtros | Objetivos < 24 px |
|---|---|---|---|
| 512 px | no | **desborda: 629 px de contenido en 480 visibles** | 4 |
| 698 px | **sí, 718 px en 698** → corregido, ahora no | ajustada, 650 en 650 | 7 |
| 1418 px | no | ajustada | 6 |

## Hallazgos

### Alto

#### R1. Desbordamiento horizontal entre 681 y 900 px de ancho

Evidencia: a 698 px de ancho, el `scrollWidth` del documento era de 718 px frente a un viewport de 698. Nueve elementos sobresalían, todos dentro de `.story-copy`, desde x 390 hasta x 719.

Causa: el patrón de entrada `reveal-x` que se añadió en la segunda ronda deja el bloque de texto de la sección de historia desplazado 18 px a la derecha hasta que se revela. Por encima de 900 px sobra margen y no se nota; por debajo de 680 px el patrón cambia a desplazamiento vertical y tampoco; **en la franja intermedia la rejilla de dos columnas va justa y esos 18 px se salen de la página**.

Impacto: barra de desplazamiento horizontal en toda la página, en tabletas y en ventanas de escritorio a media anchura. Es de los defectos que más ensucian la sensación de un sitio, y además solo aparece antes de que la sección se revele, así que es fácil no verlo al probar.

Estado: **corregido el 2026-09-23.** Se añadió `overflow-x: clip` a la sección `.story`, que contiene el desbordamiento sin crear un contenedor de scroll y sin afectar a `position: sticky` de otras zonas. Verificado después: a 698 px el `scrollWidth` vuelve a ser 698.

Lección para la próxima animación: cualquier patrón que desplace en el eje X necesita que su sección lo recorte, o el desplazamiento se convierte en scroll de página en algún punto de ruptura.

### Medio

#### R2. La barra de filtros desborda sin ninguna señal de que se puede desplazar

Evidencia: a 512 px de ancho, `.filter-bar` tiene 480 px visibles y 629 px de contenido. Está resuelto con `overflow-x: auto`, así que se puede arrastrar, pero no hay nada que lo indique.

Impacto: en móvil, las dos últimas categorías, "Dulces y galletas" y "Bebidas frías", quedan fuera de la vista sin ninguna pista. Quien no arrastre por casualidad creerá que el catálogo tiene tres categorías. Es una pérdida de contenido invisible, y ya estaba señalada como pendiente desde la primera ronda.

Recomendación, por orden de coste:

1. Un degradado de desvanecido en el borde derecho de la barra mientras quede contenido por mostrar, quitándolo al llegar al final.
2. Dejar la siguiente píldora cortada a propósito, con un poco de `padding-right`, para que se vea que hay más.
3. `scroll-snap-type: x proximity` en la barra y `scroll-snap-align: start` en cada píldora, para que el arrastre se sienta intencionado.

La opción 1 y la 2 se combinan bien y no necesitan JavaScript.

#### R3. Entre 681 y 900 px el texto de la sección de historia queda muy estrecho

Evidencia: `.story-grid` usa `grid-template-columns: minmax(300px, .8fr) 1.2fr`. A 698 px de ancho, con el contenedor en 650 px y la separación reducida a 3 rem por el punto de ruptura de 900, la columna de la foto se queda en su mínimo de 300 px y al texto le sobran unos 300.

Impacto: un párrafo de unos 300 px con tipografía serif a 16 px da renglones de seis o siete palabras. Se lee a saltos. Es la anchura de una tableta en vertical, que no es un caso raro.

Recomendación: bajar el punto de ruptura de una sola columna para `.story-grid` de 680 a unos 820 px, de modo que la tableta en vertical vea la foto arriba y el texto debajo, a anchura completa. No hace falta tocar el resto de la maqueta.

#### R4. Solo hay dos puntos de ruptura para cinco disposiciones distintas

Evidencia: `@media (max-width: 900px)` y `@media (max-width: 680px)`.

Impacto: funciona, pero obliga a que cada punto haga demasiadas cosas a la vez. El de 900 cambia a la vez el catálogo, la separación de la historia, la rejilla de locales y la posición del mapa. Cuando algo se rompe en una franja concreta, como en R1 y R3, no hay dónde tocarlo sin mover otras cuatro cosas.

Recomendación: no añadir puntos por añadir, pero sí separar los que ya generan problemas: uno propio para `.story-grid` según R3, y revisar si el catálogo se beneficiaría de dejar que `auto-fill` trabaje solo, ya que desde la segunda ronda la rejilla usa `repeat(auto-fill, minmax(260px, 1fr))` y las reglas de 2 y 1 columna podrían estar sobrando.

### Bajo

#### R5. El aviso del hero y el botón flotante ya no se solapan

Evidencia: medido a 698×1102 y a 698×1302. El aviso ocupa de y 608 a 669, y el botón flotante de y 1039 a 1082. Sin solape.

Estado: era un pendiente de la primera ronda, planteado como riesgo en alturas móviles cortas. **Comprobado y descartado** en las alturas medidas. Queda por comprobar en alturas de unos 650 px, que es donde el hero llega a su `min-height` y el aviso sube.

#### R6. El titular escala bien, pero no se ha probado en horizontal

Evidencia: el `h1` usa `clamp(4rem, 8vw, 7rem)` y en móvil `clamp(3.6rem, 17vw, 5.5rem)`. A 698 px queda en 64 px de tamaño y 118 px de alto.

Impacto: ninguno detectado. Pero no se ha probado el móvil en horizontal, donde el hero tiene `min-height: 650px` y la altura disponible puede ser menor que eso, empujando el aviso y las acciones fuera de la vista.

Recomendación: probar a 740×360 y comprobar que el botón principal sigue siendo alcanzable sin desplazar.

#### R7. No se ha probado a 320 px reales

Evidencia: el navegador sin interfaz impone una anchura mínima de ventana de unos 512 px, así que las pruebas por debajo se hicieron forzando la escala de dispositivo. A 360 px simulados no apareció desbordamiento.

Impacto: 320 px sigue siendo la anchura de referencia mínima habitual. El contenedor está definido como `min(100% - 32px, 540px)`, que debería aguantar, pero no está verificado con contenido real.

## Lo que ya está bien

- Ningún desbordamiento horizontal a 512, 698 ni 1418 px, después de la corrección de R1.
- La rejilla del catálogo se recompone sola al filtrar, gracias a `auto-fill` con `minmax(260px, 1fr)`.
- El menú móvil tiene transición real, sincroniza `aria-expanded`, se cierra al pulsar fuera y con Escape, y devuelve el foco al botón.
- El botón flotante respeta `env(safe-area-inset-bottom)`, así que no queda bajo el gesto de inicio en móviles sin botón físico.
- La barra de filtros se mantiene accesible con teclado en cualquier anchura, porque son radios reales.
- Las imágenes declaran proporción, de modo que la maqueta no salta al cargar, salvo en las cuatro de la mascota que se señalan en la auditoría de accesibilidad.
- El patrón de entrada lateral degrada a vertical por debajo de 680 px, que era la decisión correcta aunque dejara el hueco de R1 sin cubrir.

## Pendiente

- [x] Señal de desplazamiento en la barra de filtros, aplicada el 2026-09-23 (R2). Se resolvió sin JavaScript, con capas de fondo `local` que se mueven con el contenido y descubren una sombra cuando queda algo fuera. Verificado: 5 capas con `background-attachment: local, local, scroll, scroll, scroll`.
- [ ] Punto de ruptura propio para `.story-grid` a unos 820 px (R3).
- [ ] Revisar si las reglas de 2 y 1 columna del catálogo siguen haciendo falta con `auto-fill` (R4).
- [ ] Probar en alturas móviles cortas, cerca de 650 px (R5).
- [ ] Probar el móvil en horizontal (R6).
- [ ] Probar a 320 px con contenido real (R7).

## Nota de validación

Medición en navegador sin interfaz a 512, 698 y 1418 px de ancho, comprobando `scrollWidth` frente al viewport, elementos que sobresalen del borde, contenido de la barra de filtros frente a su anchura visible, tamaño de los objetivos interactivos y solape entre el aviso del hero y el botón flotante. La prueba a 360 px se hizo forzando escala de dispositivo, porque el navegador sin interfaz no permite ventanas más estrechas de unos 512 px.

**No se ha probado en ningún dispositivo físico**, ni con entrada táctil real, ni en horizontal, ni en navegadores distintos de Chrome. Las conclusiones sobre la sensación al usar con el dedo se deducen de los tamaños medidos, no de haberlo usado.
