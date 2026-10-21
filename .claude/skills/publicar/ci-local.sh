#!/usr/bin/env bash
# Corre en esta maquina lo que corre el CI, leido del propio
# .github/workflows/ci-cd.yml (si el CI cambia, esto cambia con el, y no hay
# una copia que se quede atras):
#   1. el paso "Validar archivos y referencias" (el sitio actual), en la raiz;
#   2. el paso "Construir la version en React" (build sin avisos y palabras
#      prohibidas en react/), en react/;
#   3. y, en vez de solo la prueba de humo del CI, todas las pruebas de
#      navegador de react/pruebas (npm run probar), con Edge.
# Si falta react/node_modules o el package-lock.json es mas nuevo, hace npm ci.
# Uso, desde la raiz del repo y con lo cambiado ya commiteado:
#   bash .claude/skills/publicar/ci-local.sh
set -euo pipefail
[ -f .github/workflows/ci-cd.yml ] || { echo 'Correlo desde la raiz del repo de la panaderia.'; exit 1; }

# El bloque "run: |" del paso con ese nombre, sin la sangria. Se acaba en la
# primera linea con menos sangria (el paso siguiente, un comentario suyo o
# el job siguiente).
paso() {
  awk -v nombre="name: $1" '
    index($0, nombre) && $0 ~ (nombre "$") { dentro = 1; next }
    dentro && /run: \|/ { leer = 1; next }
    leer && NF && !/^          / { exit }
    leer { sub(/^          /, ""); print }
  ' .github/workflows/ci-cd.yml
}

validar=$(paso 'Validar archivos y referencias')
[ -n "$validar" ] || { echo 'No encontre el paso "Validar archivos y referencias" en ci-cd.yml.'; exit 1; }
construir=$(paso 'Construir la version en React')
[ -n "$construir" ] || { echo 'No encontre el paso "Construir la version en React" en ci-cd.yml.'; exit 1; }

echo '== Sitio actual: validar archivos y referencias'
bash -c "$validar"

echo '== React: instalar si hace falta'
if [ ! -f react/node_modules/.package-lock.json ] || [ react/package-lock.json -nt react/node_modules/.package-lock.json ]; then
  (cd react && npm ci)
fi

echo '== React: construir sin avisos'
(cd react && bash -c "$construir")

echo '== React: pruebas de navegador (todas)'
(cd react && npm run probar)

echo 'CI local: en orden.'
