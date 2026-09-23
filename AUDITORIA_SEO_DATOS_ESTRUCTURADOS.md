# Auditoría de SEO y datos estructurados: El Tradicional

Primera ronda: 2026-09-23. Índice de auditorías: [AUDITORIAS.md](AUDITORIAS.md).

Este archivo cubre metadatos, indexabilidad, datos estructurados y semántica del marcado. La calidad de los textos en sí se trata en [AUDITORIA_CONTENIDO_CONVERSION.md](AUDITORIA_CONTENIDO_CONVERSION.md).

## Resumen

El marcado semántico está bien hecho y los datos estructurados existen, que es más de lo que suele haber. Pero **hay un fallo crítico que anula buena parte de ese trabajo**: el sitio declara que su dirección canónica es `https://www.ejemplo.com/`, un dominio de ejemplo que no existe, mientras está publicado en `https://arielnoob24.github.io/Panaderia/`.

Eso no es un detalle. Es la instrucción más fuerte que se le puede dar a un buscador sobre qué página indexar, y apunta a la nada.

## Hallazgos

### Crítico

#### S1. El `canonical`, el `og:url` y el JSON-LD apuntan a un dominio que no existe

Evidencia, en [index.html](index.html):

| Línea | Etiqueta | Valor |
|---|---|---|
| 8 | `<link rel="canonical">` | `https://www.ejemplo.com/` |
| 14 | `og:url` | `https://www.ejemplo.com/` |
| 30 | `url` del JSON-LD | `https://www.ejemplo.com` |

La dirección real de publicación es `https://arielnoob24.github.io/Panaderia/`.

Impacto: la etiqueta canónica le dice al buscador «la versión buena de esta página está en esta otra dirección». Al apuntar a un dominio ajeno e inexistente, se le está pidiendo a Google que **no indexe la página real** y que atribuya su contenido a una URL que no responde. Es el tipo de error que hace que un sitio publicado sencillamente no aparezca en las búsquedas, por bien hecho que esté todo lo demás.

El `og:url` tiene el mismo problema en el ámbito de las redes: al compartir el enlace, la vista previa puede resolverse contra un dominio muerto.

Recomendación inmediata: poner las tres a `https://arielnoob24.github.io/Panaderia/`. Y si en algún momento hay dominio propio, cambiarlas a la vez que se configura el redireccionamiento, nunca antes.

Conviene además comprobar que no queden más apariciones: `ejemplo.com` aparece en el archivo varias veces.

### Alto

#### S2. No hay `robots.txt` ni `sitemap.xml`

Evidencia: ninguno de los dos archivos existe en el repositorio.

Impacto: para un sitio de una sola página no es determinante, porque los buscadores encuentran la raíz igual. Pero el `sitemap.xml` es la forma de declarar la fecha de última modificación, y el `robots.txt` es donde se enlaza el sitemap. Sin ellos se pierde control sobre el rastreo, y no hay manera de indicar que la página ha cambiado.

Recomendación: dos archivos muy cortos en la raíz del repositorio. En `robots.txt`, permitir todo y enlazar el sitemap. En `sitemap.xml`, la única URL con su `lastmod`. Hay que recordar que GitHub Pages sirve el sitio bajo `/Panaderia/`, así que las rutas deben incluir ese segmento.

### Medio

#### S3. Los datos estructurados contienen información de marcador

Evidencia: el bloque JSON-LD de tipo `Bakery` declara `"telephone": "+593 99 000 0000"` y una dirección cuyo `streetAddress` incluye "Audio-PhoneComputer".

Impacto: los datos estructurados son justamente lo que alimenta las fichas de negocio local y los resultados enriquecidos. Publicar ahí un teléfono inventado es peor que no publicarlo: le da al buscador un dato falso con apariencia de verificado, y puede acabar mostrándose a alguien que intente llamar.

Recomendación: o completar con los datos reales, o retirar del JSON-LD los campos que todavía no se conocen. Un `Bakery` sin `telephone` es válido; uno con un teléfono falso, no es honesto. Se trata también en la auditoría de contenido.

#### S4. Falta el marcado de menú, que es justo lo que este sitio tiene

Evidencia: el JSON-LD describe el negocio, pero no el catálogo. Hay nueve productos con nombre, categoría, descripción y precio en el HTML, y ninguno está declarado como dato estructurado.

Impacto: se está desaprovechando el contenido más valioso de la página para búsqueda. Schema.org tiene tipos específicos, `Menu`, `MenuSection` y `MenuItem` con `offers` y `price`, que permiten que los productos y sus precios aparezcan en resultados enriquecidos. Para una panadería que quiere que la encuentren buscando "pan de queso Tena", es exactamente lo que hace falta.

Recomendación: añadir un segundo bloque JSON-LD con el menú, con una `MenuSection` por cada una de las cuatro categorías del filtro y un `MenuItem` por producto. Se puede generar a mano, son nueve elementos.

#### S5. La imagen para compartir es de un banco de fotos y no declara dimensiones

Evidencia: `og:image` y `twitter:image` apuntan a la misma fotografía de Unsplash que usa el hero. No hay `og:image:width` ni `og:image:height`.

Impacto: sin dimensiones declaradas, algunas plataformas tardan más en componer la vista previa o la recortan mal. Y usar una foto de banco como imagen de marca al compartir significa que el enlace se presenta con una imagen que no es del negocio.

Recomendación: declarar ancho y alto, y a medio plazo sustituirla por una fotografía propia del local o de los productos reales, en proporción 1200×630.

### Bajo

#### S6. No hay `meta robots` explícito

Evidencia: no existe la etiqueta.

Impacto: ninguno hoy, porque la ausencia equivale a `index, follow`. Se anota por completitud: si alguna vez se publica una versión de pruebas, ahí es donde habría que marcarla como no indexable.

#### S7. El título y la descripción están bien dimensionados

Evidencia: título `El Tradicional | Panadería & Pastelería`, y una descripción de unos 130 caracteres.

Impacto: ninguno, están dentro de lo que se muestra sin cortar. Se anota como verificado.

Observación menor: ni el título ni la descripción mencionan la ciudad. Para un negocio local, "Tena" es probablemente la palabra que más tráfico útil traería. Merece la pena probarlo.

## Lo que ya está bien

- `<html lang="es">` declarado.
- Un solo `h1`, jerarquía de encabezados sin saltos de nivel: `1,2,3,3,3,...,2,3,3,3,2,3`.
- Marcado semántico real: `header`, `nav`, `main`, `section`, `article` por producto, `footer`, `address` para la dirección.
- Metadatos de Open Graph y de Twitter Card completos en lo esencial: tipo, sitio, título, descripción, imagen y texto alternativo de la imagen.
- `og:locale` declarado como `es_EC`, que es correcto y poca gente se molesta en poner.
- Datos estructurados JSON-LD de tipo `Bakery` con horario, dirección, rango de precios y enlace a mapa. La estructura es correcta; el problema son los valores, no el marcado.
- Todas las imágenes tienen texto alternativo descriptivo, lo que también cuenta para búsqueda de imágenes.
- URLs de ancla limpias y coherentes: `#inicio`, `#catalogo`, `#historia`, `#locales`.

## Pendiente

- [ ] **Corregir las tres URL que apuntan a `ejemplo.com`** (S1). Es lo más urgente de todo el proyecto.
- [ ] Crear `robots.txt` y `sitemap.xml` con la ruta `/Panaderia/` (S2).
- [ ] Sustituir o retirar el teléfono y la dirección de marcador del JSON-LD (S3).
- [ ] Añadir datos estructurados de menú para los nueve productos (S4).
- [ ] Declarar dimensiones de la imagen para compartir y planificar una propia (S5).
- [ ] Probar a incluir "Tena" en el título o la descripción (S7).

## Nota de validación

Revisión del marcado de [index.html](index.html): metadatos, enlaces canónicos, bloque JSON-LD, jerarquía de encabezados y elementos semánticos. Comprobación de la existencia de `robots.txt` y `sitemap.xml` en el repositorio. Comparación de las URL declaradas con la dirección real de publicación, verificada contra el sitio en vivo.

**No se ha validado el JSON-LD con la herramienta de resultados enriquecidos de Google**, ni se ha consultado Search Console, ni se ha comprobado cómo se indexa realmente la página. El diagnóstico de S1 se basa en el significado de la etiqueta canónica, no en haber observado el comportamiento del buscador.
