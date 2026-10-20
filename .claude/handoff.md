# Handoff: dónde nos quedamos (20 de octubre de 2026)

## En una línea
Estamos migrando el sitio a **React** en la rama `mejoras`. Las fases 1, 2 y
**3 (la canasta)** están hechas, con el CI en verde. Falta la revisión de
`ux-accesibilidad` de la fase 3 y una decisión tuya (abajo).

## Lo primero mañana
1. `git switch mejoras && git pull`
2. **Decidir** lo del pie (ver "Decisión pendiente").
3. Pedir la **revisión de `ux-accesibilidad`** de la fase 3, como se hizo con
   la fase 2, y arreglar lo que salga.
4. Seguir con la **fase 4: pedido y pago**.

## Decisión pendiente
El sitio actual vuelve a guardar el pedido cada vez que se abre la página, y
por eso el pie dice siempre "Tu pedido se guardó hoy a las <hora de entrar>",
aunque la canasta esté vacía. React solo guarda cuando cambias algo, y enseña
la fecha real. Recomendación de Claude: quedarse con lo de React (es lo
correcto) y arreglar igual el sitio actual. Si se prefiere copiar el sitio
actual, es una línea.

Para retomar, se le puede decir a Claude:
> Lee `.claude/handoff.md` y `.claude/plan.md` y sigamos donde quedamos.

## Cómo trabajamos (está en `.claude/CLAUDE.md`)
conversar el cambio → plan (`.claude/plan.md`) → agentes (`.claude/agents/`)
→ skills → los agentes aplican → cerrar (el plan igual al sitio).
Todo se commitea y se pushea a `mejoras` sin preguntar. `main` es lo que se
presentó y no se toca hasta que tú lo digas.

## Lo decidido hasta ahora
- **React** con Vite, JavaScript (sin TypeScript), React Router con `HashRouter`.
- **Sin doble clic** en la versión React: se sirve por HTTP.
- El código de React vive en `react/` hasta la fase 7; después pasa a la raíz.
- Mismo CSS, mismos textos, mismas reglas y mismas claves de guardado que el
  sitio actual.
- Los enlaces de sección (`#historia`, saltar al contenido...) no son rutas:
  bajan suave y pasan el foco.
- Precios con punto decimal (`$1.25`).
- **Vista previa en internet: en pausa.** La decides al final
  (estaba propuesto Netlify; `netlify.toml` está listo en la raíz).

## Fases de la migración
1. ✅ Andamiaje (Vite, rutas, CSS, una ficha)
2. ✅ Catálogo y página (cabecera, portada, pie, mostrador, vista de catálogo)
   - ✅ Revisión de `ux-accesibilidad` y los 12 arreglos hechos
3. ✅ Canasta (falta la revisión de `ux-accesibilidad`)
4. Pedido y pago (`#confirmar`, factura, tarjeta, comprobante)
5. Cuenta (crear, verificar correo, entrar, editar, historial)
6. Calidad (adaptar `verificar-sitio`, `publicar`, axe y el CI al build de Vite)
7. Cambio: React pasa a la raíz, se borra lo viejo, y se decide cómo publicar

## Agentes (`.claude/agents/`)
| Agente | Hace | Skills |
|---|---|---|
| `frontend` | HTML, CSS, catálogo, cabecera, rutas | verificar-sitio, wcag-audit-patterns, componente-react, vercel-react-best-practices, vercel-composition-patterns |
| `logica-datos` | Canasta, pago, cuenta, guardado, correo, catálogo JSON | verificar-sitio, nielsen-usability-heuristics, componente-react, las dos de Vercel |
| `ux-accesibilidad` | Revisa WCAG 2.2 y Nielsen (solo lee) | wcag-audit-patterns, nielsen-usability-heuristics |
| `calidad-publicacion` | Revisa bugs, CI y sube los cambios | verificar-sitio, publicar, vercel-react-best-practices |

## Pendientes sueltos
- `cart.js` del sitio actual mete el nombre de cada línea guardada con
  `innerHTML` sin `escapar()`. Solo se explota tocando el propio navegador,
  pero conviene arreglarlo. React no lo tiene.
- Dos avisos menores de axe en los dos sitios (`aside` con `role="dialog"` y
  la barra de deshacer fuera de una región).
- En la fase 5: comprobar que el foco entra al abrir el panel de la cuenta
  (le pasaba lo mismo a la canasta y ya se arregló).
- La pantalla de confirmar pedido no tiene `h1` (se arregla en la fase 4).
- En el plan, sección 13: contactos de ejemplo, alérgenos, unidad del precio,
  SEO (`robots.txt`, `sitemap.xml`...).
- Contenidos de IHC para el agente de UX: cuando pases los temas de la materia.
- En el CI hay dos avisos de GitHub: subir `actions/checkout` y `setup-node`
  a v5 (fase 6).

## Para ver los cambios
- Todo lo de la rama: https://github.com/arielnoob24/Panaderia/compare/main...mejoras
- React en tu máquina: `cd react`, `npm install`, `npm run dev`, y abrir
  http://localhost:5173
