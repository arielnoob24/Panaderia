# Reto 4 · Cuestionario técnico del proyecto

Respondido el 2026-10-04 sobre el código del repositorio, después de aplicar los arreglos de [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §11. Cada dato sale del archivo que se cita, no de memoria.

> **Esto son datos, no texto de informe.** Igual que el resto de los archivos `RETO4_*`: el enunciado permite un 5 % de texto generado por IA, así que lo de aquí es la fuente de donde sacas los datos, no los párrafos que entregas.

---

## 1. Identificación y arquitectura base

### Nombre, propósito y stack

| | |
|---|---|
| **Nombre** | El Tradicional — panadería y pastelería |
| **Propósito** | Catálogo de panadería con pedido completo: **crear cuenta y verificar el teléfono con un código**, elegir productos, decidir retiro o domicilio, simular el pago y recibir el comprobante por mensaje de texto o WhatsApp al número verificado |
| **Ubicación ficticia** | Esquina de Eloy Alfaro y Gabriel Espinosa, Tena, Napo, Ecuador |

**Stack:** no hay stack. Es **HTML, CSS y JavaScript sin dependencias ni compilación**, servido como sitio estático en GitHub Pages.

| Capa | Qué se usa |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript ES2020, sin framework |
| Backend | **Ninguno.** Sitio estático |
| Librería de UI | **Ninguna.** Sin Bootstrap, Tailwind ni componentes de terceros |
| Única dependencia externa | **Leaflet 1.9.4** desde cdnjs, y solo se descarga si el usuario elige domicilio |
| Persistencia | `localStorage` del navegador: el pedido y los datos de la cuenta |
| Tipografías | Georgia y Arial, del sistema. Sin Google Fonts |
| Imágenes | Unsplash con `srcset` por ancho, más **8 archivos locales**: 4 de contenido (`logo.png`, `mascota.png`, `historia-amasado-430.jpg` y `-760.jpg`) y 4 de icono (`favicon.ico`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`) |
| Datos estructurados | JSON-LD, `@type: Bakery` |

Tres decisiones que explican lo demás:

- **Sin framework ni compilación.** `index.html` se abre con doble clic y funciona. No hay `package.json`, ni `node_modules`, ni paso de build.
- **Mejora progresiva.** Sin JavaScript el sitio no se rompe, **cambia**: los contadores de cantidad vuelven a ser enlaces de WhatsApp, la fila horizontal sale como cuadrícula entera y los enlaces de categoría bajan al catálogo.
- **`script.js` es un único IIFE** de 2.713 líneas. Un error en ejecución se lleva la página entera, y `node --check` no lo detecta.

### Tamaño real

| Archivo | Líneas | Qué contiene |
|---|---|---|
| [index.html](index.html) | 123 | Estructura, 18 fichas de producto, JSON-LD, metadatos sociales |
| [script.js](script.js) | 2.713 | Todo el comportamiento, en un IIFE |
| [styles.css](styles.css) | 950 | Estilos, con `:root` de variables |

### Factor de forma

**Web responsive, diseñado primero para escritorio y adaptado a teléfono.** No hay app nativa.

| Corte | Qué cambia |
|---|---|
| > 900 px | Cuadrícula de catálogo a 3-4 columnas, navegación horizontal |
| ≤ 900 px | Dos columnas; la foto de la historia se reduce |
| ≤ 680 px | Menú hamburguesa (la barra pasa a `visibility: hidden` hasta abrirla), una columna, el botón flotante se acerca al borde, la barra de deshacer sube para no pisarlo |

Adaptaciones que no son de ancho:

- `prefers-reduced-motion: reduce`, con un `change` listener que reacciona si se cambia a mitad de sesión ([script.js:703](script.js#L703))
- `(hover: hover) and (pointer: fine)`: el desplegable "Tienda" se abre al pasar el ratón **solo** donde existe pasar el ratón
- `env(safe-area-inset-bottom)` para el notch

### Estructura de vistas

No hay rutas de servidor. Las vistas son **estados de una sola página**, con URL propia e historial mediante `history.pushState` / `popstate`.

```
index.html
│
├── PORTADA  (categoria = 'todos')               URL: /
│   ├── header.site-header  ─ nav + desplegable Tienda + botón de cuenta
│   ├── main#contenido
│   │   ├── section#inicio.hero
│   │   ├── section.sign-band                    (decorativa, aria-hidden)
│   │   ├── section#catalogo.catalog
│   │   │   ├── div.fila-cabeza  ─ "Nuestro mostrador" + Ver todo + Pausa
│   │   │   └── div.product-grid.is-fila  ─ 18 article.product-card en fila
│   │   └── section#historia.story
│   ├── footer#visitanos  ─ horario calculado, mapa, contactos
│   └── a.floating-whatsapp  ─ acceso a la canasta
│
├── VISTA DE CATEGORÍA                           URL: #tienda-panes
│   │                                                  #tienda-dulces
│   │                                                  #tienda-bebidas-frias
│   │                                                  #tienda-catalogo
│   └── div.vista-cabeza  ─ Volver + título + Ordenar (4) + Mostrar (2)
│       └── div.product-grid  ─ cuadrícula, sin la fila
│
└── PANELES MODALES  (creados por JavaScript, en el body)
    ├── aside.canasta-panel   role=dialog aria-modal
    │   └── 4 pasos: canasta → entrega → pago → comprobante
    ├── aside.cuenta-panel    role=dialog aria-modal
    │   └── 3 pasos: crear | entrar | sesion
    └── div.deshacer-barra    (z-index 22, por encima de los paneles)
```

Nada de los paneles existe en el HTML: los monta `script.js`, porque sin JavaScript no habría panel que abrir.

---

## 2. Tarea crítica y flujo de interacción

### La tarea elegida: pedido completo a domicilio con pago por tarjeta

Es la más larga del sistema, cruza los cuatro pasos del panel, incluye un mapa, validación de tarjeta y un estado final verificable.

### Paso a paso

| # | Pantalla | Acción | Resultado |
|---|---|---|---|
| 1 | Portada, mostrador | `+` en una ficha | Nace el contador: `−`, número, `+`. Sube el contador del botón flotante |
| 2 | Botón flotante | Clic / `Enter` | Se abre la gaveta. El foco va al botón de cerrar. El fondo queda `inert` |
| 3 | Paso **canasta** | "Confirmar el pedido" | Va al paso de entrega. (Deshabilitado si la canasta está vacía) |
| 4 | Paso **entrega** | Marcar "A domicilio" | Aparecen mapa y campo de dirección. Se descarga Leaflet. El foco va al campo |
| 5 | Mapa | Clic, o `Enter` con el mapa enfocado, o "Usar mi ubicación" | Cae la aguja. Se calcula la distancia y el envío |
| 6 | Campo de dirección | Escribir | — |
| 7 | | "Seguir al pago" | **Guarda:** sin dirección no pasa |
| 8 | Paso **pago** | Marcar "Tarjeta" | El panel deja de ser gaveta y se planta en el centro, con el fondo desenfocado. Aparecen 4 campos |
| 9 | | Escribir la tarjeta | Se formatea en grupos de 4 manteniendo la posición del cursor |
| 10 | | "Confirmar el pedido" | Valida Luhn + vencimiento + CVV + titular. Pasa a "procesando" |
| 11 | Paso **comprobante** | — | Número `ET-####`, desglose, lista. Botón "Copiar" |
| 12 | | "Listo, cerrar" | El comprobante se "envía" al teléfono verificado por el canal elegido. Cerrar vacía la canasta: el pedido queda cumplido |

**Estado inicial:** canasta vacía, `entrega.modo = 'retiro'`, `metodo = 'efectivo'`.
**Estado final de éxito:** `pasoActual = 'comprobante'` con `cobro.numero` asignado.

### Manejo de errores

| Situación | Qué hace el sistema |
|---|---|
| Canasta vacía | "Confirmar" con `disabled` **y** `aria-disabled`; `pintarPie()` lo recalcula en cada cambio |
| Domicilio sin dirección | No pasa al pago. `role="alert"` visible **y el foco va al campo que falta** |
| Tarjeta que no pasa Luhn | Error bajo el campo, unido con `aria-describedby`. El foco al primer campo malo |
| Vencimiento pasado | Mismo trato. Se comprueba contra la fecha real |
| Campo sin tocar | **No se marca.** Solo cuando ya lo tocaste o ya intentaste pagar |
| Cantidad > 100 | Se recorta al tope **y se dice por qué**: *"El máximo es 100 por producto, así que quedaron 100"* |
| Leaflet no carga (sin red, CDN caído) | `.catch()`: aparece *"No se pudo cargar el mapa. Escribe la dirección y cobramos la tarifa de salida"*, se esconde el lienzo y se cobra la tarifa base |
| Geolocalización denegada | *"No se pudo saber dónde estás; marca el punto en el mapa"* |
| `localStorage` no disponible | Todo el acceso va en `try/catch`. Se pierde la persistencia, no la función |
| Portapapeles no disponible | Respaldo con `document.execCommand`, y si tampoco: *"apunta el ET-#### a mano"* |
| Cerrar a mitad del pago | Se corta el temporizador, se borran los datos de la tarjeta, se vuelve al paso de canasta con el pedido intacto |
| Imagen que no carga | `error` listener: se esconde y el contenedor recibe `.image-unavailable` |
| **Sin backend que rechace** | No hay. El "cobro" es una simulación local, y la interfaz lo declara tres veces |

### Código de la tarea

**La vista.** No hay JSX ni plantillas: el panel se construye con `innerHTML` en una sola cadena. Esto es el paso de entrega ([script.js](script.js), dentro del `panel.innerHTML`):

```js
+ '<section class="canasta-paso" data-paso="entrega" hidden>'
+ '<div class="canasta-cuerpo">'
+ '<button class="canasta-volver" data-vuelve="canasta" type="button">'
+ '<span aria-hidden="true">←</span> Volver a la canasta</button>'
+ '<fieldset class="canasta-entrega"><legend>¿Cómo lo quieres?</legend>'
+ '<div class="canasta-opciones">'
+ '<label><input type="radio" name="canasta-entrega" value="retiro" checked>'
+ '<span>Paso retirando<small>Gratis</small></span></label>'
+ '<label><input type="radio" name="canasta-entrega" value="domicilio">'
+ '<span>A domicilio<small>Desde ' + dinero(ENVIO_BASE) + '</small></span></label></div>'
+ '<div class="canasta-direccion" hidden>'
+   /* ... mapa ... */
+ '<label for="canasta-dir">¿A dónde lo llevamos?</label>'
+ '<input id="canasta-dir" type="text" autocomplete="street-address" '
+ 'placeholder="Calle, número y una referencia">'
+ '<p class="canasta-aviso" role="alert" hidden>Escribe la dirección para poder llevarlo.</p>'
+ '</div></fieldset></div>'
```

**El estado.** No hay hooks ni store: son variables del IIFE y funciones que repintan.

```js
// El pedido: clave estable por nombre, valor { nombre, precio, cantidad }
const pedido = new Map();

// Cómo se recibe
const entrega = { modo: 'retiro', direccion: '', punto: null };

// El cobro simulado. La tarjeta vive aquí y solo aquí: no se guarda ni se envía.
const cobro = { numero: '' };
let pasoActual = 'canasta';

// Cada ficha del catálogo deja aquí su manera de repintarse
const refrescos = [];

// Lo último que se quitó, por si hay que reponerlo. Se guarda una copia: la
// línea original se borra del pedido y no se puede confiar en la referencia.
let borrado = null;   // { id, linea: { nombre, precio, cantidad } }
```

El equivalente a `loading` / `error` / `success` son tres clases y un paso:

| Estado | Cómo se representa |
|---|---|
| `loading` | `panel.classList.add('is-procesando')` → el botón queda `disabled` con `cursor: progress` |
| `error` | `errorPago.hidden = false` sobre un `<p role="alert">`, más `.is-mal` en el campo |
| `success` | `irA('comprobante')`, que es un paso del panel |

**La guarda que impide pasar sin dirección:**

```js
seguir.addEventListener('click', () => {
  if (entrega.modo === 'domicilio' && !campoDir.value.trim()) {
    avisoDir.hidden = false;
    campoDir.focus();
    return;
  }
  avisoDir.hidden = true;
  irA('pago');
});
```

**La validación de Luhn**, que es lo que separa un número inventado de uno con forma de tarjeta:

```js
const luhn = (digitos) => {
  let suma = 0;
  let doble = false;
  for (let i = digitos.length - 1; i >= 0; i -= 1) {
    let n = Number(digitos[i]);
    if (doble) { n *= 2; if (n > 9) n -= 9; }
    suma += n;
    doble = !doble;
  }
  return suma % 10 === 0;
};
```

**El envío por distancia**, redondeado al 0,05 más cercano porque cobrar $2,3718 no lo hace nadie:

```js
// Distancia en línea recta entre dos puntos de la Tierra. No es lo que anda
// la moto, pero para una maqueta de clase sobra y no necesita ningún servicio.
const kmEntre = (a, b) => { /* haversine */ };
const tarifaPara = (km) => Math.round((ENVIO_BASE + km * ENVIO_KM) / 0.05) * 0.05;
```

---

## 3. Respuestas del sistema y microinteracciones

No hay librería de notificaciones. Todo el feedback es propio, y va por **tres canales a la vez**: visual, de foco y anunciado.

| Acción | Visual | Foco | Anunciado |
|---|---|---|---|
| `+` en una ficha | Nacen `−` y el número; sube el contador del flotante | — | *"Pan redondo añadido. 3 productos en la canasta."* |
| Bajar a 1 unidad | El `−` **se convierte en papelera** | — | El `aria-label` pasa a "Quitar de la canasta" |
| Quitar el último | Desaparecen `−` y número; **sale la barra de deshacer** | Salta al `+` | *"Pan redondo quitado. 2 productos en la canasta."* |
| Deshacer | La barra se va; vuelve la cantidad exacta | — | *"Pan redondo vuelve a la canasta."* |
| Cambiar el tamaño | Se reescribe el precio de la ficha | — | *"Coca-Cola 1 L, $1.25."* |
| Pulsar pausa | El icono pasa de ‖ a ▶; `aria-pressed="true"` | — | *"Mostrador detenido. No se moverá hasta que lo reanudes."* |
| Entrar en categoría | Salida acelerada → entrada desacelerada, en diagonal | Al título | *"Mostrando 5 de 7 productos."* + cambia el `<title>` y la URL |
| Abrir un panel | Entra la gaveta; el fondo se oscurece | Al cerrar; fondo `inert` | El `role="dialog"` se anuncia con su título |
| Elegir domicilio | Aparecen mapa y dirección | Al campo | — |
| Marcar en el mapa | Cae la aguja; se reescribe el total | — | *"A 2,3 km del local · envío $2.15"* |
| Escribir la tarjeta | Grupos de 4, **cursor conservado por dígitos** | — | — |
| Error de validación | `.is-mal` en el borde + mensaje bajo el campo | Al primer campo malo | `role="alert"` lo dice solo |
| Confirmar el pago | `.is-procesando`, botón `disabled`, `cursor: progress` | — | — |
| Comprobante | Sello ✓, número, desglose | Al título del paso | — |
| Copiar el número | — | — | *"Número ET-4821 copiado."* (`role="status"`) |
| Pasar el ratón por un botón-dibujo | Cuadrito a los 500 ms | — | `aria-describedby` apunta al cuadrito |
| **Tabular** a ese botón | Cuadrito **inmediato** | Anillo doble | Igual |
| Cerrar un panel | Se va la gaveta | **Vuelve al control que lo abrió** | — |

### Dónde se definen

**Las dos regiones que anuncian.** Una visible, una solo para lector de pantalla:

```js
// Visible, bajo el encabezado del catálogo (en index.html)
<p class="catalog-status" role="status" aria-live="polite"></p>

// Invisible, para la canasta (creada en script.js)
const avisos = document.createElement('p');
avisos.className = 'sr-only';
avisos.setAttribute('role', 'status');
avisos.setAttribute('aria-live', 'polite');
```

**El cuadrito de ayuda.** Uno solo para toda la página, porque ponerle uno a cada botón sería llenar el DOM de cajas que casi nunca se ven. Lo pide cualquier elemento con `data-tip`:

```js
document.addEventListener('focusin', (e) => {
  const quien = e.target.closest?.('[data-tip]');
  if (!quien) return;
  // Quien tabula hasta aquí sí quiere saber qué es esto. Quien lo pulsó con
  // el ratón ya lo está usando: el cuadrito solo le taparía lo que escribe.
  if (llegoConRaton) esconderTip();
  else mostrarTip(quien, true);
});
```

**El estado de "procesando"**, y por qué el temporizador se puede cortar:

```js
panel.classList.add('is-procesando');
pagar.disabled = true;
temporizador = window.setTimeout(() => {
  cobro.numero = nuevoNumero();
  irA('comprobante');
}, 1400);
```

**Deshacer, con 12 segundos de gracia:**

```js
const ESPERA_DESHACER = 12000;
const anotarBorrado = (id, linea) => {
  borrado = { id, linea: { ...linea } };
  deshacerTexto.textContent = linea.cantidad === 1
    ? `Quitaste ${linea.nombre}.`
    : `Quitaste ${linea.nombre} (${linea.cantidad} unidades).`;
  barraDeshacer.hidden = false;
  window.clearTimeout(relojDeshacer);
  relojDeshacer = window.setTimeout(olvidarBorrado, ESPERA_DESHACER);
};
```

---

## 4. Accesibilidad (WCAG 2.2) y semántica

### Perceptibilidad

**Contrastes.** Calculados con la fórmula de WCAG sobre los tokens de `:root`. Los 17 pares están en [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §7.2; estos son los que importan:

| Par | Hex | Ratio | AA (4.5) |
|---|---|---|---|
| Texto principal sobre fondo | `#3a2822` / `#f7f1e7` | **12.41** | pasa, y AAA |
| Texto en tarjeta | `#3a2822` / `#fffdf8` | **13.71** | pasa, y AAA |
| Texto claro sobre barra oscura | `#eee4d8` / `#3a2822` | **11.10** | pasa, y AAA |
| Texto secundario sobre papel | `#5e514a` / `#fffdf8` | **7.51** | pasa, y AAA |
| Texto secundario sobre fondo | `#5e514a` / `#f7f1e7` | **6.79** | pasa |
| Botón amarillo | `#3a2822` / `#d79b4a` | **5.76** | pasa |
| Enlace ámbar sobre barra oscura | `#d79b4a` / `#3a2822` | **5.76** | pasa |
| `em` del `h1` (texto grande) | `#a85f45` / `#f7f1e7` | 4.26 | pasa como grande (exige 3) |
| Anillo de foco, línea | `#3a2822` / `#f7f1e7` | **12.41** | pasa |

Dos notas: el **halo ámbar** del anillo de foco da 2.15 por sí solo, pero el anillo es doble y la línea marrón de 3 px es la que cumple. Y el `small` de "Gratis" daba 4.49 (fallaba por 0,01) hasta el arreglo del 2026-10-04: ahora usa `#5e514a` y da 6.79.

**El `h1` sobre la fotografía, medido en Chrome.** Los números de arriba son sobre color plano y ahí no valían, así que se escondió el texto, se capturó el fondo real y se muestrearon los píxeles:

| Zona | Color del texto | Peor contraste del área | Exige | Resultado |
|---|---|---|---|---|
| Todo el `h1` (112 px, peso 500 → texto grande) | `rgb(58,40,34)` | **11,13** sobre 33.280 píxeles | 3 | pasa con holgura |
| Solo el `<em>` *"de siempre"* | `rgb(168,95,69)` | **3,82** sobre 17.536 píxeles | 3 | pasa |

Dato curioso para el informe: el contraste contra el píxel *mediano* del área del `<em>` sale **4,26**, exactamente el mismo número que da el cálculo sobre color plano (`--corteza` sobre `--masa`). El velo del hero deja el fondo prácticamente en el crema de la paleta, así que la foto no empeora el contraste.

**Iconos e imágenes:**

| | Cómo |
|---|---|
| 22 imágenes | **0 sin atributo `alt`**. Las 2 decorativas con `alt=""` |
| Textos alternativos | Descriptivos, no nombres de archivo: *"Un panadero bolea la masa sobre una mesa de madera enharinada, junto a un banneton, una cuchilla de greñar y un tarro de masa madre"* |
| 21 SVG | **21 de 21** con `aria-hidden="true"` + `focusable="false"` — son adorno dentro de botones que ya tienen nombre |
| Botones sin texto | `aria-label` + `title`: el círculo de la cuenta, el botón flotante, la pausa, las flechas de la fila |
| Imagen de fondo del hero | `role="img"` + `aria-label` descriptivo |
| QR de DeUna | `aria-hidden` + un `<p>` al lado que explica que es de adorno y no codifica nada |
| Fichas de producto | Los grupos de tamaño con `role="group"` + `aria-label="Tamaño de Coca-Cola"` |

### Operabilidad

**¿Se completa todo el flujo solo con teclado? Sí.** Documentado tecla por tecla en [ACCESIBILIDAD_TECLADO.md](ACCESIBILIDAD_TECLADO.md).

| | |
|---|---|
| Paradas de tabulación en la portada | **38** (42 controles, pero los 11 radios forman 5 grupos de una parada cada uno). Eran 36 antes de añadir "Ver todo" y la pausa |
| Trampas de foco | Ninguna |
| Enlace para saltar al contenido | Sí, visible al recibir el foco |
| `Esc` | Cierra cualquier panel y desplegable, y devuelve el foco |

El flujo del pedido con teclado: `Tab` hasta un `+`, `Enter`. `Tab` al botón flotante, `Enter`. Dentro del panel `Tab` cicla sin salirse. Los radios de entrega con flechas. **El mapa con flechas y `Enter` para marcar el centro.** Los campos de tarjeta con `Tab`. `Enter` en "Confirmar".

**Atajos y teclas por elemento:**

| Elemento | Teclas |
|---|---|
| Desplegables de la barra | `↓` `↑` recorren, `Inicio` `Fin` a las puntas, `Esc` cierra |
| Grupos de radio (tamaño, entrega, pago) | `← → ↑ ↓` |
| Campo de cantidad | `↑ ↓` suman y restan, `Enter` confirma, `Esc` recupera el valor anterior |
| Mapa de reparto | `← → ↑ ↓` mueven, `+` `−` acercan, **`Enter` marca el centro** |
| Paneles | `Tab` cicla dentro, `Esc` cierra |

**El foco visible.** Un solo estilo en todo el sitio, con `:focus-visible` para que no salga al pulsar con el ratón:

```css
a:focus-visible, button:focus-visible {
  outline: 3px solid var(--horno);
  outline-offset: 3px;
  box-shadow: 0 0 0 5px var(--ambar);
}
/* Para que la cabecera fija no tape lo que acaba de recibir el foco */
/* Y NO colgado de :focus-visible. El navegador calcula el desplazamiento en el
   mismo instante en que mueve el foco, cuando la pseudoclase todavia no casa,
   asi que ahi no servia de nada: medido con elementFromPoint, el elemento
   seguia acabando debajo de la barra. El margen de abajo libra al boton
   flotante de la canasta, que tambien tapaba. */
a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]) {
  scroll-margin-top: 110px;
  scroll-margin-bottom: 92px;
}
```

**El cerco de foco de los modales**, con dos detalles que no son habituales — recupera el foco si acabó fuera, y admite "anexos" (cajas de fuera del panel, como la barra de deshacer, que el tabulador tiene que alcanzar):

```js
const atraparFoco = (panel, abierto, cerrar) => {
  document.addEventListener('keydown', (e) => {
    if (!abierto()) return;
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key !== 'Tab') return;
    const focos = [panel, ...anexosDeFoco].flatMap((caja) => focosDe(caja));
    if (!focos.length) return;
    const primero = focos[0], ultimo = focos[focos.length - 1];
    const dentro = [panel, ...anexosDeFoco].some((c) => c.contains(document.activeElement));
    if (!dentro) { e.preventDefault(); (e.shiftKey ? ultimo : primero).focus(); return; }
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });
};
```

Y mientras un panel está abierto, el fondo se apaga del todo con `inert`, así que no lo recorre el tabulador **ni lo lee un lector de pantalla**:

```js
const apagarDetras = (panel, apagado) => {
  if (apagado) panelesAbiertos.add(panel); else panelesAbiertos.delete(panel);
  const hayPanel = panelesAbiertos.size > 0;
  detras().forEach((zona) => { zona.inert = hayPanel; });
};
```

**Los tres criterios nuevos de WCAG 2.2, medidos en Chrome el 2026-10-04:**

| Criterio | Resultado |
|---|---|
| **2.2.2** Pausar, detener, ocultar (A) | **Cumple.** La fila que avanza sola tiene botón de pausa con `aria-pressed`, y parada a mano no la reanudan ni el reloj ni las flechas |
| **2.5.8** Tamaño del objetivo, mínimo (AA) | **Cumple en los 7 escenarios medidos.** Hay 6 controles por debajo de 24×24 px, pero todos quedan exentos por la **excepción de espaciado**: un círculo de 24 px centrado en cada uno no toca ningún otro objetivo |
| **2.4.11** Foco no oscurecido, mínimo (AA) | **Cumple** en escritorio y teléfono, tabulando hacia delante y hacia atrás. Y cumple también **2.4.12 (AAA)**: ni un elemento queda tapado ni en parte |
| **3.3.8** Autenticación accesible, mínimo (AA) | **Cumple.** No hay prueba cognitiva: el paso de entrar solo pide el correo, con `autocomplete="email"` |

### Comprensibilidad

| | Cómo |
|---|---|
| Idioma | `lang="es"` |
| 51 campos | **0 sin rótulo asociado**: 26 con `<label for>`, 10 con etiqueta envolvente y 15 con `aria-label` en los contadores de cantidad |
| Agrupaciones | `fieldset` + `legend`: *"¿Cómo lo quieres?"*, *"¿Cómo quieres pagar?"* |
| `placeholder` | Como **ejemplo**, nunca como etiqueta: `"Calle, número y una referencia"`, `"4242 4242 4242 4242"`, `"MM/AA"` |
| Ayuda bajo el campo | La lista de requisitos de la contraseña, que se repinta en cada tecla |
| Validación en línea | Bajo el campo, unida con `aria-describedby` (12 elementos) |
| **Cuándo se marca** | Solo si ya tocaste el campo o ya intentaste enviar. El correo y el teléfono al salir de ellos: corregir el correo en la tercera letra no ayuda |

**La terminología es de panadería, no de desarrollador.** Esa fue una decisión, no una casualidad:

| En el sitio | Lo que diría un sitio genérico |
|---|---|
| "Tu canasta" | "Carrito" |
| "El mostrador", "La vitrina" | "Productos destacados" |
| "Paso retirando" | "Recogida en tienda" |
| "¿A dónde lo llevamos?" | "Dirección de envío" |
| "Vuelve mañana" | "Sin stock" |
| "Revisa el correo, algo le falta" | "Formato inválido" |
| "Escribe la dirección para poder llevarlo" | "Campo obligatorio" |

No aparece en ninguna parte de la interfaz la palabra *error*, *inválido*, *campo requerido*, *token* ni *sesión expirada*.

### Robustez

**Etiquetas semánticas:**

| Elemento | Cuántos | Dónde |
|---|---|---|
| `<header>` | 1 | Barra fija |
| `<nav>` | 1 | Con `aria-label="Navegación principal"` |
| `<main>` | 1 | `id="contenido"`, destino del enlace de salto |
| `<footer>` | 1 | `id="visitanos"` |
| `<section>` | 4 en el HTML, 11 con los paneles montados | hero, franja, catálogo, historia, y un `section` por paso de panel |
| `<article>` | 18 | Una por producto |
| `<fieldset>` + `<legend>` | 3 | *¿Cómo lo quieres?* y *¿Cómo quieres pagar?*. Los grupos de tamaño usan `role="group"` en su lugar, porque un `fieldset` dentro de la ficha rompe el diseño |
| `<dl>` / `<dt>` / `<dd>` | 5 | Desglose, datos bancarios, comprobante, horario, datos de la cuenta |
| `<address>` | 1 | Dirección del local |
| `<output>` | 1 por línea de la canasta | Creado al pintar la lista, así que con la canasta vacía hay 0 |
| `<button type="button">` | 62 | Ningún `<div>` haciendo de botón: **0 elementos con `onclick`** |

**Jerarquía de encabezados:** 30 encabezados, **0 saltos de nivel**.

**Roles ARIA presentes:**

| Atributo | Cuántos | Para qué |
|---|---|---|
| `role="dialog"` + `aria-modal="true"` | 2 | Canasta y cuenta, las dos con `aria-labelledby` |
| `role="status"` | 4 | Catálogo, canasta, copiado de cuenta, copiado del número de pedido |
| `aria-live="polite"` | 2 | Las dos regiones que anuncian |
| `role="alert"` | 6 | Errores de formulario |
| `aria-expanded` | 3 | Hamburguesa, "Tienda", círculo de cuenta |
| `aria-controls` | 3 | Los mismos tres |
| `aria-describedby` | 12 | Campo ↔ mensaje, y botón ↔ cuadrito |
| `aria-pressed` | 1 | Pausa del mostrador |
| `aria-hidden="true"` | 46 | 21 SVG, 24 `span` de adorno (flechas ↗ ↓ ← →, el signo −, el sello ✓), la franja decorativa y el recuento de la vista |
| `aria-disabled` | 1 | "Confirmar", junto a `disabled` |
| `role="group"` | 6 | Grupos de tamaño |
| `role="img"` | 1 | Fondo del hero |
| `role="application"` | 1, al cargar el mapa | El mapa, para que las flechas lleguen al widget. Se pone al construirlo, así que no está hasta que eliges domicilio |
| `inert` | 4 zonas | El fondo mientras hay panel abierto |

**Y lo más robusto, que no es ARIA:** sin JavaScript el sitio sigue sirviendo. Los 15 contadores vuelven a ser enlaces de WhatsApp con el producto en el mensaje, la fila horizontal sale como cuadrícula entera, los enlaces de categoría bajan al catálogo, y los paneles simplemente no existen porque no hacen falta.

---

## 5. Modelo mental y metáforas

**La metáfora es entrar a la panadería del barrio.** No la de una tienda en línea, y la diferencia se nota en el vocabulario, en el recorrido y en los iconos.

| Elemento de la interfaz | Lo que imita del mundo real |
|---|---|
| La fila horizontal de la portada | **El mostrador:** pasas por delante mirando lo que hay, no abres un catálogo |
| "Nuestro mostrador", "La vitrina" | El sitio físico donde está el pan |
| "Tu canasta" | La canasta de mimbre que coges al entrar, no un carrito de supermercado |
| El icono del botón flotante | Una canasta de pan: asa de arco, cuerpo ahusado y dos mimbres |
| "Paso retirando" / "A domicilio" | Lo que se dice por teléfono al pedir |
| "Vuelve mañana" sobre lo agotado | El cartelito de la bandeja vacía |
| El `−` que **se vuelve papelera** con una unidad | Devolver una pieza a la bandeja vs. dejar de llevar el producto |
| La nota del hero con su punto que late | **El cartel de la puerta.** Y ahora dice la verdad, porque sale del horario real: *"Horneando ahora mismo / Abierto hasta las 20:00"*, *"El horno se está calentando / Abrimos a las 08:00"*, *"Ya cerramos por hoy"* o *"Hoy no horneamos / Día festivo"*. El punto deja de latir en ámbar cuando está cerrado |
| El horario con "hoy" marcado | El horario pegado en el cristal |
| El comprobante con sello ✓ y número | El tiquete de papel que te dan en el mostrador |
| Cerrar el comprobante vacía la canasta | Sales de la tienda con el pedido hecho |

**Convenciones estándar que no se reinventaron**, porque reinventarlas obligaría a aprender un paradigma nuevo:

| Convención | Dónde |
|---|---|
| Gaveta lateral para el carrito | Como en cualquier tienda en línea |
| Pasos numerados en el pago | canasta → entrega → pago → comprobante |
| Contador `− n +` | El patrón universal de cantidad |
| Chip redondeado para el tamaño | Como las tallas en ropa |
| Mapa con aguja arrastrable | Como las apps de reparto |
| "Usar mi ubicación" con icono de diana | La misma convención de las apps de mapas |
| Círculo con iniciales para la cuenta | Como Google o GitHub |
| Patrón modal de WAI-ARIA | El estándar, no una invención |

**Y una convención que se rompió a propósito:** en el paso de pago, el panel **deja de ser una gaveta lateral y se planta en el centro** con el resto desenfocado. La razón es que pagar merece toda la pantalla, no un costado — y el cambio de forma del contenedor comunica un cambio de contexto que un cambio de contenido dentro de la misma gaveta no comunicaría.

### Las tres máquinas de estados

Están implementadas de verdad, no dibujadas sobre el diseño. El esqueleto para el diagrama está en [RETO4_CUADERNO.md](RETO4_CUADERNO.md) §5.1:

- **Catálogo:** `todos` ⇄ `panes` / `dulces` / `bebidas-frias` / `catalogo`, con URL propia e historial del navegador
- **Pedido:** `canasta` → `entrega` → `pago` → `comprobante`, con vuelta al paso anterior y una guarda entre entrega y pago
- **Cuenta:** `crear` ⇄ `entrar` → `sesion`

---

## Lo que falta y no lo puedo responder yo

De las cinco que había, **tres quedaron medidas** en Chrome el 2026-10-04 (objetivos táctiles, contraste del `h1` sobre la foto y foco no oscurecido). Quedan dos:

| Pregunta | Por qué |
|---|---|
| Qué suena raro con lector de pantalla | Narrador (`Ctrl+Win+Enter`) o NVDA, diez minutos |
| Clics mínimos del pedido completo | Cuéntalos recorriéndolo, no los estimes |
