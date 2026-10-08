---
name: nuevo-producto
description: Agrega, cambia o quita un producto del catalogo de la panaderia (data/productos.json) con su foto en los dos anchos, cumpliendo las reglas que revisa el CI.
argument-hint: "<nombre>, <categoria>, <precio> [, ruta de la foto]"
disable-model-invocation: true
---

# Producto nuevo en el catalogo

Pedido: $ARGUMENTS

El catalogo vive en `data/productos.json`. Lo valida `revisar()` de `js/repo.js`,
la misma funcion que usa el sitio al cargarlo y que corre el CI, asi que las
reglas de abajo no son de estilo: si no se cumplen, el sitio no publica.

## Forma de un producto

```json
{
  "nombre": "Pan de yuca",
  "categoria": "panes",
  "precio": 0.5,
  "foto": "assets/img/productos/pan-de-yuca",
  "alt": "Pan de yuca dorado y redondo sobre papel blanco",
  "etiqueta": { "color": "green", "texto": "De la casa" },
  "disponible": false,
  "tamanos": [{ "valor": "500 ml", "precio": 0.85 }, { "valor": "1 L", "precio": 1.25 }]
}
```

`etiqueta`, `disponible` y `tamanos` son opcionales; si no hacen falta, no van.

## Reglas

- **categoria**: una de las que ya existen (`panes`, `dulces`, `bebidas-frias`).
  Una categoria nueva necesita ademas su entrada `data-filtro="..."` en el menu
  Tienda de `index.html`, o el CI falla porque sus productos quedan inalcanzables.
- **foto**: la raiz, **sin** `-420`, sin `-840` y sin `.jpg`. En disco tienen que
  existir `<raiz>-420.jpg` (420x315) y `<raiz>-840.jpg` (840x630).
- **alt**: describe lo que se ve en la foto (forma, color, sobre que esta), no
  repite el nombre. Es parte de la evidencia WCAG del reto.
- **precio**: numero en dolares. Si hay `tamanos`, `precio` tiene que ser igual
  al del primer tamano.
- **etiqueta.color**: `green` o `yellow`, que son los que tiene el CSS. El texto
  va en un circulo de 62 px: dos o tres palabras cortas ("Recién hecho").
- Nada de las palabras que rechaza el CI (ver la skill `publicar`), tampoco en
  nombre, alt ni etiqueta.
- Mismo orden que el resto: el producto va junto a los de su categoria, no al final.

## La foto

Si el usuario pasa una imagen, se prepara con:

```bash
python .claude/skills/nuevo-producto/foto.py <imagen> assets/img/productos/<slug>
```

Recorta al centro a 4:3 y pone el fondo transparente en blanco. El `<slug>` va en
minusculas, sin tildes y con guiones (`rebanada-de-cheesecake-de-limon`). Mira el
resultado (`-840.jpg`) antes de seguir: si el recorte corta el producto, pide otra
foto o una mas centrada en vez de dejarlo asi.

Si no hay foto, no inventes una ni reutilices la de otro producto: pregunta.

## Para quitar o cambiar un producto

- Quitar: borrar la entrada y sus dos JPG. Si era el ultimo de su categoria,
  quitar tambien su `data-filtro` del menu Tienda.
- Agotado por un tiempo: `"disponible": false` en vez de borrarlo.

## Al terminar

1. `node herramientas/empaquetar.mjs` (el catalogo va embebido en `js/sin-servidor.js`).
2. `node .claude/skills/verificar-sitio/verificar.mjs`: el numero de fichas ya sale del JSON.
3. Publicar con la skill `publicar`.
