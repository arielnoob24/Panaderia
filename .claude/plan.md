# Plan del sitio: El Tradicional

> Material de referencia del proyecto, no texto para entregar en un informe.
> Es la fuente de verdad de **cómo debe funcionar** el sitio. Los agentes de
> `.claude/agents/` lo leen antes de trabajar; si el código y este plan no
> coinciden, o se arregla el código o se actualiza el plan en el mismo commit.
>
> Cómo se trabaja (conversar → plan → agentes → skills → aplicar) está en
> `.claude/CLAUDE.md`. Las secciones 1 a 14 describen el sitio **como está
> hoy** (React); la 15 es la historia corta de cómo se llegó aquí.

Última actualización: 25 de octubre de 2026.

---

## 1. Qué es

Sitio de la panadería y pastelería **El Tradicional** (Tena, Ecuador):
catálogo, canasta, pedido con pago simulado, comprobante y cuenta de cliente.
Proyecto de la materia Desarrollo de Plataformas. Hecho en **React** (Vite,
JavaScript, React Router con `HashRouter`, Motion).

- Publicado en GitHub Pages: https://arielnoob24.github.io/Panaderia/
- El sitio presentado (antes de React) queda en la etiqueta git
  `sitio-presentado`.
- Dirección: esquina de Eloy Alfaro y Gabriel Espinosa, Tena.
- Horario: lunes a viernes 08:00–20:00; sábado y domingo 09:00–21:00.
- Teléfono, WhatsApp e Instagram son **de ejemplo** (Contáctanos lo avisa).

## 2. Reglas que no se rompen

| Regla | Por qué |
|---|---|
| Sitio **estático**: GitHub Pages sirve lo que construye Vite (`dist/`); sin servidor propio | GitHub Pages solo sirve archivos |
| **Solo servicios gratis**, nada que pida tarjeta (ni SMS, ni WhatsApp Business, ni Firebase Blaze) | Proyecto de clase sin presupuesto |
| Dependencias **con versión exacta** (sin `^`), solo las que diga este plan | Que un `npm ci` de hoy y uno de dentro de un mes construyan lo mismo |
| Se abre **por HTTP** (Pages, `npm run dev`, `npm run preview`); con doble clic no | Decidido al elegir React: un sitio publicado se abre por HTTP |
| El CI rechaza las palabras de cafetería, café y cóctel, **también en comentarios** | Es una panadería; lo revisa `ci-cd.yml` |
| Se trabaja directo en **`main`**, que es lo que sirve GitHub Pages: se commitea y pushea sin preguntar (desde el 21 de octubre de 2026; `mejoras` ya no se usa) | Cada push publica, así que el CI local va siempre antes |
| Lo guardado en el navegador **no cambia de formato** sin plan (claves de la sección 8) | Quien ya usó el sitio conserva su canasta, su cuenta y sus pedidos |
| Los informes de clase admiten **máximo 5% de texto de IA** | Pasarse cuesta la mitad de la nota; lo que escribe Claude es referencia |
| La base de datos (`bd/`) cumple las **reglas del modelo** de la sección 8 | Las pusieron el usuario y el profesor |

## 3. Cómo está repartido

```
index.html              la pagina: <div id="raiz">, metadatos, JSON-LD y el <noscript>
package.json            versiones exactas; scripts dev, build, preview y probar
vite.config.js          base './' y el plugin que copia hero-1200.jpg sin huella (og:image)
src/
  main.jsx              monta App dentro de HashRouter, LazyMotion, MotionConfig y los proveedores
  App.jsx               las vistas, la transicion y la carga por partes
  vistas/               Inicio, Nosotros, Contacto
  catalogo/             Catalogo, VistaCabeza, OrdenarPor, FichaProducto, Hero,
                        CabeceraPeriodico, Cinta, categorias.js
  comun/                cabecera, avisos, globo, foco, vistas.js (rutas),
                        apertura.js (abrir la pagina y desplazamiento), cargaPorPartes.js
  pedido/               canasta, lineas, deshacer, confirmar, factura, pago, comprobante,
                        pedirOtraVez.js
  cuenta/               Entrar, CrearCuenta, Verificar, Recuperar, MisDatos, MisPedidos,
                        FichaCuenta y sus piezas
  estado/               pedido.js y sesion.js (reductores puros) y sus proveedores
  servicios/            lo que no es interfaz: state.js, storage.js, mail.js, horario.js,
                        cobro.js, guardado.js, cuenta.js, catalogo.js, reglasCatalogo.js
  estilos/              vistas.css y cuenta.css (se cargan despues de styles.css)
assets/
  css/styles.css        la hoja base (colores, componentes)
  img/                  logo, mascota, portada e historia
    productos/          las fotos del catalogo, cada una en 420 y 840 px
data/
  productos.json        el catalogo: nombre, precio, foto, categoria y tamanos
pruebas/
  probar.mjs            corre los casos en Edge (o Chrome) contra dist/
  arranque.mjs          servidor, navegador y ayudas comunes
  casos/                un caso por archivo
bd/
  BD_EL_TRADICIONAL.sql la base de datos en PostgreSQL (seccion 8)
.github/workflows/      el CI: valida, prueba y publica dist/
.claude/                agentes, skills, herramientas de Claude Code y este plan
```

- **Las reglas viven en `src/servicios/`**, sin DOM: reciben datos y
  devuelven resultados. `reglasCatalogo.js` (`revisar()`, `normalizar()`) no
  usa nada de Vite, para que el CI la cargue con node.
- **El estado**: `Context` + `useReducer`. Los reductores son puros; guardar
  en el navegador es un efecto aparte, que escribe solo cuando el reductor
  cuenta un cambio.
- **Las importaciones** de fotos y datos van desde la raíz del proyecto
  (`'/assets/...'`, `'/data/productos.json'`); las fotos del catálogo, con
  `import.meta.glob`. Vite les pone huella al construir.
- **Carga por partes**: las 6 vistas de la cuenta, `#/confirmar` y
  `#/comprobante` van aparte (tabla `APARTE` en `comun/cargaPorPartes.js`,
  grupos `cuenta` y `pago`). Se precargan con el puntero o el foco en la
  cuenta de la cabecera y en "Ir a pagar", y en reposo tras `load` (no sin
  red ni con `saveData`). Al navegar se ve la vista anterior hasta que llega
  la nueva. Si una parte no llega, se reintenta una vez a los 800 ms y, si
  falla, sale "No se pudo abrir esta parte" (`FalloDeCarga.jsx`, con su
  `h1`) con "Reintentar" (recarga: Chromium recuerda el módulo que falló) y
  "Volver al inicio".
- **Sin JavaScript**: el `<noscript>` de `index.html` enseña la marca, la
  dirección, el horario y "Para comprar en El Tradicional necesitas activar
  JavaScript en tu navegador". Sin enlace a WhatsApp: el sitio es para
  comprar en él.

## 4. Las vistas y el catálogo

Cada opción del menú de arriba es una vista propia (`comun/vistas.js`):

| Menú | Ruta | Contenido |
|---|---|---|
| Logo / Inicio | `#/` | Cabecera de periódico, portada y la cinta de categorías (Panes, Dulces y pasteles, Bebidas), y nada más: sin carrusel |
| Nosotros | `#/nosotros` | La historia (foto en arco, sello y titular como la portada) y los tres principios numerados sobre la masa (sección 10, "Nosotros con el estilo de la portada"); la galería cuando haya fotos |
| Tienda | `#/tienda-catalogo`, `#/tienda-<categoría>` | El catálogo; cambiar de categoría no vuelve a montar la vista |
| Contáctanos | `#/contacto` | Dirección, mapa con su sello, horario estilo carta con el día de hoy marcado, abierto/cerrado y contacto, en una sola pantalla (sección 10, "Contacto con el estilo de la portada") |
| — | `#/confirmar`, `#/comprobante` | El pedido (sección 6) |
| Silueta / iniciales | `#/cuenta/*` | La cuenta (sección 7) |

- **Menú de arriba**: Inicio, Nosotros, Tienda y Contáctanos (Inicio
  también en el menú del teléfono; el logo sigue llevando a `#/`).
  **Tienda es un enlace simple** a `#/tienda-catalogo`, sin flecha ni
  desplegable de categorías (quitado el 25 de octubre de 2026 por decisión
  del usuario): las categorías se eligen con "Filtrar por" dentro de la
  tienda o con la cinta de la portada.
- **Al cambiar de vista**: arriba del todo, título de pestaña propio, `h1`
  con el foco (WCAG 2.4.3) y se anuncia. Transición: fundido con un pequeño
  desplazamiento hacia arriba (unos 400 ms, `--dur-base`). Al abrir la página no se mueve
  el foco ni se anima (lo marca `comun/apertura.js`).
- **Atrás y Adelante**: el desplazamiento lo decide la página
  (`history.scrollRestoration = 'manual'` tras `load`, `auto` en
  `pagehide`). Entre vistas, arriba con el foco en el `h1`; entre categorías
  de la tienda, donde se estaba. Atrás no limpia los filtros.
- **Direcciones viejas** (de cuando era una sola página): `#historia` →
  `#/nosotros`, `#visitanos` → `#/contacto`, `#catalogo` →
  `#/tienda-catalogo`, `#inicio` y `#contenido` → `#/`, con `replace`.
- **Sin pie de página** (el usuario lo quitó el 22 de octubre de 2026). Lo
  que llevaba se reparte: la nota de que el teléfono y las redes son de
  ejemplo va en `#/contacto`, junto a los contactos; "Tu pedido se guardó…"
  va en el pie del panel de la canasta, bajo "Ir a pagar"
  (`pedido/GuardadoCanasta.jsx`); abierto/cerrado ya lo dice la
  cabecera de periódico de la portada y Contacto. La ayuda constante (WCAG
  3.2.6) es "Contáctanos" en el menú, en el mismo sitio en todas las vistas.
  Nosotros, Contacto y la tienda terminan en la franja de espigas, pegada
  al borde de abajo; la portada deja aire bajo la cinta (más en el
  teléfono, para que la canasta flotante no tape el último enlace). En el
  teléfono cada vista deja 92 px abajo por la canasta flotante, salvo las
  que acaban en la franja.
- **Mapa** en `#/contacto`: `iframe` de Google Maps sin clave
  (`https://maps.google.com/maps?q=-1.004033,-77.812690&z=17&output=embed`),
  con `title` y `loading="lazy"`; "Ver en el mapa" va bajo la dirección
  (sección 10, "Contacto con el estilo de la portada").

### Datos (`data/productos.json`)

Hoy: **17 productos** en 3 categorías (`panes` 6, `dulces` 5,
`bebidas-frias` 6), 8 marcados como destacados (hoy el sitio no los usa).

| Campo | Obligatorio | Regla |
|---|---|---|
| `nombre` | sí | Lo que se ve en la ficha |
| `categoria` | sí | Tiene que estar en `CATEGORIAS` (`src/catalogo/categorias.js`, la lista de la cinta y de "Filtrar por"), y al revés |
| `precio` | sí | Número en dólares; con `tamanos`, igual al del primer tamaño |
| `foto` | sí | Raíz sin ancho ni extensión; existen `-420.jpg` (420×315) y `-840.jpg` (840×630) |
| `alt` | sí | Describe lo que se ve, no repite el nombre |
| `disponible` | no | `false` = agotado ("Vuelve mañana") |
| `etiqueta` | no | `{ color: green \| yellow, texto }`. **Ya no se pinta** (26 de octubre de 2026): la ficha solo lleva sello redondo cuando está agotada. El campo queda en los datos hasta quitarlo (ver Pendiente) |
| `tamanos` | no | `[{ valor, precio }]`; cada tamaño es una línea distinta en la canasta |
| `destacado` | no | `true` o `false`. Desde que la portada no tiene carrusel (22 de octubre de 2026) el sitio no lo usa; se queda en el JSON y en la base por si vuelve |

`revisar()` de `src/servicios/reglasCatalogo.js` valida cada producto; el
sitio y el CI usan la misma función. Para añadir uno, la skill
`/nuevo-producto`.

### Portada

Solo la cabecera de periódico, la portada y la cinta de categorías
(sección 10). "Los más pedidos" y su carrusel se quitaron el 22 de octubre
de 2026 por decisión del usuario: a la tienda se llega con "Nuestros
panes", con la cinta o con el menú.

### Vista de la tienda

- Se entra por "Nuestros panes" (portada), Tienda en el menú (catálogo
  entero) o una categoría de la cinta (con "Filtrar por" ya puesto). Sin
  botón "Volver al inicio" (quitado el 25 de octubre de 2026): a la
  portada se vuelve con el logo o con Inicio. Entrar con un enlace limpia orden,
  "Mostrar" y búsqueda; Atrás y Adelante no.
- Controles: Filtrar por (radios: Todas + 3 categorías, como la cinta), buscador (sin tildes ni
  mayúsculas), Ordenar por, Mostrar (solo disponibles).
- **"Ordenar por" es un desplegable propio** (25 de octubre de 2026; el
  `<select>` del navegador se veía genérico): un botón en `--papel` con
  filete fino que dice el orden elegido y una flecha, y al abrirlo un
  panel **en `--masa`, sin sombra dura ni filete** (26 de octubre de
  2026: en `--papel` se veía como una tarjeta blanca suelta, y el usuario
  no quiere recuadro de fondo; es una **lista plana**: solo las opciones
  en texto. Tiene que seguir siendo opaco porque cae sobre la primera
  fila de fichas; el botón pasa a texto con una línea fina debajo
  `--horno-claro`, sin relleno papel), con las cuatro
  opciones en Fraunces cursiva; la elegida en la **pastilla `--horno` con
  texto `--papel`** como en "Filtrar por", y la que tiene el puntero o las
  flechas en una pastilla `--papel` (sobre la masa sí se distingue) con filete `--horno-claro`
  para no depender solo del tono. **Las dos pastillas se deslizan**: la de
  la elegida y la de la que se mira son un solo elemento cada una
  (`layoutId` de Motion) que viaja de una opción a otra con un resorte
  corto (~250 ms); con menos movimiento salta sin viajar. El panel entra con fundido y `scale(.96)` → 1
  desde el botón (respuesta rápida, `--dur-fast`), la flecha gira; con
  menos movimiento solo aparece. Patrón APG de **combobox de solo
  selección**: botón `role="combobox"` con `aria-expanded`,
  `aria-controls` y `aria-activedescendant`, lista `role="listbox"` con
  `role="option"` y `aria-selected`. Teclado: Enter, Espacio, Alt+↓ o ↓
  abren; ↑/↓, Inicio y Fin recorren; una letra salta a la opción que
  empieza por ella (repetida, pasa a la siguiente que empieza igual);
  Enter o Espacio eligen y cierran; Esc y Tab cierran sin cambiar. Como
  en el APG, además ↑, Inicio y Fin también abren y Alt+↑ elige y cierra.
  Clic fuera cierra (`catalogo/OrdenarPor.jsx`). Al elegir, el foco vuelve al botón y el
  orden se anuncia como antes.
- **"Mostrar" son dos opciones a la vista** (26 de octubre de 2026; el
  interruptor "Solo disponibles" no convencía y el usuario no quiere
  recuadro de fondo): `Todos` y `Solo disponibles`, con su rótulo
  "Mostrar" en versalitas, en Fraunces cursiva como las categorías de
  "Filtrar por" y **sin caja alrededor**. La elegida, en la pastilla
  `--horno` con texto `--papel`, que se desliza de una a otra (`layoutId`,
  mismo resorte que las otras; con menos movimiento salta). Por dentro
  son dos radios (Tab entra una vez, las flechas cambian) con el nombre
  del grupo "Mostrar". Se recuerda en `sessionStorage` como antes.
- "Mostrando X de Y productos" en una sola región `aria-live`
  (`.catalog-status`): mientras se escribe en el buscador calla y habla una
  vez, 400 ms después de la última tecla; sin resultados junta la cuenta y el
  porqué. El orden se anuncia aparte ("Ordenado por precio, de menor a
  mayor").
- El `h1` dice la categoría ("Dulces y pasteles", o "Todo el catálogo"); la
  pestaña también ("Dulces y pasteles · Catálogo | El Tradicional").
- Cada ficha: foto con `srcset`, categoría encima del nombre, sello, tamaños
  (radios), precio y control `− cantidad +` (máximo 100 por producto). Al
  agregar se anuncia; ninguna foto vuela a la canasta (se quitó el 22 de
  octubre de 2026).
- **Fichas más pequeñas** (25 de octubre de 2026, segunda vuelta el mismo
  día): **5 por fila** en escritorio (cuando la tienda mide 1080 px o
  más), 4 entre unos 860 y 1080 px, 3 en tableta y 2 en el
  teléfono como antes (se pregunta a la caja de la tienda con una
  container query, no a la ventana). Con cinco o cuatro, y en la tableta como en
  el teléfono, foto, nombre, precio, sello y control de cantidad
  bajan en proporción; la letra no baja de 11 px y los botones − y + no
  bajan de 24 × 24 px (WCAG 2.5.8).
- La ficha, en el estilo editorial (sección 10):
  esquinas rectas, borde fino `--horno` y la foto con un margen de papel;
  categoría en versalitas, nombre en Fraunces, sin hueco vacío entre el
  nombre y el precio. El precio en Fraunces y, entre el precio y el
  control, **puntos como en una pizarra**. **Solo hay un sello, el de
  "Agotado"** (26 de octubre de 2026: los de "Nuevo", "Favorito" y
  similares sobraban en las demás fichas), como **sello de tinta**
  (doble aro), letra de al menos 11 px. Con el puntero encima sube con
  **sombra dura** `6px 6px 0 --horno`, la foto se acerca despacio y el sello
  gira un poco; al pulsar baja a `scale(.97)`.
- **Agregar se nota aunque sea rápido** (S1, elegida sobre la muestra): el
  `+` solo, y tras el primer toque se **estira** a `− n +` (el número entra
  deslizándose cada vez que cambia). Cada toque suelta un **"+1"** (o
  "−1") que sube desde el botón y se desvanece, y con prisa salen varios a
  la vez (`aria-hidden`: el anuncio ya lo hace el control); la canasta
  de arriba **brinca** y sube su número. En 0 vuelve a ser el `+` solo. El
  movimiento vive en `comun/golpes.js`. Con menos movimiento: sin "+1", ni
  brinco, ni destello; el número cambia sin más.
- **Destello al agregar** (22 de octubre de 2026): cada toque del `+` (no
  al quitar ni al escribir la cantidad) pinta la pastilla `− n +` de
  `--horno` un momento, con el `−` y el número en `--sobre-horno` (el `+`
  sigue ámbar), y vuelve al `--papel`: entra al instante y vuelve en
  `--dur-slow`. Fondo y texto no se funden a la vez (a medio camino se
  perdería el texto): el fondo aclara un poco con el texto aún claro, al
  35 % todo salta a la vez (el fondo a casi papel, el texto y el anillo del
  `+` a su color oscuro) y el fondo acaba de fundirse; en todo momento el
  texto cumple 4,5:1 y el anillo 3:1. Al acabar, la clase se quita (si no,
  el anillo del `+` destellaba al enfocarlo). Con prisa, cada toque lo
  reinicia. Café oscuro y no verde: el verde sería un sexto color.
- **Las líneas de la canasta se mueven igual que las fichas** (23 de
  octubre de 2026): su `− n +` suelta el "+1" o "−1", destella al agregar
  y su número entra deslizándose, con el mismo código
  (`comun/golpes.js`). La canasta de arriba no brinca: ya está abierta.
- Al cambiar de vista el foco va al `h1`, pero sin dibujarle el recuadro
  ámbar: un título no es un control.

## 5. La canasta

- Botón con icono y contador en la cabecera (en el teléfono flota abajo); el
  número se desliza hacia arriba al añadir y hacia abajo al quitar.
- Panel lateral (`div role="dialog"` + `aria-modal`): atrapa el foco, se
  cierra con Esc, tocando fuera o con Atrás/Adelante, y devuelve el foco al
  botón (si quien lo abrió se fue con la vista, al botón de la canasta).
- Cada línea: foto, −, cantidad, +, y una X que quita el producto entero. Con
  una unidad, el − pasa a basurero y pregunta "¿Lo quitamos?", y la X no sale.
  El + y el − avisan "3 de Pan redondo. N productos en la canasta" y el foco
  se queda en el botón pulsado. Las líneas entran por la derecha, salen por la
  izquierda y las demás suben a ocupar el hueco (solo la posición).
- Tope de **100 por producto**: en el tope, el + de la ficha y el de la línea
  se ven apagados pero siguen enfocables con `aria-disabled` y, al pulsarlos,
  avisan "El máximo es 100 por producto. Ya hay 100 de … en la canasta."
- Campo de cantidad de la ficha: Enter asienta lo escrito y Esc lo descarta,
  sin sacar el foco del campo (con 0 el producto sale y el foco pasa al +).
- **Deshacer** durante 12 s al quitar o al vaciar ("¿Quitamos todo lo que hay
  en la canasta?"). El reloj se para con el foco o el puntero encima. Mientras
  la barra se ve en el teléfono, `scroll-padding-bottom` sube a 168 px para que
  no tape el foco. Con la canasta abierta, mientras se ve la barra, la
  lista guarda abajo 136 px para que el foco no quede debajo de ella.
- "Ir a pagar" exige una **cuenta con el correo verificado**; si no la hay,
  sube la hoja "Inicia sesión para pagar" (`alertdialog` modal, con
  desplazamiento propio en pantallas bajas; la barra de deshacer queda
  `inert`). Sus botones llevan a iniciar sesión o a crear cuenta, y al
  terminar se va directo a `#/confirmar`.
- Vacía, "Ver la vitrina" lleva a `#/tienda-catalogo` con el foco en su título.
- El globo de ayuda se quita con Esc sin cerrar la canasta.

## 6. Confirmar el pedido y pagar

- `#/confirmar` y luego `#/comprobante` (este con `replace`, para que Atrás no
  vuelva al pago hecho). Sin cuenta verificada o con la canasta vacía,
  `#/confirmar` vuelve a la portada. Cada una con su `h1` ("Confirmar el
  pedido", "Pedido confirmado").
- Izquierda: retiro o domicilio (envío fijo **$1.50**), dirección, cómo paga
  (efectivo o tarjeta; empieza en la forma preferida de la cuenta) y factura
  (a mi nombre o a otra persona). Sin mapa.
- Derecha, pegada al desplazar: lo que lleva, subtotal/envío/total, a qué
  correo llega el comprobante y "Confirmar".
- Validación: dirección → factura → tarjeta. Factura: cédula de 10 con
  provincia 01–24, tercer dígito 0–5 y **dígito verificador (módulo 10)**, o
  RUC de 13 que no termina en 000 (con tercer dígito menor que 6, sus 10
  primeros son una cédula válida; si no, el tercero es 6 o 9): la misma regla
  que `FN_CEDULA_VALIDA` y `FN_RUC_VALIDO` de `bd/`. Tarjeta: Luhn, MM/AA no
  vencida, CVV de 3, titular. El foco va al primer error; los errores salen al
  dejar el campo o al intentar pagar, con `aria-invalid` y
  `aria-describedby`, y se juntan "a, b y c". Reglas y textos en
  `src/servicios/cobro.js`.
- La tarjeta lleva `autocomplete="off"` a propósito: es de prueba y el
  navegador no debe guardarla.
- Al aprobar (simula 1,5 s): número `ET-XXXX` sin letras confundibles,
  comprobante, correo, guardado en IndexedDB (con el `correo` de la cuenta),
  se vacía la canasta y se limpian tarjeta y factura. El comprobante dice "Tu
  canasta ya está vacía. El pedido queda en Mis pedidos."
- **El cobro no existe**: la tarjeta no se guarda ni se envía (en IndexedDB
  solo "Tarjeta terminada en XXXX").

## 7. La cuenta

Una cuenta por navegador. Cada paso es una vista propia:

| Ruta | Contenido | Si no corresponde (con `replace`) |
|---|---|---|
| `#/cuenta/entrar` | "Iniciar sesión": correo y contraseña; "¿Olvidaste tu contraseña?"; "¿No tienes cuenta? Créala" | Con sesión → `#/cuenta` |
| `#/cuenta/crear` | Nombre con apellido, correo, teléfono, dirección (opcional), contraseña con sus 4 requisitos y repetirla; dos columnas en la computadora, una en el teléfono. Si ya hay una cuenta: "En este navegador ya hay una cuenta (a…@dominio). Crear otra la reemplaza." | Con sesión → `#/cuenta` |
| `#/cuenta/verificar` | Código de 6 cifras en 6 casillas, "Reenviar" cada 45 s y el recuadro con el código si EmailJS falta o falla | Sin cuenta por verificar → `#/cuenta/entrar` |
| `#/cuenta/recuperar` | Recuperar la contraseña (abajo) | Con sesión → `#/cuenta` |
| `#/cuenta` | **Mis datos**, editables ahí mismo: nombre, teléfono, dirección y forma de pago preferida (Efectivo o Tarjeta; "No guardamos tarjetas"); el correo se ve y no se cambia. "Guardar" (pasa a "Guardado ✓" 2 s) y "Cerrar sesión" | Sin sesión → `#/cuenta/entrar` |
| `#/cuenta/pedidos` | Una fila por pedido de **esta cuenta** (`ET-XXXX`, fecha, total), más nuevo arriba, en `<details>` que se despliega animando la altura; los viejos sin `correo` también. Cada uno con "Pedir otra vez" | Sin sesión → `#/cuenta/entrar` |

- **Cabecera**: sin sesión, la silueta ("Iniciar sesión / Registrarse") lleva
  a `#/cuenta/entrar`; con sesión, las iniciales abren una ficha con "Mis
  datos", "Mis pedidos (N)" y "Cerrar sesión" (flechas, Inicio, Fin, Esc,
  `aria-current` en la vista en la que se está). El botón usa tonos claros:
  línea blanca al inicio y papel tenue con sesión; al abrir la ficha o estar
  dentro de una vista de cuenta queda en papel, y al pasar el puntero vuelve
  al blanco tenue del menú superior.
- **Al terminar** de iniciar sesión, verificar o recuperar: a `#/confirmar`
  si se venía de "Ir a pagar" y la canasta tiene algo; si no, a `#/cuenta`.
  Cerrar sesión no borra la cuenta y lleva a `#/`. Los pasos van con
  `replace`: Atrás no vuelve a un formulario ya hecho.
- **Reglas**: teléfono de 9 cifras que empieza por 9 (+593 delante; al pegar
  se quitan el 0, el +593 y los espacios; `autocomplete="tel-national"`);
  contraseña con 4 requisitos visibles (cada ✓ aparece con un rebote) y
  "Mostrar"; la contraseña se guarda solo como huella **PBKDF2 con sal**.
  Errores distintos para "no hay cuenta" y "contraseña incorrecta" (la única
  cuenta es la del navegador). Enter pasa al campo siguiente; en el último,
  hace la acción. Errores con `aria-invalid` + `aria-describedby`, y fundido
  suave (sin sacudidas).
- **Código en 6 casillas**: una cifra por casilla, el foco salta solo,
  Retroceso vuelve y borra, flechas, pegar en cualquiera lo reparte;
  `fieldset` con `legend`, "Cifra N de 6", `inputmode="numeric"`,
  `autocomplete="one-time-code"`. Al llenar la sexta se comprueba; si falla,
  el error bajo las casillas y el foco a la primera. El código sale de
  `crypto.getRandomValues`.
- **Recuperar la contraseña**, por código al correo:
  1. Se escribe el correo; si no es el de la cuenta, el mismo error que al
     iniciar sesión. EmailJS manda un código de 6 cifras ("para cambiar tu
     contraseña", con la misma plantilla).
  2. El código **caduca a los 10 minutos** y admite **5 intentos**; un
     código nuevo no sale antes de 45 s desde el último enviado. "Cambiar el
     correo" conserva el código, su hora y sus intentos.
  3. Con el código bien: contraseña nueva con los 4 requisitos, repetirla.
     Sal nueva, la vieja deja de valer, la cuenta queda verificada y con la
     sesión abierta; datos, forma de pago y pedidos se conservan.
  4. **Si el correo no sale, no se recupera** (sin recuadro con el código).
     La recuperación vive solo en memoria y se borra al iniciar o cerrar
     sesión; los 10 minutos se comprueban también al cambiar la contraseña.
  5. Solo desde el mismo navegador donde se creó la cuenta (la vista lo dice).
- **Pedir otra vez** (`pedido/pedirOtraVez.js`, acción `sumar`): mete en la
  canasta lo de ese pedido que siga disponible, con el mismo tamaño y el
  precio de hoy, sumado a lo que haya (tope de 100), abre la canasta y avisa
  qué entró y qué no; el aviso también queda escrito bajo el botón.
- **Movimiento**: crear sale a la izquierda y verificar entra por la derecha;
  los pasos de recuperar igual (`PasoQueCambia.jsx`: la hoja que sale es su
  nodo de DOM, `inert` y sin ids, animado con `element.animate()`).

## 8. Dónde se guarda cada cosa (`src/servicios/storage.js`)

| Dónde | Qué | Por qué |
|---|---|---|
| `localStorage` | Pedido a medias, entrega, factura y la cuenta (`metodo`, `clave: {sal, hash}`, `verificado`, `sesionAbierta`…). Se escribe solo cuando cambia algo, no al cargar; al aprobar un pedido se borra la canasta | Tiene que seguir mañana |
| `sessionStorage` | Orden y "Mostrar" del catálogo | Dura lo que la pestaña |
| IndexedDB `eltradicional/pedidos` | Pedidos pagados, clave = número, con el `correo` de la cuenta | Registros que se acumulan |
| Cookie `eltradicional-guardado` | Fecha del último guardado (1 mes, `SameSite=Lax`); la canasta la enseña como "Tu pedido se guardó…", solo si hay algo en ella | Corta y caduca sola |

Son las mismas claves y formatos que el sitio presentado. Todo va en
`try/catch`: en ventana privada no puede tumbar la página.

### La base de datos (`bd/BD_EL_TRADICIONAL.sql`, todavía sin conectar)

El sitio sigue guardando como dice la tabla de arriba. El script crea la base
relacional que va a reemplazar ese guardado cuando se conecte. Motor:
**PostgreSQL** (Supabase usa el mismo y tiene plan gratis sin tarjeta).

#### Reglas del modelo (las pusieron el usuario y el profesor; no se rompen)

Cualquier tabla nueva o cambio en el script tiene que cumplirlas todas.

| Regla | Detalle |
|---|---|
| **Relacional y en un solo `.sql`** | El entregable es un script que crea la base desde cero: base, tablas, reglas, vistas y datos iniciales. Vive en `bd/` |
| **Motor PostgreSQL** | Lo eligió el usuario el 20 de octubre de 2026 |
| **Nombres `ENTIDAD` y `ENT_Atributo`** | Tabla en plural y mayúsculas (`ESTUDIANTES`). Cada atributo lleva el prefijo de 3 letras de su tabla (`EST_Nombre`), y el prefijo no se repite entre tablas. Una FK conserva el nombre de la PK que referencia; si una tabla apunta dos veces a la misma, la que se repite agrega su papel (`UMI_CodigoCompra`, `EMP_CodigoAutoriza`), como en la propuesta del profesor. Sin comillas, así que PostgreSQL los guarda en minúsculas |
| **La PK es un código** | Cada tabla fuerte tiene `XXX_Codigo`, en texto con prefijo, que pone una secuencia: `PRO001` (3 dígitos en catálogos), `PED0000001` (7 en lo que crece). Excepción: si ya existe un código oficial (INEC, SRI), se usa ese. Las secuencias dejan huecos cuando un insert falla, y es normal; solo el secuencial de factura no puede tener huecos (el SRI) |
| **Sin N:N** | Se resuelve con una entidad débil entre las dos |
| **PK de una débil** | Es la unión de las PK de las fuertes que relaciona, sin un código propio. Si una de ellas es otra débil, entra su PK compuesta (`DETALLES_PEDIDO`): falta confirmar con el profesor si eso vale |
| **Sin 1:1** | Si dos tablas quedarían 1:1, se juntan o se rehace la relación |
| **Sin herencia** | Nada de supertipo y subtipos |
| **Todo conectado** | Cada tabla tiene al menos una relación. No puede haber un par o grupo de tablas aislado del resto. Solo autenticación y autorización podrían quedar aparte, pero hoy también están conectadas (USUARIOS → PEDIDOS, DIRECCIONES) |
| **Autenticación y autorización con al menos 3 tablas** | Lo dijo el profesor. Hoy son 7: ROLES, PERMISOS, ROLES_PERMISOS, USUARIOS, VERIFICACIONES y los logs ACCESOS y AUDITORIAS |
| **Normalizada (hasta 3FN)** | Valores atómicos (nombres y apellidos separados). Lo que se calcula no se guarda: va en una vista. El precio y el IVA del día en cada línea sí se guardan, porque cambian |
| **Tipos según el contexto ecuatoriano** | Dinero en dólares `NUMERIC(…,2)`. Fechas `TIMESTAMPTZ` con zona `America/Guayaquil`. Cédula `CHAR(10)` con módulo 10, RUC de 13 dígitos, celular `CHAR(10)` `09XXXXXXXX`. Provincias y cantones con su código del INEC; tipo de identificación, forma de pago y tarifa de IVA con su código del SRI. Número de factura `001-001-000000001`. Cada tipo con su `CHECK` |
| **Varias tablas, no 3 o 4** | El modelo cubre lo que hace el sitio (cuenta, catálogo, canasta, entrega, factura y pago) y lo que pide el "Contexto comercial" del profesor (JW Cóndor, dic. 2025): compras, inventario, producción, talento humano y contabilidad |
| **Documentos con estados** | Orden de compra, ajuste, orden de producción y rol de pagos: ABI → APR o ANU. Recepción: PEN → REC o CAN. Asiento: ABI (manual) o PEN (generado) → APR, ANU o ERR. El estado va en la cabecera y las líneas lo siguen (guardarlo en cada línea repetiría el dato). Aprobado o anulado, el documento y sus líneas ya no cambian |
| **Aprobar genera lo siguiente** | Orden de compra aprobada → recepción pendiente + asiento. Ajuste, producción y rol aprobados → asiento. Factura → asiento de venta; anularla → asiento contrario. Un asiento que no cuadra al aprobarlo queda en ERR |

- **50 tablas en 11 grupos**: autenticación y autorización (ROLES, PERMISOS,
  ROLES_PERMISOS, USUARIOS, VERIFICACIONES, ACCESOS, AUDITORIAS), ubicación (PROVINCIAS, CANTONES,
  DIRECCIONES), catálogo (CATEGORIAS, ETIQUETAS, TARIFAS_IVA, PRODUCTOS,
  TAMANOS, PRODUCTOS_TAMANOS, ALERGENOS, PRODUCTOS_ALERGENOS), pedidos
  (TIPOS_ENTREGA, ESTADOS_PEDIDO, PEDIDOS, DETALLES_PEDIDO), facturación y
  pagos (TIPOS_IDENTIFICACION, CLIENTES, FACTURAS, METODOS_PAGO, PAGOS),
  talento humano (CARGOS, EMPLEADOS), materiales y recetas (UNIDADES_MEDIDA,
  METODOS_COSTEO, TIPOS_MATERIAL, MATERIALES, RECETAS), compras (PROVEEDORES,
  PROVEEDORES_MATERIALES, ORDENES_COMPRA, DETALLES_ORDEN_COMPRA, RECEPCIONES,
  LOTES_MATERIAL), inventario y producción (AJUSTES_INVENTARIO,
  DETALLES_AJUSTE, ORDENES_PRODUCCION, CONSUMOS_PRODUCCION), contabilidad
  (CUENTAS_CONTABLES, ASIENTOS, DETALLES_ASIENTO) y nómina
  (CONCEPTOS_NOMINA, NOMINAS, DETALLES_NOMINA).
- **Lo que pidió el profesor y cómo quedó** (decidido el 20 de octubre de 2026):
  - *Unidades*: el material guarda `UMI_CodigoCompra`, `UMI_CodigoProduccion`
    y `MAT_FactorConversion` (1 qq = 45359,2 g). Lote, receta, consumo y
    ajuste van siempre en la unidad de producción.
  - *Materiales y productos*: tablas separadas (sin herencia). MATERIALES es
    lo que se compra; PRODUCTOS, lo que se vende. Las bebidas que se revenden
    son materiales con receta de 1 unidad, así que todo sale por producción.
  - *Recetas*: por `PRODUCTOS_TAMANOS` (la Avena de 500 ml lleva más leche que
    la de 300 ml). Es una débil sobre otra débil, como `DETALLES_PEDIDO`.
  - *Lotes*: cantidad inicial y costo por unidad de producción del día en que
    entró. **El saldo no se guarda** (regla de 3FN): sale de `VW_LOTES_SALDO`.
  - *Método de costeo*: uno por material (`METODOS_COSTEO`): FEFO, FIFO,
    LIFO o PROM (promedio ponderado). Lo aplica la base al aprobar la
    producción.
  - *Kardex*: es la vista `VW_KARDEX` y no una tabla, porque lotes, ajustes y
    consumos ya están guardados y copiarlos rompería la 3FN. Si el profesor
    pide la tabla `MOVIMIENTOS_INVENTARIO`, se cambia.
  - *Producción*: `ORDENES_PRODUCCION` y `CONSUMOS_PRODUCCION` (de qué lote
    salió cada material).
  - *Del contexto comercial no se hizo*: perchas y bodegas, entregas al
    cliente (las cubren los estados del pedido), crédito y cuentas por cobrar
    de clientes, vendedores y comisiones, centros de costo, cuotas.
  - *Solo lo que usa una tienda* (decidido el 20 de octubre de 2026): es un
    solo local, sin sucursales ni departamentos. El empleado guarda su cargo y
    su sueldo de hoy (sin historia de cargos ni cargas familiares); lo pagado
    cada mes queda en el rol de pagos. Se quedan la nómina y la contabilidad
    (el profesor pidió asientos), la recepción y los ajustes, y los alérgenos.
  - *Empleados y usuarios* (22 de octubre de 2026): la cuenta dice de qué
    empleado es (`USUARIOS.EMP_Codigo`, vacío si es de un cliente), y un
    empleado puede tener varias (la de trabajo, una personal, una nueva si
    la vieja se desactiva). Es 1:N: el modelo no tiene ninguna 1:1. Así se
    sabe qué empleado aprueba algo o sale en la auditoría.
  - *Logs* (22 de octubre de 2026): `ACCESOS` anota cada intento de entrar
    (bueno o con su motivo: clave, correo sin verificar, inactiva,
    bloqueada); con 5 fallos seguidos en 15 minutos la cuenta se bloquea y
    `VW_USUARIOS` lo dice. `AUDITORIAS` la llena un trigger en cuentas,
    permisos, productos y precios, recetas, materiales, empleados,
    proveedores, facturas, pagos, compras, ajustes, producción, cuentas,
    asientos y nómina: quién (variable `app.usuario` de la conexión), cuándo
    y la fila antes y después en JSON, sin la huella ni la sal. Los dos logs
    no se cambian ni se borran.
- **Lo que se calcula no se guarda**: totales, IVA y lo pagado salen de
  `VW_PEDIDOS_TOTALES`; si el correo está verificado, de `VW_USUARIOS`. El
  precio y el IVA de cada línea sí se guardan (son los del día). También son
  vistas: saldo de lotes, existencias, kardex, totales de la orden de compra,
  lo recibido, costo de producción, existencias de productos, neto del rol,
  cuadre de asientos y saldos de cuentas.
- **Lo que revisa la base**: cédula (módulo 10) y RUC, celular `09XXXXXXXX`,
  correo en minúsculas, número `ET-XXXX` sin 0/1/I/O, 1–100 por línea,
  domicilio con dirección del mismo usuario y retiro sin ella, producto
  agotado, una sola factura vigente por pedido y secuencial de factura sin
  saltos (el SRI lo exige).
- **Contraseña**: solo la huella PBKDF2 (32 bytes), la sal (16) y las
  iteraciones. De la tarjeta, solo los 4 últimos dígitos y la autorización.
- **Datos iniciales**: roles y permisos, las 24 provincias, los cantones de
  Napo, el catálogo de `data/productos.json` con sus tamaños, alérgenos
  comunes, entregas ($0 y $1,50), estados, tipos de identificación,
  CONSUMIDOR FINAL, formas de pago con su código del SRI, cargos, unidades, métodos de costeo, 29 materiales, la receta de cada
  producto y tamaño, el plan de cuentas y los conceptos de nómina. Las
  cantidades de las recetas, la vida útil y los mínimos son de ejemplo.

## 9. Correo (`src/servicios/mail.js`)

EmailJS (gratis, unos 200 correos al mes): una sola plantilla para el código
de verificar, el de recuperar y el comprobante (asunto y cuerpo van en
variables). Las claves son públicas por diseño; las protege la lista de
dominios del panel de EmailJS. `enviarCorreo()` nunca lanza: si falla, el
pedido sigue valiendo.

## 10. Aspecto y adaptación

- `assets/css/styles.css` es la base, con variables en `:root` (colores
  `--masa`, `--horno`, `--ambar`, `--corteza`, `--papel`; sombras, radios,
  duraciones y curvas). Lo propio de las vistas va en `src/estilos/`.
- **Regla 60-30-10** en cada vista: 60 % `--masa`/`--papel`, 30 % `--horno`,
  10 % `--ambar`/`--corteza`.
- **Fondos**: dibujos de línea de trigo, maíz y pan en SVG propio
  (`comun/trazos.jsx`, `FondoDibujo.jsx`), distintos en cada vista y en cada
  paso de la cuenta, quietos, `aria-hidden` y tenues (medidos: el texto de
  encima sigue en AA).
- **Movimiento** con Motion 13.5.1 (`LazyMotion` + `domAnimation`, `m.*`):
  transición de vistas, contador y líneas de la canasta, respuesta al pulsar,
  los ✓ de la contraseña, crear → verificar, los pasos de recuperar, Mis
  pedidos y "Guardado ✓". Un solo momento de entrada por vista; lo demás
  responde a lo que hace la persona. Todo se apaga con
  `prefers-reduced-motion` (`MotionConfig reducedMotion="user"`). Skills:
  `frontend-design`, `emil-design-eng`.
- **Ritmo del movimiento** (el usuario lo quiere más lento y suave). Dos
  clases, y nada fuera de ellas:
  - **Respuesta a un toque** (botón pulsado, contador, ✓, color de hover,
    globos): rápida, 120–200 ms (`--dur-micro`, `--dur-fast`). Si esto se
    alarga el sitio se siente torpe, no suave.
  - **Escena** (cambio de vista, entradas, desplegar, la ficha al
    levantarse, la canasta): lenta, 400–1100 ms (`--dur-base` 400,
    `--dur-slow` 560, `--dur-editorial` 760, `--dur-scene` 1100).
  - Lo que sale va más rápido que lo que entra (salida ≈ la mitad).
  - Nada con `ease-in`: entrar y salir con `--ease-out`/`--ease-soft`.
  - Las duraciones y curvas de Motion salen de un solo archivo,
    `src/comun/movimiento.js`, con los mismos valores que `:root`; ningún
    componente escribe la suya a mano.
  - Al pulsar, botones y fichas bajan a `scale(.97)` (respuesta).
- Contenido hasta 1440 px. **La barra de arriba siempre es `--horno`**,
  opaca desde que carga la página, con el logo y el texto en claro; va de
  borde a borde y se pega al bajar. Sobre secciones oscuras **no se
  invierte**: sigue en `--horno` y gana una línea ámbar fina abajo para separarse
  (hoy solo queda la banda de la cuenta).
  Cortes en 900, 680 y 420 px.
- El hover no depende de media queries: el portátil del usuario es táctil y
  `(hover: hover)` le da falso, así que **nunca veía el hover** (y
  `any-hover` podría fallar igual). Al primer movimiento con
  `pointerType` `mouse` o `pen`, `<html>` gana la clase `con-puntero`, que
  se quita al tocar con el dedo. Van bajo `.con-puntero` los hover que
  mueven algo (`transform`) y los que pintan un fondo o un estado que en el
  teléfono se quedaría pegado tras tocar; un cambio de color o subrayado de
  un enlace puede quedarse con `:hover` normal. En JS, `pointerType`.
- Sin cache-buster a mano: Vite pone huella a los nombres de los archivos.

### Estilo: editorial artesanal con toque retro (21 de octubre de 2026)

Elegido por el usuario sobre una muestra (`.claude/referencias/muestra-editorial.html`,
que trae el CSS y el JS de cada pieza; su panel "Elige" y sus rutas `file://`
no van al sitio). Primera vuelta: **portada y fichas**; Nosotros, Contacto,
la canasta y la cuenta, en una segunda vuelta. Los colores, el logo, el
ritmo del movimiento y la accesibilidad no cambian.

- **Letra de títulos: Fraunces** (variable, con los ejes `opsz`, `SOFT` y
  `WONK`), servida desde el propio sitio con `@fontsource-variable/fraunces`
  5.3.0 (`full.css` y `full-italic.css`), nunca desde Google. Sustituye a
  Georgia en **todos** los títulos del sitio (para que no convivan dos
  letras de título); el texto corrido sigue en Arial.
- **Grano de papel** muy tenue en el fondo `--masa` (SVG de ruido en CSS).
- **Rótulos en versalitas espaciadas** (`.72rem`, `letter-spacing .22em`,
  mayúsculas, `--corteza-oscura`): categorías y "Horneado cada mañana".
- **Cabecera de periódico** bajo la barra, solo en la portada:
  `Miércoles, 21 de octubre ═══ PANADERÍA & PASTELERÍA ═══ ● Abierto · hasta las 20:00`.
  La fecha es la de hoy (`Intl`, `es-EC`); el estado sale de `useHorario`
  (abierto con su hora de cierre, o cerrado con cuándo abre). Las líneas
  dobles se dibujan de izquierda a derecha al entrar. En el teléfono solo
  la fecha y el estado. Sin ciudad ni año de fundación (no hay dato real).
- **Portada** en dos columnas: a la izquierda el rótulo con una espiga
  ("Horneado cada mañana"), el `h1` "El sabor / *de siempre*" en Fraunces
  grande (la segunda línea en cursiva cobriza y desplazada), la frase
  **"Pan recién horneado, todos los días."** en cursiva, el botón
  **"Nuestros panes"** con el icono de la **hogaza** y "Cómo llegar" con el
  pin. A la derecha la foto **cuadrada en arco** (unos 460 px, marco fino a
  10 px), con el pie "Miga abierta, corteza tostada" y el **sello** "Hecho a
  mano · Pan de la casa", quieto (solo gira un poco con el puntero encima;
  **nunca con el scroll**: marea). La nota "Horneando ahora mismo" sale de
  la portada: su estado lo dice ya la cabecera de periódico.
  - Se ajusta al alto visible en escritorio, tableta y teléfono: la cinta
    termina en el borde inferior, y la foto y los espacios se reducen según
    la altura sin desaparecer ni generar scroll.
  - Un estampado de 18 espigas propias, repartidas en posiciones, tamaños
    y giros distintos, llena el fondo de la portada. La tinta queda tenue
    (opacidad .2) bajo el contenido, para que el texto que cae encima de
    una espiga siga con contraste (sección 11), y no añade desplazamiento.
  - En la tableta y el teléfono el sello va sobre la esquina de abajo a la
    derecha de la foto, nunca sobre el pie; en el teléfono asoma la mitad
    por fuera de la foto, en el margen, para no tapar el pan.
  - Al entrar: rótulo, título, frase y botones suben uno tras otro; la foto
    se descubre de abajo arriba; el sello cae girando. Una vez, escena.
- **Cinta cobriza** (en lugar de la franja de trigo): Panes, Dulces y
  pasteles, Bebidas, cada una con su icono de línea (hogaza, galleta con
  chispas, botella), separadas por ✦; cada una es un enlace a su categoría. Al pasar
  el puntero, cada icono acompaña la ola de las letras con un movimiento
  breve propio; con menos movimiento se queda quieto.
- **Navegación superior**: la pastilla de la vista actual viaja a la opción
  elegida con una animación breve, también al entrar a Tienda desde una de
  sus categorías; se desactiva con movimiento reducido. La cuenta seleccionada
  permanece blanca y no cambia al pasar el puntero.
- **Botones: ticket de panadería** (P2 y G3, elegidos el 22 de octubre de
  2026 en `.claude/referencias/muestra-menu.html`; sustituyen a la pastilla
  B1, que no gustó). Las cuatro esquinas van **mordidas hacia dentro**
  (círculos de 9 px, con `mask`), como un vale. Arial en versalitas
  (`.78rem`, `letter-spacing .16em`) y **sombra dura** `4px 4px 0`; como la
  máscara se come la `box-shadow`, la máscara no va en el botón sino en
  dos capas detrás del texto: `::before` (el relleno) y `::after` (la
  sombra corrida). Así el anillo de foco (el `outline` del botón) queda
  fuera de la máscara. Con el puntero se levanta (`6px 6px 0`, un grado de
  giro) y el icono se inclina; al pulsar se hunde con `scale(.97)`. Sin
  brillo: encima del ticket pediría una tercera capa recortada. Un solo bloque de CSS (`.button`, `.button-yellow`,
  `.button-otro`, `.button-pagar`). Ninguno hereda Georgia.
  - **Ámbar con sombra `--horno`**: "Nuestros panes" y todos los botones de
    acción ("Iniciar sesión", "Crear cuenta", "Verificar", "Listo, cerrar",
    "Reintentar", "Ver en el mapa"…).
  - **"Ir a pagar" y el botón final de pagar**, los protagonistas: el mismo
    ticket en **`--corteza` con texto `--papel` y sombra `--horno`** (K1 de
    `muestra-colores.html`, 23 de octubre de 2026; el `--horno` de antes
    era demasiado oscuro), a todo lo ancho de la canasta. Así no se
    confunde con el `+` ámbar de agregar. Papel sobre corteza da 4,7:1:
    el texto no puede ir más fino ni más pequeño que hoy.
  - **Secundario** (`.button-otro`: "Ya tengo cuenta…", "No tengo
    cuenta…", "Cerrar sesión"): ticket hueco, solo el borde de 1,5 px
    `--horno` siguiendo las mordidas (dibujado, porque un `border` no las
    sigue), que sube 2 px y se rellena de `--masa` con el puntero.
  - Con `forced-colors` se quitan las capas y el botón lleva un filete
    `ButtonText` de 1,5 px (`GrayText` si está apagado).
  - Apagado (`aria-disabled`): opacidad .45 y sin reaccionar al puntero.
  **Recto lo que se lee**: las fichas siguen con esquinas rectas.
- **"Cómo llegar" de la portada**: enlace, no botón (L1 de
  `muestra-colores.html`). Fraunces en cursiva de unos 1.35rem y 600, con
  el pin en `--corteza` (24 px) y un filete fino de `--corteza`, sin relleno
  ni raya, para distinguirlo del fondo sin competir con "Nuestros panes".
  Con el puntero las letras **saltan una tras otra** (la ola: cada letra en
  un `span` `aria-hidden`, sin cambiar el nombre accesible), el texto y el
  borde pasan a `--corteza-oscura` y el pin da un saltito. Con menos
  movimiento solo cambia el color.
- **Menú de arriba: todo en blanco** (W1 y S2 de `muestra-colores.html`,
  23 de octubre de 2026; sustituye al ámbar de M2, que no gustó). Con el
  puntero, sobre el mismo enlace se enciende en su sitio un **blanco
  tenue** (`--papel` al 16 %, opacidad y `scale(.85)` → 1, respuesta
  rápida) y el texto sigue claro; no viaja de un enlace a otro. **La
  página actual** es la única en **blanco lleno**: pastilla `--papel` con
  el texto `--horno`, sin raya ni aro, y
  así también en el menú del teléfono. Solo con
  ratón o lápiz (`.con-puntero`); el foco de teclado sigue con su anillo
  `--papel`. Entre 681 y 900 px el menú va centrado en el hueco entre el
  logo y los botones (rejilla `auto 1fr auto`, logo de 52 px), para que
  nada se pise.
- **La cinta de categorías** también sin ámbar: con el puntero se enciende
  en su sitio una pastilla `--papel` llena con el texto y el icono en
  `--horno` y las letras saltan en secuencia, como una ola; el lector de
  pantalla sigue recibiendo el nombre de cada categoría como una sola frase.
  Con menos movimiento no hay ola. (Un blanco tenue sobre el cobrizo dejaría
  el texto por debajo de 4,5:1.)
- **Iconos de línea** del mismo trazo que los dibujos de trigo
  (`comun/iconos.jsx`): hogaza, rebanada, botella, espiga, pin, flecha y
  **cesta con asa**, que pasa a ser el icono de la canasta (arriba y la
  flotante del teléfono).

### Nosotros con el estilo de la portada (24 de octubre de 2026)

Segunda vuelta de Nosotros, aplicada sin muestra (el usuario lo eligió así).
Las piezas son las de la portada; lo que se reutiliza va en las mismas
clases o en piezas comunes, no copiado.

- **La historia**, en dos columnas como la portada pero en espejo: **la
  foto del amasado a la izquierda**, en el mismo **arco** con marco fino y
  el pie "Despacio sabe mejor"; a la derecha el rótulo con la espiga
  **"Nuestra historia"**, el `h1` "El tiempo es / *nuestro ingrediente*"
  con el tratamiento del `h1` de la portada (Fraunces grande, la segunda
  línea en cursiva cobriza y desplazada), "No hacemos pan rápido. Hacemos
  pan que vale la espera." en cursiva como la frase de la portada, el
  párrafo de la madrugada en Arial, y **"Conoce nuestro local"** con el
  aspecto y la ola de "Cómo llegar" (pin, Fraunces en cursiva, filete
  `--corteza`), que sigue llevando a `#/contacto`.
- **Sello propio** sobre la foto: "Masa madre · Hecho despacio", el mismo
  dibujo y comportamiento que el de la portada (`aria-hidden`, cae girando
  al entrar, gira un poco con el puntero encima, nunca con el scroll).
- **Entrada**: la escena de la portada (rótulo, título, frase y enlace
  suben uno tras otro; la foto se descubre de abajo arriba; el sello cae
  girando). Una vez, al llegar a la vista.
- **Los tres principios**, sin la banda oscura: sobre la masa con el grano
  de papel. El `h2` "Tres cosas que no cambiamos" va en versalitas entre
  las **líneas dobles** de la cabecera de periódico, que se dibujan de
  izquierda a derecha. Debajo, tres columnas separadas por ✦, cada una con
  su número editorial (**"N.º 1"**, "N.º 2", "N.º 3", en versalitas
  `--corteza-oscura`), el icono de línea, el nombre en Fraunces y su
  frase. Con el puntero encima, el icono de cada principio hace un
  movimiento breve propio, como los de la cinta.
- **Todo en una sola pantalla, sin scroll** (pedido el 24 de octubre de
  2026), como la portada: la vista mide el alto visible (`100svh`), la
  franja de espigas termina en el borde de abajo, y la foto, el sello, el
  `h1` y los espacios se reducen según la altura (`clamp` con `svh`) sin
  desaparecer. En escritorio y tableta caben todos los textos; los
  principios van en una fila de tres.
- **En el teléfono** (680 px o menos), para que quepa: la foto en arco se
  hace pequeña y va **al lado del título** (a la derecha), sin el sello ni
  su pie; se quita el párrafo de la madrugada; los principios siguen en
  **una fila de tres**, cada uno con su "N.º", el icono y el nombre,
  **sin su frase**. Lo quitado no se ve ni se lee (`display: none`),
  salvo el pie de la foto, que sigue dando nombre a la figura para el
  lector de pantalla (no confunde).
- Como ya no hay nada debajo, los principios **no esperan al scroll**:
  entran en la misma escena de la vista, tras la historia (las líneas se
  dibujan y las columnas suben una tras otra). Fuera el
  `IntersectionObserver` y la excepción a "un solo momento de entrada".
- Con menos movimiento todo está quieto y visible desde el principio, sin
  ola ni giros.
- Con zoom o una ventana muy baja donde no quepa, la vista crece y se
  desplaza en vez de cortar texto (WCAG 1.4.10): ajustarse al alto nunca
  esconde contenido que en ese tamaño debería verse.
- Fondo con el estampado de trazos de Nosotros (`FondoDibujo`), tenue.

**Disposición "arco de pie"** (25 de octubre de 2026, elegida por el
usuario entre tres propuestas; manda sobre lo de arriba donde choque). La
foto pesaba poco (300 px de ancho a 1440×900, con 300 px vacíos al lado) y
la historia y los principios se leían como dos bloques:

- **Una sola composición**: los principios van **dentro de la historia**,
  bajo el texto y en la misma columna (siguen siendo una `section` con su
  `h2`). Rejilla de dos columnas: la foto a la izquierda ocupa **todo el
  alto** de las dos filas; a la derecha el texto y debajo los principios.
- **La foto con peso**: el arco mide alrededor del **80 % del alto
  disponible** (unos 520 px de ancho a 1440×900, ~430 a 1366×768), sin
  pasar de 540 px. El sello se queda sobre su esquina sin pisar el texto.
- **Los principios alineados con el texto**: a la izquierda, empezando en
  el mismo borde que el rótulo; el `h2` en versalitas con **una sola**
  línea doble a su derecha (no a los dos lados); las tres columnas con ✦,
  "N.º", icono, nombre y frase como antes, pero alineadas a la izquierda.
- **El aire**: el hueco entre el texto y los principios es menor que los de
  arriba y abajo (se acaba el reparto a partes iguales); el conjunto va
  centrado en vertical entre la barra y la franja.
- **Tableta** (681–900 px): foto y texto arriba, principios debajo a todo
  lo ancho, como hasta ahora.
- **En el teléfono** (sustituye al bullet de arriba): la foto en arco **a
  todo el ancho, arriba**, con el alto que sobre (entre 150 y 300 px),
  sin el sello ni su pie; debajo rótulo, título, frase y "Conoce nuestro
  local" (más bajo, como el "Cómo llegar" de la portada en el teléfono);
  sin el párrafo de la madrugada; los principios en una fila de tres sin su
  frase. Sin huecos grandes entre las piezas.
- Si a 1280×720 no cabe el texto, baja algo el `h1` antes que la foto.
  Entre 901 y 1180 px la columna del texto es estrecha y los principios
  parten en más líneas: la foto no pasa del 37 % del ancho (del 40 % por
  encima), y el `h1`, los nombres y las frases de los principios bajan un
  poco, para que 1024×768 siga cabiendo sin scroll.
- Medido: el arco mide 520 px de ancho a 1440×900, 420 a 1366×768, 383 a
  1280×720 y 379 a 1024×768; en el teléfono, 293 px de alto a 390×844 y
  150 a 360×640.
- Sigue todo lo demás: una sola pantalla sin scroll, la escena de
  entrada, menos movimiento, y crecer con scroll cuando con zoom no quepa.

### Contacto con el estilo de la portada (24 de octubre de 2026)

Como Nosotros, sin muestra (elegido por el usuario) y con las mismas piezas
comunes (`EnlaceLlegar`/`TextoOla`, `Sello`, `.linea-doble`, la escena de
entrada), no copiadas.

- **Arriba, como la portada**: el texto a la izquierda y el mapa a la
  derecha; **debajo**, el horario a la izquierda y Escríbenos a la
  derecha, cada uno con su cabeza entre líneas dobles. En el teléfono, una
  columna en ese orden.
- **El texto**: el rótulo con la espiga **"Dónde estamos"**, el `h1`
  "Visítanos / *en Tena*" con el tratamiento del de la portada (la segunda
  línea en cursiva cobriza y desplazada), la dirección, dentro de su
  `<address>`, en cursiva como la frase de la portada, y "Ver en el mapa".
  En el teléfono la dirección va al lado del título, abajo, y el botón
  debajo de los dos.
- **El mapa** en un **marco fino recto** (el mismo filete de la foto en
  arco, pero sin arco para no recortar el mapa), con un **sello propio**
  arriba a la derecha, "Eloy Alfaro · Gabriel Espinosa", que se comporta
  como el de la portada (`aria-hidden`, cae girando al entrar, nunca con
  el scroll) y no tapa los controles ni los créditos de Google (abajo y a
  la izquierda). Deja pasar el puntero al mapa (`pointer-events: none`),
  así que no gira con el puntero encima. "Ver en el mapa" sigue siendo el
  ticket ámbar, bajo la dirección.
- **El horario**, sin la tarjeta oscura: sobre la masa, con el `h2`
  "Horario de atención" en versalitas entre **líneas dobles** (como los
  principios de Nosotros), el estado abierto/cerrado debajo y cada fila
  **como una carta**: el día, **puntos guía** y la hora, en Fraunces (la
  fila de hoy en horno, con su pastilla "hoy"). Sigue siendo un `<dl>`;
  los puntos son el borde punteado de un `::after` del `dt`, sin texto.
  Si la fila no cabe, la hora baja a la línea siguiente. "En feriados
  nacionales cerramos." debajo, en cursiva. El estado va en una pastilla
  papel con el texto en horno (abierto) o corteza oscura (cerrado): el
  ámbar de antes era para el fondo oscuro.
- **Escríbenos**: WhatsApp e Instagram con el aspecto de "Cómo llegar"
  (Fraunces en cursiva, filete `--corteza`, su icono y la ola de letras;
  es el mismo `EnlaceLlegar`, que con `href` se abre en otra pestaña y lo
  dice en el nombre), uno al lado del otro con el rótulo de cada uno
  encima, y la nota de que son de ejemplo, que **se ve siempre**:
  "Teléfono y redes de ejemplo (proyecto de clase)."
- **Entrada**: la escena de la portada (rótulo, título, dirección y
  enlaces suben uno tras otro; el mapa se descubre de abajo arriba; el
  sello cae girando; las líneas del horario se dibujan). Una vez.
- **Todo en una sola pantalla, sin scroll**, como Nosotros: la vista mide
  el alto visible (`min-height: 100svh`), la franja en el borde de abajo,
  y el mapa, el sello, el `h1` y los espacios se reducen según la altura
  (`clamp` con `svh`). Cabe de 1440×900 a 360×640 (también 1366×768,
  1280×720, 900×1000, 768×1024, 390×844, 390×700 y 375×667). En el
  teléfono el mapa se hace bajo (150–200 px según la altura) y no se
  quita ningún texto.
- **En los teléfonos bajos** (680 px de ancho o menos y 800 px de alto o
  menos), para que quepa: el estado abierto/cerrado sube **junto a
  "Dónde estamos"**, como en la cabecera de periódico, y el del horario
  se quita (solo uno se ve y se lee a la vez: el otro va con
  `display: none`); el `h1` va **en una línea**, "Visítanos *en Tena*",
  sin el desplazamiento de la segunda; la dirección, en una línea; el
  mapa puede bajar **hasta 120 px**; y los espacios quedan al mínimo (el
  ticket sigue en 44 px). La canasta flotante no tapa ningún enlace.
- A 320 px de ancho WhatsApp e Instagram van uno debajo del otro y la
  vista crece unos 55 px. Con zoom o una ventana muy baja, la vista crece
  y se desplaza en vez de cortar texto (WCAG 1.4.10).
- Con menos movimiento todo está quieto y visible desde el principio.

### La tienda con el estilo de la portada (25 de octubre de 2026)

Como Nosotros y Contacto, sin muestra y con las mismas piezas comunes.
Cambia la cabecera de la vista; las fichas siguen editoriales (más
pequeñas desde el 25 de octubre, sección 4).

- **Sin la tarjeta oscura**: la cabecera va sobre la masa con el grano y
  su `FondoDibujo`. El `--horno` queda en la barra, el texto, el borde de
  las fichas y la categoría elegida.
- **El texto**, alineado a la izquierda como la portada (sin "Volver al
  inicio" desde el 25 de octubre): el rótulo con la espiga **"Nuestra vitrina"**; el
  `h1` con el nombre de la vista en Fraunces grande; y debajo una **frase
  en cursiva** propia de cada una (el usuario puede cambiarlas):
  - Todo el catálogo: "Panes, dulces y bebidas de la casa."
  - Panes: "Lo que sale del horno cada mañana."
  - Dulces y pasteles: "Para endulzar la tarde."
  - Bebidas: "Para acompañar el pan."
- **"Filtrar por" como la cinta**: Todas ✦ Panes ✦ Dulces y pasteles ✦
  Bebidas, en Fraunces cursiva, cada categoría con su icono de la cinta
  (hogaza, galleta, botella) y la ola de letras con el puntero. La
  elegida en una **pastilla `--horno` con el texto `--papel`, que se
  desliza de una categoría a otra** (un solo elemento compartido,
  `layoutId` de Motion, resorte corto de ~250 ms; con menos movimiento
  salta; si las categorías parten en dos filas, cruza de una a otra). Siguen
  siendo radios (Tab entra una vez, las flechas cambian), con el rótulo
  "Filtrar por" en versalitas. El nombre de cada radio es el de siempre
  (el texto entero escondido de la ola); las estrellas son adorno; el
  foco se ve en la etiqueta con el anillo de los campos. En el teléfono
  el rótulo va encima y las categorías parten en las líneas que hagan
  falta, sin estrellas. El icono de cada categoría es uno solo para la
  cinta y el filtro (`IconoCategoria` en `comun/iconos.jsx`).
- **Los mandos** (buscador, "Ordenar por", "Mostrar") en una fila entre
  **líneas dobles**, como los títulos de Nosotros y Contacto: campos en
  `--papel` con filete fino, rótulos en versalitas. "Mostrando X de Y
  productos" en versalitas `--corteza-oscura`, bajo la fila a la derecha.
  Cuando los mandos no caben en una fila (1080 px o menos) las líneas van
  encima y debajo, a todo lo ancho; en el teléfono los mandos se apilan
  como antes.
- **Entrada**: la escena de la portada (rótulo, título, frase y filtro
  suben uno tras otro; luego los mandos suben y sus líneas se dibujan).
  Es de montaje: las categorías son la misma vista y no se vuelve a
  montar, así que al cambiar de categoría dentro de la tienda no se
  repite la escena: solo cambian el título, la frase y las fichas (que
  entran escalonadas como ya hacían).
- Los panes dibujados del fondo van a la derecha, lejos del texto; con
  1080 px o menos se quita el pan largo, que caía bajo el filtro.
- **Con scroll**: la tienda no se ajusta a una pantalla (son 17 fichas).
- Con menos movimiento, todo quieto y visible.

## 11. Accesibilidad (objetivo: WCAG 2.2 AA)

- Todo con teclado; paneles que atrapan el foco, Esc y devolución del foco;
  `inert` detrás de los paneles; ficha de la cuenta y "Ordenar por" con
  flechas; enlace de salto al contenido.
- Foco visible: anillo de 3 px en `--horno` con halo ámbar de 5 px; dentro
  de la barra (que es `--horno`) y en "Saltar al contenido", el anillo es
  `--papel`. La canasta flotante del teléfono, que va sobre la página
  clara, vuelve al anillo `--horno`. Campos con
  borde `--horno-claro` (4,97:1). `html { scroll-padding-top/bottom }` para
  que el foco no quede bajo la cabecera.
- ARIA solo donde hace falta: `role="dialog"` + `aria-modal`, `alertdialog`,
  `aria-expanded`, `aria-controls`, `aria-current`, `aria-live="polite"`,
  `aria-invalid` + `aria-describedby`.
- Sobre el grano de papel el contraste se mide con su píxel más oscuro,
  rgb(238,230,220): rótulos 6,52:1, pie de foto 6,17:1, `h1 em` 3,87:1
  (vale por ser letra grande). En la portada, donde una espiga del
  estampado pasa bajo la letra, el peor píxel de 320 a 1440 px (texto
  transparente, 24 de octubre de 2026): `h1 em` 3,14:1, pie 5,03:1,
  frase 5,10:1, rótulo 5,37:1. En la cabeza de la tienda, sobre el grano
  y sus panes (de 320 a 1440 px): rótulos 6,52:1, `h1` 9,28:1, frase
  6,17:1, categorías 8,99:1, la elegida (papel sobre horno) 13,71:1.
  En #/contacto, sobre el grano y los
  trazos del fondo (mismo método, de 320 a 1440 px): `h1 em` 3,87:1,
  rótulos 5,16:1, dirección 5,07:1, nota de ejemplo 6,17:1, días del
  horario 6,17:1. El estado abierto/cerrado va en su pastilla papel:
  abierto, horno sobre papel, 13,71:1; cerrado, corteza oscura sobre
  papel, 7,93:1. WhatsApp e Instagram llevan su rótulo escondido delante
  en el nombre ("WhatsApp: +593…"). En todos los botones principales
  (ticket) la sombra dura sustituye al halo ámbar; el anillo de 3 px se queda. Un
  `.button` con `aria-disabled` se ve apagado (opacidad .45, `GrayText` con
  `forced-colors`) y no reacciona al puntero.
- Contraste medido (texto 12,4:1; sobre la foto de la portada 8:1 o más;
  sobre los fondos de trazos 5,7:1 o más).
- Con `forced-colors`, lo elegido se pinta con `Highlight` (filtros,
  tamaños, opciones de confirmar, forma de pago).
- Objetivos de al menos 24 px, o con espacio libre alrededor (WCAG 2.5.8).
- Se pueden seleccionar el código del recuadro, el `ET-XXXX` y los datos de
  Mis datos (`user-select: text`).
- Precios con **punto decimal** (`$1.25`), como se escriben los dólares en
  Ecuador; lo hace `dinero()`.
- Revisión de `ux-accesibilidad` del 20 de octubre de 2026 sobre todo el
  sitio: 0 violaciones A/AA con axe, y sus arreglos hechos.

## 12. Calidad y publicación

1. `npm run build` sin errores ni avisos.
2. `npm run probar` (todas las pruebas de navegador de `pruebas/casos/`, en
   Edge; `npm run probar -- <nombre>` para una). Lo nuevo que ninguna prueba
   mira lleva su caso, en escritorio y en el teléfono, en el mismo commit.
3. Commit solo de los archivos del cambio, por nombre
   (`git commit -m ... -- <rutas>`: un `git commit` sin rutas se lleva lo que
   otro agente tenga en el índice), mensaje en español.
4. `bash .claude/skills/publicar/ci-local.sh`.
5. Push a `main` y esperar a que `Validar y publicar sitio` salga en verde
   (`validate` y `deploy`, que publica en Pages).

El CI (`validate`, en cualquier rama): `npm ci`, build sin avisos, `revisar()`
de cada producto, categorías ↔ `CATEGORIAS`, fotos en los dos anchos y de la
portada, palabras prohibidas en `index.html`, `src/`,
`assets/css/` y `data/productos.json`, espacios al final de línea, y la
prueba `humo` en Chrome. `deploy` (solo `main`) construye y publica `dist/`.
`.claude/herramientas/axe.mjs` mide 46 estados del sitio.

## 13. Pendiente

### Contenido y confianza
- [ ] Teléfono, WhatsApp e Instagram reales, o quitarlos del JSON-LD y de los enlaces.
- [ ] Ingredientes y alérgenos por producto (confirmados por el negocio).
- [ ] Unidad del precio (pieza, funda, docena).
- [ ] Galería del local en `#/nosotros` (`assets/img/local/`), cuando el
      usuario pase fotos reales; sin fotos no se enseña nada.

- [ ] Quitar `etiqueta` de `data/productos.json`, de `reglasCatalogo.js`, de
      la tabla de campos y de `bd/` (ya no se pinta; hay que tocar el modelo
      y probar con `probar-bd`).

### Accesibilidad y UX
- [x] "Solo disponibles" como `Todos | Solo disponibles` a la vista y
      "Ordenar por" como lista plana sin caja (26 de octubre de 2026).
- [x] Tienda sin desplegable en el menú, sin "Volver al inicio", fichas 4
      por fila, "Ordenar por" desplegable propio y "Mostrar" interruptor
      (secciones 3, 4 y 10, 25 de octubre de 2026). Lo prueba
      `pruebas/casos/tienda-mandos.mjs`.
- [x] Fichas 5 por fila con la tienda de 1080 px o más y 4 desde unos 860
      (sección 4, segunda vuelta del 25 de octubre de 2026): a 1440 la ficha
      mide 258 px, a 1280 y a 1024, 228; el − y el + en 30 × 30. Lo prueba
      `tienda-mandos.mjs` a 1440, 1280, 1024 y 900 px, con el `− n +`
      abierto en todas (precio y control en una línea, dentro de la ficha,
      sin partir palabras del nombre).
- [x] Nosotros con la disposición "arco de pie" (sección 10, 25 de
      octubre de 2026): la foto de alto entero y los principios bajo el
      texto, en su columna. Lo prueba `pruebas/casos/nosotros.mjs` (sin
      scroll de 1440×900 a 360×640 y a 1024×768, peso de la foto, aire
      centrado con el hueco del medio menor, sello lejos del texto).
- [ ] `user-select: none`: los precios, el WhatsApp y los datos del
      comprobante (salvo el número) todavía no se pueden copiar.
- [x] Canasta sin cuenta: el usuario quiere que cualquiera la llene y que
      solo al ir a pagar se le avise, que es como ya funciona (sección 5).
      Sin invitado y sin aviso previo (22 de octubre de 2026).
- [ ] axe (menor): la barra de deshacer fuera de un punto de referencia (`region`).
- [ ] 60-30-10 medido con capturas en cada vista (se ajustó a ojo).
- [ ] Tras recargar, la tienda no recuerda el desplazamiento de las entradas
      de antes (Atrás entre categorías da arriba); se arreglaría con
      `sessionStorage`. No urge.
- [ ] Las entradas creadas cambiando la dirección a mano (escribir
      `#/tienda-dulces` estando en `#/tienda-panes`) no llevan clave de React
      Router (todas `default`), así que Atrás entre ellas no vuelve a donde
      se estaba. Con los enlaces del sitio sí. Lo destapó el caso
      `atras-entre-vistas` con 5 fichas por fila; ahora prueba el recorrido
      con enlaces (cinta → Panes, menú → Tienda, Atrás).
- [ ] El caso `reenviar-codigo` todavía espera a que crear acabe de salir y
      su comentario dice que está "apuntado para frontend"; ya no hace falta.
- [ ] Sección de contenidos de IHC en el agente de UX (cuando el usuario pase los temas).
- [ ] GitHub avisa de que `ubuntu-latest` pasa a Ubuntu 26.
- [x] Quitar el halo que late junto a "Horneando ahora mismo" (`latido`,
      infinito, incumplía 2.2.2): el usuario prefiere quitarlo; el punto
      quieto se queda.
- [ ] Sin probar en Firefox ni Safari (`mask-image`), ni `forced-colors` en la barra nueva, ni con NVDA.

### Estilo editorial artesanal
- [ ] Fraunces sin precarga: en la primera visita el `h1` sale en Georgia y
      salta a Fraunces (unos 150 kB por estilo). Añadir
      `<link rel="preload" as="font">` del woff2 latin normal.
- [ ] `notaDelHorno` (`servicios/horario.js`) ya no la usa nadie: borrarla
      (`logica-datos`).
- [ ] axe no mide el contraste sobre el grano ni dentro de las fichas
      ("a revisar a mano" en 32 de 46 estados; medido a mano, todo pasa):
      que `axe.mjs` haga otra pasada de `color-contrast` sin el grano
      (`body{background-image:none}`, `.product-card::after{content:none}`).
- [x] Primera vuelta: portada y fichas (sección 10, "Estilo"), Inicio en el
      menú y la cesta con asa en la canasta (21 de octubre de 2026).
- [x] Portada sin "Los más pedidos" ni carrusel, sin la foto que vuela a la
      canasta, y destello `--horno` en la pastilla al agregar (22 de
      octubre de 2026).
- [x] Botones en pastilla con sombra (B1) en todo el sitio, enlaces sueltos
      en pastilla y la pastilla que se desliza en el menú (N3), sección 10
      (22 de octubre de 2026). Los botones dejan de heredar Georgia.
- [x] Botones en ticket (ámbar; "Ir a pagar" y pagar en `--horno`),
      "Cómo llegar" como enlace sin raya, menú y cinta que se encienden en
      su sitio con aro en la página actual, y fuera el pie de página
      (22 de octubre de 2026, sección 10 y sección 2).
- [ ] Menú y cinta en blanco (W1, S2), "Ir a pagar" y pagar en cobrizo
      (K1), "Cómo llegar" más grande y con la ola (L1), y las líneas de la
      canasta con el "+1", el destello y el número que entra (23 de
      octubre de 2026).
- [ ] Acciones que no son `.button` y siguen con su estilo: "Ver la
      vitrina" (canasta vacía), "Pedir otra vez", "Editar" de la cuenta y
      `.order-button`. Decidir con el usuario si pasan al ticket.
- [ ] Georgia sigue en `body`: la heredan "Saltar al contenido" y el
      `<noscript>` de `index.html` (los botones y el párrafo de Nosotros ya
      no). La sección 10 dice texto corrido en Arial.
- [x] Nosotros con el estilo de la portada (sección 10, 24 de octubre de
      2026): arco, sello propio, escena de entrada, principios numerados
      sobre la masa entre líneas dobles que se dibujan al llegar. Las
      piezas comunes con la portada: `comun/FotoEnArco.jsx`, `Sello.jsx` y
      `EnlaceLlegar.jsx`; lo prueba `pruebas/casos/nosotros.mjs`.
- [x] Portada en el teléfono (revisión de `ux-accesibilidad` del 24 de
      octubre de 2026): el sello va sobre la esquina de la foto y ya no
      tapa el pie ni la cinta (también a 320×640 con el espaciado de
      1.4.12); las espigas del fondo bajan a .2 (medidas en la sección
      11); y en la cinta los espacios de la ola son espacios de verdad,
      la línea se parte entre palabras. Lo prueba `pruebas/casos/portada.mjs`.
- [x] Nosotros en una sola pantalla sin scroll (sección 10, 24 de octubre
      de 2026): foto al lado del título y principios sin frase en el
      teléfono; los principios entran con la escena, sin observador. Lo
      prueba `nosotros.mjs` de 1440×900 a 360×640, y que a 320×256 y
      640×360 crece sin cortar.
- [x] Contacto con el estilo de la portada (sección 10, 24 de octubre de
      2026): rótulo y titular, mapa con marco y sello, horario estilo carta
      sobre la masa, Escríbenos con la ola, una sola pantalla de 1440×900 a
      360×640. Lo prueba `pruebas/casos/contacto.mjs`.
- [x] Contacto en los teléfonos bajos (24 de octubre de 2026): el estado
      junto a "Dónde estamos", el `h1` en una línea, el mapa hasta 120 px
      y la nota de ejemplo más corta; cabe sin desplazarse a 390×700,
      375×667 y 360×640, y la canasta flotante no tapa ningún enlace.
- [x] La tienda con el estilo de la portada (sección 10, 25 de octubre de
      2026): cabecera sobre la masa, frase por categoría, filtro como la
      cinta, mandos entre líneas dobles. Lo prueba `pruebas/casos/tienda.mjs`.
- [ ] `.claude/herramientas/axe.mjs` (y cualquier script de revisión que
      cree una cuenta) manda un correo real por EmailJS: el 25 de octubre
      de 2026 llegó uno a `ana@correo.com`. Que corte EmailJS como hace
      `t.contexto` en `pruebas/`.
- [ ] Segunda vuelta: el aspecto de la canasta y la cuenta más allá
      de los botones, con otra muestra antes.

### Aspecto y movimiento (revisión visual del 21 de octubre de 2026)
- [x] Barra siempre `--horno`, sin invertirse; línea ámbar sobre lo oscuro.
- [x] Hover bajo `.con-puntero`: en el portátil del usuario no se veía.
- [x] Ritmo del movimiento (sección 10) y `src/comun/movimiento.js`.
- [x] Fichas: nombre en Georgia, sin hueco, sellos legibles, `scale(.97)`.
- [x] Carrusel: flechas y barra de avance en el pie en todos los anchos, sin
      barra del navegador, borde desvanecido.
- [x] Sin recuadro ámbar en el `h1` al cambiar de vista.
- [x] Carrusel: si a mitad del salto de 560 ms se mueve con el teclado o se
      tabula a una ficha, el salto no se cancela (`useFila.js`, escuchar
      también `keydown` y `focusin`).
- [x] El buscador y "Ordenar por" de la tienda se quedan con el borde
      corteza al pasar el ratón (el usuario lo aprobó).

### Base de datos
- [x] Modelo y script de creación en PostgreSQL (`bd/BD_EL_TRADICIONAL.sql`).
- [x] Compras, inventario por lotes, recetas, producción con FEFO/FIFO/LIFO/
      promedio, talento humano, nómina, contabilidad y logs (50 tablas).
- [ ] Revisar el modelo con el profesor, sobre todo: el kardex como vista,
      el saldo del lote calculado y las débiles sobre otra débil.
- [ ] Confirmar las recetas con el panadero y la vida útil de cada material.
- [x] Base subida a Supabase (proyecto `ugscqizansixnsuzljtu`, 21 de octubre
      de 2026; logs el 22), con el conector MCP. Las 50 tablas tienen RLS sin políticas
      (por la API no entra nadie), las vistas usan `security_invoker` y las
      funciones fijan su `search_path`; está al final del script y
      `probar-bd` lo comprueba.
- [ ] Antes de conectar el sitio: escribir las políticas de RLS de lo que
      el sitio necesite (por ejemplo, leer el catálogo) y decidir cómo entra
      el usuario (Supabase Auth o la cuenta actual). Con eso se decide
      también cómo se llena `app.usuario` para que la auditoría sepa quién.
- [ ] El IVA de cada producto es una suposición (pan 0%, dulces y bebidas
      15%): confirmarlo con el contador.
- [ ] Cuáles alérgenos lleva cada producto (`PRODUCTOS_ALERGENOS`).
- [ ] Conectar el sitio a la base (servicio gratis, sin tarjeta).

### SEO
- [ ] `robots.txt` y `sitemap.xml`.
- [ ] Menú como dato estructurado (`Menu` / `Offer`).
- [ ] Tamaño de la imagen de Open Graph.
- [ ] "Tena" en el título y la descripción.

## 14. Agentes y skills

Los agentes viven en `.claude/agents/` y todos leen este plan primero.

| Agente | Se encarga de | Cambia archivos | Skills cargadas |
|---|---|---|---|
| `frontend` | `index.html`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, `src/vistas/`, `src/catalogo/`, `src/comun/`, `src/estilos/`, `assets/css/styles.css`, `FichaCuenta.jsx`, `PasoQueCambia.jsx`; maquetación, responsive y movimiento | Sí | `verificar-sitio`, `wcag-audit-patterns`, `componente-react`, `vercel-react-best-practices`, `vercel-composition-patterns`, `frontend-design`, `emil-design-eng` |
| `logica-datos` | `src/estado/`, `src/servicios/`, `src/pedido/`, `src/cuenta/` (salvo lo de `frontend`), `data/productos.json` | Sí | `verificar-sitio`, `nielsen-usability-heuristics`, `componente-react`, `vercel-react-best-practices`, `vercel-composition-patterns` (+ sigue `nuevo-producto`) |
| `base-datos` | La base de datos (`bd/`) y su prueba (`.claude/skills/probar-bd/probar.mjs`) | Sí | `probar-bd`, `supabase-postgres-best-practices` |
| `ux-accesibilidad` | WCAG 2.2, heurísticas de Nielsen, IHC, recorridos de usuario | No, solo informa | `wcag-audit-patterns`, `nielsen-usability-heuristics` (+ `.claude/herramientas/axe.mjs`) |
| `revision-visual` | Aspecto y movimiento: capturas en 1440/900/680/390 px, fichas, barra, tipografía, 60-30-10, duraciones y curvas | No, solo informa | `frontend-design`, `emil-design-eng`, `review-animations`, `web-design-guidelines` (+ `.claude/herramientas/capturas.mjs`) |
| `calidad-publicacion` | Revisión de código y seguridad, `pruebas/`, `.claude/herramientas/`, CI, `package.json`, publicar | Sí, lo de publicar y las pruebas | `verificar-sitio`, `publicar`, `vercel-react-best-practices` |

Skills en `.claude/skills/`:

| Skill | Origen | Quién la usa |
|---|---|---|
| `verificar-sitio` | propia: build sin avisos y `npm run probar` | `frontend`, `logica-datos`, `calidad-publicacion` |
| `publicar` | propia (`ci-local.sh` al lado) | `calidad-publicacion` |
| `componente-react` | propia: convenciones de `src/` | `frontend`, `logica-datos` |
| `nuevo-producto` | propia, la invocas tú con `/nuevo-producto` | `logica-datos` sigue sus pasos |
| `probar-bd` | propia: corre `bd/` en PGlite y comprueba las reglas del modelo, el catálogo y los inserts (`probar.mjs` al lado) | `base-datos` |
| `notas-para-explicar` | propia, la invocas tú con `/notas-para-explicar` | — |
| `wcag-audit-patterns` | skills.sh, `wshobson/agents` | `ux-accesibilidad`, `frontend` |
| `nielsen-usability-heuristics` | skills.sh, `dembrandt/dembrandt-skills` | `ux-accesibilidad`, `logica-datos` |
| `vercel-react-best-practices` | skills.sh, `vercel-labs/agent-skills` (copiada a mano del commit `063bee9`) | `frontend`, `logica-datos`, `calidad-publicacion` |
| `vercel-composition-patterns` | skills.sh, `vercel-labs/agent-skills` (copiada a mano del commit `063bee9`) | `frontend`, `logica-datos` |
| `frontend-design` | skills.sh, `anthropics/skills` (copiada a mano del commit `dbd4588`) | `frontend`, `revision-visual` |
| `emil-design-eng` | skills.sh, `emilkowalski/skills` (copiada a mano del commit `2d22863`, leída entera el 21 de octubre de 2026) | `frontend`, `revision-visual` |
| `review-animations` | skills.sh, `emilkowalski/skills` (ídem, con `STANDARDS.md`) | `revision-visual` |
| `web-design-guidelines` | skills.sh, `vercel-labs/agent-skills` (copiada a mano del commit `063bee9`); baja sus reglas en el momento de `vercel-labs/web-interface-guidelines` | `revision-visual` |
| `supabase-postgres-best-practices` | skills.sh, `supabase/agent-skills` (con el CLI; leída entera el 20 de octubre de 2026). Choca con las reglas del modelo en PK, `text` y nombres: mandan las del plan | `base-datos` |

Las instaladas con el CLI quedan en `skills-lock.json` y `npx skills update -p`
las actualiza. Las dos de Vercel se copiaron a mano porque el CLI se colgaba con
ese repositorio, y `frontend-design` igual: para actualizarlas, volver a
copiarlas. Ojo: `npx skills use` **no instala**, solo genera un prompt de un
uso; para instalar es `npx skills add <repo> --skill <nombre> -a claude-code --copy`.

A las dos de Emil se les quitó al copiarlas la sección "Initial Response"
(obliga a contestar solo una frase fija y dentro de un agente lo bloquea) y a
`review-animations` el `disable-model-invocation`. Chocan con el plan en dos
cosas y manda el plan: piden menos de 300 ms en todo (aquí solo en la
respuesta a un toque; las escenas van más lentas, sección 10) y el hover con
`(hover: hover)` (aquí la clase `.con-puntero`). `web-design-guidelines` pide
Title Case, que es del inglés: no aplica.

## 15. Cómo se llegó aquí (migración a React, 19–21 de octubre de 2026)

El sitio presentado era HTML, CSS y 10 módulos de JavaScript sin
dependencias, que se abría también con doble clic (etiqueta
`sitio-presentado`). El 19 de octubre de 2026 el usuario eligió **React**
(Vite, JavaScript, React Router, sin doble clic) y se migró en la rama
`mejoras`, en siete fases, sin cambiar el formato de lo guardado:

1. **Andamiaje**: Vite + React en `react/`, `styles.css` importado.
2. **Catálogo y página**: cabecera, portada, tienda, filtros, rutas, avisos.
3. **Canasta**: panel, líneas, deshacer, vaciar, guardado.
4. **Pedido y pago**: confirmar, factura, tarjeta, comprobante, IndexedDB.
5. **Cuenta** como vistas propias, con código en 6 casillas, recuperar la
   contraseña, pedidos por cuenta y "Pedir otra vez". La revisión de calidad
   encontró que un código de recuperar acertado sobrevivía; se arregló.
6. **Calidad**: pruebas de navegador en el repositorio (`npm run probar`),
   prueba de humo en el CI, axe sobre React, carga por partes y una revisión
   completa de `ux-accesibilidad` con sus arreglos.
7. **El cambio**: las reglas de `js/` pasaron a `src/servicios/`, `react/`
   subió a la raíz, se borraron `js/`, `herramientas/` y `netlify.toml`, y
   Pages pasó a publicar `dist/`.

Por el camino el usuario decidió también: una vista por cada opción del menú
(menos desplazamiento), fondos de trigo, maíz y pan, la regla 60-30-10,
Motion en vistas, canasta y cuenta, el mapa en contacto, sin vista previa en
Netlify, y que sin JavaScript no se enlace a WhatsApp.

Pendiente de la fase 7:
- [x] Etiqueta `sitio-presentado`.
- [x] React sin imports de `js/` (`7751f09`) y `revisar()` en
      `reglasCatalogo.js` (`21b4df5`).
- [x] `react/` a la raíz y fuera lo viejo (`00ecc9c`, `79d08f7`).
- [x] CI que publica `dist/` (`e77dd80`).
- [x] Herramientas y skills (`e77dd80`); agentes al día.
- [x] Plan reescrito; `README.md` al día.
- [x] Verificado (22 pruebas y axe en 46 estados), fusionado en `main` el
      21 de octubre de 2026 (`666f743`) y Pages en verde.
