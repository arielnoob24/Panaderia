---
name: probar-bd
description: Prueba la base de datos de la panaderia (bd/BD_EL_TRADICIONAL.sql) sin PostgreSQL instalado - la ejecuta en PGlite, comprueba las reglas del modelo del plan (nombres ENTIDAD/ENT_Atributo, PK codigo, debiles, sin 1:1 ni herencia, todo conectado), que el catalogo coincida con data/productos.json, y los inserts que deben pasar y fallar. Usala despues de tocar el script de la base o data/productos.json, y antes de commitear.
---

# Probar la base de datos

La base es `bd/BD_EL_TRADICIONAL.sql` (PostgreSQL). Sus reglas están en la
tabla "Reglas del modelo" de la sección 8 de `.claude/plan.md`. Esta skill
las comprueba con `probar.mjs`, que está junto a este archivo.

## Pasos

1. **Prepara PGlite en el scratchpad**, nunca en el repo: el sitio no lleva
   dependencias. Solo hace falta la primera vez de cada sesión:

   ```bash
   S="<scratchpad>/pg"
   mkdir -p "$S" && cd "$S" && npm init -y >/dev/null && npm i @electric-sql/pglite@0.2.17
   ```

2. **Copia el script y ejecútalo desde ahí.** Node busca `@electric-sql/pglite`
   junto al script, por eso no se ejecuta desde el repo:

   ```bash
   cp "<repo>/.claude/skills/probar-bd/probar.mjs" "$S/"
   cd "$S" && node probar.mjs "<repo>/bd/BD_EL_TRADICIONAL.sql" "<repo>/data/productos.json"
   ```

   Se ejecuta solo el paso 2 del script (lo que va después de `\connect`):
   PGlite ya es una base, así que `CREATE DATABASE` sobra.

3. **Lee el resultado.** Cada línea dice `OK` o `MAL`, y al final sale
   `Todo bien` o cuántas fallaron (código de salida 1).

## Qué comprueba

| Bloque | Qué mira | Si sale MAL |
|---|---|---|
| El script | Que corre sin errores y no tiene las palabras que rechaza el CI | Arregla el SQL |
| Estructura | Nombres `ENTIDAD` / `ENT_Atributo` y un prefijo por tabla. Cada FK con el nombre de la PK que referencia. La PK de una fuerte es `XXX_Codigo`; la de una débil, la unión de sus FK. Sin 1:1 ni herencia, cada tabla con alguna relación y todas en un solo grupo. Autenticación y autorización con al menos 3 tablas | Es una regla del profesor o del usuario: cambia el modelo, no la prueba. Si de verdad hace falta romperla, pregúntale al usuario |
| Datos iniciales | Cada producto del JSON con su categoría, foto, alt, disponible, destacado, sello, tamaños y precios, más las 24 provincias | Actualiza los inserts del catálogo en el SQL |
| Pruebas del caso | Cédula y RUC; usuario, verificación, dirección, pedido, líneas, pago, totales y factura, con inserts que deben pasar y otros que deben fallar | Si cambiaste a propósito esa tabla, ajusta su prueba en `probar.mjs`; si no, es un error del SQL |

Las comprobaciones de estructura leen el catálogo de PostgreSQL, así que
sirven sin cambios cuando se agregan tablas. Las pruebas del caso usan
nombres concretos de tablas y columnas: al agregar una tabla con reglas
propias, agrégale su prueba.

## Ojo

- Las secuencias dejan huecos cuando un insert falla (`PED0000005` después
  de cuatro fallos). Es normal; no lo "arregles". La excepción es el
  secuencial de factura, que no puede tener saltos.
- PostgreSQL guarda en minúsculas los nombres sin comillas, y la prueba los
  ve así (`productos`, `pro_nombre`).
- Si cambias una regla de la sección 8 del plan, cambia aquí su comprobación
  en el mismo cambio.
