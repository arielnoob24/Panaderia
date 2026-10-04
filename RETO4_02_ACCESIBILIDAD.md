# Reto 4 · Entregable 2 — Accesibilidad y los cuatro principios WCAG 2.2

5 de los 20 puntos. Criterio literal: *"Cumplimiento de los principios vistos en el primer RDA: percepción, operabilidad, comprensión y robustez."* Y el enunciado pide una **matriz de cumplimiento**, no una tabla de definiciones.

Materia prima, no texto para entregar. Los bloques `> ESCRIBE TÚ` son tuyos.

---

## 1. Lo que cambió: ya no falta ninguna medición

En la guía te dije que este criterio no estaba listo porque faltaban tres mediciones que necesitaban un navegador. **Las tres están hechas.** Controlé el Chrome que tienes instalado con `puppeteer-core` y medí sobre la página de verdad, en siete escenarios y dos tamaños de pantalla.

| Lo que faltaba | Resultado |
|---|---|
| Objetivos táctiles de 24×24 (2.5.8) | **Cumple** en los 7 escenarios |
| Contraste del `h1` sobre la fotografía | **11,13** el titular y **3,82** el `<em>`; los dos pasan |
| Si la cabecera fija tapa el foco (2.4.11) | **Cumple**, y también el nivel AAA — pero hubo que arreglar dos cosas (§3) |

Y midiendo salió algo que no esperaba: **el arreglo que había hecho para el foco no servía de nada.** Está en §3 y es el mejor material que tienes para este apartado.

---

## 2. La matriz de cumplimiento

Cinco columnas. La cuarta es la que convierte una tabla de definiciones en una matriz de cumplimiento: **cualquiera puede repetir la comprobación y obtener lo mismo**.

Todo medido el 2026-10-04 sobre `index.html` + `script.js` + `styles.css` del repositorio.

### Perceptibilidad

| Criterio WCAG | Qué hace el sitio | Cómo lo compruebas | Resultado |
|---|---|---|---|
| **1.1.1** Contenido no textual (A) | 22 imágenes, ninguna sin atributo `alt`. Las 2 decorativas con `alt=""`. Los 21 SVG con `aria-hidden="true"` + `focusable="false"` | `document.querySelectorAll('img:not([alt])').length` → 0 | ✅ 0 de 22 sin `alt` |
| **1.1.1** (iconos sin texto) | Los botones que son solo dibujo llevan `aria-label` + `title`: el círculo de cuenta, el flotante, la pausa, las flechas de la fila | Tabular por ellos con Narrador abierto | ✅ 0 controles sin nombre accesible, de 59 |
| **1.1.1** (el QR) | El QR de DeUna es de adorno, va `aria-hidden` y un `<p>` al lado explica que no codifica nada | Leer `.pago-qr-alt` en el paso de pago | ✅ |
| **1.4.3** Contraste mínimo (AA) | 16 de los 17 pares de la paleta pasan; muchos con AAA. El que fallaba (`--horno-claro` sobre `--masa`, 4,49) se corrigió a `--horno-suave` (6,79) | Fórmula de WCAG sobre los tokens de `:root`; tabla completa en [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §7.2 | ✅ 17 de 17 |
| **1.4.3** (texto sobre foto) | El `h1` va sobre una fotografía con velo. Medido en píxeles: peor contraste **11,13** el titular, **3,82** el `<em>` | Esconder el texto, capturar el fondo y muestrear. 33.280 y 17.536 píxeles | ✅ exige 3 (texto grande de 112 px) |
| **1.4.11** Contraste no textual (AA) | El anillo de foco es doble: línea marrón de 3 px (**12,41**) y halo ámbar de 5 px | Inspeccionar `a:focus-visible` en DevTools | ✅ la línea cumple; el halo es refuerzo |
| **1.4.4** Redimensionar texto (AA) | Todo en `rem` y `clamp()`; ningún `px` fijo en tamaños de letra | Zoom al 200 %: lienzo de 720×450 px CSS | ✅ medido, §5 |
| **1.4.10** Reflujo (AA) | Una sola columna desde 680 px | Lienzo de 320 px CSS (zoom 400 %) | ✅ sin scroll horizontal |

### Operabilidad

| Criterio WCAG | Qué hace el sitio | Cómo lo compruebas | Resultado |
|---|---|---|---|
| **2.1.1** Teclado (A) | **Todo el flujo del pedido se completa sin ratón**, incluido marcar el punto en el mapa. 38 paradas de tabulación en la portada | Recorrido de 5 pasos en [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md) §2 | ✅ |
| **2.1.2** Sin trampas de foco (A) | `Esc` cierra cualquier panel y desplegable y devuelve el foco. El cerco de los modales recupera el foco si acabó fuera | Abrir la canasta y pulsar `Tab` quince veces | ✅ 0 trampas |
| **2.4.1** Evitar bloques (A) | Enlace "Saltar al contenido", invisible hasta que recibe el foco | `Tab` una vez desde el principio | ✅ |
| **2.4.3** Orden del foco (AA) | El orden del documento es el visual. Al abrir el menú del teléfono el foco entra en él | Tabular y comparar con lo que se ve | ✅ orden medido y publicado |
| **2.4.7** Foco visible (AA) | Un solo estilo en todo el sitio: 3 px marrón + halo ámbar de 5 px, con `:focus-visible` | Tabular por cualquier control | ✅ |
| **2.4.11** Foco no oscurecido, mínimo (AA) — *nuevo en 2.2* | `scroll-margin-top: 110px` por la cabecera fija y `scroll-margin-bottom: 92px` por el botón flotante | `elementFromPoint` sobre una rejilla de 5×5 del elemento enfocado, 45 pulsaciones, 4 escenarios | ✅ 0 tapados. **También cumple 2.4.12 (AAA)**: 0 tapados ni en parte |
| **2.5.8** Tamaño del objetivo, mínimo (AA) — *nuevo en 2.2* | 6 controles miden menos de 24×24, todos exentos por la **excepción de espaciado** de la propia norma | Círculo de 24 px centrado en cada objetivo pequeño; comprobar que no toca otro | ✅ 7 escenarios, 0 incumplimientos |
| **2.2.2** Pausar, detener, ocultar (A) | La fila del mostrador avanza sola cada 4,2 s y tiene **botón de pausa** con `aria-pressed`. Parada a mano, no la reanudan ni el reloj ni las flechas | Pulsar la pausa y esperar 10 segundos | ✅ (era un incumplimiento hasta el 2026-10-04) |
| **2.3.3** Animación por interacción (AAA) | `prefers-reduced-motion: reduce` respetado, con un listener que reacciona si lo cambias a mitad de sesión | Activarlo en Configuración de Windows con la página abierta | ✅ |
| **2.5.7** Movimientos de arrastre (AA) — *nuevo en 2.2* | La aguja del mapa se arrastra, pero hay dos alternativas sin arrastrar: el botón "Marcar el centro" y `Enter` sobre el mapa | Marcar el punto sin arrastrar nada | ✅ |

### Comprensibilidad

| Criterio WCAG | Qué hace el sitio | Cómo lo compruebas | Resultado |
|---|---|---|---|
| **3.1.1** Idioma de la página (A) | `lang="es"` en `<html>` | Ver la fuente | ✅ |
| **3.2.3** Navegación consistente (AA) | La barra no cambia al entrar en una categoría ni al abrir un panel | Entrar en cada vista y comparar | ✅ |
| **3.2.5** Cambio a petición (AAA) | Los 4 enlaces que abren pestaña nueva lo avisan con `sr-only` | `document.querySelectorAll('a[target="_blank"]')` y leer cada texto | ✅ 4 de 4 (eran 0 de 4) |
| **3.3.1** Identificación de errores (A) | 4 regiones `role="alert"`. El error va bajo su campo | Pulsar "Seguir al pago" con domicilio y sin dirección | ✅ |
| **3.3.2** Etiquetas e instrucciones (A) | 48 campos, **0 sin rótulo asociado**. `placeholder` solo como ejemplo, nunca como etiqueta | Recorrer los campos buscando `label[for]` | ✅ 48 de 48 |
| **3.3.3** Sugerencia ante error (AA) | Los mensajes dicen qué falta: *"Revisa el correo, algo le falta"*, no "formato inválido". Y **el foco va al primer campo que falta** | Intentar pagar con una tarjeta que no pase Luhn | ✅ |
| **3.3.8** Autenticación accesible, mínimo (AA) — *nuevo en 2.2* | El paso de entrar **no pide contraseña**: no hay servidor que la compruebe, así que pedirla sería fingir. Solo el correo, con `autocomplete="email"` | Abrir el círculo de cuenta → "Iniciar sesión" | ✅ sin prueba cognitiva |

### Robustez

| Criterio WCAG | Qué hace el sitio | Cómo lo compruebas | Resultado |
|---|---|---|---|
| **1.3.1** Información y relaciones (A) | `header`/`nav`/`main`/`footer` una vez cada uno, 18 `article`, 2 `fieldset` con `legend`, 5 `dl`, 1 `address`. 30 encabezados, **0 saltos de nivel** | Recorrer los encabezados con un lector de pantalla | ✅ |
| **1.3.1** (grupos de opciones) | Los 6 grupos de tamaño con `role="group"` + `aria-label="Tamaño de ‹producto›"` | Inspeccionar `.card-tamanos` | ✅ 6 de 6 |
| **4.1.2** Nombre, función, valor (A) | 2 diálogos con `role="dialog"` + `aria-modal` + `aria-labelledby`. 3 `aria-expanded` + `aria-controls`. 1 `aria-pressed`. 11 `aria-describedby`. 58 `<button type="button">`, **0 `<div>` con `onclick`** | `document.querySelectorAll('div[onclick]').length` → 0 | ✅ 0 controles sin nombre |
| **4.1.3** Mensajes de estado (AA) | 4 `role="status"` y 2 `aria-live="polite"`: el recuento del catálogo, los cambios de la canasta y los dos avisos de copiado | Añadir un producto con Narrador abierto | ✅ |
| **Mejora progresiva** *(no es un criterio, es el argumento)* | Sin JavaScript el sitio **cambia, no se rompe**: los 15 contadores vuelven a ser enlaces de WhatsApp, la fila sale como cuadrícula, los enlaces de categoría bajan al catálogo | Desactivar JS en DevTools y hacer un pedido | ✅ |

> **ESCRIBE TÚ:** la matriz de arriba es la tabla. Lo que tienes que escribir es un párrafo de entrada que diga **sobre qué versión se midió, con qué herramienta y en qué escenarios**, y otro de cierre con lo que no se midió. No copies mis celdas: están para que saques el dato.
>
> `<!-- -->`

---

## 3. Tu mejor material de este apartado: el arreglo que no servía

Esto es lo que te distingue, y pasó midiendo.

**Lo que había hecho.** Para que la cabecera fija no tapara lo que recibe el foco, escribí esta regla:

```css
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible,
textarea:focus-visible, [tabindex]:focus-visible { scroll-margin-top: 110px; }
```

Parece correcta. Lo di por arreglado y lo dejé "pendiente de confirmar en el navegador".

**Lo que la medición enseñó.** Al tabular hacia atrás desde el pie en el teléfono, un botón de ficha acababa en `top = -25 px`: fuera de la pantalla por arriba. La regla no estaba funcionando.

**Por qué.** El navegador calcula el desplazamiento **en el mismo instante en que mueve el foco**, cuando `:focus-visible` todavía no casa con el elemento. Colgada de la pseudoclase, la propiedad llegaba tarde siempre. Sacada del `:focus-visible`, el navegador sí la respeta:

```css
a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]) {
  scroll-margin-top: 110px;
  scroll-margin-bottom: 92px;
}
```

**Y un segundo hallazgo, por el otro lado.** Arreglado eso, apareció otro caso distinto: en el teléfono el **botón flotante de la canasta** tapaba el `+` de una ficha cuando quedaba al fondo de la pantalla. No es la cabecera: es un elemento fijo abajo. De ahí el `scroll-margin-bottom: 92px`, que es el alto del botón más su margen.

**Por qué esto da para un párrafo tuyo.** Tres cosas que puedes defender:

1. **Una regla CSS que parece correcta puede no hacer nada**, y la única forma de saberlo es medir el resultado, no leer el código.
2. **Hay dos elementos fijos que pueden tapar el foco**, no uno. Pensé solo en la cabecera porque es la que se ve siempre; el botón flotante se me escapó hasta que la medición lo señaló.
3. **"Pendiente de confirmar" era una forma elegante de decir "no lo sé".** Y resultó que no estaba arreglado.

> **ESCRIBE TÚ:**
> `<!-- -->`

---

## 4. El otro ángulo fuerte: el mapa

Ya está contado en [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md) §3, pero conviene que esté aquí porque es el caso que mejor demuestra el criterio.

**El problema:** el punto de entrega se marcaba con un clic en el mapa o arrastrando la aguja. Dos cosas que un teclado no puede hacer. El pedido a domicilio estaba cerrado para quien no usa ratón — no "incómodo": **imposible**.

**Lo que no sirvió:** no se arregla con un `aria-label`, ni con un `tabindex`, ni con un `role`. El mapa ya era focalizable y Leaflet ya movía con las flechas. Lo que no existía era **una forma de soltar la aguja**.

**El arreglo:** una interacción nueva. Un botón "Marcar el centro del mapa", y `Enter` sobre el mapa hace lo mismo. Y de paso cubre WCAG 2.5.7 (movimientos de arrastre, nuevo en 2.2), que exige una alternativa a arrastrar.

**El giro que vale el punto:** esa interacción nueva **también sirve a quien usa el teléfono** y no quiere pelearse con el pulgar para acertar en un punto del mapa. Accesibilidad que mejora la usabilidad de todos.

> **PREGUNTA que el informe tiene que contestar:** ¿por qué no bastaba con un atributo ARIA? La respuesta distingue entre un problema de **etiquetado** (el sistema no dice lo que es) y un problema de **interacción** (no hay forma de hacerlo). ARIA arregla el primero y no puede arreglar el segundo.
>
> **ESCRIBE TÚ:**
> `<!-- -->`

---

## 5. El zoom, medido

Medido en Chrome el 2026-10-04 a cuatro niveles. Un zoom del 200 % sobre una ventana de 1440×900 equivale a un lienzo de 720×450 px CSS, y así se simula.

| Zoom | Lienzo CSS | Desplazamiento horizontal | La cabecera se come | Resultado |
|---|---|---|---|---|
| 100 % | 1440×900 | no | 10 % del alto | ✅ |
| **200 %** | 720×450 | **no** | 19 % del alto | ✅ **1.4.4 cumple** |
| 300 % | 480×300 | no | 23 % del alto | ✅ |
| 400 % | 320×512 | **no** | 14 % del alto | ✅ **1.4.10 cumple** (320 px es el mínimo que exige el criterio) |

**Lo importante:** no aparece desplazamiento horizontal en ningún nivel, ni siquiera a 320 px CSS, que es el ancho mínimo que exige WCAG 1.4.10 (Reflujo). Y al 200 % el titular del hero queda entero por debajo de la cabecera (`top` 214, la cabecera acaba en 86), así que no se pierde contenido.

**Una cosa que sí se nota y conviene explicar antes de que te la señalen:** al 200 %, si desplazas la página, la cabecera fija pasa por delante del contenido. Eso es el comportamiento normal de una cabecera fija y **no incumple nada** —el contenido sigue siendo alcanzable desplazando— pero a mucho zoom se come una quinta parte de la pantalla. Si quieres curarte en salud, dilo tú como limitación conocida.

| Criterio WCAG | Qué hace el sitio | Cómo lo compruebas | Resultado |
|---|---|---|---|
| **1.4.4** Redimensionar texto (AA) | Tamaños en `rem` y `clamp()`; ningún `px` fijo en tipografía | Zoom al 200 %, comprobar que no se pierde contenido | ✅ |
| **1.4.10** Reflujo (AA) | Una sola columna desde 680 px; la cuadrícula se reorganiza | Lienzo de 320 px CSS, comprobar que no hay scroll horizontal | ✅ |

*(Añade estas dos filas a la matriz de §2, en Perceptibilidad.)*

---

## 5 bis. Lo único que queda sin medir

**Dilo en el informe.** Un apartado sin ninguna laguna suena a inventado.

| Qué | Por qué | Tiempo |
|---|---|---|
| **Lector de pantalla** | Nada sustituye a oírlo, y el enunciado nombra expresamente los lectores de pantalla en el principio de Robustez. Narrador (`Ctrl + Win + Enter`) o NVDA | 10 min |

> **MIDE TÚ:** qué sonó raro `<!-- -->`

---

## 6. Cómo montar este apartado del informe

Orden propuesto. Son títulos, no contenido:

1. **Qué son los cuatro principios** y de dónde salen (WCAG 2.2, W3C). Dos párrafos con tus palabras.
2. **Método.** Sobre qué versión, con qué herramientas, en qué escenarios y tamaños de pantalla. **Esto es lo que hace creíble la matriz**: di que se midió en Chrome con `puppeteer-core`, en 7 escenarios y 2 tamaños, y que los contrastes se calcularon con la fórmula de WCAG.
3. **La matriz**, los cuatro principios, la tabla de §2.
4. **Dos casos en detalle:** el mapa (§4) y el arreglo que no servía (§3). Una página cada uno.
5. **Qué queda sin medir** (§5).

**Cuánto:** de 4 a 5 páginas con las tablas.

**Cómo sabes que está bien:** coge tres filas al azar de tu matriz, haz lo que dice la columna "cómo lo compruebas", y mira si sale lo mismo. Si no puedes repetir tu propia comprobación, esa celda está mal escrita.

---

## 7. Las cifras, para que no tengas que buscarlas

Todas medidas el 2026-10-04. Están verificadas contra el código por un comprobador automático: 39 afirmaciones, las 39 cuadran.

| | |
|---|---|
| Imágenes / sin `alt` | 22 / **0** |
| Decorativas con `alt=""` | 2 |
| SVG / bien ocultos a tecnología asistida | 21 / **21** |
| Campos de formulario / sin rótulo | 48 / **0** |
| Controles interactivos / sin nombre accesible | 59 en pantalla / **0** |
| Encabezados / saltos de nivel | 30 / **0** |
| Paradas de tabulación en la portada | 38 |
| Trampas de foco | 0 |
| Diálogos con `role="dialog"` + `aria-modal` + `aria-labelledby` | 2 de 2 |
| Regiones que anuncian (`role="status"` / `aria-live`) | 4 / 2 |
| `role="alert"` | 4 |
| `aria-expanded` / `aria-controls` / `aria-describedby` / `aria-pressed` | 3 / 3 / 11 / 1 |
| `role="group"` en grupos de tamaño | 6 de 6 |
| `<button type="button">` / `<div onclick>` | 58 / **0** |
| Enlaces con `target="_blank"` / que lo avisan | 4 / **4** |
| Pares de contraste medidos / que pasan AA | 17 / **17** |
| Peor contraste del `h1` sobre la foto | **11,13** (exige 3) |
| Peor contraste del `<em>` sobre la foto | **3,82** (exige 3) |
| Controles por debajo de 24×24 / que incumplen 2.5.8 | 6 / **0** (exentos por espaciado) |
| Elementos enfocados que quedan tapados | **0** en 4 escenarios, también a nivel AAA |
