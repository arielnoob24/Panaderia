# Plan del sitio: El Tradicional

> Material de referencia del proyecto, no texto para entregar en un informe.
> Es la fuente de verdad de **cómo debe funcionar** el sitio. Los agentes de
> `.claude/agents/` lo leen antes de trabajar; si el código y este plan no
> coinciden, o se arregla el código o se actualiza el plan en el mismo commit.
>
> Cómo se trabaja (conversar → plan → agentes → skills → aplicar) está en
> `.claude/CLAUDE.md`. Las secciones 1 a 14 describen el sitio **como está
> hoy** (React); la 15 es la historia corta de cómo se llegó aquí.

Última actualización: 21 de octubre de 2026.

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
- Teléfono, WhatsApp e Instagram son **de ejemplo** (el pie lo avisa).

## 2. Reglas que no se rompen

| Regla | Por qué |
|---|---|
| Sitio **estático**: GitHub Pages sirve lo que construye Vite (`dist/`); sin servidor propio | GitHub Pages solo sirve archivos |
| **Solo servicios gratis**, nada que pida tarjeta (ni SMS, ni WhatsApp Business, ni Firebase Blaze) | Proyecto de clase sin presupuesto |
| Dependencias **con versión exacta** (sin `^`), solo las que diga este plan | Que un `npm ci` de hoy y uno de dentro de un mes construyan lo mismo |
| Se abre **por HTTP** (Pages, `npm run dev`, `npm run preview`); con doble clic no | Decidido al elegir React: un sitio publicado se abre por HTTP |
| El CI rechaza las palabras de cafetería, café y cóctel, **también en comentarios** | Es una panadería; lo revisa `ci-cd.yml` |
| `main` es lo que sirve GitHub Pages; se trabaja en la rama **`mejoras`**, donde se commitea y pushea sin preguntar; a `main` solo cuando el usuario lo pide | Lo publicado no cambia hasta fusionar |
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
  catalogo/             Catalogo, VistaCabeza, FichaProducto, MasPedidos, Hero, categorias.js
  comun/                cabecera, menu Tienda, pie, avisos, globo, foco, vistas.js (rutas),
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
| Logo / Inicio | `#/` | Portada, la franja y "Los más pedidos" en carrusel, con un enlace a toda la tienda |
| Nosotros | `#/nosotros` | La historia y los principios (una columna bajo 420 px); la galería cuando haya fotos |
| Tienda | `#/tienda-catalogo`, `#/tienda-<categoría>` | El catálogo; cambiar de categoría no vuelve a montar la vista |
| Contáctanos | `#/contacto` | Horario con el día de hoy marcado, abierto/cerrado, dirección, mapa y contacto |
| — | `#/confirmar`, `#/comprobante` | El pedido (sección 6) |
| Silueta / iniciales | `#/cuenta/*` | La cuenta (sección 7) |

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
- **Pie corto** en todas las vistas: marca, abierto/cerrado, WhatsApp,
  Instagram, la nota de que son de ejemplo, "Tu pedido se guardó…" y el ©. En
  `#/contacto`, "Horario y cómo llegar" lleva `aria-current="page"`.
- **Mapa** en `#/contacto`: `iframe` de Google Maps sin clave
  (`https://maps.google.com/maps?q=-1.004033,-77.812690&z=17&output=embed`),
  con `title` y `loading="lazy"`, y "Ver en el mapa" debajo.

### Datos (`data/productos.json`)

Hoy: **17 productos** en 3 categorías (`panes` 6, `dulces` 5,
`bebidas-frias` 6), 8 marcados como destacados.

| Campo | Obligatorio | Regla |
|---|---|---|
| `nombre` | sí | Lo que se ve en la ficha |
| `categoria` | sí | Tiene que estar en `CATEGORIAS` (`src/catalogo/categorias.js`, la lista del menú Tienda), y al revés |
| `precio` | sí | Número en dólares; con `tamanos`, igual al del primer tamaño |
| `foto` | sí | Raíz sin ancho ni extensión; existen `-420.jpg` (420×315) y `-840.jpg` (840×630) |
| `alt` | sí | Describe lo que se ve, no repite el nombre |
| `disponible` | no | `false` = agotado ("Vuelve mañana") |
| `etiqueta` | no | `{ color: green \| yellow, texto }`, sello redondo de 2–3 palabras |
| `tamanos` | no | `[{ valor, precio }]`; cada tamaño es una línea distinta en la canasta |
| `destacado` | no | `true` = entra en "Los más pedidos"; hacen falta al menos 4 disponibles |

`revisar()` de `src/servicios/reglasCatalogo.js` valida cada producto; el
sitio y el CI usan la misma función. Para añadir uno, la skill
`/nuevo-producto`.

### Portada: "Los más pedidos"

Carrusel con `scroll-snap` nativo y botones Anterior/Siguiente que se
desactivan en los extremos; se arrastra con el dedo, **no avanza solo**, y
cada ficha se alcanza con Tab.

- En **todos los anchos** las flechas van en el pie del carrusel, junto a la
  barra de avance (como ya estaba en el teléfono): nunca encima de las fotos.
- Sin barra de desplazamiento del navegador (la barra de avance la sustituye).
- El borde por donde siguen las fichas se desvanece (máscara), para que se
  note que hay más y no parezca un corte.
- Los botones desplazan una ficha con movimiento de escena (`--dur-slow`).

### Vista de la tienda

- Se entra por "Ver el menú", la palabra Tienda (catálogo entero) o una de sus
  categorías (con "Filtrar por" ya puesto). Entrar con un enlace limpia orden,
  "Mostrar" y búsqueda; Atrás y Adelante no.
- Controles: Filtrar por (chips: Todas + 3 categorías), buscador (sin tildes ni
  mayúsculas), Ordenar por, Mostrar (solo disponibles).
- "Mostrando X de Y productos" en una sola región `aria-live`
  (`.catalog-status`): mientras se escribe en el buscador calla y habla una
  vez, 400 ms después de la última tecla; sin resultados junta la cuenta y el
  porqué. El orden se anuncia aparte ("Ordenado por precio, de menor a
  mayor").
- El `h1` dice la categoría ("Dulces y pasteles", o "Todo el catálogo"); la
  pestaña también ("Dulces y pasteles · Catálogo | El Tradicional").
- Cada ficha: foto con `srcset`, categoría encima del nombre, sello, tamaños
  (radios), precio y control `− cantidad +` (máximo 100 por producto). Al
  agregar, la foto vuela a la canasta y se anuncia.
- La ficha (también en el carrusel): nombre en Georgia como en la canasta,
  sin hueco vacío entre el nombre y el precio, sellos con letra de al menos
  11 px. Con el puntero encima sube y la foto se acerca despacio (escena);
  al pulsar baja a `scale(.97)`.
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
  no tape el foco.
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
  `aria-current` en la vista en la que se está).
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
| Cookie `eltradicional-guardado` | Fecha del último guardado (1 mes, `SameSite=Lax`); el pie la enseña como "Tu pedido se guardó…", solo si hay algo en la canasta | Corta y caduca sola |

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
| **Autenticación y autorización con al menos 3 tablas** | Lo dijo el profesor. Hoy son 5: ROLES, PERMISOS, ROLES_PERMISOS, USUARIOS, VERIFICACIONES |
| **Normalizada (hasta 3FN)** | Valores atómicos (nombres y apellidos separados). Lo que se calcula no se guarda: va en una vista. El precio y el IVA del día en cada línea sí se guardan, porque cambian |
| **Tipos según el contexto ecuatoriano** | Dinero en dólares `NUMERIC(…,2)`. Fechas `TIMESTAMPTZ` con zona `America/Guayaquil`. Cédula `CHAR(10)` con módulo 10, RUC de 13 dígitos, celular `CHAR(10)` `09XXXXXXXX`. Provincias y cantones con su código del INEC; tipo de identificación, forma de pago y tarifa de IVA con su código del SRI. Número de factura `001-001-000000001`. Cada tipo con su `CHECK` |
| **Varias tablas, no 3 o 4** | El modelo cubre lo que hace el sitio (cuenta, catálogo, canasta, entrega, factura y pago) y lo que pide el "Contexto comercial" del profesor (JW Cóndor, dic. 2025): compras, inventario, producción, talento humano y contabilidad |
| **Documentos con estados** | Orden de compra, ajuste, orden de producción y rol de pagos: ABI → APR o ANU. Recepción: PEN → REC o CAN. Asiento: ABI (manual) o PEN (generado) → APR, ANU o ERR. El estado va en la cabecera y las líneas lo siguen (guardarlo en cada línea repetiría el dato). Aprobado o anulado, el documento y sus líneas ya no cambian |
| **Aprobar genera lo siguiente** | Orden de compra aprobada → recepción pendiente + asiento. Ajuste, producción y rol aprobados → asiento. Factura → asiento de venta; anularla → asiento contrario. Un asiento que no cuadra al aprobarlo queda en ERR |

- **48 tablas en 11 grupos**: autenticación y autorización (ROLES, PERMISOS,
  ROLES_PERMISOS, USUARIOS, VERIFICACIONES), ubicación (PROVINCIAS, CANTONES,
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
  - *Empleados y usuarios* no se enlazan: sería 1:1. El empleado se conecta
    por lo que hace (compra, recibe, produce, aprueba).
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
  - **Escena** (cambio de vista, entradas, carrusel, desplegar, la ficha al
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
  invierte**: sigue en `--horno` y gana una línea ámbar fina abajo para separarse.
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

## 11. Accesibilidad (objetivo: WCAG 2.2 AA)

- Todo con teclado; paneles que atrapan el foco, Esc y devolución del foco;
  `inert` detrás de los paneles; menú Tienda y ficha de la cuenta con
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
5. Push a `mejoras` y esperar a que `Validar y publicar sitio` salga en verde.
   Solo un push a `main` publica en Pages; se fusiona cuando el usuario lo
   pide.

El CI (`validate`, en cualquier rama): `npm ci`, build sin avisos, `revisar()`
de cada producto, categorías ↔ `CATEGORIAS`, fotos en los dos anchos y de la
portada, al menos 4 destacados, palabras prohibidas en `index.html`, `src/`,
`assets/css/` y `data/productos.json`, espacios al final de línea, y la
prueba `humo` en Chrome. `deploy` (solo `main`) construye y publica `dist/`.
`.claude/herramientas/axe.mjs` mide 46 estados del sitio.

## 13. Pendiente

### Contenido y confianza
- [ ] Teléfono, WhatsApp e Instagram reales, o quitarlos del JSON-LD y de los enlaces.
- [ ] Ingredientes y alérgenos por producto (confirmados por el negocio).
- [ ] Unidad del precio (pieza, funda, docena).
- [ ] "Horneando ahora mismo" se deduce del horario, no de la realidad.
- [ ] Galería del local en `#/nosotros` (`assets/img/local/`), cuando el
      usuario pase fotos reales; sin fotos no se enseña nada.

### Accesibilidad y UX
- [ ] `user-select: none`: los precios, el WhatsApp y los datos del
      comprobante (salvo el número) todavía no se pueden copiar.
- [ ] Decir antes de llenar la canasta que pagar pide cuenta, o permitir invitado.
- [ ] axe (menor): la barra de deshacer fuera de un punto de referencia (`region`).
- [ ] 60-30-10 medido con capturas en cada vista (se ajustó a ojo).
- [ ] Tras recargar, la tienda no recuerda el desplazamiento de las entradas
      de antes (Atrás entre categorías da arriba); se arreglaría con
      `sessionStorage`. No urge.
- [ ] El caso `reenviar-codigo` todavía espera a que crear acabe de salir y
      su comentario dice que está "apuntado para frontend"; ya no hace falta.
- [ ] Sección de contenidos de IHC en el agente de UX (cuando el usuario pase los temas).
- [ ] GitHub avisa de que `ubuntu-latest` pasa a Ubuntu 26.
- [ ] El punto que late en "Abierto/Cerrado" (`latido`, 2,4 s, infinito)
      sigue más de 5 s sin pausa (2.2.2, nivel A, a juicio: es un punto de
      10 px). Con menos movimiento se apaga.
- [ ] Sin probar en Firefox ni Safari (`mask-image`, `:has(:focus-visible)`
      del carrusel), ni `forced-colors` en la barra nueva, ni con NVDA.

### Aspecto y movimiento (revisión visual del 21 de octubre de 2026)
- [x] Barra siempre `--horno`, sin invertirse; línea ámbar sobre lo oscuro.
- [x] Hover bajo `.con-puntero`: en el portátil del usuario no se veía.
- [x] Ritmo del movimiento (sección 10) y `src/comun/movimiento.js`.
- [x] Fichas: nombre en Georgia, sin hueco, sellos legibles, `scale(.97)`.
- [x] Carrusel: flechas y barra de avance en el pie en todos los anchos, sin
      barra del navegador, borde desvanecido.
- [x] Sin recuadro ámbar en el `h1` al cambiar de vista.
- [ ] Carrusel: si a mitad del salto de 560 ms se mueve con el teclado o se
      tabula a una ficha, el salto no se cancela (`useFila.js`, escuchar
      también `keydown` y `focusin`).
- [ ] Decidir si el buscador y "Ordenar por" de la tienda se quedan con el
      borde corteza al pasar el ratón (salió al pasar el hover a
      `.con-puntero`).

### Base de datos
- [x] Modelo y script de creación en PostgreSQL (`bd/BD_EL_TRADICIONAL.sql`).
- [x] Compras, inventario por lotes, recetas, producción con FEFO/FIFO/LIFO/
      promedio, talento humano, nómina y contabilidad (48 tablas).
- [ ] Revisar el modelo con el profesor, sobre todo: el kardex como vista,
      el saldo del lote calculado y las débiles sobre otra débil.
- [ ] Confirmar las recetas con el panadero y la vida útil de cada material.
- [x] Base subida a Supabase (proyecto `ugscqizansixnsuzljtu`, 21 de octubre
      de 2026), con el conector MCP. Las 48 tablas tienen RLS sin políticas
      (por la API no entra nadie), las vistas usan `security_invoker` y las
      funciones fijan su `search_path`; está al final del script y
      `probar-bd` lo comprueba.
- [ ] Antes de conectar el sitio: escribir las políticas de RLS de lo que
      el sitio necesite (por ejemplo, leer el catálogo) y decidir cómo entra
      el usuario (Supabase Auth o la cuenta actual).
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
| `revision-visual` | Aspecto y movimiento: capturas en 1440/900/680/390 px, fichas, carrusel, barra, tipografía, 60-30-10, duraciones y curvas | No, solo informa | `frontend-design`, `emil-design-eng`, `review-animations`, `web-design-guidelines` (+ `.claude/herramientas/capturas.mjs`) |
| `calidad-publicacion` | Revisión de código y seguridad, `pruebas/`, CI, `package.json`, publicar | Sí, lo de publicar y las pruebas | `verificar-sitio`, `publicar`, `vercel-react-best-practices` |

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
