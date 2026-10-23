# Panaderia El Tradicional

Sitio de una panaderia de Tena: catalogo, canasta, pago simulado, comprobante y
cuenta de cliente. Esta hecho en React, se construye con Vite y se publica en
GitHub Pages. No hay servidor detras: todo corre en el navegador.

- En internet: https://arielnoob24.github.io/Panaderia/
- El sitio que se presento antes de pasar a React queda en la etiqueta git
  `sitio-presentado`.

## Como esta repartido

```
index.html              la pagina: metadatos, JSON-LD y el aviso sin JavaScript
package.json            dependencias con version exacta y los scripts
vite.config.js          la configuracion de Vite
src/
  main.jsx, App.jsx     el arranque y las vistas
  vistas/               Inicio, Nosotros y Contacto
  catalogo/             la portada, la cinta, la tienda, sus filtros y las fichas
  pedido/               la canasta, confirmar el pedido, el pago y el comprobante
  cuenta/               iniciar sesion, crear cuenta, verificar, recuperar la
                        contrasena, Mis datos y Mis pedidos
  comun/                cabecera, avisos, foco, rutas y horario
  estado/               el estado del pedido y de la sesion (Context + useReducer)
  servicios/            las reglas, sin interfaz: catalogo, cobro, cuenta,
                        guardado y correo
  estilos/              estilos de las vistas y de la cuenta
assets/
  css/styles.css        los estilos base: colores, tipografia, componentes
  img/                  logo, mascota y fotos de portada e historia
    productos/          las fotos del catalogo, cada una en 420 y 840 px
data/
  productos.json        el catalogo: nombre, precio, foto, categoria y tamanos
pruebas/                pruebas de navegador (npm run probar)
bd/                     la base de datos en PostgreSQL
.github/workflows/      el CI: valida, prueba y publica
.claude/                agentes, skills y plan.md (como debe funcionar todo)
```

## Con que esta hecho

- **React 19** con componentes de funcion y hooks; el estado compartido va en
  `Context` + `useReducer`, con reductores puros.
- **React Router 7** con `HashRouter`: cada opcion del menu es una vista
  (`#/`, `#/nosotros`, `#/tienda-panes`, `#/contacto`, `#/cuenta`...), asi que
  Atras y Adelante funcionan y no hay que desplazarse por una pagina larga.
- **Motion** para el movimiento: el cambio de vista, el contador y las lineas
  de la canasta, los pasos de la cuenta. Todo se apaga con
  `prefers-reduced-motion`.
- **Vite 8** para desarrollar y construir. La cuenta y el pago se cargan aparte,
  solo cuando hacen falta.
- **EmailJS** para el codigo de verificacion, el de recuperar la contrasena y
  el comprobante.

Las fotos estan en el repositorio y no en un CDN. Lo unico que sale por red,
aparte de la pagina, es el correo y el mapa de Google en Contacto.

## Para verlo en tu maquina

Hace falta Node 24.

```sh
npm ci            # instala las dependencias exactas de package-lock.json
npm run dev       # servidor de desarrollo, se recarga al guardar
npm run build     # construye el sitio en dist/
npm run preview   # sirve dist/ como lo serviria GitHub Pages
```

Con doble clic en `index.html` no funciona: es una aplicacion de React y se
abre por HTTP.

## Pruebas

```sh
npm run probar            # todas las pruebas de navegador, contra dist/
npm run probar -- humo    # solo una
```

Recorren la portada, la tienda, la canasta, el pago, la cuenta y Atras y
Adelante, en escritorio y en el telefono. Usan `playwright-core` con Edge (o
Chrome con `NAVEGADOR=chrome`), instalado fuera del repositorio en
`%LOCALAPPDATA%\panaderia-herramientas`.

El CI de GitHub, en cada push: instala, construye sin avisos, revisa cada
producto del catalogo, que esten sus fotos, que no haya palabras prohibidas, y
corre la prueba `humo` en Chrome. Solo en `main` publica `dist/` en Pages.

## Para tocar el catalogo

Meter, quitar o cambiar un producto es editar `data/productos.json`. Cada
producto necesita `nombre`, `categoria`, `precio`, `foto` y `alt`;
`disponible: false` lo marca como agotado, `etiqueta` le pone el sello de
color, `tamanos` le da varias medidas con su precio y `destacado` se guarda
pero hoy el sitio no lo usa.

El campo `foto` es la raiz del nombre del archivo, sin ancho ni extension: de
`assets/img/productos/pan-redondo` salen `pan-redondo-420.jpg` y
`pan-redondo-840.jpg`, y el navegador elige la que le cabe. El CI comprueba que
esten las dos.

La categoria tiene que estar en `src/catalogo/categorias.js` (el menu Tienda);
si no, sus productos quedan inalcanzables y el CI no publica.

## Donde se guarda cada cosa

Sin servidor, lo que sobrevive a cerrar la pagina se queda en el navegador. Se
usan los cuatro mecanismos, cada uno por lo que tiene que durar el dato. Las
funciones estan en `src/servicios/storage.js`.

| Donde | Que guarda | Por que ahi |
| --- | --- | --- |
| `localStorage` | El pedido a medias (lineas, entrega, direccion y factura) y la cuenta. | Tiene que seguir ahi manana. |
| `sessionStorage` | El orden del catalogo y "solo los disponibles". | Dura lo que dura la pestana: volver otro dia empieza limpio. |
| `IndexedDB` | Los pedidos pagados, con su recibo y el correo de la cuenta. Base `eltradicional`, almacen `pedidos`, clave el numero. | Son registros que se acumulan y se buscan por numero. |
| Cookie | Cuando se guardo por ultima vez (`eltradicional-guardado`, un mes, `SameSite=Lax`). | Es un dato corto que caduca solo; la canasta la ensena. |

Cada lectura y escritura va en su `try`/`catch`: en una ventana privada
escribir puede fallar, y eso no puede tumbar la pagina.

## Accesibilidad

El objetivo es WCAG 2.2 nivel AA, y axe no encuentra fallos automaticos.

- **Teclado.** Todo se usa sin raton. La canasta atrapa el foco, se cierra con
  `Escape` y lo devuelve al boton. El menu Tienda y la ficha de la cuenta se
  recorren con las flechas. Al cambiar de vista el foco va al titulo.
- **Foco visible** con un anillo propio y `:focus-visible`.
- **ARIA donde hace falta y no mas**: `role="dialog"` con `aria-modal`,
  `aria-expanded`, `aria-current`, `aria-live="polite"` en los avisos y
  `aria-hidden` en lo decorativo.
- **Errores de formulario** con `aria-invalid` y `aria-describedby`, que dicen
  que fallo y como arreglarlo.
- **Contraste** medido: 12,4:1 el texto principal; los dibujos de fondo no lo
  bajan de AA.
- **Movimiento** que se apaga con `prefers-reduced-motion`.

## Lo que esta simulado

El cobro no existe: no se procesa ningun pago y la tarjeta no se guarda ni se
envia. La cuenta vive solo en el navegador donde se creo, y de la contrasena
solo se guarda su huella (PBKDF2 con sal). Los correos si salen de verdad, por
EmailJS; las claves estan en `src/servicios/mail.js` y son publicas por diseno
(las protege la lista de dominios del panel de EmailJS).
