# Auditoría completa de interfaz: El Tradicional

Fecha de revisión: 2026-09-22

## Alcance

Esta revisión analiza el estado actual de la interfaz, sin evaluar precios, teléfonos, direcciones, dominios, redes sociales, horarios de prueba, imágenes provisionales ni otros datos de negocio. Esos datos quedan fuera del resultado técnico.

Se revisaron [index.html](index.html), [styles.css](styles.css), [script.js](script.js) y la documentación existente.

## Resumen ejecutivo

La base es clara y tiene una identidad visual reconocible: crema, petróleo, coral y amarillo. La navegación principal, el catálogo filtrable, el enlace para saltar al contenido, los textos alternativos y el soporte de `prefers-reduced-motion` son buenas decisiones.

La prioridad técnica es ordenar `styles.css`: existe una segunda versión completa de la hoja de estilos pegada después de la primera. Esto hace que la paleta, la tipografía, el menú móvil y las media queries dependan del orden de aparición de las reglas. Antes de seguir refinando colores o animaciones conviene dejar una sola fuente de estilos.

La prioridad de accesibilidad es corregir el estado inicial de la navegación: el elemento `nav` empieza con `aria-hidden="true"` aunque en escritorio se muestra visible. Un lector de pantalla puede interpretar que no existe.

La animación de aparición funciona como idea y respeta la reducción de movimiento, pero necesita una prueba real en móvil, con filtros y con navegación por teclado. También hay que definir una estrategia para que un fallo de JavaScript nunca deje contenido invisible.

## Hallazgos prioritarios

### P0 - Corregir antes de publicar

#### 1. Navegación oculta para lectores de pantalla en escritorio

Evidencia: [index.html](index.html#L52-L53) inicia `aria-hidden="true"`, y [script.js](script.js#L6-L18) solo cambia ese atributo cuando se usa el botón móvil.

Impacto: en escritorio el menú se ve, pero puede quedar excluido del árbol de accesibilidad. El usuario de lector de pantalla pierde los enlaces principales.

Recomendación:

- No usar `aria-hidden` en el `nav` cuando la navegación de escritorio está visible.
- En móvil, controlar visibilidad y estado con una clase y `aria-expanded` del botón.
- Probar con teclado y lector de pantalla en escritorio y móvil.

#### 2. Hoja de estilos duplicada y con reglas que se pisan

Evidencia: [styles.css](styles.css#L1) define la primera paleta y vuelve a declarar `:root`, `body`, `.hero`, `.location-grid`, `.site-footer` y varias media queries alrededor de la segunda mitad del archivo.

Impacto:

- El valor `--muted` corregido al inicio vuelve a cambiar en la segunda declaración de `:root`.
- Hay varias definiciones para el menú móvil y para `location-grid`.
- Se vuelve difícil saber qué color, fuente o breakpoint está activo.
- Una mejora futura puede parecer no funcionar porque otra regla posterior la reemplaza.

Recomendación:

- Conservar una sola declaración de variables.
- Elegir una sola versión de cada selector.
- Agrupar media queries por breakpoint al final.
- Eliminar aliases heredados como `--green` y `--terracotta` cuando ya no sean necesarios.
- Validar después con una búsqueda de selectores duplicados.

## Colores y contraste

### Lo que funciona

- La combinación petróleo/crema/coral comunica bien el concepto de panadería artesanal.
- El amarillo funciona como acento y como llamada a la acción.
- Los fondos claros y oscuros separan las secciones con claridad.
- La mayoría de los textos de cuerpo usa `--ink` o `--muted`, que son más legibles que un gris claro.

### Riesgos

#### Texto coral pequeño sobre fondo claro

Evidencia: [styles.css](styles.css#L50-L51) y [styles.css](styles.css#L87) usan `--coral` en cejas y categorías con tamaños de `0.7rem` y `0.65rem`.

Riesgo: el coral puede quedar corto de contraste para texto pequeño, especialmente con peso normal o en pantallas con brillo alto.

Recomendación:

- Medir `--coral` sobre `--cream` y `--paper` con WCAG AA.
- Si no alcanza 4.5:1 para texto normal, oscurecer el coral o reservarlo para texto grande y elementos decorativos.
- No depender solo del color para indicar la categoría activa.

#### Amarillo sobre fondos claros

Evidencia: [styles.css](styles.css#L45-L46) y [styles.css](styles.css#L98-L103) usan amarillo en enlaces o acentos.

Riesgo: el amarillo funciona mejor sobre petróleo y sobre `--ink`; sobre blanco o crema puede perderse.

Recomendación:

- Mantener el amarillo para fondos oscuros, iconos y detalles grandes.
- Para enlaces amarillos sobre fondo claro, usar una versión más oscura o subrayado visible.

#### Estados de foco

Evidencia: [styles.css](styles.css#L143) usa un outline amarillo global.

Riesgo: el foco amarillo sobre un botón amarillo puede tener poca diferenciación visual.

Recomendación:

- Usar un doble anillo o un outline oscuro para controles amarillos.
- Comprobar el foco sobre hero, tarjetas, filtros, botón flotante y menú móvil.

#### Ruido visual

Evidencia: [styles.css](styles.css#L12) aplica una textura fija sobre toda la página con `body::before`.

Riesgo: la textura puede reducir la nitidez de textos pequeños y aumentar el costo de pintura en dispositivos modestos.

Recomendación:

- Reducir la opacidad de la textura o limitarla a zonas decorativas.
- Confirmar que no interfiera con lectura, zoom y contraste.

## Animaciones y movimiento

### Recomendación visual: aparición suave al hacer scroll

Al bajar por la página, los elementos que todavía no entran en pantalla deberían comenzar ligeramente desvanecidos y aparecer de forma progresiva cuando el usuario llegue a ellos. El efecto recomendado es:

- Opacidad inicial reducida, sin ocultar contenido esencial de forma permanente.
- Desplazamiento vertical corto, aproximadamente entre 16 y 24 píxeles.
- Transición suave de entre 500 y 800 milisegundos, sin rebotes exagerados.
- Aparición escalonada de las tarjetas de productos y locales, con retrasos pequeños entre elementos.
- Cada elemento se anima una sola vez al entrar en el viewport para evitar distracciones al volver a subir.
- Los encabezados, imágenes, tarjetas y bloques de historia pueden revelarse; los textos largos no deberían aparecer palabra por palabra.
- Con `prefers-reduced-motion: reduce`, el contenido debe mostrarse inmediatamente, sin desplazamiento ni desvanecimiento.

El proyecto ya contiene una primera implementación de este patrón en [styles.css](styles.css#L239-L254) y [script.js](script.js#L70-L85). La auditoría recomienda probarla en móvil, con filtros activos y con navegación por teclado antes de considerarla terminada.

### Lo que está bien

- [script.js](script.js#L70-L85) usa `IntersectionObserver` y deja de observar cada elemento después de mostrarlo.
- [styles.css](styles.css#L239-L254) separa la entrada, el estado visible y `prefers-reduced-motion`.
- La aparición escalonada de tarjetas está limitada a unos pocos hijos y no usa movimiento permanente.
- La navegación ancla usa desplazamiento suave, con excepción para usuarios que reducen movimiento.

### Riesgos y mejoras

#### Fallback ante fallo de JavaScript

La clase `.reveal` se añade desde JavaScript, por lo que un fallo parcial del script no oculta el contenido antes de ejecutarse. Esto es correcto. Aun así, hay que conservar esta propiedad si se refactoriza: nunca poner `opacity: 0` directamente en HTML o en selectores base que afecten a contenido esencial.

#### Filtros y animación

Evidencia: [script.js](script.js#L31-L41) usa `hidden` y [styles.css](styles.css#L220-L225) vuelve a filtrar con `:has()`.

Riesgo: hay dos mecanismos para ocultar productos. Puede haber diferencias entre navegadores o estados intermedios al cambiar de categoría.

Recomendación:

- Elegir una sola fuente de verdad, preferiblemente el estado `hidden` del script si se necesita actualizar el contador.
- Si se desea animar el cambio de categoría, animar solo los elementos visibles después de actualizar el filtro.
- No animar altura de la cuadrícula para evitar saltos de layout.

#### Entrada inicial

El hero no tiene la misma entrada progresiva que el resto de la página. Esto no es un error, pero puede hacer que la primera pantalla se sienta separada del lenguaje visual del scroll.

Recomendación:

- Añadir una entrada muy corta y sutil al contenido del hero, solo si no retrasa la lectura.
- Mantener el hero visible inmediatamente para usuarios con conexión lenta o movimiento reducido.

#### Hover en dispositivos táctiles

Evidencia: [styles.css](styles.css#L79-L81) escala imágenes y tarjetas con `:hover`.

Riesgo: algunos dispositivos táctiles mantienen un estado hover extraño o producen sensación de salto.

Recomendación:

- Envolver hover visual en `@media (hover: hover) and (pointer: fine)`.
- Mantener un estado `:focus-visible` equivalente para teclado.

## Accesibilidad

### Fortalezas

- Documento con `lang="es"`.
- Enlace para saltar al contenido en [index.html](index.html#L48).
- Imágenes con `alt` y dimensiones declaradas en el catálogo.
- Filtros agrupados en `fieldset` con `legend` oculto.
- Estados del catálogo anunciados con `role="status"` y `aria-live`.
- Enlaces externos incluyen `rel="noopener"`.
- Existe soporte de teclado para cerrar el menú con Escape en [script.js](script.js#L20-L24).

### Pendientes

- Corregir `aria-hidden` inicial del menú, descrito como P0.
- Verificar que el foco no quede dentro de un menú cerrado.
- Considerar devolver el foco al botón al cerrar el menú móvil.
- Añadir un estado visual `:focus-visible` claramente distinto al hover.
- Revisar el texto alternativo de imágenes repetidas: si varias fotos muestran esencialmente el mismo pan, el alt no debería prometer diferencias que la imagen no tiene.
- El icono del botón flotante usa el carácter `◔`; conviene usar un icono reconocible y mantener una etiqueta accesible.
- Confirmar que el mapa embebido no atrape el foco de forma inesperada en móvil.

## Responsive y experiencia móvil

### Riesgos

- Hay reglas repetidas para `location-grid`, `.nav-wrap` y `.main-nav` en distintos bloques de `@media`; el comportamiento final depende de la última regla.
- El menú móvil tiene varias estrategias sucesivas: primero despliega en bloque, luego cambia a flex y finalmente vuelve a ocultarse con posición absoluta.
- El filtro horizontal es correcto como patrón, pero debe comprobarse que el elemento activo quede visible después de cambiar de categoría.
- El botón flotante de WhatsApp puede cubrir contenido o controles en pantallas muy estrechas.
- El texto de la banda de identidad y el aviso inferior del hero deben probarse con zoom del 200% y con fuentes del dispositivo ampliadas.
- Las tarjetas tienen textos con longitudes variables; conviene comprobar que precio, disponibilidad y botón no se desplacen de manera desigual.

### Pruebas recomendadas

- 320 px, 360 px, 390 px y 430 px de ancho.
- 768 px y 1024 px.
- Zoom del navegador al 200%.
- Orientación vertical y horizontal.
- Navegación completa usando solo teclado.

## Rendimiento y recursos

### Imágenes

Evidencia: [index.html](index.html#L96-L110) usa varias imágenes remotas de Unsplash y un recurso externo adicional para bebidas.

Riesgos:

- Dependencia de terceros y posibles fallos de disponibilidad.
- Varias imágenes de productos son repetidas o muy parecidas.
- La imagen del hero llega como `background-image`, por lo que no tiene `loading` ni `fetchpriority` explícitos.
- No hay `srcset` ni `sizes` para adaptar el peso a cada pantalla.
- Ocultar la imagen al fallar puede dejar una tarjeta visualmente vacía.

Recomendación:

- Guardar localmente las imágenes definitivas y optimizarlas a WebP o AVIF.
- Añadir `srcset`/`sizes` a imágenes de contenido.
- Definir un fondo visual local para cada imagen fallida.
- Reservar dimensiones o `aspect-ratio` para evitar desplazamientos de layout.

### Fuentes

Evidencia: [index.html](index.html#L22-L24) hace `preconnect` a Google Fonts, pero no carga una hoja de fuentes. La segunda parte de [styles.css](styles.css#L181-L197) menciona `DM Sans` y `Playfair Display` aunque no están garantizadas.

Impacto: el navegador puede usar fuentes de reemplazo distintas a las previstas, cambiando métricas, saltos de línea y apariencia.

Recomendación:

- O bien cargar explícitamente las fuentes que se van a usar, o bien eliminar las referencias no cargadas y elegir una pila local consistente.
- Medir el impacto de la fuente en el hero y los títulos.

### JavaScript

- El script es pequeño y no contiene dependencias.
- El intervalo de un minuto para el estado de apertura es razonable, pero debería usar una zona horaria de negocio definida y no depender únicamente del reloj local del visitante.
- El manejador de error del iframe no garantiza detectar todos los bloqueos de contenido de terceros; el enlace alternativo debe ser siempre visible o tener una prueba de carga más confiable.

## HTML, SEO y datos estructurados

### Fortalezas

- Hay `title`, `description`, canonical, Open Graph, Twitter Card y JSON-LD.
- El tipo `Bakery` es apropiado para el negocio.
- Los headings siguen una jerarquía razonable: un `h1`, títulos de sección y nombres de producto.

### Pendientes

- Reemplazar valores de ejemplo antes de publicar: canonical, Open Graph, URL, teléfono y otros datos de negocio. Este punto queda registrado, pero no se califica en esta auditoría por ser dato provisional.
- Añadir `openingHoursSpecification` y `sameAs` cuando existan datos definitivos.
- Confirmar que la imagen Open Graph tenga proporción, peso y URL pública válidos.
- Usar caracteres y ortografía consistentes en el contenido visible: actualmente aparecen textos sin tildes como `menu`, `Categorias`, `rapido` y `panaderia`.
- Reemplazar el texto `Audio-PhoneComputer` cuando exista el nombre real del local; se excluye de la evaluación por ser dato de prueba.
- Validar el JSON-LD con el Rich Results Test.

## Arquitectura y mantenibilidad

- El HTML está muy comprimido en líneas extensas, especialmente cada tarjeta de producto y las secciones finales. Esto dificulta revisión, accesibilidad y resolución de conflictos.
- Conviene separar cada producto en una estructura legible o generarlo desde un arreglo de datos si el catálogo va a crecer.
- La lógica de disponibilidad crea el elemento `.availability` aunque actualmente no hay tarjetas con `data-available="false"`. La estructura de datos debería definir explícitamente ese estado.
- El filtro CSS con `:has()` duplica la responsabilidad del filtro JavaScript.
- Hay comentarios de compatibilidad que describen reglas heredadas, señal de que la hoja necesita una limpieza estructural.
- No existe una suite de pruebas para navegación, filtros, menú, reduced motion, enlaces o cálculo de horarios.

## Plan de mejora recomendado

### Fase 1: base segura

1. Consolidar `styles.css` en una sola versión.
2. Corregir `aria-hidden` y el ciclo de foco del menú móvil.
3. Medir colores con WCAG y ajustar coral, amarillo y focus ring.
4. Mantener el fallback visible si falla JavaScript o una imagen.

### Fase 2: experiencia

1. Probar el revelado en móvil, filtros y navegación por teclado.
2. Limitar hover a dispositivos que realmente tienen puntero.
3. Revisar el botón flotante y los saltos de ancla.
4. Validar zoom del 200% y tamaños móviles pequeños.

### Fase 3: rendimiento y publicación

1. Optimizar y servir imágenes locales responsivas.
2. Resolver la estrategia de fuentes.
3. Validar JSON-LD, metadatos y enlaces definitivos.
4. Añadir pruebas automatizadas de los flujos principales.

## Lista de aceptación

- [x] Un lector de pantalla encuentra la navegación en escritorio.
- [x] El menú móvil anuncia abierto/cerrado y devuelve el foco correctamente.
- [ ] Todos los textos pequeños cumplen WCAG AA.
- [x] El foco es visible sobre todos los fondos y botones.
- [x] Las animaciones se desactivan o simplifican con `prefers-reduced-motion`.
- [x] Ningún fallo de JavaScript deja contenido esencial invisible.
- [x] Los filtros muestran el resultado correcto sin reglas CSS duplicadas.
- [ ] El sitio funciona a 320 px, 768 px, 1024 px y con zoom del 200%.
- [x] Las imágenes tienen fallback y no provocan saltos de layout.
- [x] La hoja de estilos no contiene bloques duplicados.
- [ ] JSON-LD y metadatos pasan sus validadores.
- [ ] Los flujos de menú, filtros, enlaces y estado de apertura tienen pruebas automatizadas completas.
