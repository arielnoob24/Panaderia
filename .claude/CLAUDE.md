# Cómo trabajamos en el sitio de El Tradicional

Este archivo lo carga Claude Code en cada sesión. Dice el **flujo** de trabajo;
lo que el sitio debe hacer está en `.claude/plan.md`.

## El flujo, siempre en este orden

1. **Conversar el cambio**, corto, solo hasta tener claro qué se quiere. Aquí
   no se toca código. Si hay decisiones abiertas, se preguntan.
2. **Hacerlo y verlo.** Se implementa y se verifica (build y pruebas). Los
   agentes se usan solo si el cambio los justifica: cada uno arranca de cero y
   relee el contexto, que es lo que más tokens gasta.
3. **Aprobación del usuario.**
4. **Cerrar.** Se actualiza `.claude/plan.md` con lo que quedó. Los agentes y
   las skills se tocan solo si cambió una regla o un procedimiento de verdad;
   un cambio de color o de distribución no los toca.

## Reglas fijas

- Se trabaja directo en **`main`** (desde el 21 de octubre de 2026): se
  commitea y se pushea ahí sin preguntar, y cada push publica en GitHub
  Pages. La rama `mejoras` ya no se usa.
- Solo servicios gratis, sin tarjeta.
- Los informes de clase admiten como máximo un 5% de texto de IA: lo que
  escribe Claude es material de referencia, nunca texto para entregar.
- El resto de reglas está en la sección 2 de `.claude/plan.md`.
