# Panaderia El Tradicional

Plataforma web de una panadería de Tena: catálogo, canasta, pedido con pago
simulado, comprobante, cuenta de cliente y panel de quien atiende el local.
Proyecto final de Desarrollo en Plataformas.

> Material de referencia del proyecto, no texto para entregar en un informe.

**Estado:** las tres capas están desplegadas y conectadas. El sitio en Netlify
le pide todo a la API Express en Render, que trabaja sobre la base PostgreSQL
de Supabase. Lo único que queda está en [`PENDIENTES.md`](PENDIENTES.md).

## Enlaces

### El sitio

| Qué | Dirección | Notas |
|---|---|---|
| **Sitio principal (Netlify)** | https://el-tradicional-panaderia.netlify.app | Usa la API Express en Render |
| Sitio en GitHub Pages | https://arielnoob24.github.io/Panaderia/ | Mismo sitio; usa la Edge Function de Supabase (valor por defecto) |
| Tienda | https://el-tradicional-panaderia.netlify.app/tienda.html | El catálogo, con filtros y búsqueda |
| Contáctanos | https://el-tradicional-panaderia.netlify.app/contacto.html | Horario y avisos del local (Firestore) |
| Crear cuenta | https://el-tradicional-panaderia.netlify.app/crear-cuenta.html | Verificación por código de 6 cifras |
| Entrar | https://el-tradicional-panaderia.netlify.app/entrar.html | |
| Mis pedidos | https://el-tradicional-panaderia.netlify.app/mis-pedidos.html | Resumen con SQLite y descargas CSV y `.sqlite` (pide sesión) |
| Panel de administración | https://el-tradicional-panaderia.netlify.app/admin.html | Pide una cuenta con rol de administración |
| Mapa del sitio (XML) | https://el-tradicional-panaderia.netlify.app/sitemap.xml | |

### La API Express (Render)

| Qué | Dirección |
|---|---|
| Salud | https://el-tradicional-api.onrender.com/api/salud |
| Catálogo | https://el-tradicional-api.onrender.com/api/productos |
| Catálogo filtrado | https://el-tradicional-api.onrender.com/api/productos?categoria=panes&disponible=true |
| Un producto | https://el-tradicional-api.onrender.com/api/productos/PRO001 |
| Categorías | https://el-tradicional-api.onrender.com/api/categorias |
| Una categoría con sus productos | https://el-tradicional-api.onrender.com/api/categorias/panes |

Las rutas de escritura (`POST`, `PUT`, `PATCH`, `DELETE /api/productos`,
`/api/cuenta`, `/api/pedidos`) piden el token de sesión; la tabla completa está
en [`backend/README.md`](backend/README.md). Render gratis se duerme tras 15
minutos sin tráfico: la primera petición tarda cerca de un minuto (el sitio lo
despierta solo al abrirse).

### El código

| Qué | Dirección |
|---|---|
| Repositorio original (publica en Pages) | https://github.com/arielnoob24/Panaderia |
| Fork de trabajo (rama `efra`) | https://github.com/voidholic/Panaderia/tree/efra |
| CI: Validar y publicar sitio | https://github.com/arielnoob24/Panaderia/actions |
| Frontend | [`frontend/`](frontend/) |
| Backend | [`backend/`](backend/) · [`backend/README.md`](backend/README.md) |
| Esquema de Prisma | [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) |
| Base de datos (script completo) | [`bd/BD_EL_TRADICIONAL.sql`](bd/BD_EL_TRADICIONAL.sql) |
| Edge Function y migraciones de Supabase | [`supabase/`](supabase/) |
| Reglas de Firestore | [`firebase/firestore.rules`](firebase/firestore.rules) |
| Despliegue en Netlify | [`netlify.toml`](netlify.toml) |
| Despliegue en Render | [`render.yaml`](render.yaml) |
| CI de GitHub | [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) |
| Lo que queda por hacer | [`PENDIENTES.md`](PENDIENTES.md) |

### Paneles de los servicios (piden iniciar sesión)

| Servicio | Panel | De quién |
|---|---|---|
| Netlify | https://app.netlify.com/projects/el-tradicional-panaderia | Efraín |
| Render | https://dashboard.render.com (servicio `el-tradicional-api`) | Efraín |
| Firebase | https://console.firebase.google.com/project/el-tradicional-panaderia | Efraín |
| Supabase | https://supabase.com/dashboard/project/ugscqizansixnsuzljtu | Ariel |

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
        con el token JWT            ▼
                 │        ┌────────────────────┐
                 │        │ Firebase Firestore │
                 │        │ (NoSQL): avisos    │
                 ▼        └────────────────────┘
 ┌──────────────────────────────┐
 │ LÓGICA DE NEGOCIO  backend/  │  Render
 │ Express 5: middlewares ->    │
 │ rutas -> controladores ->    │
 │ validaciones -> modelos      │
 └───────────────┬──────────────┘
          Prisma 7 (ORM) + pg
                 ▼
 ┌──────────────────────────────────────────────┐
 │ DATOS  PostgreSQL de Supabase (SQL)          │  Supabase
 │ 50 tablas, CHECK, triggers, vistas y         │
 │ funciones FN_* (bd/BD_EL_TRADICIONAL.sql)    │
 │ + Supabase Auth (cuentas y tokens JWT)       │
 │ + Edge Function api (el panel, /admin/*)     │
 └──────────────────────────────────────────────┘
```

- **Cliente-servidor**: el navegador pide y el servidor responde. La página
  nunca toca las tablas: le pide todo a la API, que decide qué se puede. La
  API no guarda sesiones (stateless): cada petición trae su token JWT.
- **N-capas**: presentación (`frontend/`), lógica de negocio (`backend/`, y
  las reglas que viven en la base como `FN_PEDIDOS_REGISTRAR`) y datos
  (PostgreSQL). Cada capa solo habla con la de al lado: pasar el sitio de la
  Edge Function a Express fue cambiar una sola variable (`VITE_API_URL`).
- **Aplicación, sistema y plataforma**: una *aplicación* resuelve una tarea
  (la tienda en React, o la API). Un *sistema* es el conjunto que trabaja
  junto para un fin (sitio + API + base + autenticación + avisos). Una
  *plataforma* es la base sobre la que se construyen y se conectan
  aplicaciones y servicios: aquí, los servicios gestionados (Supabase, Render,
  Netlify, Firebase) más la API REST, que la página, el panel o cualquier
  otro cliente pueden consumir.
- **SQL frente a NoSQL**: lo que tiene estructura y relaciones (productos,
  pedidos, facturas, inventario) va en PostgreSQL, con su esquema, llaves y
  transacciones. Los avisos del local, que son documentos sueltos que cambian
  de un día para otro, van en Firestore (NoSQL, sin esquema fijo).

### Dónde corre cada parte

| Parte | Servicio | Plan | Rama |
|---|---|---|---|
| Sitio | Netlify | Free | `efra` (pasa a `main` en la configuración de Netlify: `PENDIENTES.md` 2.4) |
| Sitio (copia) | GitHub Pages | Gratis | `main` del repo original |
| API Express | Render (`el-tradicional-api`) | Free | `main` |
| Base, cuentas y panel | Supabase | Free | (de Ariel) |
| Avisos | Firebase Firestore (`el-tradicional-panaderia`) | Spark | |

Todos son gratis y ninguno pidió tarjeta. Las variables públicas del sitio
están en [`frontend/.env.example`](frontend/.env.example); las secretas del
backend (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) solo existen en Render,
con sus nombres en [`backend/.env.example`](backend/.env.example).

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
  pruebas/                43 pruebas de navegador (npm run probar)
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

Para que el sitio local use la API local, crea `frontend/.env.local` con
`VITE_API_URL=http://localhost:3000/api`. Sin variables, el sitio usa los
valores de `frontend/vite.config.js`.

Con doble clic en `frontend/index.html` no funciona: se abre por HTTP.

## Pruebas y CI

```sh
npm run probar                             # 43 pruebas de navegador (Chrome)
npm run probar -- humo                     # solo una
cd backend && npm run probar               # 24 pruebas de la API, sin credenciales
node .claude/herramientas/axe.mjs          # WCAG 2.2 AA: 46 estados, 0 fallos automáticos
bash .claude/skills/publicar/ci-local.sh   # todo lo del CI, en local (~17 min)
```

- Las pruebas de navegador recorren portada, tienda, canasta, pago, cuenta,
  Mis pedidos (con SQLite y las descargas), los avisos de Firestore y el
  panel, en escritorio y en el teléfono, sin salir a internet: Supabase y
  Firestore se simulan.
- Las del backend cargan `bd/BD_EL_TRADICIONAL.sql` en PGlite (PostgreSQL en
  WebAssembly) y le hablan por HTTP a la API, sin tocar la base real.
- El CI de GitHub tiene cuatro jobs: `validate` (build sin avisos, catálogo,
  fotos, palabras prohibidas y prueba de humo), `backend` (las 24 pruebas),
  `empaquetar` y `deploy` (publican `frontend/dist/` en Pages; van separados
  para que el deploy no busque el paquete antes de que GitHub lo registre).
- Render se vuelve a desplegar solo con cada push a `main`, y Netlify con
  cada push a su rama de producción.

## El temario, punto por punto

| # | Concepto | Dónde está | Estado |
|---|---|---|---|
| 1 | HTML5 semántico | `<header>` `frontend/src/comun/Cabecera.jsx:105`; `<main>` `frontend/src/App.jsx:122`; `<nav>` `Cabecera.jsx:110`; `<article>` `frontend/src/catalogo/FichaProducto.jsx:78`; `<footer>` del panel de la canasta `frontend/src/pedido/Canasta.jsx:267` (el sitio no lleva pie general, a propósito) | Cumple |
| 1 | WCAG y ARIA | `aria-live` `frontend/src/comun/Avisos.jsx:57`; diálogos con `aria-modal`; `axe.mjs`: 46 estados, 0 fallos automáticos | Cumple |
| 1 | Box model, Flexbox, Grid, media queries | `box-sizing` `frontend/assets/css/styles.css:64`; grid `styles.css:132`; teléfono ≤680, tableta 681–900 (`styles.css:178`) y escritorio ≥901 | Cumple |
| 2 | `const`/`let`, async/await, Promesas | Sin `var`; `pedirApi` `frontend/src/servicios/api.js:31` (async, `AbortSignal.timeout`, `try/catch`); despertador `api.js:56` | Cumple |
| 2 | DOM y eventos | `addEventListener` `frontend/src/catalogo/Catalogo.jsx:225`; descargas con Blob `frontend/src/comun/descargar.js` | Cumple |
| 3 | MVC en el cliente | Modelo: reductores puros (`frontend/src/estado/pedido.js:62`) y `servicios/`; Vista: componentes JSX; Controlador: proveedores con `useReducer` (`PedidoProvider.jsx:58`) | Cumple |
| 3 | Templating ligero y plugins | JSX; `memo` (`FichaProducto.jsx:117`); plugin propio de Vite `copiarFijas` (`frontend/vite.config.js:35`); Motion | Cumple |
| 3 | JSON, CSV, XML | JSON: `frontend/data/productos.json` y las respuestas de la API; CSV: Mis pedidos → "Descargar en CSV" (`frontend/src/servicios/csv.js:18`); XML: `sitemap.xml` (`frontend/scripts/paginas.mjs:61`) | Cumple |
| 3 | SQLite embebido (`sql.js`) | "Tu resumen" de Mis pedidos: `pedidos` 1:N `lineas`, JOIN y GROUP BY (`frontend/src/servicios/sqlite.js:90`) y descarga de la base `.sqlite` | Cumple |
| 3 | Lectura de Firestore | Avisos del local en Contáctanos (`frontend/src/servicios/firestore.js:32`), reglas `firebase/firestore.rules` | Cumple |
| 4 | Aplicación / sistema / plataforma; N-capas; cliente-servidor | Sección "Arquitectura" de este README | Cumple |
| 5 | Express modular | `backend/src/routes` → `controllers` → `models` | Cumple |
| 5 | Middlewares `(req, res, next)` | `express.json()` `backend/src/app.js:18`; CORS `backend/src/middlewares/cors.js:19`; JWT `autenticar.js:28`; autorización `autorizar.js:9`; Correlation-ID `app.js:16`; errores `errores.js:27` | Cumple |
| 6 | REST y CRUD | `/api/productos`: POST, GET, GET `/:codigo`, PUT, PATCH (`backend/src/routes/productos.js:16`), DELETE (`:17`); 200, 201, 400, 401, 403, 404, 409 y 500 en JSON; stateless. Probado en vivo contra la base real | Cumple |
| 7 | Framework | React 19 (Virtual DOM), componentes reutilizables (`FichaProducto`, `MarcoCuenta`...), estado reactivo, `fetch` asíncrono | Cumple |
| 8 | SQL frente a NoSQL | PostgreSQL (Supabase) y Firestore (sección "Arquitectura") | Cumple |
| 8 | ORM: modelos, migraciones, CRUD, relaciones | Prisma 7: 50 modelos de `db pull`; migración base `backend/prisma/migrations/0_base`; `create` anidado `backend/src/models/productos.js:140`; 1:N `categorias`→`productos`; N:M `productos`↔`tamanos` (`schema.prisma:549`) y `roles`↔`permisos` (`schema.prisma:651`) | Cumple (falta el `migrate diff` contra la base real: `PENDIENTES.md` 1.4) |

## Para tocar el catálogo

Las rutas de esta sección son dentro de `frontend/` (menos `bd/` y
`supabase/`, que están en la raíz). El catálogo de verdad está en la base; el
archivo `data/productos.json` es el respaldo que se usa si la API no contesta,
y tiene que coincidir con ella.

- **Por la API** (con una cuenta administradora): `POST /api/productos` para
  crear, `PUT` o `PATCH /api/productos/:codigo` para cambiar y `DELETE` para
  retirar (queda agotado). Ver [`backend/README.md`](backend/README.md).
- **En el respaldo**: cada producto en `data/productos.json` necesita
  `nombre`, `categoria`, `precio`, `foto` y `alt`; `disponible: false` lo
  marca como agotado, `etiqueta` le pone el sello de color y `tamanos` le da
  varias medidas con su precio. El campo `foto` es la raíz del nombre del
  archivo: de `assets/img/productos/pan-redondo` salen `pan-redondo-420.jpg` y
  `pan-redondo-840.jpg`. La categoría tiene que estar en
  `src/catalogo/categorias.js`; si no, el CI no publica.
- **En el script de la base**: el producto y su tamaño también van en los
  inserts iniciales de `bd/BD_EL_TRADICIONAL.sql` (la prueba de la base
  compara los dos catálogos) y, para la base alojada, en una migración de
  `supabase/migrations/`.

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
