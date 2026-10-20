---
name: componente-react
description: Convenciones para escribir la version en React del sitio de la panaderia (carpeta react/) - donde va cada archivo, como se nombran componentes, hooks y acciones, como se maneja el estado, que se conserva del sitio actual (clases CSS, ARIA, rutas, reglas) y como se prueba. Usala al crear o cambiar cualquier componente, hook o contexto de react/.
---

# Componentes de React en El Tradicional

La migracion esta descrita en la seccion 15 de `.claude/plan.md`; lo que cada
parte debe hacer, en las secciones 4 a 11. Esta skill dice **como se escribe**.

## Donde va cada cosa

```
react/
  package.json, vite.config.js, index.html
  src/
    main.jsx          monta <App /> dentro de HashRouter y los proveedores
    App.jsx           las rutas
    estado/           contextos y reductores (PedidoProvider, SesionProvider)
    servicios/        lo que no es interfaz: catalogo.js, storage.js, mail.js
    comun/            hooks y piezas de todas las zonas (useAtraparFoco, Avisos, Globo)
    catalogo/         FichaProducto, Mostrador, VistaCatalogo, Filtros...
    pedido/           Canasta, LineaCanasta, Confirmar, Comprobante...
    cuenta/           Entrar, CrearCuenta, Verificar, MisDatos, MisPedidos, FichaCuenta
```

- Las zonas son las mismas que en `js/` (`comun`, `catalogo`, `pedido`,
  `cuenta`) para que se encuentre lo mismo en el mismo sitio.
- Nada de archivos `index.js` que reexportan: se importa del archivo directo.
- Fotos y catalogo **no se copian** a `react/`: se leen de `assets/img/` y
  `data/productos.json` de la raiz (lo resuelve `vite.config.js`).

## Nombres

- Componentes en PascalCase y en espanol: `FichaProducto.jsx`, `BotonCanasta.jsx`.
  Un componente por archivo, el archivo se llama como el componente.
- Hooks: `useAlgo` (`usePedido`, `useAtraparFoco`, `useHorario`).
- Acciones del reductor en espanol y en infinitivo: `{ tipo: 'agregar', id, cantidad }`.
- Sin tildes en el codigo; comentarios que explican el por que, como en `js/`.
- Nunca las palabras de cafeteria, cafe ni coctel, ni en comentarios.

## Lo que se conserva del sitio actual

- **Las mismas clases CSS** y la misma estructura de HTML: `styles.css` se
  importa tal cual y tiene que seguir aplicando. Si un componente necesita otra
  estructura, se cambia el CSS en el mismo commit.
- **El mismo ARIA**: `role="dialog"` + `aria-modal`, `aria-expanded`,
  `aria-controls`, `aria-live`, `aria-invalid` + `aria-describedby`, `inert`
  detras de los paneles. El foco se mueve con `ref`, no con `querySelector`.
- **Las mismas rutas** (`#tienda-*`, `#confirmar`, `#comprobante`) con React
  Router, y el mismo comportamiento de Atras. Las vistas nuevas de la
  seccion 15 (`#/`, `#/nosotros`, `#/contacto`, `#/cuenta/*`) son solo de
  React; las redirecciones de una vista que no corresponde van con `replace`.
- **Las mismas reglas**: `revisar()` del catalogo, Luhn, cedula/RUC, PBKDF2,
  los cuatro almacenamientos. Se mueven a `servicios/` o se importan; no se
  reescriben de memoria.
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

1. Dentro de `react/`: `npm run build` sin errores ni avisos.
2. `npm run preview` y comprobar el cambio en Edge con un script de
   playwright-core en el scratchpad (mismo arranque que
   `.claude/skills/verificar-sitio/verificar.mjs`), en escritorio y en movil
   (`hasTouch: true, isMobile: true`, 390 px).
3. Comparar con el sitio actual: lo que se migro tiene que hacer lo mismo.
4. Si el cambio pide algo que el plan no dice, se para y se pregunta.
