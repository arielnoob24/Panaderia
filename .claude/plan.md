# Plan del sitio: El Tradicional

> Material de referencia del proyecto, no texto para entregar en un informe.
> Es la fuente de verdad de **cómo debe funcionar** el sitio. Los agentes de
> `.claude/agents/` lo leen antes de trabajar; si el código y este plan no
> coinciden, o se arregla el código o se actualiza el plan en el mismo commit.
>
> Cómo se trabaja (conversar → plan → agentes → skills → aplicar) está en
> `.claude/CLAUDE.md`. Las secciones 1 a 13 describen el sitio **como está
> hoy**; la 15 es el siguiente paso.

Última actualización: 20 de octubre de 2026.

---

## 1. Qué es

Sitio de la panadería y pastelería **El Tradicional** (Tena, Ecuador):
catálogo, canasta, pedido con pago simulado, comprobante y cuenta de cliente.
Proyecto de la materia Desarrollo de Plataformas.

- Publicado en GitHub Pages: https://arielnoob24.github.io/Panaderia/
- Dirección: esquina de Eloy Alfaro y Gabriel Espinosa, Tena.
- Horario: lunes a viernes 08:00–20:00; sábado y domingo 09:00–21:00.
- Teléfono, WhatsApp e Instagram son **de ejemplo** (el pie lo avisa).

## 2. Reglas que no se rompen

| Regla | Por qué |
|---|---|
| Sitio **estático**, sin servidor ni base de datos en internet | GitHub Pages solo sirve archivos |
| **Solo servicios gratis**, nada que pida tarjeta (ni SMS, ni WhatsApp Business, ni Firebase Blaze) | Proyecto de clase sin presupuesto |
| **Sin dependencias** en el navegador: lo que está en el repo es lo que corre | Se abre igual por HTTP y con doble clic |
| Tiene que funcionar **con doble clic** (`file://`) además de por HTTP | La profe puede abrirlo así |
| El CI rechaza las palabras de cafetería, café y cóctel, **también en comentarios** | Es una panadería; lo revisa `ci-cd.yml` |
| `main` es lo que se presentó y lo que sirve GitHub Pages; las mejoras van en la rama **`mejoras`** y se commitean y pushean ahí sin preguntar | El proyecto ya se entregó: lo publicado no cambia hasta fusionar `mejoras` en `main` |
| Los informes de clase admiten **máximo 5% de texto de IA** | Pasarse cuesta la mitad de la nota; lo que escribe Claude es referencia |
| La base de datos (`bd/`) cumple las **reglas del modelo** de la sección 8 | Las pusieron el usuario y el profesor |

## 3. Cómo está repartido

```
index.html              la unica pagina; tiene que estar en la raiz para GitHub Pages
README.md               como verlo, tocarlo y publicarlo
bd/
  BD_EL_TRADICIONAL.sql la base de datos en PostgreSQL (todavia sin conectar)
assets/
  css/styles.css        todos los estilos
  img/                  logo, mascota, iconos y la foto de portada
    productos/          las fotos del catalogo, cada una en 420 y 840 px
data/
  productos.json        el catalogo: nombre, precio, foto, categoria y tamanos
js/
  app.js                el arranque: trae los datos y enciende lo demas
  sin-servidor.js       todo junto, con el catalogo dentro (generado; es lo
                        que corre al abrir index.html con doble clic)
  comun/                lo que usan todas las zonas
    state.js            lo que comparten los modulos, y el puente entre ellos
    storage.js          los cuatro sitios donde se guarda: local, session, IDB y cookie
    ui.js               barra, foco, cuadritos de ayuda, animaciones y horario
    horario.js          cuentas del horario: feriados con Pascua y textos del
                        pie, de la nota del horno y de la hora de retiro
                        (sin DOM; lo usa tambien react/)
    mail.js             envio de correo por EmailJS
  catalogo/
    repo.js             lee y revisa data/productos.json
    view.js             pinta las fichas y manda el catalogo (orden, filtro, vistas)
  pedido/
    cart.js             la canasta: panel, lineas y control de cantidad
    guardado.js         que se acepta del pedido guardado y como se escribe
                        (sin DOM; lo usa tambien react/)
    cobro.js            reglas del pago: factura, tarjeta, numero ET-XXXX,
                        recibo, correo (sin DOM; lo usa tambien react/)
    checkout.js         pago simulado y comprobante
  cuenta/
    account.js          crear cuenta, verificar el correo y entrar
    guardada.js         que se acepta de la cuenta guardada (sin DOM; lo usa
                        tambien react/)
herramientas/
  empaquetar.mjs        genera js/sin-servidor.js
react/                  la version en React mientras se migra (seccion 15)
.gitignore              react/node_modules/ y react/dist/
.github/workflows/      el CI: valida y publica
.claude/                agentes, skills, herramientas de Claude Code y plan.md
                        (como debe funcionar todo; lo leen los agentes)
```

### Cómo se llaman los módulos

```
index.html
  └── app.js  arranque
        ├── catalogo/repo.js     lee y valida data/productos.json
        ├── catalogo/view.js     fichas, mostrador, vista de catálogo, filtros, rutas
        ├── pedido/cart.js       canasta, pantalla de confirmar, control de cantidad
        │     ├── pedido/guardado.js  formato del pedido en localStorage (sin DOM)
        │     └── pedido/checkout.js  pago simulado, factura, comprobante
        │           └── pedido/cobro.js  reglas del pago y del recibo (sin DOM)
        ├── cuenta/account.js    crear cuenta, verificar correo, entrar, datos, pedidos
        │     └── cuenta/guardada.js  formato de la cuenta en localStorage (sin DOM)
        └── comun/ui.js          avisos aria-live, foco, menús, globo de ayuda, horario
  Todos usan comun/: state.js (datos compartidos y "puente"), storage.js, mail.js
  Cada carpeta importa las otras con rutas relativas (`../comun/state.js`).
```

- **El puente** (`state.js`): los módulos que se llaman en las dos direcciones
  cuelgan sus funciones en `puente` en vez de importarse mutuamente.
- **Sin DOM, para los dos sitios**: `horario.js`, `guardado.js`, `cobro.js` y
  `guardada.js` no tocan la página ni el almacenamiento; reciben datos y
  devuelven resultados. React los importa con `@raiz`, así que las reglas se
  escriben una sola vez. Lo que se mete como HTML pasa por `escapar()`
  (`state.js`).
- **Doble clic**: el script del final de `index.html` carga `js/app.js` como
  módulo si es HTTP, o `js/sin-servidor.js` (todo junto, con el catálogo
  dentro) si es `file:`. En `file://` no hay cookies: el pie no dice cuándo se
  guardó, pero el pedido se guarda igual.
- **Orden de arranque** (`app.js`): cargar productos → pintar catálogo →
  controles de ficha → vigilar imágenes → canasta → cuenta → marca de guardado
  → horario (cada minuto). Si el catálogo falla, se avisa y la canasta y la
  cuenta siguen funcionando.

## 4. El catálogo

### Datos (`data/productos.json`)

Hoy: **17 productos** en 3 categorías (`panes` 6, `dulces` 5,
`bebidas-frias` 6), 8 marcados como destacados.

| Campo | Obligatorio | Regla |
|---|---|---|
| `nombre` | sí | Lo que se ve en la ficha |
| `categoria` | sí | Tiene que tener su `data-filtro` en el menú Tienda, y al revés |
| `precio` | sí | Número en dólares; con `tamanos`, igual al del primer tamaño |
| `foto` | sí | Raíz sin ancho ni extensión; existen `-420.jpg` (420×315) y `-840.jpg` (840×630) |
| `alt` | sí | Describe lo que se ve, no repite el nombre |
| `disponible` | no | `false` = agotado ("Vuelve mañana") |
| `etiqueta` | no | `{ color: green \| yellow, texto }`, sello redondo de 2–3 palabras |
| `tamanos` | no | `[{ valor, precio }]`; cada tamaño es una línea distinta en la canasta |
| `destacado` | no | `true` = entra en "Los más pedidos"; hacen falta al menos 4 disponibles |

`revisar()` de `js/catalogo/repo.js` valida cada producto; el sitio y el CI usan la
misma función. Tras tocar el JSON: `node herramientas/empaquetar.mjs`.

### Portada: "Los más pedidos"

- Fila horizontal con los destacados disponibles. Flechas, barra de avance y
  botón de pausa; la flecha de adelante, en el último, vuelve al primero.
- Avanza sola cada 4,2 s. Se para con el puntero, el dedo o el foco encima,
  mientras se agrega algo, con la pestaña oculta, con `prefers-reduced-motion`
  o con pausa.
- En el teléfono: flechas debajo, caben dos fichas, el botón de agregar va
  sobre la foto y la ficha no cambia de alto al agregar.

### Vista de catálogo

- Se entra por "Ver el menú", la palabra Tienda (catálogo entero) o una de sus
  categorías (catálogo con "Filtrar por" ya puesto).
- Rutas: `#tienda-catalogo`, `#tienda-panes`, `#tienda-dulces`,
  `#tienda-bebidas-frias`. Entrar usa `pushState`; cambiar el filtro a mano usa
  `replaceState`. El **Atrás** del navegador vuelve a la vista anterior.
- Controles: Filtrar por (chips: Todas + 3 categorías), buscador (sin tildes ni
  mayúsculas), Ordenar por, Mostrar (solo disponibles). Ordenar cambia la
  propiedad CSS `order`, no mueve el HTML.
- "Mostrando X de Y productos", anunciado por `aria-live` ("en esta categoría"
  con una puesta, "en todo el catálogo" con Todas). Cambiar el orden no cambia
  ese aviso: se anuncia el orden ("Ordenado por precio, de menor a mayor").
- El título de la vista es un `h1` y dice la categoría de "Filtrar por"
  ("Dulces y pasteles", o "Todo el catálogo" con Todas); la pestaña también
  ("Dulces y pasteles · Catálogo | El Tradicional").
- Cada ficha: foto con `srcset`, categoría encima del nombre, sello, tamaños
  (radios), precio y control `− cantidad +` (máximo 100 por producto).
- Al agregar, la foto vuela a la canasta y se anuncia en la región de avisos.

## 5. La canasta

- Botón con icono y contador en la cabecera (en el teléfono flota abajo). Sin
  JavaScript es el enlace a WhatsApp.
- Panel lateral `aside role="dialog"`: atrapa el foco, se cierra con Esc,
  tocando fuera o con Atrás/Adelante del navegador, y devuelve el foco al
  botón (si quien lo abrió se fue con la vista, al botón de la canasta).
- Cada línea: foto, −, cantidad, +, y una X que quita el producto entero. Con
  una unidad, el − pasa a basurero y pregunta "¿Lo quitamos?", y la X no sale
  (haría lo mismo). El + y el − avisan "3 de Pan redondo. N productos en la
  canasta" y el foco se queda en el botón pulsado.
- Tope de **100 por producto**: en el tope, el + de la ficha y el de la línea
  siguen enfocables con `aria-disabled` y, al pulsarlos, avisan "El máximo es
  100 por producto. Ya hay 100 de … en la canasta."
- Campo de cantidad de la ficha: Enter asienta lo escrito y Esc lo descarta,
  los dos sin sacar el foco del campo (con 0 el producto sale y el foco pasa
  al +).
- **Deshacer** durante 12 s al quitar o al vaciar ("¿Quitamos todo lo que hay
  en la canasta?"). El reloj se para mientras la barra tiene el foco o el
  puntero encima, y sigue con lo que le quedaba al soltarla.
- "Ir a pagar" exige una **cuenta con el correo verificado**; si no la hay,
  sube la hoja "Entra a tu cuenta para pagar", modal: mientras está arriba la
  barra de deshacer queda `inert` y el Tab da la vuelta solo dentro de ella.
- Vacía, "Ver la vitrina" lleva al catálogo entero (`#tienda-catalogo`, como
  "Ver el menú") con el foco en su título.

## 6. Confirmar el pedido y pagar

- Es otra vista dentro de `<main>`: `#confirmar` y luego `#comprobante`
  (este con `replaceState`, para que Atrás no vuelva al pago ya hecho). El
  título de la vista es su `h1` ("Confirmar el pedido", "Pedido confirmado").
- Izquierda: retiro o domicilio (envío fijo **$1.50**), dirección, cómo paga
  (efectivo o tarjeta) y factura (a mi nombre o a otra persona). Sin mapa.
- Derecha, pegada al desplazar: lo que lleva, subtotal/envío/total, a qué
  correo llega el comprobante y "Confirmar".
- Validación: dirección → factura (cédula de 10 o RUC de 13, provincia 01–24)
  → tarjeta (Luhn, MM/AA no vencida, CVV de 3, titular). El foco va al primer
  error. Los errores salen al dejar el campo o al intentar pagar, con
  `aria-invalid` y `aria-describedby` (la dirección también). Las reglas y
  los textos viven en `js/pedido/cobro.js`.
- Al aprobar (simula 1,5 s): número `ET-XXXX` sin letras confundibles,
  comprobante, correo, guardado en IndexedDB, se vacía la canasta guardada y se
  limpian tarjeta y factura.
- **El cobro no existe**: la tarjeta no se guarda ni se envía.

## 7. La cuenta

- Botón en la cabecera: fuera de sesión, silueta con "Iniciar sesión /
  Registrarse"; dentro, iniciales y ficha con "Editar mis datos" y "Ver mis
  pedidos (N)".
- Pasos del panel: `crear`, `verificar`, `entrar`, `sesion`, `editar`,
  `pedidos`.
- Crear: nombre con apellido, correo (el error dice exactamente qué falta),
  teléfono de 9 cifras que empieza por 9 (+593 delante), contraseña con 4
  requisitos visibles mientras se escribe, y repetirla. Botón "Mostrar" en
  cada contraseña.
- Verificar: código de 6 cifras por correo; 45 s entre envíos. Si EmailJS no
  está o falla, el código se enseña en pantalla en un recuadro que imita el
  correo.
- Entrar: correo (se revisa al salir del campo) y contraseña, que se compara
  por su huella **PBKDF2 con sal**. Errores distintos para "no hay cuenta" y
  "contraseña incorrecta" (aceptable porque la única cuenta es la de ese
  navegador).
- Editar: nombre, teléfono y dirección con las mismas reglas; el correo no se
  edita. Cerrar sesión no borra la cuenta.
- Métodos de pago: forma de pago preferida (Efectivo o Tarjeta), con la que
  empieza el pago al confirmar; se puede cambiar ahí. No se guardan tarjetas.
  En React es un campo de Mis datos (sección 15, fase 5).
- Pedidos: todo el historial de IndexedDB, más nuevo arriba, cada uno en un
  `<details>`.
- Enter en un campo pasa al siguiente; en el último, hace la acción.

## 8. Dónde se guarda cada cosa (`js/comun/storage.js`)

| Dónde | Qué | Por qué |
|---|---|---|
| `localStorage` | Pedido a medias, entrega, factura y la cuenta. Se escribe solo cuando cambia algo, no al cargar (tampoco la dirección que la cuenta rellena al arrancar); al aprobar un pedido se borra | Tiene que seguir mañana |
| `sessionStorage` | Orden y "Mostrar" del catálogo | Dura lo que la pestaña |
| IndexedDB `eltradicional/pedidos` | Pedidos pagados, clave = número | Registros que se acumulan |
| Cookie `eltradicional-guardado` | Fecha del último guardado (1 mes, `SameSite=Lax`); el pie la enseña como "Tu pedido se guardó…", y solo si hay algo en la canasta | Corta y caduca sola |

Todo va en `try/catch`: en ventana privada no puede tumbar la página.

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

- **51 tablas en 11 grupos**: autenticación y autorización (ROLES, PERMISOS,
  ROLES_PERMISOS, USUARIOS, VERIFICACIONES), ubicación (PROVINCIAS, CANTONES,
  DIRECCIONES), catálogo (CATEGORIAS, ETIQUETAS, TARIFAS_IVA, PRODUCTOS,
  TAMANOS, PRODUCTOS_TAMANOS, ALERGENOS, PRODUCTOS_ALERGENOS), pedidos
  (TIPOS_ENTREGA, ESTADOS_PEDIDO, PEDIDOS, DETALLES_PEDIDO), facturación y
  pagos (TIPOS_IDENTIFICACION, CLIENTES, FACTURAS, METODOS_PAGO, PAGOS),
  talento humano (DEPARTAMENTOS, CARGOS, EMPLEADOS, EMPLEADOS_CARGOS,
  CARGAS_FAMILIARES), materiales y recetas (UNIDADES_MEDIDA, METODOS_COSTEO,
  TIPOS_MATERIAL, MATERIALES, RECETAS), compras (PROVEEDORES,
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
  CONSUMIDOR FINAL, formas de pago con su código del SRI, departamentos y
  cargos, unidades, métodos de costeo, 29 materiales, la receta de cada
  producto y tamaño, el plan de cuentas y los conceptos de nómina. Las
  cantidades de las recetas, la vida útil y los mínimos son de ejemplo.

## 9. Correo (`js/comun/mail.js`)

EmailJS (gratis): una sola plantilla para el código y el comprobante. Las
claves son públicas por diseño; las protege la lista de dominios del panel de
EmailJS. `enviarCorreo()` nunca lanza: si falla, el pedido sigue valiendo.

## 10. Aspecto y adaptación

- CSS con variables en `:root` (colores `--masa`, `--horno`, `--ambar`,
  `--corteza`, `--papel`; sombras, radios, duraciones y curvas).
- Contenido hasta 1440 px; la barra de arriba va de borde a borde, se pega al
  bajar 40 px y se invierte sobre secciones oscuras.
- Cortes en 900, 680 y 420 px. El hover solo con `(hover: hover) and (pointer: fine)`,
  pero en JS **no fiarse de esa media query**: el portátil del usuario es táctil
  y la da falsa; usar `pointerType`.
- Clases de estado puestas por JS: `is-open`, `is-loaded`, `is-loading`,
  `is-visible`, `is-fila`, `is-lleno`, `is-mal`, `is-dentro`.
- Cache-buster `?v=palabra-AAAAMMDD` en la hoja de estilos y en los dos
  scripts; se sube en cada cambio.

## 11. Accesibilidad (objetivo: WCAG 2.2 AA)

- Todo con teclado; paneles que atrapan el foco, Esc y devolución del foco;
  `inert` detrás de los paneles; menú Tienda con flechas; enlace de salto.
- Foco visible con anillo propio y `:focus-visible`.
- ARIA solo donde hace falta: `role="dialog"` + `aria-modal`, `aria-expanded`,
  `aria-controls`, `aria-live="polite"`, `aria-invalid` + `aria-describedby`.
- Contraste medido (texto 12,4:1; secundario 6,8:1; pie 11,1:1 y 8,7:1).
- `prefers-reduced-motion` apaga entradas, velos y desplazamiento suave.
- Objetivos táctiles de al menos 24 px, o con espacio libre alrededor como
  permite WCAG 2.5.8 (los tamaños del teléfono miden 22,7 px y pasan así);
  los botones de ficha miden 32 px en el teléfono y 34 px en escritorio.
- Precios con **punto decimal** (`$1.25`), como se escriben los dólares en
  Ecuador; lo hace `dinero()`.

## 12. Calidad y publicación

1. Cambio en `js/` o en el catálogo → `node herramientas/empaquetar.mjs`.
2. Subir los `?v=` que toque.
3. `node .claude/skills/verificar-sitio/verificar.mjs` (Edge, HTTP, móvil y
   doble clic). `node --check` **no basta**.
4. Commit solo de los archivos del cambio, mensaje en español.
5. `bash .claude/skills/publicar/ci-local.sh`.
6. Push a la rama en la que se trabaja (`mejoras`) y esperar a que `Validar y publicar sitio` salga en verde. Solo un push a `main` publica en Pages; para llevar `mejoras` al sitio se fusiona en `main` cuando el usuario lo pida.

El CI comprueba: archivos principales, sintaxis de los módulos,
`sin-servidor.js` al día, imports con la mayúscula exacta, el catálogo con
`revisar()`, categorías ↔ menú Tienda, fotos en los dos anchos, portada,
al menos 4 destacados, palabras prohibidas y espacios al final de línea.
Además, en un paso aparte, que la versión en React de `react/` instala y
construye (sección 15).

## 13. Pendiente

### Contenido y confianza
- [ ] Teléfono, WhatsApp e Instagram reales, o quitarlos del JSON-LD y de los enlaces.
- [ ] Ingredientes y alérgenos por producto (confirmados por el negocio).
- [ ] Unidad del precio (pieza, funda, docena).
- [ ] "Horneando ahora mismo" se deduce del horario, no de la realidad.

### Accesibilidad y UX
- [ ] Avisar que abren otra pestaña: botón flotante y "Pedir" de reserva sin JS.
- [x] "Ver en el mapa" mide 131×18 px, pero cumple WCAG 2.5.8 por el espacio libre alrededor.
- [ ] `user-select: none`: la dirección y el horario ya se copian; los precios y el WhatsApp todavía no.
- [ ] Probar la fila quieta por defecto en vez de que avance sola.
- [x] El menú del teléfono lleva el foco a "Nosotros" al abrirse (`visibility 0s`
      al abrir, como el submenú de Tienda).
- [x] Contraste de la fila de hoy del horario y `h1` en la vista de catálogo.
- [x] La vista de confirmar tiene `h1` (`.checkout-titulo`), en los dos sitios;
      sus `h3` pasaron a `h2` para no saltarse un nivel.
- [ ] Decir antes de llenar la canasta que pagar pide cuenta, o permitir invitado.
- [ ] axe (menores, en los dos sitios): `aside` con `role="dialog"` en la
      canasta (`aria-allowed-role`; pasar a `div`) y la barra de deshacer fuera
      de un punto de referencia (`region`).
- [ ] El panel de la cuenta (`.cuenta-panel.is-open`) tiene la misma
      transición de `visibility` que tenía la canasta: comprobar si el foco
      entra al abrirlo. Solo en el sitio actual: en React la cuenta son
      vistas, sin panel (fase 5).
- [x] `cart.js` metía el nombre de cada línea (que viene de `localStorage`) con
      `innerHTML` sin escapar, y el comprobante también. Ahora pasa por
      `escapar()`, que vive en `state.js` (antes solo en `view.js`), y el
      comprobante usa `textContent`. React no tenía el problema.
- [ ] Sección de contenidos de IHC en el agente de UX (cuando el usuario pase los temas).

### Base de datos
- [x] Modelo y script de creación en PostgreSQL (`bd/BD_EL_TRADICIONAL.sql`).
- [x] Compras, inventario por lotes, recetas, producción con FEFO/FIFO/LIFO/
      promedio, talento humano, nómina y contabilidad (51 tablas).
- [ ] Revisar el modelo con el profesor, sobre todo: el kardex como vista,
      el saldo del lote calculado y las débiles sobre otra débil.
- [ ] Confirmar las recetas con el panadero y la vida útil de cada material.
- [ ] Subir el script a Supabase (solo el paso 2). El conector MCP ya está
      agregado (proyecto `ugscqizansixnsuzljtu`); falta iniciar sesión con
      `/mcp` después de reiniciar Claude Code.
- [ ] Antes de conectar el sitio: RLS en todas las tablas de `public`.
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
| `frontend` | `index.html`, `assets/css/styles.css`, `js/catalogo/view.js`, `js/comun/ui.js`, maquetación, responsive, animaciones | Sí | `verificar-sitio`, `wcag-audit-patterns`, `componente-react`, `vercel-react-best-practices`, `vercel-composition-patterns` |
| `logica-datos` | `js/comun/` (state, storage, mail), `js/catalogo/repo.js`, `js/pedido/`, `js/cuenta/`, el catálogo | Sí | `verificar-sitio`, `nielsen-usability-heuristics`, `componente-react`, `vercel-react-best-practices`, `vercel-composition-patterns` (+ sigue `nuevo-producto`) |
| `base-datos` | La base de datos (`bd/`) y su prueba (`.claude/skills/probar-bd/probar.mjs`) | Sí | `probar-bd`, `supabase-postgres-best-practices` |
| `ux-accesibilidad` | WCAG 2.2, heurísticas de Nielsen, IHC, recorridos de usuario | No, solo informa | `wcag-audit-patterns`, `nielsen-usability-heuristics` (+ `.claude/herramientas/axe.mjs`) |
| `calidad-publicacion` | Revisión de código y seguridad, CI, empaquetar, subir a la rama | Solo lo de publicar | `verificar-sitio`, `publicar`, `vercel-react-best-practices` |

Skills en `.claude/skills/`:

| Skill | Origen | Quién la usa |
|---|---|---|
| `verificar-sitio` | propia | `frontend`, `logica-datos`, `calidad-publicacion` |
| `publicar` | propia | `calidad-publicacion` |
| `nuevo-producto` | propia, la invocas tú con `/nuevo-producto` | `logica-datos` sigue sus pasos |
| `probar-bd` | propia: corre `bd/` en PGlite y comprueba las reglas del modelo, el catálogo y los inserts (`probar.mjs` al lado) | `base-datos` |
| `notas-para-explicar` | propia, la invocas tú con `/notas-para-explicar` | — |
| `wcag-audit-patterns` | skills.sh, `wshobson/agents` | `ux-accesibilidad`, `frontend` |
| `nielsen-usability-heuristics` | skills.sh, `dembrandt/dembrandt-skills` | `ux-accesibilidad`, `logica-datos` |
| `componente-react` | propia: convenciones de `react/` | `frontend`, `logica-datos` |
| `vercel-react-best-practices` | skills.sh, `vercel-labs/agent-skills` (copiada a mano del commit `063bee9`) | `frontend`, `logica-datos`, `calidad-publicacion` |
| `vercel-composition-patterns` | skills.sh, `vercel-labs/agent-skills` (copiada a mano del commit `063bee9`) | `frontend`, `logica-datos` |
| `frontend-design` | skills.sh, `anthropics/skills` (copiada a mano del commit `dbd4588`) | `frontend` |
| `supabase-postgres-best-practices` | skills.sh, `supabase/agent-skills` (con el CLI; leída entera el 20 de octubre de 2026). Choca con las reglas del modelo en PK, `text` y nombres: mandan las del plan | `base-datos` |

Las instaladas con el CLI quedan en `skills-lock.json` y `npx skills update -p`
las actualiza. Las dos de Vercel se copiaron a mano porque el CLI se colgaba con
ese repositorio, y `frontend-design` igual: para actualizarlas, volver a copiarlas. Ojo: `npx skills use` **no instala**, solo genera un prompt de un
uso; para instalar es `npx skills add <repo> --skill <nombre> -a claude-code --copy`.

## 15. Migración a React (decidida, fase 5 hecha; sigue la 6)

El 19 de octubre de 2026 el usuario eligió **React** para la siguiente versión.
Se hace en la rama `mejoras`; `main` sigue con el sitio presentado hasta que
el usuario pida fusionar. Mientras dure, las secciones 1 a 13 siguen siendo la
referencia de **qué** tiene que hacer el sitio: la versión en React tiene que
hacer lo mismo (mismas vistas, rutas, reglas, guardado y accesibilidad) antes
de reemplazar a la de ahora.

### Decisiones (confirmadas el 19 de octubre de 2026)

El sitio se va a publicar de verdad: se elige lo mejor para un sitio real, no
lo que pida la clase.

| Tema | Decisión | Por qué |
|---|---|---|
| Herramienta | **Vite** + React, en **JavaScript** (JSX), sin TypeScript por ahora | Vite es el arranque estándar de React; TypeScript se puede añadir después, cuando React ya se domine |
| Dónde | Carpeta `react/` con su propio `package.json` mientras se migra; en la fase 7 pasa a la raíz y se borra lo viejo | El sitio actual sigue funcionando y validándose durante la migración |
| Fotos y catálogo | `react/` usa `data/productos.json` y `assets/img/` de la raíz **sin copiarlos** (lo resuelve `vite.config.js`); `revisar()` se reutiliza | Una sola fuente de verdad; el CI ya la valida |
| Estado | `Context` + `useReducer` para pedido, entrega y sesión; sin Redux | El estado es pequeño; reemplaza a `state.js`, al `puente` y a los `pintar()` a mano |
| Rutas | **React Router** con `HashRouter`: las mismas `#tienda-*`, `#confirmar`, `#comprobante`, que `HashRouter` escribe con barra (`#/tienda-panes`); las de antes, sin barra, siguen entrando | Es lo estándar; con `#` GitHub Pages no necesita el truco del 404 |
| Estilos | Se conserva `styles.css` y sus clases; nada de Tailwind ni Bootstrap | Es la identidad del sitio |
| Guardado y correo | La lógica de `storage.js` y `mail.js` se conserva, llamada desde hooks | Ya funcionan y no dependen de la interfaz |
| **Doble clic** | **Se deja.** La versión en React solo se sirve por HTTP; `js/sin-servidor.js` y `herramientas/empaquetar.mjs` desaparecen en la fase 7 | Un sitio publicado se abre por HTTP. Meter todo en un solo archivo quita la caché por archivo y hace la primera carga más pesada |
| Caché | Vite pone una huella en el nombre de cada archivo (`index-a1b2c3.js`): **se acaba el `?v=` a mano** | Lo hace solo y no se olvida |
| Publicar | El CI hace `npm ci && npm run build` en `react/` y valida; en la fase 7, publica `dist/` | `node_modules` nunca se publica |

Mientras dure la migración, las reglas de la sección 2 sobre doble clic y
"sin dependencias" siguen valiendo **para el sitio actual**, no para `react/`.

### Fases

1. **Andamiaje**: Vite + React en `react/`, `styles.css` importado, el
   catálogo cargado y una ficha pintada.
2. **Catálogo y página**: la página entera menos la canasta y la cuenta
   (cabecera con menú Tienda y menú del teléfono, portada, franja, historia,
   pie con horario y estado abierto/cerrado, enlaces de sección), las fichas,
   "Los más pedidos", la vista de catálogo, filtros, orden, buscador, rutas
   `#tienda-*`, globo de ayuda, avisos `aria-live` y animaciones de entrada.
   Las fichas llevan el botón de agregar, pero sin efecto hasta la fase 3.
3. **Canasta**: botón de la canasta con contador en la cabecera (y flotante
   en el teléfono), panel lateral, control de cantidad de las fichas (con
   tamaños como líneas distintas), la foto que vuela a la canasta, quitar con
   pregunta, la X de cada línea, deshacer 12 s, vaciar, y guardado en
   `localStorage` con la marca de la cookie y "Tu pedido se guardó…" en el
   pie. Reglas:
   - **Mismo formato y mismas claves de `localStorage` y cookie** que el sitio
     actual, para que un pedido guardado siga ahí cuando React lo reemplace.
   - "Ir a pagar" ya existe, pero como en React todavía no hay cuenta (fase 5)
     ni pedido (fase 4), enseña el aviso de "Crear cuenta o entrar" del sitio
     actual con el botón sin efecto, y un comentario que lo diga.
   - El reductor del pedido (`agregar`, `cambiar`, `quitar`, `vaciar`,
     `reponer`) es puro y vive en `src/estado/`; guardar es un efecto aparte.
4. **Pedido y pago**: `#confirmar`, factura, tarjeta, comprobante e IndexedDB,
   con todo lo de la sección 6. Reglas:
   - **Mismas claves y formatos** de `localStorage` (entrega, factura) e
     IndexedDB (`eltradicional/pedidos`) que el sitio actual; la lógica de
     validar (Luhn, MM/AA, cédula/RUC, provincia 01–24), el número `ET-XXXX` y
     el correo se importan de `js/` o se mueven a `src/servicios/`, no se
     reescriben de memoria.
   - La cuenta llega en la fase 5, pero **la de este navegador ya existe** en
     `localStorage` si se creó en el sitio actual. En esta fase React solo la
     **lee** (un `SesionProvider` de solo lectura en `src/estado/`): con
     sesión abierta y correo verificado, "Ir a pagar" lleva a `#/confirmar`;
     si no, sale el aviso de "Crear cuenta o entrar" como ahora. Entrar a
     `#/confirmar` sin cuenta o con la canasta vacía vuelve a la portada.
   - `#/comprobante` con `replace`, para que Atrás no vuelva al pago hecho.
   - La pantalla de confirmar lleva su `h1` (en el sitio actual también).
   - Al terminar, React ya guarda la entrega y la factura que son suyas: deja
     de reescribir sin tocar las que encontraba (fase 3). Hecho: ver "Cómo
     quedó la fase 4".
5. **Cuenta**: crear, verificar, entrar, editar, historial, como vistas
   propias (ver "Fase 5: la cuenta").
6. **Calidad**: `verificar-sitio`, `axe.mjs`, el CI y la skill `publicar`
   adaptados al *build*; revisión completa de `ux-accesibilidad`. Además:
   - Cargar con `React.lazy` + `Suspense` las vistas de la cuenta y del pago
     (`App.jsx`): hoy el JS es un solo archivo de unos 490 kB (154 kB gzip).
   - Pasar a `.claude/herramientas/` (o a la skill que toque) los scripts de
     Edge de la fase 5, que hoy viven en el scratchpad de una sesión
     (`cuenta`, `reenviar`, `recuperar`, `revision-recuperar`,
     `recuperar-mov`, `pedidos-cuenta`, `metodo`, `pegar-tel`,
     `movimiento`, `atras3`, `filtros-atras`).
7. **Cambio**: `react/` pasa a la raíz, fuera `js/` y `herramientas/`, y el
   plan se reescribe para describir la versión en React.

Cada fase cierra con el sitio funcionando y la paridad comprobada con las
secciones 4 a 11.

### Cómo quedó la fase 1 (hecha el 19 de octubre de 2026)

- Versiones fijadas sin `^`: Vite 8.3.4, `@vitejs/plugin-react` 6.1.2, React y
  React DOM 19.3.1, `react-router-dom` 7.18.4; Node 24.15.0 en el CI.
- `vite.config.js`: alias `@raiz` hacia la raíz del repo, `server.fs.allow`
  para que `npm run dev` pueda leerla y `base: './'` para servir bajo
  `/Panaderia/`.
- Catálogo: `src/servicios/catalogo.js` importa `data/productos.json` (va dentro
  del JS construido, sin `fetch`) y lo pasa por `revisar()` y `normalizar()` de
  `js/catalogo/repo.js`, que ahora exporta las dos. Las fotos entran con
  `import.meta.glob` sobre `assets/img/productos/*.jpg`: Vite las copia a
  `dist/assets/` con huella, y en `react/` no hay ninguna copia.
- Rutas: `/`, `/tienda-catalogo`, una `/tienda-<categoria>` por categoría (React
  Router no admite `tienda-:categoria` en un mismo tramo), `/confirmar`,
  `/comprobante`; lo demás vuelve a la portada con `replace`. Las direcciones
  se ven como `#/tienda-panes`; `#tienda-panes` sin barra sigue abriendo la
  misma vista porque React Router le añade la barra al leerla.
- Enlaces de sección (decidido el 19 de octubre de 2026): "Saltar al
  contenido", `#inicio`, `#catalogo`, `#historia` y `#visitanos` **no son
  rutas**. Al pulsarlos se desplaza suave hasta la sección (sin suavidad con
  `prefers-reduced-motion`) y el foco pasa a ella (`tabIndex={-1}` +
  `focus({ preventScroll: true })`), sin tocar la dirección. Para quien usa la
  página se comporta igual que hoy, y el salto al contenido sigue cumpliendo
  WCAG 2.4.1. Abrir una de esas direcciones tal cual (`#historia` pegado, un
  enlace compartido, otra pestaña) lleva a `#/` con `replace` y baja a la
  sección sin animar, con el foco en ella (arreglado el 20 de octubre de 2026).
- CI: paso "Construir la version en React" (`npm ci && npm run build` en
  `react/`) detrás de la validación; `ci-local.sh` solo corre la validación.

### Cómo quedó la fase 2 (hecha el 19 de octubre de 2026)

- La página entera menos canasta y cuenta, con las clases y el ARIA de
  `index.html`. Donde irán la canasta y la cuenta (`.nav-acciones`, botón
  flotante, "Tu pedido se guardó" del pie) solo hay un comentario.
- Una sola ruta para la portada y las vistas (`path="*"` → `Portada`): como en
  `view.js`, la vista aparta la portada con `body.is-vista` y las fichas son
  siempre las mismas. Entrar con un enlace (`state.entrar`) limpia orden,
  Mostrar y búsqueda, sube y enfoca el título; Atrás no limpia. "Filtrar por"
  sale de la dirección y se cambia con `replace`.
- Reutilizado sin copiar: `recordarVista`/`vistaRecordada` de `storage.js`,
  `dinero`/`idDe` de `state.js` y el horario, que pasó de `ui.js` a
  `js/comun/horario.js` (sin DOM) para que lo importen los dos sitios.
- Lo que se mueve a cada píxel (barra de avance, alto de la fila en el
  teléfono, el globo) va por `ref` y no por estado.
- Desde la vista, Nosotros vuelve a la portada (con historial) y baja a
  #historia cuando ya está pintada; Contáctanos baja al pie sin salir de la
  vista. El salto al contenido no cambia la dirección.
- Escape cierra la tienda y el menú del teléfono a la vez y devuelve el foco al
  botón que corresponde (antes, en el teléfono, iba siempre al del menú).
- El "+" de cada ficha se ve y se enfoca igual, pero no agrega nada hasta la
  fase 3; el tamaño elegido sí cambia el precio, el nombre del botón y se
  anuncia, como hoy.

### Arreglos antes de la fase 3 (revisión de `ux-accesibilidad`, 20 de octubre de 2026)

Todos para `frontend`, en React y, cuando es CSS o `view.js`, también en el
sitio actual. Gravedad de Nielsen entre paréntesis.

- [x] (3) Abrir directamente `#inicio`, `#catalogo`, `#historia`, `#visitanos`
      o `#contenido` (dirección pegada, enlace compartido, pestaña nueva) baja
      a la sección, como en el sitio actual (antes React se quedaba arriba).
- [x] (3) Menú del teléfono: el foco entra en "Nosotros" al abrirlo
      (`visibility 0s` en `.main-nav.is-open`).
- [x] (3) Contraste de la fila de hoy del horario (`.is-today`, `.dia-hoy`) de
      al menos 4,5:1.
- [x] (2) La vista de catálogo tiene `h1` (`.vista-titulo`).
- [x] (2) Contraste del submenú Tienda en hover y foco.
- [x] (2) Al volver al inicio y con Atrás/Adelante el foco va a `#inicio` o al
      título de la vista, no a `body`.
- [x] (2) El menú del teléfono se cierra cuando el foco sale de él.
- [x] (2) Se puede pasar el cursor por encima del globo de ayuda sin que se
      cierre (WCAG 1.4.13).
- [x] (2) Sin `aria-haspopup` en la flecha de Tienda.
- [x] (1) Se anuncia el cambio de orden; al volver al inicio no se anuncia el
      catálogo viejo; con búsqueda vacía en "Todas" no dice "en esta categoría".
- [x] (1) El título de la vista y de la pestaña dicen la categoría
      ("Dulces y pasteles · Catálogo | El Tradicional").
- [x] (1) Sin desplazamiento horizontal a 320 px con espaciado de texto
      aumentado (`.vista-mandos`).

No se arregla: Escape en el sitio actual mueve el foco aunque no haya nada
abierto. React ya lo hace bien, y el sitio actual se retira en la fase 7.

### Cómo quedó la fase 3 (hecha el 20 de octubre de 2026)

- Estado: `src/estado/pedido.js` es el reductor puro (`agregar`, `cambiar`,
  `quitar`, `vaciar`, `reponer` y `olvidar`, que cierra el deshacer); las
  líneas son pares `[id, línea]` en el orden del `Map` de antes, y el último
  borrado vive en el mismo estado. `PedidoProvider` lo inicia con lo guardado
  y guarda en un efecto cuando cambian las líneas. Unidades y subtotal se
  calculan al pintar.
- Guardado: lo que se acepta de `localStorage` y cómo se escribe pasó de
  `cart.js` a `js/pedido/guardado.js` (sin DOM), que usan los dos sitios;
  misma clave, mismo formato y misma cookie. React reescribe la entrega y la
  factura que encuentre guardadas (todavía no son suyas: fase 4) sin tocarlas.
  Comprobado sirviendo los dos en el mismo origen: lo que guarda uno lo lee el
  otro, en los dos sentidos.
- Piezas en `src/pedido/`: `BotonCanasta` (en `.nav-acciones`, el mismo `<a
  role="button">` con `floating-whatsapp is-canasta`), `Canasta`,
  `LineaCanasta`, `PideCuenta`, `BarraDeshacer`, `ControlCantidad` (el de las
  fichas, con el HTML de `montarControlesDeFicha`) y `GuardadoPie`. El foco y
  la animación que cruzan de una a otra van por `CanastaProvider`. El cerco
  del foco y el `inert` de detrás están en `src/comun/useAtraparFoco.js`, para
  la cuenta también.
- "Ir a pagar" enseña siempre el aviso de cuenta; sus dos botones grandes no
  hacen nada hasta la fase 5 (lo dice un comentario en `PideCuenta.jsx`).
- Diferencias con el sitio actual, a propósito: React **no guarda al
  cargar** (el sitio actual reescribe pedido y cookie en cada visita, así que
  su pie dice siempre "hoy a las" la hora de entrar; React dice la fecha real
  del último cambio), y la foto de una línea sale aunque el producto esté
  agotado.
- Decidido el 20 de octubre de 2026: **se queda lo de React** y el sitio
  actual también deja de guardar al cargar; solo guarda cuando cambia el
  pedido, la entrega o la factura. Así el pie de los dos dice la fecha real.
  Hecho el 20 de octubre: tampoco guarda la dirección que la cuenta rellena
  al arrancar (sí al entrar o al editar la cuenta).
- Arreglado en los dos sitios: el `+` de la línea de la canasta respeta el
  tope de 100 (antes solo la ficha), y el panel se hace visible en el acto al
  abrirse (`visibility 0s`), así que el foco entra en la X de cerrar (antes se
  quedaba en `body` hasta el primer Tab).

### Cómo quedó la fase 4 (hecha el 20 de octubre de 2026)

- Reglas sin reescribir: lo que decidía `checkout.js` (factura, Luhn, MM/AA,
  CVV, titular, los avisos "Para la factura, revisa…" y "Revisa … de la
  tarjeta", el número `ET-XXXX`, el recibo, el saludo y el cuerpo del correo,
  el estado del envío) pasó a `js/pedido/cobro.js`, sin DOM, y lo usan los dos
  sitios. `armarRecibo()` hace un solo objeto del pedido aprobado y de él
  salen el comprobante, el correo y el registro de IndexedDB
  (`reciboParaGuardar()`, el mismo formato de siempre). La cuenta guardada se
  lee con `js/cuenta/guardada.js`, que usan `account.js` y React. La hora de
  retiro pasó a `textoRetiro()` de `horario.js`. `direccionEntera()` salió de
  `state.js` (ahora `direccionDe(entrega)` en `cobro.js`).
- Estado: el reductor de `src/estado/pedido.js` lleva también la entrega y la
  factura (`entrega`, `factura`, `cumplido`), porque se guardan en el mismo
  registro, y cuenta los cambios: `PedidoProvider` guarda cuando el contador
  sube, así que ni lo leído al arrancar ni vaciar al aprobar se escriben. React
  ya no reescribe la entrega y la factura del sitio actual: son suyas.
  `PedidoProvider` también guarda el recibo del último pedido y lo olvida al
  salir de `#/comprobante`.
- Sesión: `src/estado/SesionProvider.jsx`, de solo lectura, con
  `useSyncExternalStore` sobre la cuenta de `localStorage`; se vuelve a leer
  con el evento `storage` (entrar en la cuenta en otra pestaña del sitio
  actual deja pagar sin recargar). Con sesión y correo verificado, "Ir a
  pagar" cierra la canasta y va a `#/confirmar`; si no, la hoja de siempre
  (sus botones siguen sin efecto hasta la fase 5). La dirección de la cuenta
  rellena el pedido sin guardarse y la forma de pago empieza en la preferida.
- Piezas en `src/pedido/`: `Confirmar` (la guarda de entrada),
  `FormularioPedido`, `ElegirEntrega`, `ElegirPago`, `DatosFactura`,
  `CampoPago`, `ResumenPedido`, `Comprobante` (la guarda), `Recibo`,
  `CabezaPedido` y `useVistaPedido` (`body.is-checkout`, título de la
  pestaña, foco en el `h1`; al salir con "Volver a la tienda" o "Listo,
  cerrar", portada y foco en el botón de la canasta). La tarjeta vive solo en
  el estado de `FormularioPedido`. Los campos que se guardan recortados no se
  controlan (`defaultValue`), para poder escribir espacios.
- Comprobado en Edge, escritorio y teléfono, con los dos sitios en el mismo
  origen: 142 comprobaciones del recorrido (sin cuenta, sin verificar, canasta
  vacía, retiro/efectivo, domicilio/tarjeta/factura a otra persona con cada
  error, foco, Enter, Atrás y Adelante, correo bien y caído), la misma
  secuencia de errores da los mismos textos, foco y `aria-invalid` en los dos
  sitios, y los pedidos pagados en uno salen en el historial del otro. axe sin
  violaciones en confirmar y comprobante de los dos.
- Diferencias a propósito con el sitio actual:
  - Se puede entrar a `#/confirmar` con un enlace o recargando si hay cuenta
    verificada y canasta (el sitio actual limpia la dirección y se queda en el
    catálogo). Si la canasta se vacía estando dentro, la vista se queda y el
    botón dice "Tu canasta está vacía", como en el sitio actual.
  - Al aprobar, React vacía la canasta en el acto (el comprobante sale del
    recibo); el sitio actual dejaba las líneas en memoria hasta cerrar el
    comprobante.
  - "Ir a pagar" desde la canasta abierta con "Editar la canasta" no apila
    otra entrada en el historial: solo cierra la canasta.
- Arreglado en los dos sitios: `h1` en la vista de confirmar y sus `h3` a
  `h2`; la dirección lleva `aria-invalid` y `aria-describedby` y avisa también
  al dejar el campo vacío; al aprobar se vacían también el correo y la
  dirección opcionales de la factura (antes quedaban escritos con la factura
  ya limpia); con la canasta vacía el pie no dice "Tu pedido se guardó…".

### Arreglos de la fase 3 (revisión de `ux-accesibilidad`, 20 de octubre de 2026)

Van en React y, salvo el de los avisos repetidos, también en el sitio actual.
Se hacen después de la fase 4, a la vez que las vistas. Gravedad de Nielsen
entre paréntesis.

- [x] (3) `frontend`: en el teléfono la barra de deshacer tapa el botón
      flotante de la canasta (la regla de `bottom: 74px` del `@media` va antes
      que la base y pierde). Con el panel abierto, la barra va encima del pie
      de la canasta, sin tapar "Ir a pagar". Hecho en `styles.css` (los dos
      sitios): las reglas van detrás de la base; con el panel abierto
      (`body:has(.canasta-panel.is-open)`) la barra se pone dentro de la
      gaveta, 172 px sobre el borde. Medido a 320, 390, 900 y 1280 px sin
      solaparse. De paso, `prefers-reduced-motion` ya le quita la animación
      (perdía por lo mismo).
- [x] (3) `logica-datos`: React no repite un aviso igual al anterior
      (`Avisos.jsx`); tiene que anunciarlo otra vez, como el sitio actual.
      Hecho: cada aviso lleva un contador y su texto va en un `Fragment` con
      esa clave, así que es un nodo nuevo aunque diga lo mismo.
- [x] (2) `logica-datos`: con la hoja "Entra a tu cuenta para pagar" abierta,
      el Tab no llega a "Deshacer" (la barra sale del cerco mientras tanto).
      Hecho: la barra queda `inert` con la hoja arriba (en React la hoja pasó
      de `Canasta` a `CanastaProvider` para que la barra lo sepa).
- [x] (2) `logica-datos`: en el tope de 100, el `+` de la ficha y el de la
      línea dicen "El máximo es 100 por producto" y quedan con `aria-disabled`.
      Hecho: también el globo (`data-tip`); pulsarlo no vuela ni guarda nada.
      Falta que `frontend` lo vea apagado en `styles.css` (como
      `.canasta-enviar[aria-disabled="true"]`).
- [x] (2) `logica-datos`: Enter o Esc en el campo de cantidad asientan el
      valor sin `blur()`; el foco sigue en el campo. En el sitio actual, Esc
      no sube a la página (allí se llevaba el foco al botón del menú).
- [x] (2) `logica-datos`: el reloj de 12 s del deshacer se para mientras la
      barra tiene el foco o el puntero encima. Al soltarla sigue con lo que le
      quedaba; un borrado nuevo vuelve a dar 12 s.
- [x] (2) `logica-datos`: Atrás/Adelante con el panel abierto lo cierran.
      Antes de pintar la vista nueva, para que no siga `inert`. Si quien abrió
      el panel se fue con la vista ("Editar la canasta" de `#confirmar`), el
      foco va al botón de la canasta.
- [x] (1) `logica-datos`: el `+`/`−` de una línea avisa "3 de Pan redondo. N
      productos en la canasta", como la ficha.
- [x] (1) `logica-datos`: con la canasta vacía el pie no dice "Tu pedido se
      guardó…" (no enseña nada). Hecho con la fase 4, en los dos sitios.
- [x] (1) `logica-datos`: "Ver la vitrina" de la canasta vacía lleva al catálogo y deja
      el foco en su título (en React, a `#/tienda-catalogo` cuando haya vistas).
      Hecho en los dos: el sitio actual llama a `abrirCategoria('catalogo')`
      de `view.js` por el puente; React navega a `#/tienda-catalogo` con
      `state.entrar`, como "Ver el menú". Si las vistas nuevas cambian cómo se
      entra al catálogo, hay que ajustar `verVitrina` en `Canasta.jsx`.
- [x] (1) `logica-datos`: con una sola unidad, la línea no enseña la X (el
      basurero hace lo mismo y tenían el mismo nombre).

Hechos los de `logica-datos` el 20 de octubre de 2026, comprobados en Edge
(escritorio y teléfono, los dos sitios) con un caso que fallaba antes y pasa
después. De paso, el sitio actual ya no manda el foco a `body` al pulsar el
`+`/`−` de una línea: lo devuelve al mismo botón de la línea rehecha, como
React.

### Fase 5: la cuenta (decidido el 20 de octubre de 2026)

Siguiendo "Vistas y aspecto", en React la cuenta **no es un panel lateral**:
cada paso es una vista propia, para que los formularios tengan ancho y no
haya que desplazarse en una columna estrecha. **Solo en React**: el sitio
actual sigue con su panel. Lo que hace cada paso es lo de la sección 7.

| Ruta | Contenido | Si no corresponde (con `replace`) |
|---|---|---|
| `#/cuenta/entrar` | Título y botón **"Iniciar sesión"** (el mismo nombre que la cabecera y la hoja de pagar). Correo y contraseña; "¿Olvidaste tu contraseña?"; "¿No tienes cuenta? Créala" | Con sesión → `#/cuenta` |
| `#/cuenta/crear` | Nombre, correo, teléfono, dirección (opcional), contraseña con sus 4 requisitos y repetirla; dos columnas en la computadora (datos a la izquierda, contraseña a la derecha), una en el teléfono; "¿Ya tienes cuenta? Inicia sesión". Si en el navegador ya hay una cuenta, aviso arriba: "En este navegador ya hay una cuenta (a…@…). Crear otra la reemplaza." | Con sesión → `#/cuenta` |
| `#/cuenta/verificar` | Código de 6 cifras, "Reenviar" cada 45 s y el recuadro con el código si EmailJS falta o falla | Sin cuenta por verificar → `#/cuenta/entrar` |
| `#/cuenta` | **Mis datos**, editables ahí mismo (nombre, teléfono, dirección y **forma de pago preferida**, Efectivo o Tarjeta con su dibujo y su frase como en el sitio actual; el correo se ve pero no se cambia), "Guardar" y "Cerrar sesión". "No guardamos tarjetas" sigue dicho junto a la forma de pago | Sin sesión → `#/cuenta/entrar` |
| `#/cuenta/recuperar` | Recuperar la contraseña (ver abajo) | Con sesión → `#/cuenta` |
| `#/cuenta/pedidos` | Una fila por pedido (`ET-XXXX`, fecha, total), más nuevo arriba; cada una se despliega (`<details>`) con el detalle. **Solo los pedidos de esa cuenta** (ver abajo) | Sin sesión → `#/cuenta/entrar` |

- Como las demás vistas: título de pestaña propio, `h1` con el foco al
  llegar, se anuncia, y la transición de vistas.
- **Cabecera**: sin sesión, la silueta ("Iniciar sesión / Registrarse") lleva
  a `#/cuenta/entrar`. Con sesión, las iniciales abren una ficha pequeña con
  "Mis datos", "Mis pedidos (N)" y "Cerrar sesión".
- **Desde "Ir a pagar"**: los dos botones de la hoja (en React, "Inicia
  sesión para pagar"; en el sitio actual, "Entra a tu cuenta para pagar") llevan a `#/cuenta/entrar` y `#/cuenta/crear`. Al terminar (entrar
  con el correo verificado, o verificarlo) se va **directo a `#/confirmar`**
  con la canasta. Sin venir de pagar, se termina en `#/cuenta`.
- Cerrar sesión no borra la cuenta; lleva a `#/`.
- **Mismas claves y formatos** de `localStorage` que el sitio actual: una
  cuenta creada en React sirve en el sitio actual y al revés. PBKDF2, las
  validaciones y el correo se importan de `js/cuenta/` y `js/comun/` (o se
  mueven a `src/servicios/`), no se reescriben de memoria.
- El `SesionProvider` de solo lectura (fase 4) pasa a crear, entrar, editar y
  cerrar sesión, con un reductor puro como el del pedido.
- Queda fuera: avisar antes de llenar la canasta que pagar pide cuenta, y
  pedir como invitado (siguen en la sección 13).

**Decidido tras la revisión de `ux-accesibilidad`** (usuario, 20 de octubre
de 2026):
- **"Iniciar sesión"** en todas partes (cabecera, hoja de pagar, título y
  botón de la vista); "Entrar" deja de usarse para esa acción.
- **Una cuenta por navegador, pero sin sorpresas**: Crear avisa si ya hay
  una (con el correo a medias, `a…@…`) y que crear otra la reemplaza.
- **Pedidos por cuenta**: el registro de IndexedDB lleva también `correo`
  (`reciboParaGuardar()` en `js/pedido/cobro.js`, campo nuevo que no rompe
  los de antes; vale para los dos sitios). Mis pedidos y el "(N)" de la ficha
  enseñan solo los de la cuenta abierta. Los pedidos viejos sin `correo` se
  siguen enseñando (son de antes de la regla y no se sabe de quién son).
- **Recuperar la contraseña** (`#/cuenta/recuperar`, solo React), como lo
  hacen las empresas, por código al correo:
  1. "¿Olvidaste tu contraseña?" en Iniciar sesión lleva aquí, con el correo
     ya puesto si se había escrito.
  2. Se escribe el correo. Si no es el de la cuenta de este navegador, el
     mismo error que al iniciar sesión. Si lo es, EmailJS manda un código de
     6 cifras (texto propio: "para cambiar tu contraseña"), que se escribe en
     las mismas 6 casillas de verificar.
  3. El código **caduca a los 10 minutos**, admite **5 intentos** (después
     hay que pedir otro) y se reenvía cada 45 s.
  4. Con el código bien: contraseña nueva con los 4 requisitos y repetirla
     ("Mostrar" en cada una). Se guarda como siempre (PBKDF2 con sal nueva),
     la vieja deja de valer, y queda la sesión abierta: a `#/confirmar` si se
     venía de pagar, si no a `#/cuenta`. Datos, forma de pago y pedidos se
     conservan, y la cuenta queda **verificada** (el código llegó a ese
     correo, que prueba lo mismo que verificarlo). Con `replace`, para que
     Atrás no vuelva al código.
  5. **Si el correo no se puede enviar, no se recupera**: "No pudimos enviar
     el correo. Inténtalo más tarde." Aquí **no** hay recuadro con el código
     en pantalla (dejaría a cualquiera cambiar la contraseña).
  6. Límite que se dice en la vista: la cuenta vive en este navegador, así
     que se recupera desde el mismo navegador donde se creó.
  7. Mismo movimiento que crear → verificar entre sus pasos.

**Movimiento de la cuenta** (Motion y `frontend-design`, como el resto de
"Vistas y aspecto"; todo se apaga con `prefers-reduced-motion`):
1. **Requisitos de la contraseña**: cada uno se marca con un ✓ que aparece
   con un pequeño rebote al cumplirse y se quita si deja de cumplirse.
2. **De crear a verificar**: el formulario sale hacia la izquierda y el paso
   del código entra desde la derecha, para que se lea como el paso siguiente.
3. **Código en 6 casillas** (esto sí cambia el uso, no solo el aspecto):
   una cifra por casilla, el foco salta solo a la siguiente, Retroceso en una
   casilla vacía vuelve a la anterior y borra, las flechas se mueven entre
   ellas, y pegar el código (en cualquier casilla) lo reparte entero. Van en
   un `fieldset` con `legend` "Código de 6 cifras" y cada una con su
   `aria-label` ("Cifra 1 de 6"…), `inputmode="numeric"` y
   `autocomplete="one-time-code"` en la primera. Al llenar la sexta se
   comprueba solo; si falla, el error va bajo las casillas y el foco a la
   primera.
4. **Mis pedidos**: cada fila se despliega animando la altura en vez de
   saltar, y su flecha gira. Sigue siendo un `<details>` (funciona con
   teclado y lector de pantalla).
5. **Guardar en Mis datos**: el botón pasa a "Guardado ✓" unos 2 s, además
   del aviso `aria-live`.
6. **Errores**: el mensaje aparece con un fundido suave bajo el campo. Sin
   sacudidas (WCAG 2.3.3 y marean).

Pendiente de la fase 5:
- [x] Rutas y vistas de la cuenta, con sus redirecciones (la lógica; la
      maquetación en dos columnas es de `frontend`).
- [x] Crear y verificar (con EmailJS y el recuadro de respaldo).
- [x] Entrar, y de "Ir a pagar" directo a `#/confirmar`.
- [x] Mis datos y cerrar sesión.
- [x] Forma de pago preferida dentro de Mis datos (`FormaDePago.jsx`: el
      `fieldset` `.cuenta-metodos` del sitio actual, con leyenda visible, y
      "No guardamos tarjetas" debajo). Se guarda con "Guardar los cambios"
      en el campo `metodo` de siempre; `#/confirmar` empieza con ella.
      Comprobado en los dos sentidos con el sitio actual.
- [x] Mis pedidos.
- [x] Botón y ficha de la cuenta en la cabecera.
- [x] El código en 6 casillas: su teclado (punto 3 de arriba, sin animar).
- [x] Movimiento de la cuenta (los 6 puntos), y la maquetación de las vistas.
- [x] `logica-datos`: escribir en una casilla del código la **misma cifra**
      que ya tenía no pasa a la siguiente (React no da `onChange` si el
      valor no cambia), así que corregir un código con una cifra repetida en
      su sitio se atasca. Arreglado: las casillas escuchan `onInput`, que el
      navegador da siempre (también con el teclado del teléfono y al
      rellenar el código solo).
- [x] Cuenta compartida con el sitio actual, comprobada en los dos sentidos.
- [x] Revisión de `ux-accesibilidad` (20 de octubre de 2026): 12 problemas,
      ninguno de gravedad 4 y axe sin violaciones. Los enlaces del menú que
      se veían apagados en las capturas miden 12,4:1 en la ventana: era la
      captura de página entera con `reducedMotion`, no el sitio.
- [x] Arreglos de la revisión (`5e081a6` de `logica-datos`, `ee4553c` de
      `frontend`, 20 de octubre de 2026). En los dos sitios: se pueden
      seleccionar el código del recuadro, el `ET-XXXX` y el correo; el
      teléfono pegado con 0, +593 o espacios queda bien (`soloNueve` quita
      el 593, sin `maxlength`, `autocomplete="tel-national"`); los campos
      llevan borde `--horno-claro` (4,97:1) y foco con anillo `--horno` y
      halo ámbar; la forma de pago elegida, aro de `--horno`; el número de la
      ficha en `--papel` (9,52:1); `html { scroll-padding-top/bottom }` en vez
      de `scroll-margin` por elemento. Solo React: avisos al lector cuando el
      correo no sale ("No pudimos enviar el correo; el código está en
      pantalla."), el error del código se anuncia una vez, "abrir la página"
      lo marca `comun/apertura.js` (no la clave `default`) y el foco vuelve
      al `h1` con Atrás, y `aria-current="page"` en la ficha.
- [x] Desplazamiento con Atrás/Adelante (`429b1de`, solo React hasta la
      fase 7): lo decide la página (`history.scrollRestoration = 'manual'`
      tras `load`, `auto` otra vez en `pagehide`). **Entre vistas, arriba
      del todo** con el foco en el `h1`; **entre categorías de la tienda,
      donde se estaba** (un `Map` por clave de entrada en
      `comun/apertura.js`). El buscador y "Ordenar por" con el borde y el
      foco de los campos, en los dos sitios.
- [x] `frontend` (`56e0732`): Atrás a una entrada de la tienda abierta con un enlace
      limpia orden, "Mostrar" y búsqueda (`Catalogo.jsx` mira
      `state.entrar` sin mirar si es Atrás); no debe limpiarlos.
- [ ] Tras recargar, la tienda no recuerda el desplazamiento de las
      entradas de antes (Atrás entre categorías da arriba). Se arreglaría
      guardándolo en `sessionStorage`; no urge.
- [x] Revisión de `calidad-publicacion` (20 de octubre de 2026): sin
      regresiones en el sitio actual, todo verificado. Arreglado después
      (`3053e79` de `logica-datos`, `9ff8119` de `frontend`):
      - **Seguridad**: un código de recuperar acertado y sin usar ya no
        sobrevive: `entrar`, `verificar`, `salir` y `porVerificar` borran la
        recuperación, y los 10 minutos se comprueban también en el reductor,
        al cambiar la contraseña y al pintar el paso de la clave (antes se
        podía cambiar la contraseña 30 minutos después sin código).
      - "Cambiar el correo" conserva el código, su hora y sus intentos;
        pedirlo otra vez con el mismo correo reabre las casillas sin mandar
        otro. **La espera de 45 s cuenta desde el último código de recuperar
        que salió** (`envioClave`), aunque fuera de una recuperación
        anterior.
      - Los avisos de caducado y de "la cuenta cambió" se ven en el paso del
        correo.
      - El código de 6 cifras sale de `crypto.getRandomValues`
        (`codigoAlAzar()` en `js/cuenta/guardada.js`, para los dos sitios).
      - En los dos sitios, el anillo del +593 en la caja solo con
        `@supports selector(:has(*))`; sin `:has`, el campo lleva el suyo.
      - Comprobado de nuevo en Edge: `revision-recuperar` 32 bien,
        `recuperar` 106, `cuenta` 230, `verificar-sitio` en orden.
- [x] **Fase 5 cerrada** el 20 de octubre de 2026.
- [x] "Iniciar sesión" en todas partes en React (`994f4e7`); el sitio actual
      sigue con "Entrar" en su panel.
- [x] Aviso en Crear si ya hay una cuenta ("a…@dominio"), y pedidos
      filtrados por correo en `usePedidosGuardados()` (Mis pedidos, Mis datos
      y el "(N)" de la ficha). `reciboParaGuardar()` guarda `correo` en los
      dos sitios; el historial del sitio actual no se filtra.
- [x] Recuperar la contraseña (`#/cuenta/recuperar`, `Recuperar.jsx`): tres
      pasos (correo, código, clave) con la misma plantilla de EmailJS
      (asunto y cuerpo van en variables). Las cifras que faltan no gastan
      intento; si el reenvío falla, el código anterior vale hasta caducar.
- [x] `frontend` (`56e0732`): maquetación y movimiento de recuperar (clases
      `recuperar-paso-correo|codigo|clave` con su `key`, `recuperar-dicho`,
      `recuperar-limite`, `cuenta-olvide`, `cuenta-ya-hay`) y los dibujos de
      fondo de `cuenta-recuperar`; comentario viejo en `FichaCuenta.jsx`.
      El cambio de paso lo hace `PasoQueCambia.jsx`: la hoja que sale ya no
      es un componente vivo, sino su nodo de DOM puesto un momento detrás,
      `inert`, `aria-hidden` y sin ids, animado con `element.animate()`
      (con `AnimatePresence` la hoja vieja seguía viva y daba el error #520
      de React). Hacia delante, sale a la izquierda y entra por la derecha;
      hacia atrás, al revés.

Cómo quedó la parte de `logica-datos` (20 de octubre de 2026):
- Estado: `src/estado/sesion.js` es el reductor puro (`releer`,
  `porVerificar`, `codigo`, `envio`, `verificar`, `entrar`, `editar`,
  `salir`). `SesionProvider` hace lo que no es puro (huella, código al azar,
  correo) y guarda en un efecto cuando el reductor cuenta un cambio; el evento
  `storage` vuelve a leer la cuenta. La cuenta por verificar vive solo en
  memoria hasta que se verifica, como en el sitio actual (recargar en
  `#/cuenta/verificar` lleva a entrar). El código y la hora del último envío
  van en el estado: salir de la vista y volver no reinicia los 45 s.
- Reglas: `leerCuentaGuardada()` se importa de `js/cuenta/guardada.js` y
  EmailJS de `js/comun/mail.js`. Las reglas de los campos, PBKDF2 y los textos
  del código están **copiados tal cual** de `account.js` en
  `src/servicios/cuenta.js`, porque `account.js` arma su panel al importarse
  y el sitio actual no se tocaba; hasta la fase 7, una regla que cambie se
  cambia en los dos.
- Cada vista mira si le toca al llegar, no a cada pintado (como
  `#/confirmar`): React Router cambia de dirección en una transición que se
  pinta después del cambio de sesión, y si no, el desvío de la vista ganaría
  al destino. Los desvíos llevan `alAbrir`, así que abrir la página en una
  dirección que rebota no mueve el foco (también en `#/confirmar` y
  `#/comprobante`, que antes lo movían).
- "Ir a pagar" deja `pagar` en el `state` de la dirección, y pasa de entrar a
  crear y a verificar. Al terminar se va a `#/confirmar` si se venía de pagar
  y la canasta tiene algo; si no, a `#/cuenta`.
- Confirmado por el usuario el 20 de octubre de 2026: crear → verificar,
  entrar/verificar → destino y "Cerrar sesión" → `#/` van con `replace`, para
  que Atrás no vuelva a un formulario ya hecho ni a los datos de una sesión
  cerrada (como el comprobante). Crear lleva "Dirección (opcional)" como el
  sitio actual. "Métodos de pago" no es una vista en React: la forma de pago
  preferida es un campo más de Mis datos (ver la tabla).

Cómo quedó la parte de `frontend` (20 de octubre de 2026):
- Cabecera (`src/cuenta/FichaCuenta.jsx`, en `.nav-acciones` delante de la
  canasta, también en el teléfono): sin sesión es un **enlace** con la
  silueta (`aria-label` y globo "Iniciar sesión / Registrarse") a
  `#/cuenta/entrar`. Con sesión, el botón de las iniciales (`aria-expanded`,
  `aria-controls`) abre la ficha `.cuenta-menu` de siempre con nombre, correo,
  "Mis datos", "Mis pedidos" con su número (se vuelve a contar al abrirla) y
  "Cerrar sesión". Flechas, Inicio y Fin la recorren; Escape la cierra y
  devuelve el foco; clic, toque o foco fuera la cierran, y navegar también.
  Abrirla pliega el menú del teléfono. "Cerrar sesión" hace lo de Mis datos
  (a `#/`, con `replace` si se estaba en `#/cuenta/*`); si ya se está en la
  portada, el foco va a la silueta.
- Vistas (`src/estilos/cuenta.css`): como el mostrador de la portada, el
  `h1` va en una banda de horno (`banda-oscura`, con dibujos de trigo, maíz y
  pan distintos en cada paso) y el formulario es una hoja de papel que cuelga
  de ella. Ancho por paso: 600 px entrar y verificar, 640 Mis datos, 760 Mis
  pedidos, 1000 crear (datos | contraseña, con filete; una columna desde
  680 px). Sin desplazamiento horizontal a 320 px. Crear cabe entero a
  1280×900.
- Movimiento: el ✓ de cada requisito (`MarcaRegla.jsx`) entra con un resorte
  que se pasa un poco de su tamaño y sale encogiendo; de crear a verificar,
  crear sale a la izquierda (la única vista que se anima al salir: su propio
  `AnimatePresence` en `App.jsx`, fuera del flujo e `inert` mientras se va) y
  verificar entra por la derecha; las casillas se llenan de ámbar con un
  saltito y se agrupan de tres en tres; Mis pedidos anima la altura y gira la
  flecha manteniendo el `<details>` (se cierra al acabar de plegarse);
  "Guardado ✓" 2 s en el botón (vuelve antes si se toca un campo); errores y
  avisos con un fundido de 220 ms (`TextoSuave.jsx`, dentro del párrafo de
  siempre, para no romper `aria-describedby` ni el `role="alert"`). Con
  `prefers-reduced-motion` nada de eso se mueve.

### Vistas y aspecto (decidido el 20 de octubre de 2026; solo React)

El usuario quiere menos desplazamiento y una página que no se vea vacía y se
sienta fluida. **Solo en React**: el sitio actual se queda como está (recibe
solo arreglos) y, desde aquí, la comparación de paridad deja de aplicar a lo
que cambia este apartado. Lo hace `frontend`, con la skill `frontend-design`.
El CSS nuevo va en `react/src/estilos/`, importado después de `styles.css`;
`assets/css/styles.css` no se toca para esto.

**Vistas en lugar de una sola página larga.** Cada opción del menú de arriba es
una ruta propia; esto sustituye a la decisión de la fase 1 de que Nosotros y
Contáctanos bajaran por la misma página:

| Menú | Ruta | Contenido |
|---|---|---|
| Logo / Inicio | `#/` | Portada (hero), la franja y debajo **"Los más pedidos" en carrusel**, con un enlace a toda la tienda. Aquí sí se baja un poco: es a propósito |
| Nosotros | `#/nosotros` | La historia y, cuando haya fotos, la galería del local |
| Tienda | `#/tienda-*` | Como ahora |
| Contáctanos | `#/contacto` | Horario completo con el día de hoy marcado, abierto/cerrado, dirección, **mapa** y contacto |

- **Pie corto** en todas las vistas: marca, abierto/cerrado, WhatsApp e
  Instagram, "Tu pedido se guardó…" y el ©. El horario completo y la
  dirección pasan a `#/contacto`.
- Al cambiar de vista: arriba del todo, título de la pestaña propio, `h1` en
  cada vista y el foco en él (WCAG 2.4.3), y se anuncia como hoy las vistas
  de la tienda. El enlace de salto al contenido sigue igual.
- Las direcciones viejas siguen entrando con `replace`: `#historia` →
  `#/nosotros`, `#visitanos` → `#/contacto`, `#catalogo` → `#/tienda-catalogo`,
  `#inicio` → `#/`.
- **Transición: fundido suave**. La vista nueva aparece con opacidad y un
  pequeño desplazamiento hacia arriba (unos 280 ms); sin animación con
  `prefers-reduced-motion`.
- **Carrusel** de "Los más pedidos": `scroll-snap` nativo con botones
  Anterior/Siguiente, se arrastra con el dedo, sin avance automático, cada
  ficha alcanzable con Tab y los botones se desactivan en los extremos.

**Animaciones con Motion** (`motion`, versión exacta, sin `^`): la transición
de vistas, las líneas de la canasta que entran, salen y se reacomodan, el
contador de la canasta que salta al añadir y la respuesta al pulsar. Siguiendo
`frontend-design`: un solo momento de entrada orquestado por vista (no un
fundido en cada sección) y el resto, movimiento que responde a lo que hace la
persona. Todo con `useReducedMotion` / `MotionConfig reducedMotion="user"`.

**Fondo que no se vea vacío**: ilustraciones de línea de **trigo, maíz y pan**
en SVG propio (dibujadas aquí, sin bancos de imágenes), detrás del contenido,
`aria-hidden`, en tonos de la paleta y lo bastante tenues para no bajar el
contraste del texto de encima (se mide). Distintas en cada vista, sin
movimiento propio.

**Regla 60-30-10 en cada vista**: 60 % `--masa`/`--papel` (fondo), 30 %
`--horno` (texto, bandas oscuras, pie), 10 % `--ambar`/`--corteza` (botones,
precios, acentos). Se comprueba con capturas de cada vista en escritorio y en
el teléfono, contando la proporción de píxeles de cada grupo.

**Mapa** en `#/contacto`: `iframe` de Google Maps sin clave
(`https://maps.google.com/maps?q=-1.004033,-77.812690&z=17&output=embed`), con
`title`, `loading="lazy"` y el enlace "Ver en el mapa" de siempre debajo.

**Galería del local**: _pendiente de fotos reales del usuario_ (horno, local,
proceso), en `assets/img/local/`. Sin fotos no se enseña nada; no se usan
fotos de bancos ni inventadas.

Pendiente de este apartado:
- [ ] Vistas, pie corto, transición, carrusel y direcciones viejas.
- [x] Motion en vistas y canasta.
- [ ] Fondos de trigo, maíz y pan, y 60-30-10 medido en cada vista.
- [ ] Mapa en `#/contacto`.
- [ ] Galería (cuando el usuario pase las fotos).
- [ ] Revisión de `ux-accesibilidad` de todo lo anterior.

### Vista previa de `mejoras` (en pausa: el usuario lo decide al final)

El usuario decidirá al final cómo y dónde se publica. Mientras tanto no se
crea nada en Netlify; `netlify.toml` queda en el repo por si se elige esta
opción, y no afecta a nada. La propuesta era **Netlify** (plan gratis, sin tarjeta):

- Un sitio de Netlify conectado al repositorio, con **`mejoras` como rama
  publicada**. Cada push a `mejoras` lo reconstruye solo.
- La configuración vive en `netlify.toml` en la raíz: base `react`, orden
  `npm run build`, carpeta `dist`, Node 24.15.0. Netlify clona el repo
  entero, así que `@raiz` encuentra el catálogo y las fotos.
- Solo enseña `react/`. El sitio actual de la rama se ve en local.
- Lo crea el usuario una vez desde netlify.com (requiere su cuenta de GitHub).
  La dirección queda anotada aquí: _pendiente_.
- Al terminar la fase 7, `main` pasa a ser React y la vista previa se puede
  borrar o dejar para revisar ramas futuras.

### Reparto en `react/`

| Carpeta | Agente |
|---|---|
| `package.json`, `vite.config.js`, `index.html`, `main.jsx`, `App.jsx`, rutas | `frontend` |
| `src/comun/`, `src/catalogo/` | `frontend` |
| `src/estado/`, `src/servicios/`, `src/pedido/`, `src/cuenta/` | `logica-datos` |
| `npm run build`, CI, revisión de paridad | `calidad-publicacion` |
| Accesibilidad y UX de lo migrado | `ux-accesibilidad` |

Las skills de cada uno están en la sección 14. `verificar-sitio` y `publicar`
se adaptan al *build* de Vite en la fase 6.
