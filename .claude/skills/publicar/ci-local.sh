#!/usr/bin/env bash
# Corre en esta maquina el paso "Validar archivos y referencias" del CI,
# leido del propio .github/workflows/ci-cd.yml: si el CI cambia, esto cambia
# con el, y no hay una copia que se quede atras. Se para en el paso siguiente
# del mismo job (el de React) o en el job siguiente: solo se corre este paso.
# Uso, desde la raiz del repo y con lo cambiado ya commiteado:
#   bash .claude/skills/publicar/ci-local.sh
set -euo pipefail
paso=$(awk '
  /name: Validar archivos y referencias/ { dentro = 1 }
  dentro && /run: \|/ { leer = 1; next }
  leer && /^  [a-z]/ { exit }
  leer && /^      - / { exit }
  leer { sub(/^          /, ""); print }
' .github/workflows/ci-cd.yml)
[ -n "$paso" ] || { echo 'No encontre el paso de validacion en ci-cd.yml.'; exit 1; }
bash -c "$paso"
echo 'CI local: en orden.'
