# Reto 4 — análisis de nota y qué falta

Hecho el 2026-10-04. **Solo análisis: no se tocó ni una línea del sitio.** Cuaderno de trabajo: [RETO4_CUADERNO.md](RETO4_CUADERNO.md).

---

## 1. ¿El cuaderno es "ya de todo"? No

El cuaderno es **materia prima**. El informe no existe. Mira cualquier sección: debajo de cada bloque de evidencia hay un `> ESCRIBE TÚ` vacío. Hay 14 de esos bloques y los 14 están sin llenar.

Lo que hay y lo que no:

| Entregable que pide el enunciado | Estado |
|---|---|
| Evidencia para las 10 heurísticas | ✅ reunida (§3 del cuaderno) |
| **Análisis** escrito de las 10 heurísticas | ❌ no existe |
| Datos de accesibilidad medidos | ✅ 2026-10-04 (§7 del cuaderno) |
| **Matriz de cumplimiento de accesibilidad** (obligatoria) | ❌ solo están propuestas las columnas |
| Las 3 máquinas de estados identificadas en el código | ✅ (§5.1) |
| **Diagrama** de estados dibujado | ❌ no existe |
| Secuencia de tareas | ⚠️ los pasos están, los clics sin contar |
| 14 microinteracciones inventariadas | ✅ (§5.3) |
| **Las 5 conclusiones** | ❌ hay 7 ángulos propuestos, 0 conclusiones escritas |
| **Prototipo de baja fidelidad** | ❌ no existe, y es decisión tuya (§1.1 del cuaderno) |
| Tres mediciones pendientes | ❌ objetivos táctiles, contraste del hero, lector de pantalla |
| Informe en PDF | ❌ |

Dicho de otra forma: **tengo hecha la investigación, tú no tienes hecho el trabajo.** Y eso es a propósito — el enunciado te permite un 5 % de texto de IA, así que la parte que vale los 20 puntos es exactamente la que no puedo hacer yo.

---

## 2. Qué sacarías

### Escenario A — entregar hoy, el cuaderno tal cual: **≈ 2 / 20**

Y no por lo que falta, sino por una trampa: **el cuaderno es 100 % texto mío.** Si entra en el informe tal cual, se dispara la cláusula del 5 % y se califica sobre la mitad. Eso convierte cualquier nota en, como máximo, 10.

| Criterio | Nota | Por qué |
|---|---|---|
| Heurísticas (5) | 1 | La evidencia está, el análisis no. Un corrector lee "PREGUNTA… ESCRIBE TÚ" y ve trabajo sin terminar |
| Accesibilidad (5) | 2 | La evidencia es fuerte, pero la matriz obligatoria no está construida y faltan 3 mediciones |
| Diseño de interacción (5) | 1,5 | Las máquinas de estados están descritas en prosa; el diagrama que pide no está |
| Conclusiones (5) | **0** | Cero escritas. Y el enunciado avisa: una conclusión que no esté escrita como conclusión penaliza los 5 puntos enteros |
| Subtotal | 4,5 | |
| Cláusula del 5 % de IA | **÷2** | |
| **Total** | **≈ 2** | |

### Escenario B — lo escribes tú desde el material, sin arreglar nada más: **12 – 16 / 20**

Los cuatro criterios son alcanzables al máximo con lo que ya hay reunido, pero entran las penalizaciones de §3. Un corrector que pruebe el sitio con teclado —y el tuyo dijo que lo iba a hacer— encuentra entre dos y cuatro cosas, a −2 cada una.

### Escenario C — lo escribes tú **y** arreglas los cinco defectos de §3: **18 – 20 / 20**

| Criterio | Techo realista | Qué hace falta para llegar |
|---|---|---|
| Heurísticas (5) | 5 | Las 10 están cubiertas con ejemplos reales del prototipo. Para asegurarlo, ver §4.1: te falta documentar **violaciones**, no solo cumplimientos |
| Accesibilidad (5) | 5 | Construir la matriz, hacer las 3 mediciones, arreglar los defectos. La operabilidad por teclado es tu punto más fuerte de todo el trabajo |
| Diseño de interacción (5) | 5 | Dibujar el diagrama y contar los clics. El material está entero |
| Conclusiones (5) | 5 | Enteramente tuyo. Es el criterio con más riesgo y el único donde no puedo ayudarte nada |

---

## 3. Los cinco defectos que te pueden costar −2 cada uno

Reordenados por **probabilidad de que los encuentre**, no por gravedad técnica. El inventario completo y verificado —16 violaciones con severidad— está en [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md) §4; esta sección se queda como el resumen de los que más riesgo tienen. Y el orden cambió cuando me dijiste que el profesor va a probar la página solo con el teclado: eso sube a lo más alto dos cosas que de otro modo serían improbables.

### 3.1 🔴 La fila del mostrador se mueve sola y no hay cómo pararla

**WCAG 2.2.2 (Pausar, detener, ocultar) — Nivel A.** El criterio más bajo de la norma, el que no se perdona.

La fila avanza una ficha cada 4,2 s indefinidamente, en paralelo con el resto del contenido. Se detiene si pasas el ratón por encima, si tocas con el dedo o si el foco entra en ella, y respeta `prefers-reduced-motion`. **Pero no hay ningún control visible de pausa.** La norma pide un mecanismo; "se para si haces otra cosa" no es un mecanismo.

Lo verifiqué: `productGrid.andarSola = { arrancar, parar }` existe en [script.js:407](script.js#L407) pero nada en la interfaz lo llama.

- **Probabilidad de que lo encuentre: alta.** Es lo primero que se ve al abrir la página, y el enunciado nombra WCAG 2.2 explícitamente.
- **Honestidad:** esto es un fallo real, no una interpretación estricta. Si lo documentas tú antes de que te lo encuentren, deja de ser un error y pasa a ser un hallazgo de tu propia auditoría. Eso cambia por completo cómo se lee.

### 3.2 🔴 El foco puede quedar tapado por la cabecera fija

**WCAG 2.4.11 (Foco no oscurecido) — Nivel AA, nuevo en 2.2.** Exactamente el tipo de criterio que un profesor que acaba de dar WCAG 2.2 va a buscar.

La cabecera es `position: fixed` ([styles.css:69](styles.css#L69)) y mide unos 96 px. Hay `scroll-margin-top` puesto en las secciones con `id` ([styles.css:57](styles.css#L57), [styles.css:164](styles.css#L164)), que arregla el salto de los enlaces internos — **pero no protege a un elemento que recibe el foco al tabular**. Tabulando hacia atrás (`Shift+Tab`) el navegador desplaza lo justo para que el elemento entre en la ventana, y "la ventana" incluye los 96 px que tapa la cabecera.

- **No lo puedo confirmar yo**: hace falta un navegador. Te toma 30 segundos: baja media página, `Shift+Tab` varias veces y mira si algún elemento enfocado se mete debajo de la barra.
- **Probabilidad: alta**, porque es exactamente lo que pasa tabulando, y es el método anunciado del profesor.

### 3.3 ~~La Powerade agotada tiene controles que no llevan a ninguna parte~~ — **RETIRADO, era un error mío**

Escribí que la Powerade agotada dejaba tabular sus dos tamaños sin ofrecer botón. **Es falso.** Sus dos radios llevan `disabled` en el HTML, así que el tabulador no las toca; las tres fichas agotadas tienen **cero** controles alcanzables.

El error era de mi medición: el volcado del orden de tabulación no excluía los elementos deshabilitados y los contaba. Verificado y corregido el 2026-10-04 al preparar [RETO4_01_HEURISTICAS.md](RETO4_01_HEURISTICAS.md).

**No lo lleves al informe.** Y el número de paradas de tabulación que te di, 44, también estaba mal por lo mismo más otra cosa: son **36**. Ver §8.2 de RETO4_01_HEURISTICAS.md.

En su lugar, el tercer defecto más probable es **V2 del inventario de heurísticas**: el comprobante no se puede guardar ni copiar, y cerrar el panel vacía la canasta. Severidad 3, verificado en el código.

### 3.4 🟠 El teléfono y el WhatsApp son marcadores de posición

`+593 99 000 0000` en el pie, en la navegación, en el botón flotante y en los 15 enlaces de pedido. Cualquiera que pulse un llamado a la acción lo descubre.

- **Probabilidad: alta.** Es lo primero que se toca para comprobar que el flujo cierra.
- Ya estaba en tu [AUDITORIA_CONTENIDO_CONVERSION.md](AUDITORIA_CONTENIDO_CONVERSION.md) como hallazgo crítico C1 y sigue sin arreglar.
- En un proyecto de clase puede pasar como aceptable si **lo declaras**. Sin declararlo, es un error.

### 3.5 🟡 El campo de contraseña no comprueba nada

El panel de entrar lo dice en pantalla, con todas las letras: *"Maqueta académica. Sin servidor no hay contraseña que comprobar: entra cualquiera."* Eso te cubre de la acusación de ocultarlo.

Pero deja viva una pregunta incómoda de diseño de interacción: **si no comprueba nada, ¿por qué pedirlo?** Un campo que invita a escribir una contraseña de verdad y la descarta es, según cómo se mire, teatro de interfaz.

- **Probabilidad: media.** Depende de cuánto mire el flujo de cuenta.
- Tiene defensa en las dos direcciones. Lo que **no** tiene defensa es que te lo pregunten y no lo hayas pensado. Decídelo antes, no durante.
- Detalle menor del mismo flujo: al salir de la cuenta aterrizas en **"Crear cuenta"**, no en "Entrar". Acabas de tener una cuenta; ofrecerte crear otra es raro.

### Los que probablemente no encuentre

| Defecto | Por qué es improbable |
|---|---|
| Contraste 4,49 sobre 4,5 en el `small` de "Gratis" | Hace falta una herramienta de contraste y mirar ese texto concreto |
| 4 enlaces que abren pestaña nueva sin avisarlo | Hace falta lector de pantalla o leer el HTML |
| `canonical` y `og:url` apuntando a `www.ejemplo.com` | Está fuera de los criterios de este reto |
| Objetivos táctiles por debajo de 24×24 (WCAG 2.5.8) | **Desconocido**: sigue sin medirse. Podría ser improbable o podría ser el sexto defecto |

---

## 4. Qué cambiaría del cuaderno para mejorar la nota

Ordenado por puntos ganados por hora invertida.

### 4.1 Lo más rentable: el cuaderno documenta cumplimientos, no violaciones

Esto es el agujero conceptual más grande de lo que te entregué, y lo vi al releerlo contra el enunciado.

Una **evaluación heurística**, en el método de Nielsen, no es una lista de lo que el sistema hace bien: es un inventario de **violaciones clasificadas por severidad** (0 = no es problema, 1 = cosmético, 2 = menor, 3 = mayor, 4 = catástrofe). Mi §3 del cuaderno está escrita al revés: diez secciones de "mira todo lo que cumple".

Un informe que aplica las 10 heurísticas y **no encuentra un solo problema** se lee como un informe que no se hizo. Y encima el enunciado premia lo contrario: cada error que encuentre el profesor son 2 puntos menos, así que encontrarlos tú primero es la jugada obvia.

**Qué cambiar:** añadir a cada heurística una columna de violaciones con severidad. Los cinco defectos de §3 ya te dan material: 3.1 es H1 y H3 (severidad 3), 3.3 es H1 y H5 (severidad 2), 3.5 es H5 y H8 (severidad 2), 3.4 es H1 (severidad 3 en producción, 1 en una maqueta declarada).

Eso convierte el criterio de heurísticas de "describí mi sitio" a "evalué mi sitio", que es lo que vale 5 puntos.

### 4.2 Falta la tabla que cruza heurísticas con WCAG

Tienes dos listas paralelas, §3 (Nielsen) y §4 (WCAG), y no se tocan. Pero los mejores hallazgos están en la intersección: el arreglo del mapa es H3 (control del usuario) **y** WCAG 2.1.1 a la vez; el carrusel sin pausa es H3 **y** WCAG 2.2.2.

Una tabla de dos entradas —heurística en las filas, principio WCAG en las columnas— enseña que entendiste que usabilidad y accesibilidad no son dos trabajos. Barato de hacer, y es el tipo de cosa que sube una nota de 4 a 5.

### 4.3 El cuaderno no te da el guion de la demostración

El profesor va a probar la página con el teclado delante de ti. Eso no es un entregable del informe, pero es donde se pierden los puntos de "errores encontrados".

Falta en el cuaderno: una página con **qué enseñar en qué orden** y, más importante, **qué contestar cuando encuentre algo**. ACCESIBILIDAD_TECLADO.md §2 tiene un recorrido de cinco pasos, pero está escrito para que entiendas el sitio, no para defenderlo en vivo.

Si quieres te lo armo, pero con el mismo trato: yo pongo las preguntas probables y los datos, tú escribes lo que vas a decir.

### 4.4 Las conclusiones están propuestas como títulos, no como argumentos

Mis siete ángulos de §6 son titulares: *"Accesibilidad como rediseño, no como capa"*. Eso no es una conclusión, es el nombre de una. Falta, para cada uno, **la evidencia concreta que lo sostiene** y **qué se seguiría de ahí** — las dos cosas que convierten una afirmación en conclusión.

Lo dejé así a propósito para no escribírtelas, pero me pasé de corto: un ángulo sin su evidencia al lado es más difícil de desarrollar, no más fácil. Puedo añadir a cada uno los dos o tres datos que lo prueban, sin escribir el argumento.

### 4.5 Tres mediciones siguen abiertas y una puede ser un sexto defecto

Las de §8 del cuaderno. La de objetivos táctiles (24×24, WCAG 2.5.8) es la que importa: no sabes si pasas o no, y es nueva en 2.2, así que es candidata a que te la busquen. Dos minutos con el snippet que te dejé.

---

## 5. Lo que no hice y no voy a hacer

Para que quede claro dónde está la línea:

| Qué | Por qué |
|---|---|
| El informe, los análisis, las conclusiones | El 5 % de IA. Es la parte que vale la nota |
| Decidir el asunto del prototipo de baja fidelidad | Cambia todo el encuadre y es una decisión tuya o del profesor |
| Dibujar el diagrama de estados | Te di el esqueleto con los estados y las transiciones reales del código; el dibujo es trabajo tuyo y se nota la diferencia |
| Arreglar los cinco defectos de §3 | Me pediste solo análisis. Dime y los arreglo, pero decide primero cuáles quieres documentar como hallazgos **antes** de arreglarlos — un defecto arreglado sin documentar no te da ningún punto |

Ese último punto es el que menos obvio es y el que más vale: **el orden importa**. Si arreglas el carrusel hoy y no lo cuentas, ganas cero. Si lo documentas como hallazgo de tu auditoría, con su severidad, y *después* lo arreglas y lo documentas también, el mismo trabajo te paga dos veces: en el criterio de heurísticas y en el de accesibilidad.
