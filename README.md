# Panaderia El Tradicional

Sitio estatico de una panaderia: catalogo, canasta, pago simulado y cuenta de
cliente. No hay servidor detras; todo corre en el navegador y se publica en
GitHub Pages.

## Como esta repartido

```
index.html            la pagina, con sus secciones semanticas
assets/
  styles.css          todos los estilos
  img/                fotos, logo, mascota e iconos
data/
  productos.json      el catalogo: nombre, precio, foto, categoria y tamanos
js/
  app.js              el arranque: trae los datos y enciende lo demas
  repo.js             lee y revisa data/productos.json
  view.js             pinta las fichas y manda el catalogo (orden, filtro, vistas)
  cart.js             la canasta: panel, lineas y control de cantidad
  checkout.js         pago simulado y comprobante
  account.js          crear cuenta, verificar el correo y entrar
  map.js              mapa del reparto (Leaflet, se trae solo si hace falta)
  mail.js             envio de correo por EmailJS
  ui.js               barra, foco, cuadritos de ayuda, animaciones y horario
  state.js            lo que comparten los modulos, y el puente entre ellos
```

## Para verlo en tu maquina

Hace falta servirlo por HTTP. Abrir `index.html` con doble clic no funciona: el
navegador no deja que una pagina en `file://` cargue modulos de JavaScript ni
lea `data/productos.json`, asi que saldria en blanco.

```sh
python -m http.server 8000
# y abrir http://localhost:8000
```

En GitHub Pages va por HTTP, asi que ahi no hay nada que preparar.

## Para tocar el catalogo

Meter, quitar o cambiar un producto es editar `data/productos.json` y nada mas:
las fichas se pintan desde ahi. Cada producto necesita `nombre`, `categoria`,
`precio`, `foto` y `alt`; `disponible: false` lo marca como agotado, `etiqueta`
le pone el rotulo de color y `tamanos` le da varias medidas con su precio.

Si una categoria nueva no esta en el menu Tienda de `index.html`, sus productos
quedan inalcanzables: el CI lo comprueba y no publica.

## Lo que esta simulado

El cobro no existe: no se procesa ningun pago y los datos de la tarjeta no se
guardan ni se envian. La cuenta se guarda solo en el navegador y la contrasena
no se guarda en ninguna parte. El correo del codigo y del comprobante si sale
de verdad, por EmailJS; como configurarlo esta en `CORREO_REAL.md`.
