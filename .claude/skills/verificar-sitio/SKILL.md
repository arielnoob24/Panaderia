---
name: verificar-sitio
description: Abre la pagina de la panaderia en Edge (por HTTP y con doble clic) y comprueba que el JavaScript arranco de verdad - fichas, canasta, checkout, cuenta y el atras del navegador; y construye la version en React (react/) y le pasa sus pruebas de navegador (npm run probar). Usala despues de tocar js/, index.html, data/productos.json o react/, y siempre antes de commitear, porque node --check no ve los errores que dejan la pagina muerta.
---

# Verificar que el sitio arranca

`node --check` (lo que hace el CI) solo mira la sintaxis. Un `const` usado antes
de declararse, un modulo que revienta al evaluarse o un import con otra mayuscula
dejan la pagina sin JavaScript, el CI pasa y Pages publica una pagina inerte.

## Como se corre

Desde la raiz del repo, las dos versiones (mientras dure la migracion se
comprueban siempre las dos: `react/` usa el catalogo, las fotos y varias
reglas de `js/`, asi que un cambio en uno puede romper el otro):

```bash
node herramientas/empaquetar.mjs            # si se toco js/ o el catalogo
node .claude/skills/verificar-sitio/verificar.mjs
cd react && npm run build && npm run probar  # la version en React
```

`npm run build` tiene que salir **sin avisos** (el CI falla si hay alguno).

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

## Las pruebas de React (`react/pruebas/`)

`npm run probar` sirve una copia de `react/dist` (y la raiz, para el sitio
actual) en puertos libres, abre Edge y corre los casos de
`react/pruebas/casos/` uno tras otro: la cuenta entera, verificar y reenviar
el codigo, recuperar la contrasena, Mis pedidos, la ficha de la cabecera, el
movimiento, Atras y Adelante, la forma de pago, pegar el telefono, y que la
cuenta se comparte con el sitio actual. Tarda unos 7 minutos y al final saca un
resumen; sale con codigo 1 si alguno falla.

- Uno solo: `npm run probar -- humo` (o varios: `-- cuenta recuperar`).
- La lista con lo que mira cada uno: `npm run probar -- --lista`.
- `humo` es el rapido (unos segundos) y el que corre el CI en Chrome.
- Prueba lo construido: si `src/` es mas nuevo que `dist/`, avisa. Corre
  `npm run build` antes.
- Otro navegador: `NAVEGADOR=chrome` (o `chromium`, o `NAVEGADOR_RUTA=...`).

## Al leer los fallos

- Si **todas** las comprobaciones fallan a la vez, no son muchos fallos: es uno
  solo que tumbo el arranque. Busca el mensaje de error (`Cannot access ... before
  initialization`, `Failed to fetch dynamically imported module`...) y empieza por ahi.
- Si solo falla `doble clic`, casi siempre es que `js/sin-servidor.js` no esta al
  dia: corre `node herramientas/empaquetar.mjs` y vuelve a probar.
- Si cambias a proposito la estructura (otro numero de pasos, otra clase), ajusta
  la comprobacion en `verificar.mjs` en el mismo commit; no la borres.

- Si falla un caso de React, el mensaje dice la ventana (`[escritorio]`,
  `[movil]`...) y que se esperaba. `se corto: ... Timeout` es un selector que ya
  no existe o una vista que no llego; `404 en http://...` o `error de pagina`,
  algo que no cargo.

## Para probar algo concreto

- **En React**: un caso nuevo en `react/pruebas/casos/<nombre>.mjs`, con el
  arranque comun (`t.contexto(...)`, `t.ok(...)`, ayudas de `arranque.mjs`
  como `crearCuenta` o `meterPedidos`; ver la cabecera de `probar.mjs`). Se
  commitea con el cambio, para que quede probado despues.
- **En el sitio actual**, para un cambio que el recorrido general no toca (un
  boton nuevo, un aviso de la cuenta), un script aparte en el scratchpad con el
  mismo arranque: `createRequire` hacia `%LOCALAPPDATA%\panaderia-herramientas`,
  `chromium.launch({ channel: 'msedge' })` y `pagina.on('pageerror', ...)`.
- No fiarse de `(hover: hover)` para simular tactil: usar `hasTouch: true, isMobile: true`.
