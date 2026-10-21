---
name: publicar
description: Sube un cambio del sitio de la panaderia a GitHub Pages - empaqueta, sube el cache-buster, pasa el CI en local, verifica la pagina, commitea solo lo tocado, pushea a la rama de trabajo (mejoras) y espera al workflow; a main solo cuando el usuario pide llevarlo al sitio. Usala al terminar cualquier cambio del sitio; el usuario quiere que todo se suba sin preguntar.
---

# Publicar en GitHub Pages

El proyecto ya se presento. `main` es lo entregado y lo que sirve Pages
(https://arielnoob24.github.io/Panaderia/); las mejoras van en la rama
`mejoras`. Cada cambio se commitea y se pushea a esa rama sin preguntar,
siguiendo estos pasos en orden. Pasarlo a `main` (y por tanto al sitio) solo
cuando el usuario lo pida: `git switch main && git merge mejoras` y despues los
pasos 5 a 7 sobre `main`.

## 1. Ver que se toco

```bash
git status --short
```

Solo entran los archivos del cambio. **No** commitear lo que no es tuyo ni del
cambio: PDFs de la clase,
`GUIA_PARA_EXPLICAR.md`, `auditoria*.md` u otros `.md` sueltos sin seguimiento.

## 2. Regenerar lo que depende del cambio

- Se toco `js/` o `data/productos.json` → `node herramientas/empaquetar.mjs`
  (regenera `js/sin-servidor.js`; el CI no publica si no esta al dia).
- Se toco `assets/css/styles.css` → subir el `?v=` del `<link rel="stylesheet">` en
  `index.html`.
- Se toco `js/` → subir el `?v=` de `js/app.js` **y** el de `js/sin-servidor.js`
  en el `<script>` del final de `index.html`.

El `?v=` lleva una palabra del cambio y la fecha: `fila-20261008`. Sin eso el
navegador sigue sirviendo el archivo viejo desde su cache.

En `react/` no hay `?v=`: Vite pone la huella en el nombre de cada archivo.

## 3. Revisar antes de commitear

```bash
node .claude/skills/verificar-sitio/verificar.mjs
cd react && npm run build && npm run probar   # unos 7 minutos
```

Las dos versiones, aunque el cambio sea solo de una: `react/` usa el catalogo,
las fotos y reglas de `js/`. El build sin avisos; `npm run probar` corre todas
las pruebas de `react/pruebas/` y tiene que acabar en `N de N en orden`. Si
falla, se arregla antes de seguir (ver la skill `verificar-sitio`). Si el
cambio trae algo que ninguna prueba mira, se le agrega un caso en
`react/pruebas/casos/` y entra en el mismo commit.

## 4. Commitear

Solo los archivos del paso 1, por nombre (nunca `git add -A` ni `git add .`).
Mensaje en espanol, una linea que diga que cambia para quien usa el sitio, en el
estilo de `git log --oneline -5`, y al final la linea `Co-Authored-By` que pida
el sistema.

## 5. Pasar el CI en local

```bash
bash .claude/skills/publicar/ci-local.sh
```

Corre lo mismo que `.github/workflows/ci-cd.yml`, leido del propio archivo:
el paso de validacion del sitio actual, el build de React (sin avisos y sin las
palabras prohibidas en `react/`) y, en vez de solo la prueba de humo del CI,
**todas** las pruebas de navegador (`npm run probar`, con Edge). Si falta
`react/node_modules`, hace `npm ci`. Va despues del commit porque el CI compara
`js/sin-servidor.js` con lo commiteado. Tarda unos 7 minutos. Lo que mas lo
tumba:

- **La palabra prohibida**: el CI rechaza `cafe`, `cafeteria`, `coctel` (con o sin
  tilde) en `index.html`, `assets/css/styles.css`, `data/productos.json`, `js/*.js`,
  `react/index.html` y `react/src` (JS, JSX y CSS), **tambien dentro de
  comentarios y ejemplos**.
- Un aviso de `npm run build` (un import que no se resuelve, un trozo de mas de
  500 kB).
- Una prueba de `react/pruebas/` que falla: el resumen del final dice cual.
- Espacios al final de linea (`git diff --check`).
- Una foto del catalogo sin su `-420.jpg` o `-840.jpg`.

Si falla, se arregla y se corrige el commit (todavia no se ha pusheado, asi que
`git commit --amend` esta bien aqui).

## 6. Pushear y esperar

```bash
git branch --show-current          # mejoras, salvo que el usuario pidiera main
git push origin HEAD
gh run list --limit 1
gh run watch <id> --exit-status
```

No digas que esta subido hasta que el workflow `Validar y publicar sitio`
termine en verde. En `mejoras` solo valida; el job de publicar solo corre en
`main`. Si falla, `gh run view <id> --log-failed`, arreglar y volver a
publicar con un commit nuevo (lo pusheado no se reescribe).

En GitHub el job valida el sitio actual, construye React sin avisos y pasa la
prueba de humo (`npm run probar -- humo`) en el Chrome del runner; si falla
solo la de humo, su log dice que comprobacion fue.

## 7. Confirmar en vivo (solo si se pusheo a main)

Pages tarda un minuto en servir lo nuevo. Comprobar contra la URL publicada que
el cambio esta (por ejemplo, que `index.html` ya trae el `?v=` nuevo):

```bash
curl -s https://arielnoob24.github.io/Panaderia/ | grep -o '?v=[a-z0-9-]*' | sort -u
```
