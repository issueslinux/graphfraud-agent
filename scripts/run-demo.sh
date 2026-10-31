#!/usr/bin/env bash
# Run a real IRIS Interoperability/AI Hub demo after loading EAP build 154.
# This must never print success solely because Docker started successfully.
set -euo pipefail
MODE="${1:---require-ai}"
if [[ "$MODE" != "--require-ai" && "$MODE" != "--allow-fallback" ]]; then
  echo 'Usage: run-demo.sh [--require-ai|--allow-fallback]' >&2
  exit 2
fi
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if ! command -v docker >/dev/null 2>&1; then
  echo 'BLOCK: Docker Compose is required; load InterSystems AI Hub EAP 154 locally first.' >&2
  exit 2
fi
docker compose up -d --build
logfile="$(mktemp)"
trap 'rm -f "$logfile"' EXIT
if ! docker compose exec -T iris iris session IRIS -U USER < run-demo.script > "$logfile" 2>&1; then
  cat "$logfile" >&2
  echo 'BLOCK: IRIS terminal invocation failed; no live demo verified.' >&2
  exit 1
fi
cat "$logfile"
if ! grep -qx 'GRAPHFRAUD_DEMO_OK' "$logfile"; then
  echo 'BLOCK: IRIS did not confirm production start and live demo success.' >&2
  exit 1
fi
if [[ "$MODE" == "--require-ai" ]] && ! grep -qx 'GRAPHFRAUD_AI_HUB_USED' "$logfile"; then
  echo 'BLOCK: workflow ran but no actual IRIS AI Hub agent use was confirmed.' >&2
  exit 3
fi
echo 'GraphFraud demo completed; AI Hub agent use confirmed only with GRAPHFRAUD_AI_HUB_USED marker.' 
