---
name: publicar
description: Sube un cambio del sitio de la panaderia a GitHub Pages - empaqueta, sube el cache-buster, pasa el CI en local, verifica la pagina, commitea solo lo tocado, pushea a main y espera al workflow. Usala al terminar cualquier cambio del sitio; el usuario quiere que todo se publique sin preguntar.
---

# Publicar en GitHub Pages

El usuario mira el sitio publicado (https://arielnoob24.github.io/Panaderia/), no
el archivo local: un cambio que no esta en Pages para el no existe. Por eso cada
cambio del sitio se publica sin preguntar, siguiendo estos pasos en orden.

## 1. Ver que se toco

```bash
git status --short
```

Solo entran los archivos del cambio. **No** commitear lo que no es tuyo ni del
cambio: `.github/agents/*.agent.md` (los edita el usuario), PDFs de la clase,
`GUIA_PARA_EXPLICAR.md`, `auditoria*.md` u otros `.md` sueltos sin seguimiento.

## 2. Regenerar lo que depende del cambio

- Se toco `js/` o `data/productos.json` → `node herramientas/empaquetar.mjs`
  (regenera `js/sin-servidor.js`; el CI no publica si no esta al dia).
- Se toco `assets/styles.css` → subir el `?v=` del `<link rel="stylesheet">` en
  `index.html`.
- Se toco `js/` → subir el `?v=` de `js/app.js` **y** el de `js/sin-servidor.js`
  en el `<script>` del final de `index.html`.

El `?v=` lleva una palabra del cambio y la fecha: `fila-20261008`. Sin eso el
navegador sigue sirviendo el archivo viejo desde su cache.

## 3. Revisar antes de commitear

```bash
node .claude/skills/verificar-sitio/verificar.mjs
```

Si falla, se arregla antes de seguir (ver la skill `verificar-sitio`).

## 4. Commitear

Solo los archivos del paso 1, por nombre (nunca `git add -A` ni `git add .`).
Mensaje en espanol, una linea que diga que cambia para quien usa el sitio, en el
estilo de `git log --oneline -5`, y al final la linea `Co-Authored-By` que pida
el sistema.

## 5. Pasar el CI en local

```bash
bash .claude/skills/publicar/ci-local.sh
```

Corre el mismo paso de validacion de `.github/workflows/ci-cd.yml`, leido del
propio archivo. Va despues del commit porque el CI compara `js/sin-servidor.js`
con lo commiteado. Lo que mas lo tumba:

- **La palabra prohibida**: el CI rechaza `cafe`, `cafeteria`, `coctel` (con o sin
  tilde) en `index.html`, `assets/styles.css`, `data/productos.json` y `js/*.js`,
  **tambien dentro de comentarios y ejemplos**.
- Espacios al final de linea (`git diff --check`).
- Una foto del catalogo sin su `-420.jpg` o `-840.jpg`.

Si falla, se arregla y se corrige el commit (todavia no se ha pusheado, asi que
`git commit --amend` esta bien aqui).

## 6. Pushear y esperar

```bash
git push origin main
gh run list --limit 1
gh run watch <id> --exit-status
```

No digas que ya esta publicado hasta que el workflow `Validar y publicar sitio`
termine en verde. Si falla, `gh run view <id> --log-failed`, arreglar y volver a
publicar con un commit nuevo (lo pusheado no se reescribe).

## 7. Confirmar en vivo

Pages tarda un minuto en servir lo nuevo. Comprobar contra la URL publicada que
el cambio esta (por ejemplo, que `index.html` ya trae el `?v=` nuevo):

```bash
curl -s https://arielnoob24.github.io/Panaderia/ | grep -o '?v=[a-z0-9-]*' | sort -u
```
