#!/usr/bin/env bash
set -euo pipefail
LUME_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LUME_PORT="${LUME_PORT:-8320}"
if ! command -v python3 >/dev/null 2>&1; then
  echo "Instale o Python 3: sudo apt install python3"
  exit 1
fi
if [[ ! -f "$LUME_ROOT/dist/index.html" ]]; then
  echo "A pasta dist não existe. Execute npm ci e npm run build primeiro."
  exit 1
fi
echo "ConsoloStruct 0.6 — detalhamento de consolos"
echo "Abra no navegador: http://127.0.0.1:$LUME_PORT"
echo "Mantenha este terminal aberto. Para encerrar, pressione Ctrl+C."
python3 -m http.server "$LUME_PORT" --bind 127.0.0.1 --directory "$LUME_ROOT/dist"
