# Navegación con teclado: El Tradicional

Fecha: 2026-10-04. Índice de auditorías: [AUDITORIAS.md](AUDITORIAS.md).

Este archivo es la guía práctica para recorrer el sitio **sin tocar el ratón**: qué tecla hace qué en cada pantalla, qué se arregló para que eso fuera posible, y qué queda cojo. Lo general de accesibilidad (alt, contraste, landmarks, lectores de pantalla) vive en [AUDITORIA_ACCESIBILIDAD.md](AUDITORIA_ACCESIBILIDAD.md); aquí solo el teclado.

---

## 1. Las cuatro teclas que lo hacen todo

| Tecla | Qué hace |
|---|---|
| `Tab` | Avanza al siguiente control |
| `Shift + Tab` | Retrocede al anterior |
| `Enter` | Activa enlaces y botones |
| `Espacio` | Activa botones y marca casillas (en un enlace no hace nada: desplaza la página) |
| `↑ ↓ ← →` | Se mueve **dentro** de un grupo: radios de tamaño, desplegables de la barra, el mapa |
| `Esc` | Cierra lo último que se abrió y devuelve el foco a donde estaba |

Regla general del sitio: **`Tab` entra y sale de los grupos, las flechas se mueven por dentro, `Esc` siempre cierra.**

### Cómo saber dónde está el foco

Todo lo que recibe foco se marca con un **anillo doble**: una línea marrón oscuro de 3 px y un halo ámbar de 5 px alrededor ([styles.css:475](styles.css#L475)). Es intencionadamente grueso y de dos colores para que se vea sobre fondo claro, sobre fondo marrón y sobre las fotos.

El anillo solo sale cuando se llega **con teclado**, no al pulsar con el ratón: eso lo hace el selector `:focus-visible`, que es lo correcto, no un olvido. Si al hacer clic no aparece anillo, no está roto.

---

## 2. El recorrido completo de la portada

Este es el orden real de tabulación en escritorio, medido sobre la página, no deducido:

| # | Control |
|---|---|
| 1 | **Saltar al contenido** (invisible hasta que recibe foco) |
| 2 | Logo / Ir al inicio |
| 3 | Nosotros |
| 4 | **Tienda** (botón desplegable) |
| 5 | Contáctanos |
| 6 | **Círculo de la cuenta** |
| 7 | Ver el menú ↓ |
| 8 | Encuentra tu local |
| 9–36 | El mostrador: por cada producto su botón `+`, y en las bebidas primero sus tamaños |
| 37–38 | Las dos flechas de la fila (← →) |
| 39 | Conoce nuestros locales |
| 40–43 | Pie: logo, Ver en el mapa, Instagram, teléfono |
| 44 | **Botón flotante de la canasta** |

**Cuidado con ese 44, y la tabla ya no está al día.** Dos avisos:

1. **44 era el número de *controles*, no de paradas.** Un grupo de radios con el mismo `name` es **una sola parada**: `Tab` entra en el que está marcado y las flechas se mueven por dentro.
2. **El 2026-10-04 se añadieron dos controles** en la cabeza del mostrador, "Ver todo el catálogo" y el botón de pausa, que entran después de "Encuentra tu local".

Medido hoy: 42 controles alcanzables, de los que 11 son radios en 5 grupos, más las 2 flechas de la fila → **38 paradas**. Si lo citas en un informe, cita 38.

Dos cosas a notar:

- El **botón de menú hamburguesa** (posición 12 en el documento) no aparece en escritorio porque está en `display: none`, y lo que no se muestra no se tabula. En móvil sí sale, y ahí desaparecen en cambio los enlaces de la barra hasta que se abre el menú.
- Los productos **agotados** no tienen botón `+`, así que el tabulador se los salta por completo. La Powerade, además de no tener botón, lleva sus dos radios de tamaño con `disabled`, así que tampoco esas se tabulan. Las tres fichas agotadas tienen **cero** controles alcanzables: correcto, no hay nada que activar.

### Para la demostración

El recorrido más corto que enseña todo:

1. `Tab` desde arriba → se ve el "Saltar al contenido" aparecer de la nada. Pulsa `Enter`.
2. `Shift+Tab` hasta **Tienda**, `↓` → se abre el desplegable y el foco entra en "Panes". `↓` `↓` baja por las tres, `Esc` cierra y vuelve al botón.
3. `Tab` hasta un botón `+` de un producto, `Enter`. El número aparece.
4. `Tab` hasta el **botón flotante**, `Enter`. Se abre la canasta y el foco cae en su "cerrar".
5. Dentro: `Tab` da vueltas y **no se escapa** a la página de detrás. `Esc` cierra y el foco vuelve al botón flotante.

---

## 3. Cada pieza, tecla por tecla

### La barra: desplegable "Tienda"

- `Enter` o `Espacio` sobre **Tienda**: abre y cierra.
- `↓`: abre y lleva el foco al primer enlace. `↑`: abre y lleva al último.
- Dentro: `↓` `↑` recorren, `Inicio` y `Fin` van a las puntas.
- `Esc`: cierra y **devuelve el foco al botón Tienda**, no al principio de la página.
- `Tab` saliendo del último enlace: lo cierra solo, porque un desplegable abierto detrás del foco es un menú que ya no responde.

Mientras está cerrado, el desplegable es `visibility: hidden`, y eso saca sus enlaces del recorrido del tabulador. Importa: si se hubiera escondido solo con `opacity: 0`, los tres enlaces seguirían siendo tabulables y habría tres paradas invisibles.

### La barra: círculo de la cuenta

Mismo trato que Tienda: `Enter` abre las dos puertas, `↓` `↑` recorren, `Esc` cierra devolviendo el foco al círculo.

### El menú del teléfono (hamburguesa)

`Enter` lo abre **y mete el foco en el primer enlace**. Esto es un arreglo, no un detalle: la navegación va *antes* del botón en el documento, así que sin eso el siguiente `Tab` se la saltaba por detrás y había que retroceder a ciegas para encontrar el menú que acabas de abrir.

`Esc` o volver a pulsar el botón: cierra y el foco regresa al botón.

### El mostrador en fila

La fila se recorre **tabulando por los productos**: el navegador trae solo a la vista el que recibe foco, así que no hace falta desplazar nada a mano.

Las dos flechas `←` `→` del final son el apaño para el ratón, que no tiene manera de desplazar de lado. Con teclado son opcionales. Al llegar a una punta, la flecha de ese lado se deshabilita, y un botón deshabilitado no se tabula.

La fila **se adelanta sola** cada 4,2 s, pero se detiene en cuanto el foco entra en ella (`focusin`) y no vuelve a andar hasta que sale. También respeta `prefers-reduced-motion`. Nadie va a perseguir un producto que se mueve mientras lo elige.

### Los tamaños de las bebidas

Son radios de verdad dentro de un grupo, así que funciona lo que se espera de un grupo de radios: `Tab` entra una sola vez en el grupo, y **las flechas cambian el tamaño elegido**. El precio de la ficha se actualiza al cambiar y se anuncia por la región `aria-live`.

Los radios están visualmente escondidos pero **no desactivados**: siguen siendo focalizables, y la etiqueta a la que están unidos es la que se ilumina ([styles.css:280](styles.css#L280)).

### El contador de cantidad de cada producto

Tres controles, en este orden: `−` (o papelera), el número, `+`.

- `Enter` / `Espacio` en `+` y `−`: suma y resta de uno.
- Con una sola unidad, `−` es una papelera: quita el producto. Al desaparecer, **el foco salta al `+`** para no quedarse en el aire.
- El número es un campo escribible: `↑` `↓` suben y bajan de uno, `Enter` lo confirma, `Esc` recupera el valor anterior. Se puede teclear 20 directamente en lugar de pulsar veinte veces.

### La canasta, el pago y la cuenta (los paneles)

Los tres son un diálogo modal de verdad:

- Al abrirse, el foco entra en el panel (en el botón de cerrar o en el título).
- `Tab` y `Shift+Tab` **dan la vuelta dentro del panel** y no salen. Si por lo que sea el foco acaba fuera, la siguiente tecla lo devuelve dentro en lugar de echarlo a pasear por la página de atrás.
- La página de detrás queda apagada con `inert`: ni el tabulador la recorre ni el lector de pantalla la lee.
- `Esc` cierra desde cualquier sitio, también desde dentro de un campo de texto.
- Al cerrar, **el foco vuelve exactamente al control que lo abrió**. Si ese control ya no se ve (pasa en móvil, donde el menú se cerró), va al botón del menú, que sí se ve.

Los pasos ocultos del panel (pago, comprobante) están con `hidden`, así que sus campos no se cuelan en el recorrido del paso que se está viendo.

Los errores de formulario se anuncian con `role="alert"` y **el foco va al primer campo que falta**, no a un mensaje genérico arriba.

### El mapa del reparto

Esta era la única parte **imposible de usar sin ratón**, y es el arreglo de fondo de esta ronda. Antes el punto de entrega se marcaba solo con un clic en el mapa o arrastrando la aguja: dos cosas que un teclado no puede hacer.

Ahora hay tres caminos, y dos funcionan sin ratón:

| Camino | Cómo |
|---|---|
| **Botón "Marcar el centro del mapa"** | `Tab` hasta él, `Enter`. Deja la aguja en el centro de lo que se está viendo |
| **Enter sobre el mapa** | `Tab` hasta el mapa, `↑ ↓ ← →` para moverlo, `+` y `−` para acercar y alejar, `Enter` para soltar la aguja en el centro |
| Clic o arrastrar | Solo ratón y dedo |

El mapa lleva `role="application"` y un `aria-label` que dice en voz alta qué teclas lo mueven; sin eso, al tabular hasta ahí solo se oye "mapa" y no hay forma de adivinar que hace algo. Y el recuadro del mapa se ilumina con el mismo anillo que el resto cuando recibe foco, porque Leaflet no marca su lienzo.

El texto de debajo también lo dice por escrito: *"Marca a dónde va el pedido: toca el mapa, o muévelo con las flechas y pulsa Enter"*. Antes decía solo "Toca el mapa", que para quien no toca nada no era una instrucción.

### Los cuadritos de ayuda

Los botones que son solo un dibujo (las flechas de la fila, la papelera, el círculo de la cuenta) explican lo que hacen en un cuadrito. **Al tabular sale inmediatamente**, sin la espera de medio segundo que se le pide al ratón: quien tabula hasta un botón ya decidió mirarlo. Se queda mientras el botón tenga el foco y sigue a la página si esta se desplaza debajo. `Esc` lo cierra.

---

## 4. Qué se cambió en esta ronda

| Qué | Dónde | Por qué |
|---|---|---|
| Botón "Marcar el centro del mapa" + `Enter` sobre el mapa | [script.js](script.js) | El punto de entrega era inalcanzable sin ratón. Bloqueaba el pedido a domicilio por completo |
| `role="application"` y `aria-label` en el mapa | [script.js](script.js) | Sin rótulo no había manera de saber qué teclas lo mueven |
| Anillo de foco en el recuadro del mapa | [styles.css](styles.css) | Leaflet no marca su lienzo: se tabulaba hasta él a ciegas |
| Flechas `↓ ↑ Inicio Fin` en "Tienda" y en el menú de la cuenta | [script.js](script.js) | Es lo que se espera de un desplegable. Antes solo había `Tab` |
| `Esc` y salida de foco cierran el menú de la cuenta | [script.js](script.js) | Se quedaba abierto detrás del foco, enseñando opciones que ya no respondían |
| Abrir el menú del teléfono mete el foco dentro | [script.js](script.js) | La navegación va antes del botón en el documento: el `Tab` siguiente se la saltaba |
| `inert` en la página de detrás con un panel abierto | [script.js](script.js) | El cerco de `Tab` ya lo impedía, pero solo para quien tabula. `inert` lo cierra también para el lector de pantalla |
| El cerco de foco recupera el foco perdido | [script.js](script.js) | Si el foco acababa en el `body`, el siguiente `Tab` se iba a la página de atrás |
| El cerco de foco cuenta `select` y `textarea` | [script.js](script.js) | No estaban en la lista. Hoy no hay ninguno dentro de un panel, pero el primero que se añada habría abierto un agujero |
| `↑ ↓` en el campo de cantidad | [script.js](script.js) | Es un contador: las flechas se esperan ahí |
| Anillo de foco más fuerte en el campo de cantidad | [styles.css](styles.css) | Tenía un halo al 30 % de opacidad, mucho más débil que el del resto del sitio |

---

## 5. Lo que queda y no se arregló

- **El mostrador son 18 paradas de tabulación** antes de llegar al pie. No es un fallo (hay un "Saltar al contenido" y los encabezados dan estructura a un lector de pantalla), pero quien vaya solo con `Tab` tiene un trecho largo. La solución real sería un segundo enlace de salto, "Saltar el mostrador"; no está puesto.
- **Quince enlaces abren pestaña nueva sin avisarlo.** Es el hallazgo A1 de [AUDITORIA_ACCESIBILIDAD.md](AUDITORIA_ACCESIBILIDAD.md) y afecta al teclado: pulsas, el foco desaparece a otra ventana y el botón "atrás" deja de funcionar. Sigue pendiente.
- **El botón flotante de la canasta es un `<a role="button" tabindex="0">`,** no un `<button>`. Funciona con `Enter` y `Espacio` porque se le escribieron los dos a mano, pero un botón de verdad no necesitaría eso. Es deuda, no fallo: sin JavaScript ese mismo elemento sigue siendo el enlace de WhatsApp que funciona solo.
- **La aguja del mapa no se mueve con las flechas.** Se marca el centro y ya; para corregir el punto hay que mover el mapa y volver a marcar. Arrastrarla sigue siendo solo de ratón.

---

## 6. Cómo comprobarlo uno mismo

Sin instalar nada:

1. Abre la página y pulsa `Tab` desde el principio, sin tocar el ratón **en ningún momento**. Si en algún momento no sabes dónde está el foco, eso es el fallo.
2. Intenta hacer un pedido completo: elegir un producto, abrir la canasta, marcar domicilio, poner el punto en el mapa, escribir la dirección, pasar al pago, rellenar la tarjeta de prueba (`4242 4242 4242 4242`, cualquier vencimiento futuro, CVV `123`) y confirmar.
3. En cada panel abierto, pulsa `Tab` quince veces seguidas. Si el foco sale del panel, hay un agujero en el cerco.
4. Pulsa `Esc` en cada cosa que hayas abierto. Debería cerrarse y devolver el foco de donde salió.

Con `script.js` hay un detalle que conviene recordar: **todo el archivo es un único IIFE**, así que un error en ejecución se lleva la página entera por delante y `node --check` no lo ve. Cualquier cambio en el teclado hay que probarlo en el navegador, no solo comprobar que compila.
