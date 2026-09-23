# Auditorías del sitio: El Tradicional

Índice de las revisiones especializadas. Cada archivo cubre un solo tipo de problema, para poder pensar con profundidad en un objetivo concreto sin mezclarlo con los demás.

## Los seis archivos

| # | Área | Archivo | Estado |
|---|---|---|---|
| 1 | Estética y animaciones | [AUDITORIA_ESTETICA_ANIMACIONES.md](AUDITORIA_ESTETICA_ANIMACIONES.md) | Tres rondas hechas, mayoría aplicada |
| 2 | Accesibilidad | [AUDITORIA_ACCESIBILIDAD.md](AUDITORIA_ACCESIBILIDAD.md) | Primera ronda, 2026-09-23 |
| 3 | Responsive y experiencia móvil | [AUDITORIA_RESPONSIVE_MOVIL.md](AUDITORIA_RESPONSIVE_MOVIL.md) | Primera ronda, 2026-09-23 |
| 4 | Rendimiento y recursos | [AUDITORIA_RENDIMIENTO_RECURSOS.md](AUDITORIA_RENDIMIENTO_RECURSOS.md) | Primera ronda, 2026-09-23 |
| 5 | SEO y datos estructurados | [AUDITORIA_SEO_DATOS_ESTRUCTURADOS.md](AUDITORIA_SEO_DATOS_ESTRUCTURADOS.md) | Primera ronda, 2026-09-23 |
| 6 | Contenido y conversión | [AUDITORIA_CONTENIDO_CONVERSION.md](AUDITORIA_CONTENIDO_CONVERSION.md) | Primera ronda, 2026-09-23 |

El orden no es arbitrario. Va de lo que se ve a lo que se mide, y cada área depende un poco de la anterior: no tiene sentido optimizar el rendimiento de unas imágenes que todavía van a cambiar, ni el SEO de unos textos que no están cerrados.

## Documentos anteriores

- [AUDITORIA_COMPLETA.md](AUDITORIA_COMPLETA.md): el mapa general del que salieron estas seis. Sigue siendo útil como panorámica, pero cada área está tratada con más profundidad y con datos medidos en su archivo propio.
- [AUDITORIA.md](AUDITORIA.md): la primera revisión, muy breve. Se conserva como registro.

## Lo más urgente ahora mismo

Recogido de los seis archivos, ordenado por gravedad. El número entre paréntesis remite al hallazgo en su archivo.

| Prioridad | Problema | Área |
|---|---|---|
| **Crítico** | El `canonical` y el `og:url` apuntan a `www.ejemplo.com`, un dominio que no existe. Le está diciendo a Google que la página real es una copia de otra (S1) | SEO |
| **Crítico** | Teléfono y WhatsApp son marcadores: `+593 99 000 0000`. Los quince CTA del sitio no llevan a ningún número real (C1) | Contenido |
| **Alto** | 945 KB transferidos, casi todo imágenes, y una sola foto pesa 304 KB (P1, P2) | Rendimiento |
| **Alto** | Las fotos se piden al doble del tamaño en que se muestran, sin `srcset` (P3) | Rendimiento |
| **Alto** | La mascota es un PNG de 216 KB que se muestra a 44 px, y ahora aparece en cuatro sitios (P4) | Rendimiento |
| **Alto** | Quince enlaces abren pestaña nueva y ninguno lo avisa a quien usa lector de pantalla (A1) | Accesibilidad |
| **Alto** | Siete objetivos táctiles por debajo de 24 px de alto, el mínimo de WCAG 2.2 AA (A2) | Accesibilidad |
| **Medio** | No hay `robots.txt` ni `sitemap.xml` (S2) | SEO |
| **Medio** | El nombre del local aparece como "Audio-PhoneComputer", que parece otro negocio (C2) | Contenido |
| **Medio** | Tildes ausentes en texto visible: "El menu", "Fermentacion natural", "pan rapido" (C3) | Contenido |

## Cómo leer estos archivos

Cada hallazgo lleva:

- **Evidencia**: archivo y línea concretos, o el número medido. Si no hay evidencia, no es un hallazgo.
- **Impacto**: qué se rompe y para quién.
- **Recomendación**: qué hacer, con valores concretos cuando aplica.

Los hallazgos ya corregidos se marcan como tales y se conservan, porque el registro de lo que estaba mal es lo que evita repetirlo.

## Cómo se obtuvieron los datos

Estas auditorías no son de lectura de código solamente. Los números vienen de medir:

- Renderizado del sitio en navegador sin interfaz, a varias anchuras, con capturas de cada sección.
- Cálculo de la relación de contraste WCAG de cada par de color de primer plano y fondo.
- Comprobación del código de respuesta HTTP de todas las imágenes.
- Medición en el navegador del peso transferido, del número de peticiones, del tamaño de los objetivos táctiles y del desbordamiento horizontal.

Lo que no se ha hecho, y conviene saberlo: no se ha probado con un lector de pantalla real, ni en dispositivos físicos, ni con Lighthouse, ni con una conexión lenta real. Cada archivo lo indica en su nota de validación.
