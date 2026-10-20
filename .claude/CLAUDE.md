# Cómo trabajamos en el sitio de El Tradicional

Este archivo lo carga Claude Code en cada sesión. Dice el **flujo** de trabajo;
lo que el sitio debe hacer está en `.claude/plan.md`.

## El flujo, siempre en este orden

1. **Conversar el cambio.** Cuando el usuario pide algo, primero se habla hasta
   que los dos estén seguros de qué se quiere y cómo debe comportarse. Aquí no
   se toca código. Si hay decisiones abiertas, se preguntan.
2. **Afinar el plan.** Lo decidido se escribe en `.claude/plan.md`: qué cambia
   y cómo debe funcionar. Lo que ya no aplique se corrige o se borra; lo
   pendiente va a la sección "Pendiente".
3. **Afinar los agentes.** Se actualizan los `.claude/agents/*.md` a los que
   les toca el cambio: qué archivos son suyos, qué reglas siguen y cómo
   verifican. Los agentes no deben saber nada que el plan no diga.
4. **Afinar las skills.** Se ajustan las skills de cada agente (`skills:` en su
   cabecera). Si el cambio trae un tema nuevo, **recomendar una skill**: de
   skills.sh si es conocimiento general (una librería, una norma), o crear una
   propia en `.claude/skills/` si es un procedimiento de este proyecto. Las de
   skills.sh se leen enteras antes de instalarlas.
5. **Aplicar con los agentes.** `frontend` y `logica-datos` hacen el cambio,
   `ux-accesibilidad` lo revisa si toca la interfaz, y `calidad-publicacion`
   lo verifica y lo sube.
6. **Cerrar.** El plan queda igual que el sitio: lo hecho se marca en
   "Pendiente" y se avisa al usuario qué cambió y qué se comprobó.

Un arreglo pequeño que no cambia cómo funciona nada (una errata, un fallo
claro) puede ir directo al paso 5, pero si al final algo se comporta distinto,
el plan se actualiza igual.

## Reglas fijas

- Se trabaja en la rama **`mejoras`**: se commitea y se pushea ahí sin
  preguntar. A `main` (lo presentado, lo que sirve GitHub Pages) solo se
  fusiona cuando el usuario lo pide.
- Solo servicios gratis, sin tarjeta.
- Los informes de clase admiten como máximo un 5% de texto de IA: lo que
  escribe Claude es material de referencia, nunca texto para entregar.
- El resto de reglas está en la sección 2 de `.claude/plan.md`.
