---
name: verificar-sitio
description: Abre la pagina de la panaderia en Edge (por HTTP y con doble clic) y comprueba que el JavaScript arranco de verdad - fichas, canasta, checkout, cuenta y el atras del navegador. Usala despues de tocar js/, index.html o data/productos.json y siempre antes de commitear, porque node --check no ve los errores que dejan la pagina muerta.
---

# Verificar que el sitio arranca

`node --check` (lo que hace el CI) solo mira la sintaxis. Un `const` usado antes
de declararse, un modulo que revienta al evaluarse o un import con otra mayuscula
dejan la pagina sin JavaScript, el CI pasa y Pages publica una pagina inerte.

## Como se corre

Desde la raiz del repo:

```bash
node herramientas/empaquetar.mjs            # si se toco js/ o el catalogo
node .claude/skills/verificar-sitio/verificar.mjs
```

La primera vez instala `playwright-core` en `%LOCALAPPDATA%\panaderia-herramientas`
(fuera del repo, para no subir `node_modules` a Pages). Usa Edge, que ya viene
con Windows, asi que no baja ningun Chromium.

## Que comprueba

En tres pasadas: HTTP en escritorio, HTTP en movil (tactil, 390 px) y `file://`
(doble clic, que carga `js/sin-servidor.js` en vez de los modulos):

- tantas `.product-card` como productos trae `data/productos.json`
- `.canasta-paso` dentro de `.canasta-panel`
- `#contenido > #confirmar` existe, esta escondido y tiene 2 `.checkout-paso`
- se armaron los `.cuenta-paso` y la `.nav-cuenta`
- pulsar el primer `.card-mas` deja una `.canasta-linea`
- entrar en `#tienda-<categoria>` y volver con el atras deja la portada entera
- ningun error de pagina ni de consola

Sale con codigo 1 y la lista de fallos si algo no cuadra.

## Al leer los fallos

- Si **todas** las comprobaciones fallan a la vez, no son muchos fallos: es uno
  solo que tumbo el arranque. Busca el mensaje de error (`Cannot access ... before
  initialization`, `Failed to fetch dynamically imported module`...) y empieza por ahi.
- Si solo falla `doble clic`, casi siempre es que `js/sin-servidor.js` no esta al
  dia: corre `node herramientas/empaquetar.mjs` y vuelve a probar.
- Si cambias a proposito la estructura (otro numero de pasos, otra clase), ajusta
  la comprobacion en `verificar.mjs` en el mismo commit; no la borres.

## Para probar algo concreto

Para un cambio que el recorrido general no toca (un boton nuevo, un aviso de la
cuenta), escribe un script aparte en el scratchpad con el mismo arranque:
`createRequire` hacia `%LOCALAPPDATA%\panaderia-herramientas`,
`chromium.launch({ channel: 'msedge' })` y `pagina.on('pageerror', ...)`. No
fiarse de `(hover: hover)` para simular tactil: usar `hasTouch: true, isMobile: true`.
