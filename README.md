# Panaderia El Tradicional

Plataforma de una panadería de Tena: catálogo, canasta, pedido con pago
simulado, comprobante, cuenta de cliente y panel de quien atiende el local.
Proyecto final de Desarrollo en Plataformas.

> Material de referencia del proyecto, no texto para entregar en un informe.

| Qué | Dónde |
|---|---|
| Sitio (GitHub Pages) | https://arielnoob24.github.io/Panaderia/ |
| Sitio (Netlify) | https://el-tradicional-panaderia.netlify.app |
| API Express (Render) | https://el-tradicional-api.onrender.com/api/salud |
| Lo que falta (credenciales de Ariel) | [`PENDIENTES.md`](PENDIENTES.md) |

El sitio que se presentó antes de pasar a React queda en la etiqueta git
`sitio-presentado`.

## Arquitectura

Es una arquitectura **cliente-servidor en tres capas**, cada una desplegada
aparte:

```
 Navegador (cliente)
 ┌──────────────────────────────────────────────┐
 │ PRESENTACIÓN  frontend/  React 19 + Vite 8    │  Netlify / GitHub Pages
 │ vistas (JSX), estilos, estado (Context +      │
 │ useReducer), servicios: api.js, sqlite.js,    │
 │ csv.js, firestore.js                          │
 └───────────────┬──────────────────┬───────────┘
        HTTPS + JSON (fetch)        │ HTTPS (REST)
                 ▼                  ▼
 ┌──────────────────────────────┐  ┌────────────────────┐
 │ LÓGICA DE NEGOCIO  backend/  │  │ Firebase Firestore │
 │ Express 5: rutas ->          │  │ (NoSQL): avisos    │
 │ middlewares -> controladores │  └────────────────────┘
 │ -> validaciones -> modelos   │  Render
 │ (hoy: Edge Function de       │
 │  Supabase, mismas rutas)     │
 └───────────────┬──────────────┘
          Prisma 7 (ORM) + pg
                 ▼
 ┌──────────────────────────────────────────────┐
 │ DATOS  PostgreSQL de Supabase (SQL)          │  Supabase
 │ 50 tablas, CHECK, triggers, vistas y         │
 │ funciones FN_* (bd/BD_EL_TRADICIONAL.sql)    │
 │ + Supabase Auth (cuentas y tokens JWT)       │
 └──────────────────────────────────────────────┘
```

- **Cliente-servidor**: el navegador pide y el servidor responde. La página
  nunca toca las tablas: le pide todo a la API, que decide qué se puede. La
  API no guarda sesiones (stateless): cada petición trae su token JWT.
- **N-capas**: presentación (`frontend/`), lógica de negocio (`backend/`, y
  las reglas que viven en la base como `FN_PEDIDOS_REGISTRAR`) y datos
  (PostgreSQL). Cada capa solo habla con la de al lado.
- **Aplicación, sistema y plataforma**: una *aplicación* resuelve una tarea
  (la tienda en React, o la API). Un *sistema* es el conjunto que trabaja
  junto para un fin (sitio + API + base + autenticación). Una *plataforma*
  es la base sobre la que se construyen y se conectan aplicaciones y
  servicios de terceros: aquí, los servicios gestionados (Supabase, Render,
  Netlify, Firebase) más la API REST, que la página, el panel o cualquier
  otro cliente pueden consumir.
- **SQL frente a NoSQL**: lo que tiene estructura y relaciones (productos,
  pedidos, facturas, inventario) va en PostgreSQL, con su esquema, llaves y
  transacciones. Los avisos del local, que son documentos sueltos que cambian
  de un día para otro, van en Firestore (NoSQL, sin esquema fijo).

## Cómo está repartido

```
frontend/                 el sitio (React + Vite), con su package.json
  index.html y 15 .html   cada pantalla es su archivo (npm run paginas)
  vite.config.js          entradas, base './' y las variables VITE_... por defecto
  src/
    main.jsx, App.jsx     arranque y vistas
    vistas/ catalogo/ pedido/ cuenta/ admin/ comun/
    estado/               Context + useReducer (reductores puros)
    servicios/            reglas sin interfaz: api, catalogo, cuenta, pedidos,
                          storage, sqlite (sql.js), csv, firestore, correo
    estilos/
  assets/                 estilos base e imágenes
  data/productos.json     el catálogo de respaldo
  public/                 sitemap.xml y robots.txt (los genera npm run paginas)
  pruebas/                pruebas de navegador (npm run probar)
backend/                  la API Express + Prisma (ver backend/README.md)
  src/routes/ controllers/ models/ middlewares/ validaciones/
  prisma/                 schema.prisma (de db pull) y la migración base
  pruebas/                24 pruebas contra bd/ en PGlite
bd/                       la base en PostgreSQL, en un solo script
supabase/                 la Edge Function api y las migraciones de Supabase
firebase/                 reglas de Firestore
netlify.toml, render.yaml cómo despliegan Netlify y Render
.github/workflows/        el CI: valida frontend y backend, publica en Pages
package.json              atajos: npm run instalar|dev|build|preview|probar|paginas
```

## Para verlo en tu máquina

Hace falta Node 24.

```sh
npm run instalar          # npm ci en frontend/
npm run dev               # el sitio, se recarga al guardar
npm run build             # construye frontend/dist/ (sin avisos)
npm run preview           # sirve frontend/dist/

cd backend
npm ci && npm run generar # dependencias y cliente de Prisma
npm run dev               # la API en http://localhost:3000/api (lee backend/.env)
```

Variables: `frontend/.env.example` (todas públicas; si no se ponen, valen las
de `frontend/vite.config.js`) y `backend/.env.example` (secretas: solo en
Render o en un `backend/.env` que no va al repo). Para que el sitio use el
backend Express: `VITE_API_URL=http://localhost:3000/api`.

Con doble clic en `frontend/index.html` no funciona: se abre por HTTP.

## Pruebas

```sh
npm run probar            # 43 pruebas de navegador (Chrome), contra frontend/dist/
npm run probar -- humo    # solo una
cd backend && npm run probar   # 24 pruebas de la API, sin Supabase ni credenciales
node .claude/herramientas/axe.mjs   # WCAG 2.2 AA automático: 46 estados
bash .claude/skills/publicar/ci-local.sh   # todo lo del CI, en local
```

Las de navegador recorren portada, tienda, canasta, pago, cuenta, Mis pedidos
(con SQLite y las descargas), avisos de Firestore y el panel, en escritorio y
en el teléfono, sin salir a internet (Supabase y Firestore se fingen). Las del
backend cargan `bd/BD_EL_TRADICIONAL.sql` en PGlite (PostgreSQL en
WebAssembly) y le hablan por HTTP a la API.

## El temario, punto por punto

| # | Concepto | Dónde está | Estado |
|---|---|---|---|
| 1 | HTML5 semántico | `<header>` `frontend/src/comun/Cabecera.jsx:105`; `<main>` `frontend/src/App.jsx:122`; `<nav>` `Cabecera.jsx:110`; `<article>` `frontend/src/catalogo/FichaProducto.jsx:78`; `<footer>` del panel de la canasta `frontend/src/pedido/Canasta.jsx:267` (el sitio no lleva pie general, a propósito) | Cumple |
| 1 | WCAG y ARIA | `aria-live` `frontend/src/comun/Avisos.jsx:57`; diálogos con `aria-modal`; `axe.mjs`: 46 estados, 0 fallos automáticos | Cumple |
| 1 | Box model, Flexbox, Grid, media queries | `box-sizing` `frontend/assets/css/styles.css:64`; grid `styles.css:132`; teléfono ≤680, tableta 681–900 (`styles.css:178`) y escritorio ≥901 | Cumple |
| 2 | `const`/`let`, async/await, Promesas | Sin `var`; `pedirApi` `frontend/src/servicios/api.js:31` (async, `AbortSignal.timeout`, `try/catch`) | Cumple |
| 2 | DOM y eventos | `addEventListener` `frontend/src/catalogo/Catalogo.jsx:225`; descargas con Blob `frontend/src/comun/descargar.js` | Cumple |
| 3 | MVC en el cliente | Modelo: reductores puros (`frontend/src/estado/pedido.js:62`) y `servicios/`; Vista: componentes JSX; Controlador: proveedores con `useReducer` (`PedidoProvider.jsx:58`) | Cumple |
| 3 | Templating ligero y plugins | JSX; `memo` (`FichaProducto.jsx:117`); plugin propio de Vite `copiarFijas` (`frontend/vite.config.js:35`); Motion | Cumple |
| 3 | JSON, CSV, XML | JSON: `frontend/data/productos.json`; CSV: Mis pedidos → "Descargar en CSV" (`frontend/src/servicios/csv.js:18`); XML: `sitemap.xml` (`frontend/scripts/paginas.mjs:61`) | Cumple |
| 3 | SQLite embebido (`sql.js`) | "Tu resumen" de Mis pedidos: tablas `pedidos` 1:N `lineas`, JOIN y GROUP BY (`frontend/src/servicios/sqlite.js:90`) y descarga de la base `.sqlite` | Cumple |
| 3 | Lectura de Firestore | Avisos del local en Contáctanos (`frontend/src/servicios/firestore.js:32`), reglas `firebase/firestore.rules` | Cumple |
| 4 | Aplicación / sistema / plataforma; N-capas; cliente-servidor | Sección "Arquitectura" de este README | Cumple |
| 5 | Express modular | `backend/src/routes` → `controllers` → `models` | Cumple |
| 5 | Middlewares `(req, res, next)` | `express.json()` `backend/src/app.js:18`; CORS `backend/src/middlewares/cors.js:19`; JWT `autenticar.js:28`; autorización `autorizar.js:9`; Correlation-ID `app.js:16`; errores `errores.js:27` | Cumple |
| 6 | REST y CRUD | `/api/productos`: POST, GET, GET `/:codigo`, PUT, PATCH (`backend/src/routes/productos.js:16`), DELETE (`:17`); 200, 201, 400, 401, 403, 404, 409 y 500 en JSON; stateless | Cumple |
| 7 | Framework | React 19 (Virtual DOM), componentes reutilizables (`FichaProducto`, `MarcoCuenta`...), estado reactivo, `fetch` asíncrono | Cumple |
| 8 | SQL frente a NoSQL | PostgreSQL (Supabase) y Firestore (sección "Arquitectura") | Cumple |
| 8 | ORM: modelos, migraciones, CRUD, relaciones | Prisma 7: 50 modelos de `db pull`; migración base `backend/prisma/migrations/0_base`; `create` anidado `backend/src/models/productos.js:140`; 1:N `categorias`→`productos`; N:M `productos`↔`tamanos` (`schema.prisma:549`) y `roles`↔`permisos` (`schema.prisma:651`) | Cumple (verificar contra la base real: `PENDIENTES.md` 1.4) |

## Para tocar el catálogo

Las rutas de esta sección son dentro de `frontend/` (menos `bd/` y
`supabase/`, que están en la raíz). Meter, quitar o cambiar un producto es
editar `data/productos.json`. Cada producto necesita `nombre`, `categoria`,
`precio`, `foto` y `alt`; `disponible: false` lo marca como agotado,
`etiqueta` le pone el sello de color, `tamanos` le da varias medidas con su
precio y `destacado` se guarda pero hoy el sitio no lo usa.

El campo `foto` es la raíz del nombre del archivo, sin ancho ni extensión: de
`assets/img/productos/pan-redondo` salen `pan-redondo-420.jpg` y
`pan-redondo-840.jpg`, y el navegador elige la que le cabe. El CI comprueba
que estén las dos. Las fuentes originales se conservan en
`assets/img/productos/originales/`.

La categoría tiene que estar en `src/catalogo/categorias.js`; si no, sus
productos quedan inalcanzables y el CI no publica. Para que la base siga
igual, agrega también el producto y su tamaño en los inserts iniciales de
`bd/BD_EL_TRADICIONAL.sql` (la prueba de la base compara los dos catálogos) y,
para la base alojada, una migración en `supabase/migrations/`. Con el backend
en Render, también se puede crear por la API (`POST /api/productos`, con una
cuenta administradora).

## Dónde se guarda cada cosa

| Dónde | Qué guarda | Por qué ahí |
| --- | --- | --- |
| PostgreSQL (Supabase) | Cuentas, catálogo, pedidos, pagos, facturas, inventario, nómina y contabilidad | Es el registro de verdad, con relaciones y transacciones |
| Supabase Auth | Correo, contraseña y la dirección y forma de pago preferidas | Las cuentas y sus tokens JWT |
| Firestore | Los avisos del local | Documentos sueltos que se cambian a mano |
| `localStorage` | El pedido a medias, la sesión y una copia de la cuenta | Tiene que seguir ahí mañana |
| `sessionStorage` | El orden del catálogo y "solo los disponibles" | Dura lo que la pestaña |
| IndexedDB | Los pedidos pagados en este navegador | Registros que se acumulan |
| Cookie | Cuándo se guardó por última vez (`eltradicional-guardado`) | Un dato corto que caduca solo |
| SQLite en memoria (`sql.js`) | Una copia de Mis pedidos para el resumen | Se arma al abrir la vista y se puede descargar |

Cada lectura y escritura del navegador va en su `try`/`catch`: en una ventana
privada escribir puede fallar, y eso no puede tumbar la página.

## Accesibilidad

El objetivo es WCAG 2.2 nivel AA, y axe no encuentra fallos automáticos en los
46 estados que mide.

- **Teclado.** Todo se usa sin ratón. La canasta atrapa el foco, se cierra con
  `Escape` y lo devuelve al botón. Al cambiar de vista el foco va al título.
- **Foco visible** con un anillo propio y `:focus-visible`.
- **ARIA donde hace falta y no más**: `role="dialog"` con `aria-modal`,
  `aria-expanded`, `aria-current`, `aria-live="polite"` en los avisos,
  `role="note"` en los avisos del local y `aria-hidden` en lo decorativo.
- **Errores de formulario** con `aria-invalid` y `aria-describedby`.
- **Contraste** medido: 12,4:1 el texto principal.
- **Movimiento** que se apaga con `prefers-reduced-motion`.

## Lo que está simulado

El cobro no existe: no se procesa ningún pago, y de la tarjeta solo se guardan
los 4 últimos dígitos. Los correos sí salen: los códigos de verificar y
recuperar los manda Supabase Auth, y el comprobante, EmailJS (sus claves son
públicas por diseño). El teléfono y el WhatsApp del local son de ejemplo.
