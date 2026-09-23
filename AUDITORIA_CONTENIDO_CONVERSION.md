# Auditoría de contenido y conversión: El Tradicional

Primera ronda: 2026-09-23. Índice de auditorías: [AUDITORIAS.md](AUDITORIAS.md).

Este archivo cubre qué dice el sitio, si lo dice bien, y si consigue que alguien acabe pidiendo. No evalúa cómo se ve ni cómo se mueve.

## Resumen

El tono está muy conseguido. "El sabor de siempre", "El tiempo es nuestro ingrediente", "No hacemos pan rápido, hacemos pan que vale la espera" son textos que suenan a panadería de barrio y no a plantilla. Esa es la parte difícil y está resuelta.

El problema es que **el sitio está publicado con datos de marcador**. El teléfono es `+593 99 000 0000` y el WhatsApp es `593990000000`. Los quince botones de acción del sitio, incluidos los nueve "Pedir", llevan a un número que no existe. Ahora mismo el sitio no puede convertir nada.

## Hallazgos

### Crítico

#### C1. Todos los CTA llevan a un número de teléfono inventado

Evidencia: `+593 99 000 0000` aparece como teléfono de contacto y en los datos estructurados; `593990000000` es el número de todos los enlaces de WhatsApp: los nueve botones "Pedir", el de la navegación, el flotante y el del pie.

Impacto: es el fallo más caro del sitio, porque invalida su única función. Toda la maqueta, la vitrina, el tono y el trabajo de diseño desembocan en un enlace que abre WhatsApp con un número que no existe. Quien lo intente, se queda con la sensación de que el negocio no funciona.

Recomendación: sustituir el número real en un solo sitio y propagarlo. Como los enlaces se repiten doce veces con el texto del mensaje cambiando, conviene generar los `href` desde JavaScript a partir de una constante, o al menos dejar el número en un único punto del HTML para que no se olvide ninguno al actualizarlo.

### Alto

#### C2. El nombre del local parece ser el de otro negocio

Evidencia: la dirección dice "Audio-PhoneComputer / Calle Eloy Alfaro y Gabriel Espinosa, esquina / Tena, Ecuador", y ese mismo texto está en los datos estructurados como `streetAddress`.

Impacto: "Audio-PhoneComputer" suena a tienda de electrónica, no a panadería. Si es una referencia para ubicar el local, del tipo "junto a Audio-PhoneComputer", falta decirlo; tal como está, parece que la panadería se llama así. Para un negocio local, la dirección es información crítica: si confunde, la gente no llega.

Recomendación: si es una referencia, escribirlo como tal: "Junto a Audio-PhoneComputer". Si es el local que comparte espacio, explicarlo.

Estado: **corregido el 2026-09-23.** Se retiró del texto visible y del `streetAddress` del JSON-LD, donde alimentaba la ficha de negocio local. La dirección queda como "Calle Eloy Alfaro y Gabriel Espinosa, esquina. Tena, Ecuador". Si era una referencia útil para localizar el sitio, conviene reponerla escrita como tal.

#### C3. El indicador de disponibilidad siempre dice "Disponible", y nadie lo ha decidido

Evidencia: [script.js](script.js) escribe "Agotado" cuando el producto declara `data-available="false"`. **Ningún producto de [index.html](index.html) declara ese atributo**, así que los nueve muestran siempre "Disponible".

Impacto: el sitio afirma la disponibilidad de nueve productos sin ninguna base. Es una promesa que hace la interfaz por defecto, y la primera vez que alguien vaya a por un pan agotado, la promesa se rompe. La lógica existe pero está desconectada: parece que funciona y no funciona.

Recomendación: o declarar el atributo en cada producto de forma explícita, asumiendo que hay que mantenerlo a mano, o retirar el indicador hasta que haya de dónde sacar el dato. La segunda opción es más honesta mientras no exista un sistema de inventario.

### Medio

#### C4. Faltan tildes en el texto visible

Evidencia, en textos que el visitante lee:

| Dice | Debería decir | Dónde |
|---|---|---|
| El menu | El menú | Enlace de navegación |
| Ver el menu | Ver el menú | Botón principal del hero |
| Categorias del menu | Categorías del menú | Leyenda del filtro |
| No hacemos pan rapido | ...pan rápido | Frase destacada de la historia |
| la ciudad todavia duerme | ...todavía duerme | Párrafo de la historia |
| Fermentacion natural | Fermentación natural | Principio 02 |
| todos los dias | todos los días | Principio 01 |
| Combinacion sabrosa | Combinación sabrosa | Descripción de producto |

Impacto: en un sitio cuyo argumento entero es el cuidado y el oficio, las tildes ausentes contradicen el mensaje. Y afectan a dos sitios donde más duele: el botón principal de conversión ("Ver el menu") y la frase de marca ("No hacemos pan rapido"). Además cambian la pronunciación en los lectores de pantalla, como se señala en [AUDITORIA_ACCESIBILIDAD.md](AUDITORIA_ACCESIBILIDAD.md).

Recomendación: repasar todo el texto visible. Es media hora y es probablemente la mejora de percepción más barata del proyecto.

#### C5. La categoría de bebidas rompe el argumento del sitio

Evidencia: el producto "Coca-Cola, avenas y gelatinas" se ilustra con una fotografía alojada en `revistamercado.do` donde se ven botellas de Coca-Cola, Pepsi, Red Bull y Monster.

Impacto: hay tres problemas a la vez. Primero, de marca: un sitio que argumenta masa madre, fermentación lenta y productores conocidos por su nombre termina la vitrina con una foto de bebidas energéticas industriales. Segundo, de derechos: son marcas registradas de terceros en una fotografía tomada de otro medio. Tercero, técnico: es el único recurso servido desde un dominio sin control, como se recoge en [AUDITORIA_RENDIMIENTO_RECURSOS.md](AUDITORIA_RENDIMIENTO_RECURSOS.md).

Recomendación: una fotografía propia de la nevera del local, o de las bebidas que realmente se venden servidas sobre la mesa. Y valorar si conviene mostrar las marcas o describir la categoría de forma genérica.

#### C6. Falta la información que decide una compra

Evidencia: el sitio da producto, precio, horario y ubicación. No dice nada sobre pedido mínimo, tiempo de preparación, formas de pago, si hay entrega a domicilio, ni si se puede encargar para una fecha.

Impacto: el flujo lleva a WhatsApp, así que esas preguntas acaban haciéndose por chat una por una. Cada pregunta que el sitio no responde es una conversación más para el negocio y una fricción más para quien compra. Para pedidos de pastelería, la fecha de encargo suele ser lo primero que se pregunta.

Recomendación: un bloque breve cerca del catálogo o en la sección de locales, con cuatro o cinco líneas: cómo se pide, en cuánto tiempo, cómo se paga, si hay entrega. No hace falta una sección entera.

#### C7. El aviso de frescura es fijo mientras el estado del local es dinámico

Evidencia: el hero dice "Recién salido del horno · Pan redondo · Sale a las 17:00", con texto fijo en el HTML. En cambio, el estado "Abierto hoy" o "Cerrado hoy" de la sección de locales sí se calcula, con horarios de entre semana y fin de semana e incluso festivos y Semana Santa.

Impacto: la parte más visible, la del hero, es la que no es real. A las 19:00 seguirá diciendo que el pan sale a las 17:00. Y convive con un indicador de al lado que sí es correcto, lo que hace el contraste más evidente. El cálculo de festivos que ya existe en [script.js](script.js) demuestra que la capacidad técnica está; solo que no se aplicó donde más se ve.

Recomendación: o hacer que el aviso del hero cambie según la hora, reutilizando la lógica que ya existe, o redactarlo de forma que sea cierto siempre: "Horneamos a las 17:00 todos los días".

### Bajo

#### C8. El aviso de derechos está desactualizado

Evidencia: "© 2024 El Tradicional · Tena, Ecuador". La fecha de esta revisión es 2026.

Recomendación: generar el año desde JavaScript, o simplemente quitarlo. Un año antiguo en el pie sugiere que el sitio está abandonado, que es justo lo contrario de lo que interesa.

#### C9. Los mensajes de WhatsApp están bien construidos

Evidencia: cada botón "Pedir" abre WhatsApp con un texto ya escrito y específico del producto, del tipo "Hola, quiero pedir Pan de queso con cebolla."

Impacto: ninguno negativo. Se anota como acierto, porque es un detalle que reduce la fricción de verdad: quien pulsa no tiene que escribir nada ni explicar qué quiere. Merece conservarse al corregir el número de C1.

#### C10. Los precios no indican la moneda ni la unidad

Evidencia: `$0.25`, `$0.35`, `$1.00`.

Impacto: en Ecuador el dólar es la moneda oficial, así que el símbolo se entiende. Pero no se dice si el precio es por unidad, por pieza o por porción, lo cual en panadería no siempre es obvio, sobre todo en "Suspiros y galletas" a $1.25.

Recomendación: añadir la unidad donde no se deduzca: "por unidad", "la funda", "docena".

## Lo que ya está bien

- El tono de marca es coherente de principio a fin y no suena a plantilla.
- La estructura de la página sigue un recorrido lógico: qué es, qué vende, por qué es distinto, dónde está.
- Cada botón "Pedir" abre WhatsApp con un mensaje ya redactado y específico del producto.
- Hay tres puntos de contacto con WhatsApp, en navegación, en cada producto y flotante, sin llegar a resultar insistente.
- Los precios están visibles en la tarjeta, no escondidos tras un clic.
- El horario distingue entre semana y fin de semana, y el cálculo contempla festivos nacionales y fechas móviles de Semana Santa, que es un nivel de detalle poco común.
- La sección de historia da razones concretas, masa madre viva, fermentación larga, productores conocidos, en vez de adjetivos vacíos.
- El catálogo se filtra por categoría y anuncia cuántos productos quedan.

## Pendiente

Por orden de urgencia.

- [ ] **Poner el número de WhatsApp y el teléfono reales** (C1). Sin esto, el sitio no convierte.
- [x] Nombre del local aclarado: se retiró "Audio-PhoneComputer" del texto y del JSON-LD (C2).
- [ ] Decidir qué hacer con el indicador de disponibilidad (C3).
- [ ] Repasar las tildes de todo el texto visible (C4).
- [ ] Sustituir la fotografía de bebidas (C5).
- [ ] Añadir cómo se pide, en cuánto tiempo, cómo se paga y si hay entrega (C6).
- [ ] Hacer real el aviso de frescura, o redactarlo de forma que siempre lo sea (C7).
- [ ] Actualizar o generar el año del pie (C8).
- [ ] Indicar la unidad en los precios donde no se deduzca (C10).

## Nota de validación

Lectura completa del texto visible de [index.html](index.html), incluidos textos alternativos, mensajes de WhatsApp y datos estructurados. Búsqueda de patrones de marcador, de palabras sin tilde y de datos de contacto. Revisión de la lógica de [script.js](script.js) en lo que genera texto visible: disponibilidad, contador de productos y estado de apertura.

**No se ha verificado ningún dato de negocio con el cliente**: ni el teléfono, ni la dirección, ni los horarios, ni los precios, ni el catálogo de productos. Todo lo que aquí se marca como marcador se deduce de su forma, por ejemplo un número que es todo ceros. Puede haber datos que parezcan correctos y no lo sean, y esta auditoría no los detectaría.
