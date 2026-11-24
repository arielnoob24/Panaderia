# Pendientes para cerrar la integración

> Material de referencia del proyecto, no texto para entregar en un informe.

Estado al 24 de noviembre de 2026: el frontend está en Netlify
(https://el-tradicional-panaderia.netlify.app) y sigue usando la Edge
Function de Supabase. El backend Express + Prisma está en `backend/`, con sus
pruebas en verde contra una copia local de la base, y creado en Render
(https://el-tradicional-api.onrender.com), donde por ahora solo responde
`/api/salud`. Lo que falta necesita credenciales o la cuenta de Supabase de
Ariel, o viene después de eso.

Los comandos son para Git Bash o PowerShell, desde la raíz del repo. Donde
dice `<...>` va un valor que no está en el repo.

---

## Parte 1: lo que hace Ariel (su cuenta de Supabase)

### 1.1 Desplegar la Edge Function con el CORS de Netlify

El código ya permite `https://el-tradicional-panaderia.netlify.app` y sus
vistas previas (`supabase/functions/api/index.ts`, líneas 10–28). Hasta que
se despliegue, en Netlify el catálogo sale del respaldo
(`frontend/data/productos.json`) y la cuenta no habla con la API.

```sh
cd frontend
npx supabase login
npx supabase link --project-ref ugscqizansixnsuzljtu
npx supabase functions deploy api --use-api
```

Comprobar (tiene que salir la dirección de Netlify, no la de Pages):

```sh
curl -s -D - -o /dev/null -X OPTIONS \
  https://ugscqizansixnsuzljtu.supabase.co/functions/v1/api/productos \
  -H "Origin: https://el-tradicional-panaderia.netlify.app" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control-allow-origin
```

### 1.2 Sacar los datos de conexión (no van al repo ni por chat)

En el panel de Supabase del proyecto `ugscqizansixnsuzljtu`:

| Variable | Dónde está | Para qué |
|---|---|---|
| `DATABASE_URL` | **Connect** → *Transaction pooler* (puerto **6543**) | La conexión del servidor (Prisma) |
| `DIRECT_URL` | **Connect** → *Session pooler* o *Direct* (puerto **5432**) | Solo para `prisma db pull` y `migrate diff` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API Keys** → la clave secreta (`sb_secret_...`) o, en *Legacy*, la `service_role` | Guardar la dirección y la forma de pago en la cuenta de Auth (`/api/cuenta`) |
| `SUPABASE_JWT_SECRET` | **Project Settings → JWT Keys** | **Solo si** el proyecto todavía firma con el secreto HS256 (*Legacy JWT secret*). Si usa *JWT Signing Keys* (ECC o RSA), se deja vacía: el backend lee las claves públicas (JWKS) |

### 1.3 Poner las variables en Render

El servicio `el-tradicional-api` está en la cuenta de Render de Efraín. Con
Efraín al lado, en https://dashboard.render.com → `el-tradicional-api` →
**Environment** → *Add Environment Variable*, Ariel escribe:

- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET` (solo si hace falta, ver 1.2)

y pulsa **Save, rebuild, and deploy**. `SUPABASE_URL`, `ORIGENES_PERMITIDOS`
y `NODE_VERSION` ya están puestas.

Si en los logs de Render sale `self-signed certificate in certificate chain`,
se agrega al final de `DATABASE_URL` `?sslmode=no-verify` (cifra la conexión
sin comprobar el certificado de Supabase). Lo correcto a largo plazo es
bajar el certificado de Supabase (*Database Settings → SSL Configuration*) y
pasarlo como archivo secreto, pero para la presentación basta lo primero.

### 1.4 Comprobar que el esquema de Prisma coincide con la base real

En su máquina, sin escribir nada en la base:

```sh
cd backend
npm ci
DIRECT_URL="<la de 1.2>" npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

- Si sale `-- This is an empty migration.`, `prisma/schema.prisma` es fiel a
  la base real (ya lo es con la de `bd/`).
- Si sale SQL, son las diferencias entre `bd/BD_EL_TRADICIONAL.sql` y la base
  real (algo de `supabase/migrations/` que no pasó a `bd/`, o al revés). Para
  ver el esquema real sin tocar el del repo:
  `DIRECT_URL="<...>" npx prisma db pull --print > esquema-real.prisma` y
  compararlo. Luego se decide si se arregla `bd/` o el esquema.

**No correr** `prisma migrate dev`, `migrate deploy` ni `migrate reset`
contra Supabase: cambiarían tablas. Marcar la migración base como aplicada
(`npx prisma migrate resolve --applied 0_base`) crearía la tabla
`_prisma_migrations`: solo si Ariel lo aprueba, y no hace falta para que la
API funcione.

### 1.5 (Opcional) Un usuario administrador para probar el CRUD

El CRUD de `/api/productos` pide el permiso `productos.gestionar` (rol
Administrador). Si Ariel quiere que una cuenta lo tenga, en el editor SQL de
Supabase (cambia un dato, no una tabla):

```sql
UPDATE usuarios
   SET rol_codigo = (SELECT rol_codigo FROM roles WHERE rol_nombre = 'Administrador')
 WHERE usu_correo = '<correo de la cuenta>';
```

---

## Parte 2: lo que hace Efraín después

### 2.1 Comprobar el backend en Render

```sh
curl -s https://el-tradicional-api.onrender.com/api/salud
curl -s https://el-tradicional-api.onrender.com/api/productos | head -c 300
curl -s https://el-tradicional-api.onrender.com/api/categorias
```

`/api/salud` da `{"estado":"bien"}` y `/api/productos` trae 30 productos. Si
da 500, el log de Render tiene el error con el mismo `correlacion` que la
respuesta.

### 2.2 Pasar el frontend a Express

Netlify (o en la web: *Site configuration → Environment variables*):

```sh
npx netlify-cli@27.20.1 env:set VITE_API_URL https://el-tradicional-api.onrender.com/api --site 6958a261-3e56-4e9c-8a1b-26b1a32563b5
```

y redesplegar (*Deploys → Trigger deploy*, o un push a la rama que publica).
`VITE_API_ADMIN_URL` se queda en la Edge Function: el panel sigue ahí.

Para que GitHub Pages también use Express, se cambia el valor por defecto de
`VITE_API_URL` en `frontend/vite.config.js` (tabla `PUBLICAS`) y se sube con
"súbelo a la página".

### 2.3 Probar de punta a punta en Netlify

En https://el-tradicional-panaderia.netlify.app, con las herramientas del
navegador abiertas (pestaña Red):

1. **Tienda:** la petición a `.../api/productos` sale de `onrender.com`, con
   200 y la cabecera `X-Correlation-ID`; la consola **no** dice "se usa
   data/productos.json".
2. **Crear cuenta** con un correo real, verificar el código: `POST /api/cuenta` → 201.
3. **Mis datos:** cambiar el teléfono: `PUT /api/cuenta` → 200.
4. **Pagar** un pedido (efectivo, retiro): `POST /api/pedidos` → 201, y el
   comprobante trae el número `ET-XXXX` que dio la base.
5. **Mis pedidos:** sale el pedido (`GET /api/pedidos`), y "Tu resumen"
   (SQLite) y las descargas CSV y .sqlite funcionan.
6. **Contáctanos:** sale el aviso de Firestore bajo el horario.

CRUD con una cuenta administradora (1.5). El token es el `access_token` de
`localStorage` → `sb-ugscqizansixnsuzljtu-auth-token`:

```sh
API=https://el-tradicional-api.onrender.com/api; T="<access_token>"
curl -s -X POST $API/productos -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  -d '{"nombre":"Jugo de naranja","categoria":"bebidas-frias","foto":"assets/img/productos/jugo-de-naranja","alt":"Vaso de jugo de naranja","iva":"4","tamanos":[{"valor":"300 ml","precio":0.75},{"valor":"500 ml","precio":1.25}]}'
curl -s -X PATCH  $API/productos/<codigo> -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"disponible":false}'
curl -s -X DELETE $API/productos/<codigo> -H "Authorization: Bearer $T"
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/productos -H "Content-Type: application/json" -d '{}'   # 401
```

### 2.4 Subir a la página y cambiar la rama de Netlify

Cuando Efraín diga "súbelo a la página": sección 7 de la skill `publicar`
(`main` avanza en línea recta y se pushea a `upstream` y a `origin`). Después,
en Netlify (*Project configuration → Build & deploy → Branches and deploy
contexts*), la rama de producción pasa de `efra` a **`main`**, y en Render
(`el-tradicional-api` → *Settings → Build & Deploy → Branch*) también, de
`efra` a **`main`**. Hoy los dos siguen `efra` porque `main` todavía no
tiene `frontend/` ni `backend/`.

### 2.5 Render gratis se duerme: qué hacer

**El problema.** Render apaga el servicio gratis tras 15 minutos sin tráfico
y tarda cerca de un minuto en despertar. La página espera a la API solo
**4 s** (`frontend/src/servicios/api.js`, `ESPERA`) y pinta cuando llega el
catálogo (`main.jsx`). Si el servidor está dormido:

- el catálogo sale del respaldo (`data/productos.json`): la tienda se ve,
  pero con los precios del archivo;
- la cuenta y los pedidos fallan con "la conexión falló" hasta que despierte
  (el pago espera 10 s).

**Opciones, de la más simple a la más compleja:**

| | Qué es | Código | Contra |
|---|---|---|---|
| A | **Despertarlo antes de la presentación**: abrir `https://el-tradicional-api.onrender.com/api/salud` 2–3 minutos antes y esperar `{"estado":"bien"}`. Con la presentación en curso hay tráfico y no se vuelve a dormir | Ninguno | Hay que acordarse |
| B | **Un "despertador" al abrir la página**: `main.jsx` pide `/api/salud` sin esperar la respuesta. El primer visitante ve el respaldo, pero el servidor ya está despierto cuando crea la cuenta o paga | 3 líneas | El primer catálogo sigue saliendo del respaldo |
| C | **Subir la espera solo para Render** (p. ej. 60 s si la dirección es `onrender.com`) | 2 líneas | La página se queda en blanco hasta un minuto, porque pinta cuando llega el catálogo: peor que el respaldo |
| D | **Un ping cada 14 minutos** (UptimeRobot o cron-job.org, gratis) | Ninguno | Otra cuenta más; gasta ~720 de las 750 horas del mes en un solo servicio |

**Decidido (24 de noviembre de 2026): A y B.** El profesor puede revisar el
sitio en cualquier momento, no solo en la presentación.

- **B ya está hecho**: `despertarApi()` en `frontend/src/servicios/api.js`,
  llamado al arrancar `frontend/src/main.jsx`. Solo actúa si `VITE_API_URL`
  es de `onrender.com` (la Edge Function no duerme), no espera la respuesta y
  se rinde a los 90 s.
- **A, el día de la presentación**: abrir
  https://el-tradicional-api.onrender.com/api/salud 2–3 minutos antes y
  esperar `{"estado":"bien"}`.
- **C no**: con Render dormido dejaría la página en blanco hasta un minuto.

---

## Hecho y verificado (para no repetirlo)

- `frontend/` y `backend/` separados; CI, `ci-local.sh`, skills y README al día.
- Netlify conectado a `voidholic/Panaderia` (rama `efra`), con las variables
  `VITE_...` y sin el sello de Netlify (tapaba la canasta en el teléfono).
- Firebase `el-tradicional-panaderia` (Spark) con la colección `avisos` y sus
  reglas (`firebase/firestore.rules`).
- Backend: 24 pruebas en verde contra `bd/` en PGlite;
  `prisma migrate diff` entre `bd/` y `schema.prisma` vacío.
- CI local: 43 de 43 pruebas del sitio y 24 de 24 del backend.
