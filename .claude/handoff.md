# Handoff: dónde nos quedamos (proyecto final, integración hecha)

## En una línea
Las tres capas del proyecto final están desplegadas y conectadas: el sitio en
**Netlify** le pide todo al backend **Express + Prisma en Render**, que trabaja
sobre la base **PostgreSQL de Supabase** de Ariel. Todo vive en la rama `efra`
(fork `voidholic/Panaderia`). **`main` y `upstream` no se han tocado**: la
página de GitHub Pages sigue con lo de antes hasta que el usuario diga
"súbelo a la página".

## Dónde está cada cosa
| Capa | Dónde | Notas |
|---|---|---|
| Frontend | https://el-tradicional-panaderia.netlify.app | Netlify conectado a `voidholic/Panaderia`, rama `efra`, base `frontend/` (`netlify.toml`). Variables `VITE_...` en Netlify; `VITE_API_URL` apunta a Render |
| Backend | https://el-tradicional-api.onrender.com/api/salud | Render, plan free, servicio `srv-dc2l6ejrjlhs73d2oob0`, rama `efra`, carpeta `backend`. Variables de Supabase puestas por Ariel |
| Base | Supabase `ugscqizansixnsuzljtu` (de Ariel) | Ni el backend ni nadie cambia tablas. La única migración de Prisma es la base (`0_base`), sin aplicar |
| Panel | Edge Function `api` de Supabase | `/admin/*` va por `VITE_API_ADMIN_URL`; ya tiene el CORS de Netlify |
| Avisos | Firebase `el-tradicional-panaderia` (del usuario) | Colección `avisos`, reglas en `firebase/firestore.rules` |
| GitHub Pages | https://arielnoob24.github.io/Panaderia/ | Sigue en `fd0362f` (antes del proyecto final) |

## Lo primero la próxima vez
1. `git fetch origin && git fetch upstream`, `git status`,
   `git log --oneline efra..upstream/main` (tiene que salir vacío).
2. Leer `PENDIENTES.md`: lo que queda está marcado **Pendiente**.
3. Si el usuario dice "súbelo a la página": sección 7 de la skill `publicar`,
   y después cambiar la rama de producción a `main` en **Netlify y en Render**
   (`PENDIENTES.md` 2.4).

## Lo que queda
- **1.4 (Ariel)**: `prisma migrate diff` contra la base real con
  `node --env-file=.env node_modules/prisma/build/index.js ...` (Prisma 7 no
  lee `.env` solo).
- **Limpiar el producto de prueba** del CRUD en vivo (queda retirado y se ve
  como agotado en la tienda): el `DELETE` de SQL está en `PENDIENTES.md` 2.3.
- **Subir a la página** cuando el usuario lo pida, y cambiar las ramas.
- El día de la presentación: despertar Render abriendo `/api/salud` 2–3
  minutos antes (el despertador del sitio ya lo hace para cualquier visita).

## Cómo se trabaja (está en `.claude/CLAUDE.md`)
Conversar → hacer y verificar (build, pruebas, CI local) → aprobación →
cerrar (`.claude/plan.md`). Todo se commitea y se pushea a `efra` en `origin`
sin preguntar; a `upstream` solo con "súbelo a la página".

## Comprobaciones que hay que correr antes de subir
```sh
npm run build                                  # sin avisos
npm run probar                                 # 43 pruebas de navegador
cd backend && npm run probar                   # 24 pruebas de la API (PGlite)
bash .claude/skills/publicar/ci-local.sh       # todo junto (~17 min)
node .claude/herramientas/axe.mjs              # 46 estados, 0 fallos
```

## Cosas que conviene saber
- En Git Bash, un argumento que empieza por `/` (como
  `--health-check-path /api/salud`) se vuelve ruta de Windows: usar
  `MSYS_NO_PATHCONV=1`.
- El sello "Powered by Netlify" del plan gratis está apagado
  (`built_with_badge_enabled: false`): tapaba la canasta en el teléfono.
- En Netlify Free, las variables no pueden tener *scopes* (la API responde
  Forbidden): se crean sin ellos.
- `npm audit` está en 0 en `frontend/` y `backend/` (en el backend, gracias al
  `overrides` de `effect`).
