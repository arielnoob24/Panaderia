---
name: publicar
description: Sube un cambio del sitio de la panaderia a GitHub Pages - verifica el build y las pruebas, commitea solo lo tocado, pasa el CI en local, pushea a efra en el fork (no publica) y, solo cuando el usuario lo pide, sube main al repo original (que publica en Pages) y espera al deploy. Usala al terminar cualquier cambio del sitio; el usuario quiere que todo se suba sin preguntar.
---

# Publicar en GitHub Pages

Hay dos repos en GitHub:

- `origin` = `voidholic/Panaderia`, el fork del usuario. Ahi vive `efra`.
  En el fork Actions esta apagado: un push ahi no corre CI ni publica.
- `upstream` = `arielnoob24/Panaderia`, el original. Su `main` es lo que
  sirve Pages (https://arielnoob24.github.io/Panaderia/) y ahi corre
  `Validar y publicar sitio`.

Cada cambio se commitea en `efra` y se pushea a `origin` sin preguntar,
siguiendo estos pasos en orden. A `upstream` se sube solo cuando el usuario lo
pide ("subelo a la pagina" o parecido), con la seccion 7. Como el fork no
tiene CI, el CI local (paso 4) es la unica validacion antes de publicar y no
se salta nunca.

`gh` no esta instalado: el estado de los runs se lee de la API publica con
`curl` (sin token, el repo es publico).

Lo que se publica es `dist/`, lo que arma `npm run build`: el CI lo construye
y lo sube. No hay nada que regenerar a mano ni `?v=` que subir: Vite pone una
huella en el nombre de cada archivo (`index-a1b2c3.js`), asi que cada cambio
llega con un nombre nuevo y el navegador no sirve el viejo de su cache.

## 1. Ver que se toco

```bash
git status --short
```

Solo entran los archivos del cambio. **No** commitear lo que no es tuyo ni del
cambio: PDFs de la clase, `GUIA_PARA_EXPLICAR.md`, `auditoria*.md` u otros
`.md` sueltos sin seguimiento. Ni `dist/` ni `node_modules/` (los ignora
`.gitignore`).

## 2. Revisar antes de commitear

```bash
npm run build      # sin avisos
npm run probar     # unos 7 minutos
```

`npm run probar` corre todas las pruebas de `pruebas/` y tiene que acabar en
`N de N en orden`. Si falla, se arregla antes de seguir (ver la skill
`verificar-sitio`). Si el cambio trae algo que ninguna prueba mira, se le
agrega un caso en `pruebas/casos/` y entra en el mismo commit.

## 3. Commitear

Solo los archivos del paso 1, por nombre (nunca `git add -A`, `git add .` ni
`git commit -a`: puede haber otra sesion con cambios a medias). Lo mas seguro
es `git commit -m "..." -- <rutas>`. Mensaje en espanol, una linea que diga
que cambia para quien usa el sitio, en el estilo de `git log --oneline -5`, y
al final la linea `Co-Authored-By` que pida el sistema.

## 4. Pasar el CI en local

```bash
bash .claude/skills/publicar/ci-local.sh
```

Corre lo mismo que `.github/workflows/ci-cd.yml`, leido del propio archivo:
el paso "Construir" (build sin avisos), el paso "Validar catalogo, fotos y
textos" y, en vez de solo la prueba de humo del CI, **todas** las pruebas de
navegador (`npm run probar`, con Edge). Si falta `node_modules` o el
`package-lock.json` es mas nuevo, hace `npm ci`. Va despues del commit porque
`git diff --check` mira lo que queda sin commitear. Tarda unos 7 minutos. Lo
que mas lo tumba:

- **La palabra prohibida**: el CI rechaza `cafe`, `cafeteria`, `coctel` (con o
  sin tilde) en `index.html`, `src/` (todo), `assets/css/` y
  `data/productos.json`, **tambien dentro de comentarios y ejemplos**.
- Un aviso de `npm run build` (un import que no se resuelve, un trozo de mas de
  500 kB).
- Un producto que no pasa `revisar()` (`src/servicios/reglasCatalogo.js`), una
  categoria que no esta en `CATEGORIAS` (
  `src/catalogo/categorias.js`) o al reves,
  o una foto del catalogo sin su `-420.jpg` o `-840.jpg`.
- Una prueba de `pruebas/` que falla: el resumen del final dice cual.
- Espacios al final de linea (`git diff --check`).

Si falla, se arregla y se corrige el commit (todavia no se ha pusheado, asi que
`git commit --amend` esta bien aqui).

## 5. Pushear a efra

```bash
git branch --show-current          # efra
git push origin efra
```

Con eso el cambio queda guardado en el fork. No esta en la pagina: no digas
"publicado".

## 6. Confirmar en vivo (despues de la seccion 7)

`Validar y publicar sitio` corre en `upstream` con `validate` (instala,
construye sin avisos, valida catalogo y textos, prueba de humo en Chrome) y
`deploy` (vuelve a construir y sube `dist/` a Pages). Esperar a que termine
el run del commit pusheado:

```bash
git rev-parse main
curl -s "https://api.github.com/repos/arielnoob24/Panaderia/actions/runs?branch=main&per_page=5" \
  | grep -E '"(head_sha|status|conclusion|html_url)"'
```

Se repite (con Monitor, no con sleep) hasta que el run cuyo `head_sha` es ese
commit tenga `"status": "completed"`. Si `conclusion` no es `success`, se abre
su `html_url` para ver el log, se arregla en `efra` con un commit nuevo (lo
pusheado no se reescribe) y se vuelve a la seccion 7.

Con el run en verde, Pages tarda un minuto. La huella del JS servido tiene que
ser distinta de la que habia antes de subir (se anota antes del push):

```bash
curl -s https://arielnoob24.github.io/Panaderia/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'
```

Si el cambio solo toco `.claude/` u otros archivos que no entran a `dist/`,
la huella no cambia y basta con el run en verde. Despues abrir la pagina:
portada, tienda, canasta y cuenta.

## 7. Subir a la pagina (solo cuando el usuario lo pide)

`efra` ya esta commiteada, con el CI local en verde y pusheada (pasos 1 a 5).
Primero se trae lo que `main` del original haya recibido por otro lado:

```bash
git fetch origin && git fetch upstream
git switch efra
git merge upstream/main        # si alguien subio algo, entra aqui
                               # y los conflictos se resuelven en efra
```

Si ese merge trajo algo, se vuelve a verificar (`verificar-sitio` y el CI
local del paso 4) y se pushea `efra`. Despues `main` avanza en linea recta y
se sube a los dos repos:

```bash
curl -s https://arielnoob24.github.io/Panaderia/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'   # huella de antes
git switch main
git merge --ff-only upstream/main   # main local al dia con el original
git merge --ff-only efra            # si no avanza en linea recta, parar y avisar
git push upstream main              # esto publica
git push origin main                # el fork queda igual
git switch efra
```

Y el paso 6. Al usuario se le dice que quedo en la pagina solo cuando el run
de ese commit termino en verde y la pagina sirve lo nuevo.
