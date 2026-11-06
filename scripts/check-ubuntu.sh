#!/usr/bin/env bash
set -u
missing=0
for tool in node npm cargo rustc cc pkg-config; do
  if command -v "$tool" >/dev/null 2>&1; then
    echo "OK: $tool"
  else
    echo "FALTA: $tool"
    missing=1
  fi
done
if command -v node >/dev/null 2>&1; then
  node -e 'const [major,minor]=process.versions.node.split(".").map(Number);if(major<22||(major===22&&minor<12)){console.error("FALTA: Node 22.12+ (recomendado: Node 24 LTS)");process.exit(1)}console.log("OK: Node "+process.versions.node)' || missing=1
fi
if command -v pkg-config >/dev/null 2>&1; then
  for lib in webkit2gtk-4.1 gtk+-3.0 librsvg-2.0; do
    if pkg-config --exists "$lib"; then
      echo "OK: $lib $(pkg-config --modversion "$lib")"
    else
      echo "FALTA: $lib"
      missing=1
    fi
  done
fi
if [[ "$missing" -eq 1 ]]; then
  echo "Consulte docs/INSTALACAO.md para preparar o desktop. Após npm run build, a interface web pode ser servida com Python 3."
else
  echo "Pré-requisitos principais encontrados. Execute: npm ci && npm run desktop:dev"
fi
exit "$missing"
