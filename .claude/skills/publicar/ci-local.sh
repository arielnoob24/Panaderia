#!/usr/bin/env bash
# Corre en esta maquina lo que corre el CI, leido del propio
# .github/workflows/ci-cd.yml (si el CI cambia, esto cambia con el, y no hay
# una copia que se quede atras):
#   1. el paso "Construir" (build sin avisos);
#   2. el paso "Validar catalogo, fotos y textos" (revisar() de cada producto,
#      fotos, categorias de la tienda, palabras prohibidas y
#      espacios al final de linea);
#   3. y, en vez de solo la prueba de humo del CI, todas las pruebas de
#      navegador de pruebas/ (npm run probar), con Edge.
# Si falta node_modules o el package-lock.json es mas nuevo, hace npm ci.
# Uso, desde la raiz del repo y con lo cambiado ya commiteado:
#   bash .claude/skills/publicar/ci-local.sh
set -euo pipefail
[ -f .github/workflows/ci-cd.yml ] || { echo 'Correlo desde la raiz del repo de la panaderia.'; exit 1; }

# El bloque "run: |" del primer paso con ese nombre (el del job validate),
# sin la sangria. Se acaba en la primera linea con menos sangria (el paso
# siguiente, un comentario suyo o el job siguiente).
paso() {
  awk -v nombre="name: $1" '
    index($0, nombre) && $0 ~ (nombre "$") { dentro = 1; next }
    dentro && /run: \|/ { leer = 1; next }
    leer && NF && !/^          / { exit }
    leer { sub(/^          /, ""); print }
  ' .github/workflows/ci-cd.yml
}

construir=$(paso 'Construir')
[ -n "$construir" ] || { echo 'No encontre el paso "Construir" en ci-cd.yml.'; exit 1; }
validar=$(paso 'Validar catalogo, fotos y textos')
[ -n "$validar" ] || { echo 'No encontre el paso "Validar catalogo, fotos y textos" en ci-cd.yml.'; exit 1; }

echo '== Instalar si hace falta'
if [ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm ci
fi

echo '== Construir sin avisos'
bash -c "$construir"

echo '== Validar catalogo, fotos y textos'
bash -c "$validar"

echo '== Pruebas de navegador (todas)'
npm run probar

echo 'CI local: en orden.'
