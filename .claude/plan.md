# Plan del sitio: El Tradicional

> Material de referencia del proyecto, no texto para entregar en un informe.
> Es la fuente de verdad de **cómo debe funcionar** el sitio. Los agentes de
> `.claude/agents/` lo leen antes de trabajar; si el código y este plan no
> coinciden, o se arregla el código o se actualiza el plan en el mismo commit.
>
> Cómo se trabaja (conversar → plan → agentes → skills → aplicar) está en
> `.claude/CLAUDE.md`. Las secciones 1 a 13 describen el sitio **como está
> hoy**; la 15 es el siguiente paso.

Última actualización: 19 de octubre de 2026.

---

## 1. Qué es

Sitio de la panadería y pastelería **El Tradicional** (Tena, Ecuador):
catálogo, canasta, pedido con pago simulado, comprobante y cuenta de cliente.
Proyecto de la materia Desarrollo de Plataformas.

- Publicado en GitHub Pages: https://arielnoob24.github.io/Panaderia/
- Dirección: esquina de Eloy Alfaro y Gabriel Espinosa, Tena.
- Horario: lunes a viernes 08:00–20:00; sábado y domingo 09:00–21:00.
- Teléfono, WhatsApp e Instagram son **de ejemplo** (el pie lo avisa).

## 2. Reglas que no se rompen

| Regla | Por qué |
|---|---|
| Sitio **estático**, sin servidor ni base de datos en internet | GitHub Pages solo sirve archivos |
| **Solo servicios gratis**, nada que pida tarjeta (ni SMS, ni WhatsApp Business, ni Firebase Blaze) | Proyecto de clase sin presupuesto |
| **Sin dependencias** en el navegador: lo que está en el repo es lo que corre | Se abre igual por HTTP y con doble clic |
| Tiene que funcionar **con doble clic** (`file://`) además de por HTTP | La profe puede abrirlo así |
| El CI rechaza las palabras de cafetería, café y cóctel, **también en comentarios** | Es una panadería; lo revisa `ci-cd.yml` |
| `main` es lo que se presentó y lo que sirve GitHub Pages; las mejoras van en la rama **`mejoras`** y se commitean y pushean ahí sin preguntar | El proyecto ya se entregó: lo publicado no cambia hasta fusionar `mejoras` en `main` |
| Los informes de clase admiten **máximo 5% de texto de IA** | Pasarse cuesta la mitad de la nota; lo que escribe Claude es referencia |

## 3. Cómo está repartido

```
index.html              la unica pagina; tiene que estar en la raiz para GitHub Pages
README.md               como verlo, tocarlo y publicarlo
assets/
  css/styles.css        todos los estilos
  img/                  logo, mascota, iconos y la foto de portada
    productos/          las fotos del catalogo, cada una en 420 y 840 px
data/
  productos.json        el catalogo: nombre, precio, foto, categoria y tamanos
js/
  app.js                el arranque: trae los datos y enciende lo demas
  sin-servidor.js       todo junto, con el catalogo dentro (generado; es lo
                        que corre al abrir index.html con doble clic)
  comun/                lo que usan todas las zonas
    state.js            lo que comparten los modulos, y el puente entre ellos
    storage.js          los cuatro sitios donde se guarda: local, session, IDB y cookie
    ui.js               barra, foco, cuadritos de ayuda, animaciones y horario
    mail.js             envio de correo por EmailJS
  catalogo/
    repo.js             lee y revisa data/productos.json
    view.js             pinta las fichas y manda el catalogo (orden, filtro, vistas)
  pedido/
    cart.js             la canasta: panel, lineas y control de cantidad
    checkout.js         pago simulado y comprobante
  cuenta/
    account.js          crear cuenta, verificar el correo y entrar
herramientas/
  empaquetar.mjs        genera js/sin-servidor.js
.github/workflows/      el CI: valida y publica
.claude/                agentes, skills, herramientas de Claude Code y plan.md
                        (como debe funcionar todo; lo leen los agentes)
```

### Cómo se llaman los módulos

```
index.html
  └── app.js  arranque
        ├── catalogo/repo.js     lee y valida data/productos.json
        ├── catalogo/view.js     fichas, mostrador, vista de catálogo, filtros, rutas
        ├── pedido/cart.js       canasta, pantalla de confirmar, control de cantidad
        │     └── pedido/checkout.js  pago simulado, factura, comprobante
        ├── cuenta/account.js    crear cuenta, verificar correo, entrar, datos, pedidos
        └── comun/ui.js          avisos aria-live, foco, menús, globo de ayuda, horario
  Todos usan comun/: state.js (datos compartidos y "puente"), storage.js, mail.js
  Cada carpeta importa las otras con rutas relativas (`../comun/state.js`).
```

- **El puente** (`state.js`): los módulos que se llaman en las dos direcciones
  cuelgan sus funciones en `puente` en vez de importarse mutuamente.
- **Doble clic**: el script del final de `index.html` carga `js/app.js` como
  módulo si es HTTP, o `js/sin-servidor.js` (todo junto, con el catálogo
  dentro) si es `file:`. En `file://` no hay cookies: el pie no dice cuándo se
  guardó, pero el pedido se guarda igual.
- **Orden de arranque** (`app.js`): cargar productos → pintar catálogo →
  controles de ficha → vigilar imágenes → canasta → cuenta → marca de guardado
  → horario (cada minuto). Si el catálogo falla, se avisa y la canasta y la
  cuenta siguen funcionando.

## 4. El catálogo

### Datos (`data/productos.json`)

Hoy: **17 productos** en 3 categorías (`panes` 6, `dulces` 5,
`bebidas-frias` 6), 8 marcados como destacados.

| Campo | Obligatorio | Regla |
|---|---|---|
| `nombre` | sí | Lo que se ve en la ficha |
| `categoria` | sí | Tiene que tener su `data-filtro` en el menú Tienda, y al revés |
| `precio` | sí | Número en dólares; con `tamanos`, igual al del primer tamaño |
| `foto` | sí | Raíz sin ancho ni extensión; existen `-420.jpg` (420×315) y `-840.jpg` (840×630) |
| `alt` | sí | Describe lo que se ve, no repite el nombre |
| `disponible` | no | `false` = agotado ("Vuelve mañana") |
| `etiqueta` | no | `{ color: green \| yellow, texto }`, sello redondo de 2–3 palabras |
| `tamanos` | no | `[{ valor, precio }]`; cada tamaño es una línea distinta en la canasta |
| `destacado` | no | `true` = entra en "Los más pedidos"; hacen falta al menos 4 disponibles |

`revisar()` de `js/catalogo/repo.js` valida cada producto; el sitio y el CI usan la
misma función. Tras tocar el JSON: `node herramientas/empaquetar.mjs`.

### Portada: "Los más pedidos"

- Fila horizontal con los destacados disponibles. Flechas, barra de avance y
  botón de pausa; la flecha de adelante, en el último, vuelve al primero.
- Avanza sola cada 4,2 s. Se para con el puntero, el dedo o el foco encima,
  mientras se agrega algo, con la pestaña oculta, con `prefers-reduced-motion`
  o con pausa.
- En el teléfono: flechas debajo, caben dos fichas, el botón de agregar va
  sobre la foto y la ficha no cambia de alto al agregar.

### Vista de catálogo

- Se entra por "Ver el menú", la palabra Tienda (catálogo entero) o una de sus
  categorías (catálogo con "Filtrar por" ya puesto).
- Rutas: `#tienda-catalogo`, `#tienda-panes`, `#tienda-dulces`,
  `#tienda-bebidas-frias`. Entrar usa `pushState`; cambiar el filtro a mano usa
  `replaceState`. El **Atrás** del navegador vuelve a la vista anterior.
- Controles: Filtrar por (chips: Todas + 3 categorías), buscador (sin tildes ni
  mayúsculas), Ordenar por, Mostrar (solo disponibles). Ordenar cambia la
  propiedad CSS `order`, no mueve el HTML.
- "Mostrando X de Y productos", anunciado por `aria-live`.
- Cada ficha: foto con `srcset`, categoría encima del nombre, sello, tamaños
  (radios), precio y control `− cantidad +` (máximo 100 por producto).
- Al agregar, la foto vuela a la canasta y se anuncia en la región de avisos.

## 5. La canasta

- Botón con icono y contador en la cabecera (en el teléfono flota abajo). Sin
  JavaScript es el enlace a WhatsApp.
- Panel lateral `aside role="dialog"`: atrapa el foco, se cierra con Esc o
  tocando fuera y devuelve el foco al botón.
- Cada línea: foto, −, cantidad, +, y una X que quita el producto entero. Con
  una unidad, el − pasa a basurero y pregunta "¿Lo quitamos?".
- **Deshacer** durante 12 s al quitar o al vaciar ("¿Quitamos todo lo que hay
  en la canasta?").
- "Ir a pagar" exige una **cuenta con el correo verificado**; si no la hay,
  aviso visible con "Crear cuenta o entrar".

## 6. Confirmar el pedido y pagar

- Es otra vista dentro de `<main>`: `#confirmar` y luego `#comprobante`
  (este con `replaceState`, para que Atrás no vuelva al pago ya hecho).
- Izquierda: retiro o domicilio (envío fijo **$1,50**), dirección, cómo paga
  (efectivo o tarjeta) y factura (a mi nombre o a otra persona). Sin mapa.
- Derecha, pegada al desplazar: lo que lleva, subtotal/envío/total, a qué
  correo llega el comprobante y "Confirmar".
- Validación: dirección → factura (cédula de 10 o RUC de 13, provincia 01–24)
  → tarjeta (Luhn, MM/AA no vencida, CVV de 3, titular). El foco va al primer
  error. Los errores salen al dejar el campo o al intentar pagar.
- Al aprobar (simula 1,5 s): número `ET-XXXX` sin letras confundibles,
  comprobante, correo, guardado en IndexedDB, se vacía la canasta guardada y se
  limpian tarjeta y factura.
- **El cobro no existe**: la tarjeta no se guarda ni se envía.

## 7. La cuenta

- Botón en la cabecera: fuera de sesión, silueta con "Iniciar sesión /
  Registrarse"; dentro, iniciales y ficha con "Editar mis datos" y "Ver mis
  pedidos (N)".
- Pasos del panel: `crear`, `verificar`, `entrar`, `sesion`, `editar`,
  `pedidos`.
- Crear: nombre con apellido, correo (el error dice exactamente qué falta),
  teléfono de 9 cifras que empieza por 9 (+593 delante), contraseña con 4
  requisitos visibles mientras se escribe, y repetirla. Botón "Mostrar" en
  cada contraseña.
- Verificar: código de 6 cifras por correo; 45 s entre envíos. Si EmailJS no
  está o falla, el código se enseña en pantalla en un recuadro que imita el
  correo.
- Entrar: correo (se revisa al salir del campo) y contraseña, que se compara
  por su huella **PBKDF2 con sal**. Errores distintos para "no hay cuenta" y
  "contraseña incorrecta" (aceptable porque la única cuenta es la de ese
  navegador).
- Editar: nombre, teléfono y dirección con las mismas reglas; el correo no se
  edita. Cerrar sesión no borra la cuenta.
- Pedidos: todo el historial de IndexedDB, más nuevo arriba, cada uno en un
  `<details>`.
- Enter en un campo pasa al siguiente; en el último, hace la acción.

## 8. Dónde se guarda cada cosa (`js/comun/storage.js`)

| Dónde | Qué | Por qué |
|---|---|---|
| `localStorage` | Pedido a medias, entrega, factura y la cuenta | Tiene que seguir mañana |
| `sessionStorage` | Orden y "Mostrar" del catálogo | Dura lo que la pestaña |
| IndexedDB `eltradicional/pedidos` | Pedidos pagados, clave = número | Registros que se acumulan |
| Cookie `eltradicional-guardado` | Fecha del último guardado (1 mes, `SameSite=Lax`) | Corta y caduca sola |

Todo va en `try/catch`: en ventana privada no puede tumbar la página.

## 9. Correo (`js/comun/mail.js`)

EmailJS (gratis): una sola plantilla para el código y el comprobante. Las
claves son públicas por diseño; las protege la lista de dominios del panel de
EmailJS. `enviarCorreo()` nunca lanza: si falla, el pedido sigue valiendo.

## 10. Aspecto y adaptación

- CSS con variables en `:root` (colores `--masa`, `--horno`, `--ambar`,
  `--corteza`, `--papel`; sombras, radios, duraciones y curvas).
- Contenido hasta 1440 px; la barra de arriba va de borde a borde, se pega al
  bajar 40 px y se invierte sobre secciones oscuras.
- Cortes en 900, 680 y 420 px. El hover solo con `(hover: hover) and (pointer: fine)`,
  pero en JS **no fiarse de esa media query**: el portátil del usuario es táctil
  y la da falsa; usar `pointerType`.
- Clases de estado puestas por JS: `is-open`, `is-loaded`, `is-loading`,
  `is-visible`, `is-fila`, `is-lleno`, `is-mal`, `is-dentro`.
- Cache-buster `?v=palabra-AAAAMMDD` en la hoja de estilos y en los dos
  scripts; se sube en cada cambio.

## 11. Accesibilidad (objetivo: WCAG 2.2 AA)

- Todo con teclado; paneles que atrapan el foco, Esc y devolución del foco;
  `inert` detrás de los paneles; menú Tienda con flechas; enlace de salto.
- Foco visible con anillo propio y `:focus-visible`.
- ARIA solo donde hace falta: `role="dialog"` + `aria-modal`, `aria-expanded`,
  `aria-controls`, `aria-live="polite"`, `aria-invalid` + `aria-describedby`.
- Contraste medido (texto 12,4:1; secundario 6,8:1; pie 11,1:1 y 8,7:1).
- `prefers-reduced-motion` apaga entradas, velos y desplazamiento suave.
- Objetivos táctiles de al menos 24 px (los botones de ficha, 44 px).

## 12. Calidad y publicación

1. Cambio en `js/` o en el catálogo → `node herramientas/empaquetar.mjs`.
2. Subir los `?v=` que toque.
3. `node .claude/skills/verificar-sitio/verificar.mjs` (Edge, HTTP, móvil y
   doble clic). `node --check` **no basta**.
4. Commit solo de los archivos del cambio, mensaje en español.
5. `bash .claude/skills/publicar/ci-local.sh`.
6. Push a la rama en la que se trabaja (`mejoras`) y esperar a que `Validar y publicar sitio` salga en verde. Solo un push a `main` publica en Pages; para llevar `mejoras` al sitio se fusiona en `main` cuando el usuario lo pida.

El CI comprueba: archivos principales, sintaxis de los módulos,
`sin-servidor.js` al día, imports con la mayúscula exacta, el catálogo con
`revisar()`, categorías ↔ menú Tienda, fotos en los dos anchos, portada,
al menos 4 destacados, palabras prohibidas y espacios al final de línea.

## 13. Pendiente

### Contenido y confianza
- [ ] Teléfono, WhatsApp e Instagram reales, o quitarlos del JSON-LD y de los enlaces.
- [ ] Ingredientes y alérgenos por producto (confirmados por el negocio).
- [ ] Unidad del precio (pieza, funda, docena).
- [ ] "Horneando ahora mismo" se deduce del horario, no de la realidad.

### Accesibilidad y UX
- [ ] Avisar que abren otra pestaña: botón flotante y "Pedir" de reserva sin JS.
- [ ] "Ver en el mapa" del pie mide 18 px de alto (mínimo 24).
- [ ] `user-select: none` en todo el `body`: no se puede copiar dirección ni precios.
- [ ] Probar la fila quieta por defecto en vez de que avance sola.
- [ ] Decir antes de llenar la canasta que pagar pide cuenta, o permitir invitado.
- [ ] Sección de contenidos de IHC en el agente de UX (cuando el usuario pase los temas).

### SEO
- [ ] `robots.txt` y `sitemap.xml`.
- [ ] Menú como dato estructurado (`Menu` / `Offer`).
- [ ] Tamaño de la imagen de Open Graph.
- [ ] "Tena" en el título y la descripción.

## 14. Agentes y skills

Los agentes viven en `.claude/agents/` y todos leen este plan primero.

| Agente | Se encarga de | Cambia archivos | Skills cargadas |
|---|---|---|---|
| `frontend` | `index.html`, `assets/css/styles.css`, `js/catalogo/view.js`, `js/comun/ui.js`, maquetación, responsive, animaciones | Sí | `verificar-sitio`, `wcag-audit-patterns`, `componente-react`, `vercel-react-best-practices`, `vercel-composition-patterns` |
| `logica-datos` | `js/comun/` (state, storage, mail), `js/catalogo/repo.js`, `js/pedido/`, `js/cuenta/`, el catálogo | Sí | `verificar-sitio`, `nielsen-usability-heuristics`, `componente-react`, `vercel-react-best-practices`, `vercel-composition-patterns` (+ sigue `nuevo-producto`) |
| `ux-accesibilidad` | WCAG 2.2, heurísticas de Nielsen, IHC, recorridos de usuario | No, solo informa | `wcag-audit-patterns`, `nielsen-usability-heuristics` (+ `.claude/herramientas/axe.mjs`) |
| `calidad-publicacion` | Revisión de código y seguridad, CI, empaquetar, subir a la rama | Solo lo de publicar | `verificar-sitio`, `publicar`, `vercel-react-best-practices` |

Skills en `.claude/skills/`:

| Skill | Origen | Quién la usa |
|---|---|---|
| `verificar-sitio` | propia | `frontend`, `logica-datos`, `calidad-publicacion` |
| `publicar` | propia | `calidad-publicacion` |
| `nuevo-producto` | propia, la invocas tú con `/nuevo-producto` | `logica-datos` sigue sus pasos |
| `notas-para-explicar` | propia, la invocas tú con `/notas-para-explicar` | — |
| `wcag-audit-patterns` | skills.sh, `wshobson/agents` | `ux-accesibilidad`, `frontend` |
| `nielsen-usability-heuristics` | skills.sh, `dembrandt/dembrandt-skills` | `ux-accesibilidad`, `logica-datos` |
| `componente-react` | propia: convenciones de `react/` | `frontend`, `logica-datos` |
| `vercel-react-best-practices` | skills.sh, `vercel-labs/agent-skills` (copiada a mano del commit `063bee9`) | `frontend`, `logica-datos`, `calidad-publicacion` |
| `vercel-composition-patterns` | skills.sh, `vercel-labs/agent-skills` (copiada a mano del commit `063bee9`) | `frontend`, `logica-datos` |

Las instaladas con el CLI quedan en `skills-lock.json` y `npx skills update -p`
las actualiza. Las dos de Vercel se copiaron a mano porque el CLI se colgaba con
ese repositorio: para actualizarlas, volver a copiarlas. Ojo: `npx skills use` **no instala**, solo genera un prompt de un
uso; para instalar es `npx skills add <repo> --skill <nombre> -a claude-code --copy`.

## 15. Migración a React (decidida, fase 1 en curso)

El 19 de octubre de 2026 el usuario eligió **React** para la siguiente versión.
Se hace en la rama `mejoras`; `main` sigue con el sitio presentado hasta que
el usuario pida fusionar. Mientras dure, las secciones 1 a 13 siguen siendo la
referencia de **qué** tiene que hacer el sitio: la versión en React tiene que
hacer lo mismo (mismas vistas, rutas, reglas, guardado y accesibilidad) antes
de reemplazar a la de ahora.

### Decisiones (confirmadas el 19 de octubre de 2026)

El sitio se va a publicar de verdad: se elige lo mejor para un sitio real, no
lo que pida la clase.

| Tema | Decisión | Por qué |
|---|---|---|
| Herramienta | **Vite** + React, en **JavaScript** (JSX), sin TypeScript por ahora | Vite es el arranque estándar de React; TypeScript se puede añadir después, cuando React ya se domine |
| Dónde | Carpeta `react/` con su propio `package.json` mientras se migra; en la fase 7 pasa a la raíz y se borra lo viejo | El sitio actual sigue funcionando y validándose durante la migración |
| Fotos y catálogo | `react/` usa `data/productos.json` y `assets/img/` de la raíz **sin copiarlos** (lo resuelve `vite.config.js`); `revisar()` se reutiliza | Una sola fuente de verdad; el CI ya la valida |
| Estado | `Context` + `useReducer` para pedido, entrega y sesión; sin Redux | El estado es pequeño; reemplaza a `state.js`, al `puente` y a los `pintar()` a mano |
| Rutas | **React Router** con `HashRouter`: las mismas `#tienda-*`, `#confirmar`, `#comprobante` | Es lo estándar; con `#` GitHub Pages no necesita el truco del 404 |
| Estilos | Se conserva `styles.css` y sus clases; nada de Tailwind ni Bootstrap | Es la identidad del sitio |
| Guardado y correo | La lógica de `storage.js` y `mail.js` se conserva, llamada desde hooks | Ya funcionan y no dependen de la interfaz |
| **Doble clic** | **Se deja.** La versión en React solo se sirve por HTTP; `js/sin-servidor.js` y `herramientas/empaquetar.mjs` desaparecen en la fase 7 | Un sitio publicado se abre por HTTP. Meter todo en un solo archivo quita la caché por archivo y hace la primera carga más pesada |
| Caché | Vite pone una huella en el nombre de cada archivo (`index-a1b2c3.js`): **se acaba el `?v=` a mano** | Lo hace solo y no se olvida |
| Publicar | El CI hace `npm ci && npm run build` en `react/` y valida; en la fase 7, publica `dist/` | `node_modules` nunca se publica |

Mientras dure la migración, las reglas de la sección 2 sobre doble clic y
"sin dependencias" siguen valiendo **para el sitio actual**, no para `react/`.

### Fases

1. **Andamiaje**: Vite + React en `react/`, `styles.css` importado, el
   catálogo cargado y una ficha pintada.
2. **Catálogo**: fichas, "Los más pedidos", vista de catálogo, filtros, orden,
   buscador y rutas `#tienda-*`.
3. **Canasta**: panel, cantidades, deshacer y vaciar, guardado en `localStorage`.
4. **Pedido y pago**: `#confirmar`, factura, tarjeta, comprobante e IndexedDB.
5. **Cuenta**: crear, verificar, entrar, editar, historial.
6. **Calidad**: `verificar-sitio`, `axe.mjs`, el CI y la skill `publicar`
   adaptados al *build*; revisión completa de `ux-accesibilidad`.
7. **Cambio**: `react/` pasa a la raíz, fuera `js/` y `herramientas/`, y el
   plan se reescribe para describir la versión en React.

Cada fase cierra con el sitio funcionando y la paridad comprobada con las
secciones 4 a 11.

### Reparto en `react/`

| Carpeta | Agente |
|---|---|
| `package.json`, `vite.config.js`, `index.html`, `main.jsx`, `App.jsx`, rutas | `frontend` |
| `src/comun/`, `src/catalogo/` | `frontend` |
| `src/estado/`, `src/servicios/`, `src/pedido/`, `src/cuenta/` | `logica-datos` |
| `npm run build`, CI, revisión de paridad | `calidad-publicacion` |
| Accesibilidad y UX de lo migrado | `ux-accesibilidad` |

Las skills de cada uno están en la sección 14. `verificar-sitio` y `publicar`
se adaptan al *build* de Vite en la fase 6.
