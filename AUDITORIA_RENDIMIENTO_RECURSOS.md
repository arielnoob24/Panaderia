# Auditoría de rendimiento y recursos: El Tradicional

Primera ronda: 2026-09-23. Índice de auditorías: [AUDITORIAS.md](AUDITORIAS.md).

Este archivo cubre peso, peticiones, imágenes, fuentes y coste de pintado. El coste de las animaciones se trató en la segunda ronda de [AUDITORIA_ESTETICA_ANIMACIONES.md](AUDITORIA_ESTETICA_ANIMACIONES.md); aquí solo se retoma lo que se puede medir.

## Resumen

El código pesa poco y está bien resuelto: sin dependencias, sin framework, sin fuentes web, con el script diferido. Todo el problema está en las imágenes.

**945 KB transferidos en 11 peticiones, y prácticamente todo son fotografías.** Una sola pesa 304 KB. Y se piden al doble del tamaño en que se muestran. Con una hora de trabajo sobre las imágenes, este sitio baja a menos de un tercio de su peso actual sin que se note ninguna diferencia visual.

## Medición

| Concepto | Valor |
|---|---|
| Peticiones totales | 11 |
| Transferido | **945 KB** |
| De eso, imágenes | **945 KB**, prácticamente el total |
| Fuentes web | **0 KB** |
| JavaScript de terceros | **0 KB** |
| Archivos propios | `index.html` 17 KB, `styles.css` 28 KB, `script.js` 11 KB |
| Imagen más pesada | **304 KB** |
| Recursos por encima de 60 KB | 6 |

Reparto de las fotografías más pesadas:

| Peso | Imagen | Se muestra a |
|---|---|---|
| 304 KB | `photo-1509365465985` (pan de chocolate) | ~280 px de ancho |
| 124 KB | `photo-1495147466023` (pan redondo dulce) | ~280 px |
| 114 KB | `photo-1534620808146` (pan de queso con cebolla) | ~280 px |
| 114 KB | `photo-1509440159596` (pan redondo) | ~280 px |
| 88 KB | `photo-1608198093002` (pan enrollado) | ~280 px |
| 61 KB | `photo-1555507036` (palanqueta) | ~280 px |

## Hallazgos

### Alto

#### P1. Casi un megabyte, y todo es imagen

Evidencia: 945 KB en 11 peticiones, de los que las fotografías son la práctica totalidad.

Impacto: es un folleto de una sola página. Con una conexión móvil mediana, un megabyte son varios segundos antes de ver la vitrina completa, y en datos móviles es un coste real para el visitante. Lo llamativo es que el problema **no está en cómo está hecho el sitio**, que es ligero, sino en que nadie ha tocado las imágenes.

Recomendación: los tres hallazgos siguientes, aplicados juntos, deberían dejarlo por debajo de 300 KB.

#### P2. Una sola fotografía pesa 304 KB, tres veces más que sus vecinas

Evidencia: `photo-1509365465985-25d11c17e812`, la del pan de chocolate, transfiere 304 KB, mientras que fotos del mismo tamaño en pantalla pesan entre 61 y 124 KB.

Impacto: una sola tarjeta del catálogo se lleva un tercio del peso de la página. La causa probable es la propia imagen: mucho detalle fino y espolvoreado de azúcar, que comprime mal.

Recomendación: bajar la calidad de esa en concreto a `q=65`, o cambiarla por otra que comprima mejor. Conviene comprobar el peso de cada fotografía antes de elegirla, no solo su aspecto.

#### P3. Las fotos se piden al doble del tamaño en que se muestran, y no hay `srcset`

Evidencia: todas las imágenes de producto se piden con `w=700` en la URL. En la rejilla, con `repeat(auto-fill, minmax(260px, 1fr))`, se muestran a unos 280 px de ancho en escritorio. La de la sección de historia se pide con `w=1000` y se muestra a unos 430.

Impacto: se está descargando más del doble de píxeles de los que se pintan. En pantallas normales es desperdicio puro. En pantallas de alta densidad el doble sí se aprovecha, pero entonces habría que pedirlo solo ahí, no siempre.

Recomendación: aprovechar que Unsplash sirve cualquier tamaño por parámetro de URL y usar `srcset` con `sizes`. Algo así para las tarjetas:

```html
<img src="...&w=560&q=75"
     srcset="...&w=280&q=75 280w, ...&w=560&q=75 560w, ...&w=840&q=75 840w"
     sizes="(max-width: 680px) 100vw, (max-width: 900px) 50vw, 280px"
     loading="lazy" width="700" height="520" alt="...">
```

Con eso, un móvil descarga la versión de 280 y no la de 700. Es el cambio con mejor relación entre esfuerzo y ahorro de toda esta auditoría.

#### P4. La mascota es un PNG de 216 KB que se muestra a 44 px

Evidencia: `mascota-removebg-preview.png` pesa 216 925 bytes y mide 516×484 px. Desde la unificación de marca aparece en **cuatro sitios**: cabecera a 44 px, hero a 104 px, franja de identidad a 52 px y pie a 72 px.

Impacto: es el archivo propio más pesado del proyecto, más que el HTML, el CSS y el JavaScript juntos multiplicados por tres. Se descarga una sola vez y se reutiliza, eso sí, pero 216 KB para una ilustración que nunca se ve a más de 104 px es entre diez y veinte veces más de lo necesario. El nombre del archivo, `removebg-preview`, sugiere además que es la descarga de vista previa de una herramienta de recorte de fondo, no un archivo preparado para producción.

Recomendación, por orden de eficacia:

1. **Convertirla a SVG** si el original es vectorial o se puede revectorizar. Escalaría perfecta a cualquier tamaño y pesaría unos pocos KB. Es la opción correcta para una marca que aparece en cuatro tamaños distintos.
2. Si tiene que seguir siendo mapa de bits, exportarla a WebP a 208×208 px, que cubre el uso mayor de 104 px en pantallas de densidad doble. Debería quedar por debajo de 15 KB.
3. En cualquier caso, dejar de usar el archivo de vista previa y partir del original.

### Medio

#### P5. La textura de fondo se recompone en cada desplazamiento

Evidencia: `body::before` es una capa `position: fixed` a pantalla completa con una textura generada por `feTurbulence` en un SVG embebido.

Impacto: no pesa nada en red, porque va dentro del CSS, pero es una capa fija del tamaño de la ventana que el navegador tiene que recomponer mientras se hace scroll. Ya se señaló en la segunda ronda de la auditoría de estética como el motivo por el que no conviene añadir parallax ni animaciones ligadas al desplazamiento.

Recomendación: mantenerla, porque la opacidad ya está en 0,035 y aporta carácter, pero no añadir encima nada ligado al scroll. Si en algún momento se detecta jank en equipos modestos, el primer candidato a quitar es esta capa.

#### P6. Sin `preconnect` al servidor de imágenes

Evidencia: las diez fotografías vienen de `images.unsplash.com` y no hay ninguna etiqueta que anticipe esa conexión.

Impacto: la primera imagen tiene que esperar a resolver DNS, abrir TCP y negociar TLS con un dominio distinto al del sitio. Son unas décimas de segundo que se pagan una vez, pero justo antes de que aparezca el contenido principal.

Recomendación: `<link rel="preconnect" href="https://images.unsplash.com" crossorigin>` en el `<head>`. Y para la fotografía del hero, que es el elemento más grande de la primera pantalla, un `<link rel="preload" as="image">` con la misma URL que usa el CSS.

#### P7. La imagen del hero se carga desde CSS, no desde HTML

Evidencia: `.hero-image` la trae como `background-image`, y [script.js](script.js) la precarga leyendo la URL del estilo calculado para poder aplicar la transición de entrada.

Impacto: el navegador no puede descubrir esa imagen hasta que ha descargado y analizado el CSS, así que empieza más tarde de lo que podría. Y es, casi con seguridad, el elemento que define la métrica de mayor contenido visible.

Recomendación: o precargarla con `rel="preload"` según P6, o pasarla a un `<img>` con `fetchpriority="high"` colocado detrás del contenido con posicionamiento. La segunda opción es más trabajo pero deja de depender de que el JavaScript lea la URL de los estilos.

### Bajo

#### P8. Una imagen depende de un servidor de terceros sin control

Evidencia: la fotografía de bebidas viene de `revistamercado.do`.

Impacto: es el único recurso que no está ni en el repositorio ni en Unsplash. No hay control sobre su permanencia, su peso ni su velocidad. Se trata también en la auditoría de contenido, porque además muestra marcas ajenas.

#### P9. El CSS tiene 28 KB en una sola hoja sin minimizar

Evidencia: `styles.css`, 27 964 bytes.

Impacto: es poco y llega comprimido por el servidor, así que no es un problema real. Se anota solo para tenerlo medido.

Recomendación: no hacer nada por ahora. Si algún día se añade un paso de compilación, minimizar; mientras tanto, la legibilidad del archivo vale más que esos KB.

## Lo que ya está bien

Esto es lo más sano del proyecto y conviene no estropearlo.

- **Cero fuentes web.** Georgia y Arial son fuentes del sistema, así que no hay descarga, ni parpadeo de texto, ni desplazamiento al cargar la tipografía. Es una decisión excelente que muchos sitios no toman.
- **Cero dependencias y cero JavaScript de terceros.** Ni framework, ni librería de animación, ni analítica.
- El script va con `defer`, así que no bloquea el análisis del documento.
- Las diez fotografías llevan `loading="lazy"` y declaran `width` y `height`, de modo que no provocan saltos de maqueta.
- El iframe del mapa también es diferido, y tiene estado de carga y alternativa si falla.
- Unsplash se invoca con `auto=format`, así que sirve AVIF o WebP a los navegadores que los aceptan sin que haya que gestionarlo.
- Todo el movimiento anima solo `transform` y `opacity`, que son las propiedades baratas. No se anima `width`, `height`, `top` ni `margin` en ningún sitio.
- Desde la segunda ronda, la sombra de hover de las tarjetas se anima por opacidad de un pseudo-elemento en lugar de interpolar `box-shadow`, que era el efecto más caro de la página.

## Aplicado el 2026-09-23

**De 945 KB a 294 KB: un 69 % menos.** Medido igual que antes, a 1418 px de ancho.

| | Antes | Después |
|---|---:|---:|
| Transferido | 945 KB | **294 KB** |
| Imagen del hero | 138 KB | 71 KB |
| Foto más pesada del catálogo | 304 KB | 55 KB |
| Mascota | 216 KB | **8 KB** |
| Fotos del catálogo | 61–304 KB | 12–55 KB |

Qué se hizo:

- [x] `srcset` con cuatro anchuras y `sizes` en las nueve fotografías de Unsplash (P3). El navegador pide ahora 280 px para las tarjetas en vez de 700, y 640 para la de historia en vez de 1000.
- [x] La mascota se redimensionó a 224 px y se cuantizó a 128 colores conservando la transparencia: **de 216 925 a 8 277 bytes, un 96 % menos** (P4). Se comprobó a 44, 52, 72 y 104 px sobre fondo oscuro, crema y terracota: indistinguible del original. El archivo pasa a llamarse `mascota.png`, porque el anterior era la descarga de vista previa de una herramienta de recorte.
- [x] La fotografía que comprimía mal baja a `q=58`, ya que seguía pesando el triple que sus vecinas al mismo tamaño (P2).
- [x] La imagen del hero pasa a `image-set()` con versiones 1x y 2x, de modo que una pantalla normal ya no descarga la de retina (P7).
- [x] `preconnect` a `images.unsplash.com` y `preload` de la imagen del hero con `fetchpriority="high"` e `imagesrcset` alineado con el CSS, para que no se descargue dos veces (P6).
- [x] Las cuatro imágenes de la mascota declaran ya `width` y `height`, lo que además cierra el hallazgo A3 de la auditoría de accesibilidad.

## Pendiente

- [ ] Sustituir la imagen alojada en un tercero (P8). No admite `srcset` porque no acepta parámetros de tamaño, así que es la única foto que sigue sin optimizar.
- [ ] Valorar convertir la mascota a SVG. Con 8 KB ya no es urgente, pero un vector escalaría perfecto en los cuatro tamaños.
- [ ] Medir con Lighthouse y con limitación de red real, que es lo que esta auditoría no ha podido hacer.

## Nota de validación

Medición en navegador sin interfaz usando la API de rendimiento: número de peticiones, `transferSize` por recurso y por tipo, y tiempos de `DOMContentLoaded` y `load`. Los pesos de los archivos propios se leyeron del sistema de archivos.

Advertencias importantes sobre estos números: la página se cargó **desde el sistema de archivos local**, no desde el servidor, así que los tiempos medidos no representan la experiencia real y se han omitido a propósito. Los pesos de las imágenes sí son reales, porque vienen de la red. **No se ha ejecutado Lighthouse**, ni se han medido las métricas de experiencia de carga, ni se ha probado con limitación de red o de procesador. Las afirmaciones sobre coste de pintado se basan en qué propiedades se animan, no en una traza de rendimiento.
