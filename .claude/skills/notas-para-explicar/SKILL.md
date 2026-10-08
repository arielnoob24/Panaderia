---
name: notas-para-explicar
description: Prepara notas de estudio sobre una parte del sitio de la panaderia (que hace, donde esta, como demostrarlo y que preguntaria la profe) para que el usuario la explique o escriba su informe con sus palabras. Nunca redacta parrafos para entregar.
argument-hint: "<tema: un modulo, una funcion, un criterio del reto...>"
disable-model-invocation: true
---

# Notas para explicar: $ARGUMENTS

## La regla que manda

Los informes de Desarrollo de Plataformas admiten **como maximo un 5% de texto
generado por IA**; pasarse califica sobre la mitad. Estas notas son para que el
usuario entienda y recuerde, **no** texto para pegar. Por eso:

- Nada de parrafos redactados. Solo vinetas cortas, tablas, rutas y datos medidos.
- Nada de introducciones ni conclusiones: esas partes las escribe el usuario.
- Si pide "escribeme el informe" o "redacta esta seccion", recordarle el limite
  del 5% y ofrecerle estas notas en su lugar.

## Que llevan las notas

1. **Donde esta**: archivos y lineas, como enlaces (`js/cart.js:592`).
2. **Que hace**, en 3 a 6 vinetas, cada una con una idea.
3. **Como se demuestra**: pasos concretos en el sitio publicado para ensenarlo
   en vivo (que pulsar, que se ve, que mirar en DevTools).
4. **Evidencia medida**: datos que salgan de correr algo, no de suponerlo
   (cuantos productos, que guarda cada almacenamiento, que dice el lector de
   pantalla...). Si hace falta abrir la pagina, usar la skill `verificar-sitio`
   o un script parecido.
5. **Preguntas que podria hacer la profe**, con la pista de por donde va la
   respuesta, sin escribirla entera.
6. Si el tema es un criterio del reto, cruzarlo con el enunciado (el PDF
   `RDA1 - Criterio 2 - Reto 4.pdf` u otro que haya en la raiz) y marcar que
   pide el criterio que todavia no esta cubierto.

## Donde van

En el chat, salvo que el usuario pida guardarlas. Si las guarda, en un `.md` de
la raiz con una primera linea que diga que es material de referencia y no texto
para entregar. Antes de crear uno nuevo, mirar si `GUIA_PARA_EXPLICAR.md`,
`EXPLICACION_DEL_CODIGO.md` o `ACCESIBILIDAD_TECLADO.md` ya cubren el tema y
completar ese.
