---
name: verificar-sitio
description: Construye el sitio de la panaderia (npm run build, sin avisos) y le pasa sus pruebas de navegador en Edge (npm run probar) - portada, tienda, canasta, pago, cuenta, Atras y Adelante, en escritorio y en el telefono. Usala despues de tocar src/, index.html, assets/, data/productos.json o vite.config.js, y siempre antes de commitear, porque un build que sale bien no prueba que la pagina arranque.
---

# Verificar que el sitio arranca

Que `npm run build` salga bien no dice que la pagina funcione: un `const`
usado antes de declararse, un modulo que revienta al evaluarse o un producto
mal escrito en el catalogo dejan la pagina sin tienda y el build igual de
verde. Por eso se abre lo construido en un navegador de verdad.

## Como se corre

En la raiz del repo:

```bash
npm run build          # sin avisos: el CI falla si hay alguno
npm run probar         # todas las pruebas, unos 7 minutos
npm run probar -- humo # solo la rapida (unos 5 s), la que corre el CI
```

La primera vez instala `playwright-core` en `%LOCALAPPDATA%\panaderia-herramientas`
(fuera del repo y de `package.json`). Usa Edge, que ya viene con Windows, asi
que no baja ningun Chromium.

## Que comprueba

`npm run probar` sirve una copia de `dist/` en un puerto libre, abre Edge y
corre los casos de `pruebas/casos/` uno tras otro, con `humo` primero:

- `humo`: la portada arranca con su `h1` y la cinta de categorias, la tienda
  tiene una ficha por producto de `data/productos.json`, agregar deja una
  linea en la canasta, y crear una cuenta con el codigo del recuadro llega a
  `#/cuenta` con la contrasena sin guardar en claro.
- Los demas: la cuenta entera, verificar y reenviar el codigo, recuperar la
  contrasena, Mis pedidos y "Pedir lo mismo otra vez", la ficha de la
  cabecera, el movimiento, Atras y Adelante entre vistas y categorias, la
  forma de pago, la cedula y el RUC, pegar el telefono, la barra de deshacer
  y la hoja de pagar en pantallas bajas.
- En todos: ningun error de pagina ni de consola, y ningun 404 de un archivo
  propio. Nada sale a internet (EmailJS y el mapa van cortados).

Al final saca un resumen (`N de N en orden`) y sale con codigo 1 si alguno
falla.

- Varios a la vez: `npm run probar -- cuenta recuperar`.
- La lista con lo que mira cada uno: `npm run probar -- --lista`.
- Prueba lo construido: si `src/` es mas nuevo que `dist/`, avisa. Corre
  `npm run build` antes.
- Otro navegador: `NAVEGADOR=chrome` (o `chromium`, o `NAVEGADOR_RUTA=...`).

## Al leer los fallos

- Si **todos** los casos fallan a la vez, no son muchos fallos: es uno solo
  que tumbo el arranque. Busca el mensaje de error (`Cannot access ... before
  initialization`, `Failed to fetch dynamically imported module`...) y empieza
  por ahi.
- El mensaje dice la ventana (`[escritorio]`, `[movil]`...) y que se
  esperaba. `se corto: ... Timeout` es un selector que ya no existe o una
  vista que no llego; `404 en http://...` o `error de pagina`, algo que no
  cargo.
- Si cambias a proposito la estructura (otro numero de pasos, otra clase),
  ajusta el caso en el mismo commit; no lo borres.

## Para probar algo concreto

- Un caso nuevo en `pruebas/casos/<nombre>.mjs`, con el arranque comun
  (`t.contexto(...)`, `t.ok(...)`, ayudas de `arranque.mjs` como
  `crearCuenta` o `meterPedidos`; ver la cabecera de `probar.mjs`). Se
  commitea con el cambio, para que quede probado despues.
- No fiarse de `(hover: hover)` para simular tactil: usar `hasTouch: true, isMobile: true`
  (`VENTANAS.movil`).
