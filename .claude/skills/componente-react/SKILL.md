---
name: componente-react
description: Convenciones para escribir el sitio de la panaderia en React - donde va cada archivo de src/, como se nombran componentes, hooks y acciones, como se maneja el estado, que se conserva del sitio presentado (clases CSS, ARIA, rutas, reglas, lo guardado) y como se prueba. Usala al crear o cambiar cualquier componente, hook o contexto de src/.
---

# Componentes de React en El Tradicional

Lo que cada parte debe hacer esta en las secciones 4 a 11 de
`.claude/plan.md`; la historia de la migracion, en la 15. Esta skill dice
**como se escribe**.

## Donde va cada cosa

```
package.json, vite.config.js, index.html   en la raiz del repo
src/
  main.jsx          monta <App /> dentro de HashRouter y los proveedores
  App.jsx           las rutas
  estado/           contextos y reductores (PedidoProvider, SesionProvider)
  servicios/        lo que no es interfaz: catalogo.js, reglasCatalogo.js,
                    storage.js, mail.js, cobro.js, cuenta.js, horario.js
  comun/            hooks y piezas de todas las zonas (useAtraparFoco, Avisos, Globo)
  catalogo/         FichaProducto, Catalogo, MasPedidos, categorias.js...
  pedido/           Canasta, LineaCanasta, Confirmar, Comprobante...
  cuenta/           Entrar, CrearCuenta, Verificar, MisDatos, MisPedidos, FichaCuenta
  vistas/           Inicio, Nosotros, Contacto
  estilos/          lo que va despues de assets/css/styles.css
pruebas/            las pruebas de navegador (npm run probar)
```

- Las zonas (`comun`, `catalogo`, `pedido`, `cuenta`) son las del sitio
  presentado, para que se encuentre lo mismo en el mismo sitio.
- Nada de archivos `index.js` que reexportan: se importa del archivo directo.
- Fotos, hoja de estilos y catalogo viven en `assets/` y `data/productos.json`
  y **no se copian** a `src/`: se importan desde la raiz del proyecto
  (`import logo from '/assets/img/logo.png'`, `'/data/productos.json'`), que
  es como Vite entiende una ruta que empieza por barra.
- Lo que tenga que correr tambien con node (el CI, una prueba) no usa nada de
  Vite (`import.meta.glob`, JSON importado): por eso `revisar()` vive en
  `servicios/reglasCatalogo.js` y no en `catalogo.js`.

## Nombres

- Componentes en PascalCase y en espanol: `FichaProducto.jsx`, `BotonCanasta.jsx`.
  Un componente por archivo, el archivo se llama como el componente.
- Hooks: `useAlgo` (`usePedido`, `useAtraparFoco`, `useHorario`).
- Acciones del reductor en espanol y en infinitivo: `{ tipo: 'agregar', id, cantidad }`.
- Sin tildes en el codigo; comentarios que explican el por que.
- Nunca las palabras de cafeteria, cafe ni coctel, ni en comentarios.

## Lo que se conserva del sitio presentado

- **Las mismas clases CSS** y la misma estructura de HTML: `styles.css` se
  importa tal cual y tiene que seguir aplicando. Si un componente necesita otra
  estructura, se cambia el CSS en el mismo commit.
- **El mismo ARIA**: `role="dialog"` + `aria-modal`, `aria-expanded`,
  `aria-controls`, `aria-live`, `aria-invalid` + `aria-describedby`, `inert`
  detras de los paneles. El foco se mueve con `ref`, no con `querySelector`.
- **Las mismas rutas** (`#/tienda-*`, `#/confirmar`, `#/comprobante`, y las de
  antes sin barra siguen entrando) con React Router, y el mismo comportamiento
  de Atras. Las redirecciones de una vista que no corresponde van con
  `replace`.
- **Las mismas reglas**: `revisar()` del catalogo, Luhn, cedula/RUC, PBKDF2,
  los cuatro almacenamientos. Viven en `servicios/`; no se reescriben de
  memoria.
- **Lo guardado no cambia**: mismas claves y formatos de `localStorage`,
  IndexedDB y la cookie, para que nadie pierda su canasta, su cuenta ni sus
  pedidos.
- Los mismos textos que ve el usuario, salvo que el plan diga otra cosa.

## Estado

- `Context` + `useReducer`. El reductor es una funcion pura, sin
  `localStorage` ni `fetch` dentro.
- Lo que se puede calcular (subtotal, unidades, si se puede pedir) se calcula
  al pintar, no se guarda en el estado ni se sincroniza con un efecto.
- `useEffect` solo para sincronizar con lo de fuera: guardar en
  `localStorage`, escuchar `keydown` o `storage`, el intervalo del horario.
- Nada de `dangerouslySetInnerHTML`: JSX ya escapa los textos.

## Antes de dar algo por terminado

1. En la raiz del repo: `npm run build` sin errores ni avisos.
2. `npm run probar` (todas las pruebas de navegador de `pruebas/`, en Edge;
   `npm run probar -- <nombre>` para una). Lo que el cambio trae y ninguna
   prueba mira se comprueba con un caso nuevo en `pruebas/casos/<nombre>.mjs`
   (el arranque comun esta en `pruebas/arranque.mjs`), en escritorio y en
   movil (`VENTANAS.escritorio` y `VENTANAS.movil`, que es tactil a 390 px), y
   entra en el mismo commit. Nada de scripts sueltos en el scratchpad.
3. Si el cambio pide algo que el plan no dice, se para y se pregunta.
