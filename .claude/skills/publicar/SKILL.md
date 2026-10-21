---
name: publicar
description: Sube un cambio del sitio de la panaderia a GitHub Pages - verifica el build y las pruebas, commitea solo lo tocado, pasa el CI en local, pushea a la rama de trabajo (mejoras) y espera al workflow; a main solo cuando el usuario pide llevarlo al sitio. Usala al terminar cualquier cambio del sitio; el usuario quiere que todo se suba sin preguntar.
---

# Publicar en GitHub Pages

El proyecto ya se presento. `main` es lo que sirve Pages
(https://arielnoob24.github.io/Panaderia/); las mejoras van en la rama
`mejoras`. Cada cambio se commitea y se pushea a esa rama sin preguntar,
siguiendo estos pasos en orden. Pasarlo a `main` (y por tanto al sitio) solo
cuando el usuario lo pida: `git switch main && git merge mejoras` y despues los
pasos 4 a 6 sobre `main`.

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
  categoria que no esta en el menu Tienda (`CATEGORIAS` de
  `src/catalogo/categorias.js`) o al reves, menos de 4 destacados disponibles,
  o una foto del catalogo sin su `-420.jpg` o `-840.jpg`.
- Una prueba de `pruebas/` que falla: el resumen del final dice cual.
- Espacios al final de linea (`git diff --check`).

Si falla, se arregla y se corrige el commit (todavia no se ha pusheado, asi que
`git commit --amend` esta bien aqui).

## 5. Pushear y esperar

```bash
git branch --show-current          # mejoras, salvo que el usuario pidiera main
git push origin HEAD
gh run list --limit 1
gh run watch <id> --exit-status
```

No digas que esta subido hasta que el workflow `Validar y publicar sitio`
termine en verde. En `mejoras` solo valida; el job de publicar (`deploy`) solo
corre en `main`. Si falla, `gh run view <id> --log-failed`, arreglar y volver
a publicar con un commit nuevo (lo pusheado no se reescribe).

En GitHub, `validate` instala, construye sin avisos, valida el catalogo y los
textos y pasa la prueba de humo (`npm run probar -- humo`) en el Chrome del
runner; si falla solo la de humo, su log dice que comprobacion fue. `deploy`
vuelve a construir y sube `dist/` a Pages.

## 6. Confirmar en vivo (solo si se pusheo a main)

Pages tarda un minuto en servir lo nuevo. Comprobar contra la URL publicada
que el `index.html` servido pide el JS que construyo el job `deploy` de ese
run (en Windows los saltos de linea cambian la huella, asi que no se compara
con un build local):

```bash
curl -s https://arielnoob24.github.io/Panaderia/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'
gh run view <id> --log | grep -o 'assets/index-[A-Za-z0-9_-]*\.js' | sort -u
```

Y abrirla: portada, tienda, canasta y cuenta.
