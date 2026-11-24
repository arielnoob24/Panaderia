# Backend de El Tradicional

API REST en **Node.js + Express 5**, con **Prisma 7** sobre la base PostgreSQL
de Supabase que ya existe. No crea ni cambia tablas: se adapta a la base
(`bd/BD_EL_TRADICIONAL.sql`). Se despliega en **Render** (Web Service gratis,
`render.yaml` en la raíz del repo).

Mientras no tenga `DATABASE_URL`, el sitio (`frontend/`) sigue usando la Edge
Function `supabase/functions/api`. El cambio es una sola variable del
frontend: `VITE_API_URL=https://<servicio>.onrender.com/api`.

## Cómo está repartido

```
src/
  server.js           arranca: app.listen(PORT)
  app.js              la app: middlewares -> /api -> 404 -> errores
  config.js           todo sale del entorno (nada de claves en el código)
  db.js               el PrismaClient, con el adaptador de pg
  errores.js          ErrorHttp(estado, mensaje)
  routes/             qué URL y qué método va a qué controlador
  controllers/        leen la petición, validan, llaman al modelo y responden
  models/             la capa de datos: Prisma (CRUD) y las funciones de la base
  validaciones/       400 si lo que llega no vale
  middlewares/
    correlacion.js    X-Correlation-ID y una línea JSON de log por petición
    cors.js           qué páginas pueden llamar desde el navegador
    autenticar.js     el JWT de Supabase Auth (firma, caducidad, audiencia): 401
    autorizar.js      el permiso del rol de la cuenta (ROLES N:M PERMISOS): 403
    errores.js        404 de ruta y manejo global de errores (500 sin detalles)
prisma/
  schema.prisma       los 50 modelos, sacados de la base con prisma db pull
  migrations/0_base/  la migración base (baseline): la base tal como es
pruebas/
  baseLocal.mjs       la base de bd/ en PGlite, servida por un puerto local
  api.test.mjs        24 pruebas de la API contra esa base (node:test)
```

Capas: **presentación** (el sitio en `frontend/`) → **lógica de negocio**
(rutas, middlewares, controladores y validaciones de Express, más las
funciones `FN_*` de la base) → **datos** (modelos de Prisma y PostgreSQL).

## Rutas

Todas responden JSON. Sin estado en el servidor (stateless): cada petición
trae su token en `Authorization: Bearer <jwt>`.

| Método y ruta | Qué hace | Sesión | Códigos |
|---|---|---|---|
| `GET /api/salud` | La API está arriba (no toca la base) | No | 200 |
| `GET /api/productos` | El catálogo, con la forma de `frontend/data/productos.json`. Filtros `?categoria=panes&disponible=true` | No | 200, 400 |
| `GET /api/productos/:codigo` | Un producto (`PRO001`) | No | 200, 404 |
| `POST /api/productos` | Crea un producto con sus tamaños | Permiso `productos.gestionar` | 201 (+ `Location`), 400, 401, 403, 409 |
| `PUT /api/productos/:codigo` | Lo reemplaza entero | Igual | 200, 400, 401, 403, 404, 409 |
| `PATCH /api/productos/:codigo` | Cambia solo lo que llega | Igual | 200, 400, 401, 403, 404 |
| `DELETE /api/productos/:codigo` | Lo retira (queda agotado: lo vendido no se borra) | Igual | 200, 401, 403, 404 |
| `GET /api/categorias` | Las categorías y cuántos productos tiene cada una | No | 200 |
| `GET /api/categorias/:slug` | Una categoría con sus productos (1:N) | No | 200, 404 |
| `GET /api/cuenta` | Los datos de quien llama | Sí | 200, 401, 404 |
| `POST /api/cuenta` | Crea su fila en USUARIOS al verificar el correo | Sí | 201, 200, 400, 401 |
| `PUT /api/cuenta` | Cambia nombre, teléfono, dirección y forma de pago | Sí | 200, 400, 401, 404 |
| `GET /api/pedidos` | Sus pedidos, el más nuevo primero | Sí | 200, 401 |
| `POST /api/pedidos` | Registra un pedido (`FN_PEDIDOS_REGISTRAR`, una transacción) | Sí | 201, 400, 401 |

Un error inesperado es **500** con `{ error, correlacion }`: el detalle solo
va al log, con ese mismo Correlation-ID. El panel (`/admin/...`) sigue en la
Edge Function.

## En tu máquina

```sh
npm ci
npm run generar        # genera el cliente de Prisma
npm run probar         # las 24 pruebas, sin Supabase ni credenciales
cp .env.example .env   # y llénalo para hablar con la base de verdad
npm run dev            # http://localhost:3000/api/salud
```

`npm run base-local` deja la base de `bd/` escuchando en
`postgresql://postgres:postgres@127.0.0.1:54329/postgres?sslmode=disable`,
para mirarla o para `prisma db pull` sin Supabase.

## Prisma y la base existente

- `prisma/schema.prisma` no se escribió a mano: salió de `prisma db pull`
  contra la base que crea `bd/BD_EL_TRADICIONAL.sql`, y
  `prisma migrate diff` entre esa base y el esquema da vacío. Los nombres son
  los de la base (en minúsculas, como los guarda PostgreSQL).
- Relaciones que usa la API: `categorias` 1:N `productos`; `productos` N:M
  `tamanos` por `productos_tamanos` (con precio y orden); `roles` N:M
  `permisos` por `roles_permisos`; `roles` 1:N `usuarios`.
- **Migraciones**: solo `0_base`, la base tal como es (baseline). Nunca se
  corre `prisma migrate dev` ni `migrate deploy` contra Supabase: cambiaría
  tablas que son de Ariel. Los `CHECK`, triggers, vistas y funciones no los
  representa Prisma; siguen en `bd/` y en `supabase/migrations/`.
- Cada escritura de productos fija `app.usuario` en su transacción: el
  trigger de `AUDITORIAS` anota quién hizo el cambio.

## Desplegar en Render

`render.yaml` (en la raíz) describe el servicio: plan gratis, carpeta
`backend`, `npm ci --include=dev && npm run generar`, `npm start` y
`/api/salud` para revisar que esté arriba. Los pasos exactos, con lo que
pone Ariel, están en `PENDIENTES.md`.
