#!/usr/bin/env bash
# ECONEURA · Gates básicos (OpenAPI, /v1-only, Seed) con logs, HIL y rollback opcional
# v2025-09-03

set -Eeuo pipefail

# ------------------ CONFIG (env overrides) ------------------
ART="${ART:-.artifacts}"                 # carpeta de artefactos
MAX_RETRIES="${MAX_RETRIES:-2}"          # reintentos por gate
BACKOFF_BASE="${BACKOFF_BASE:-3}"        # segundos de backoff base
CMD_TIMEOUT="${CMD_TIMEOUT:-300}"        # timeout s por gate (si 'timeout' disponible)
AUTO_REVERT="${AUTO_REVERT:-0}"          # 1 → hace git revert auto al fallar
COMMIT_HIL="${COMMIT_HIL:-1}"            # 1 → commitea HIL_REQUIRED.yaml si existe
PUSH_ON_PASS="${PUSH_ON_PASS:-0}"        # 1 → git push si todos PASS
SKIP_INSTALL="${SKIP_INSTALL:-0}"        # 1 → no ejecuta pnpm install

# Archivos seed conocidos (añade más si aplica)
SEED_FILES_DEFAULT='["seed/agents_master.json","apps/api/seed/agents_master.json"]'
SEED_FILES_JSON="${SEED_FILES_JSON:-$SEED_FILES_DEFAULT}"

# ------------------ UTILIDADES ------------------
mkdir -p "${ART}/logs"
HEAD0="$(git rev-parse HEAD 2>/dev/null || echo "")"

log(){ printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*"; }
have(){ command -v "$1" >/dev/null 2>&1; }
TMO(){ if have timeout; then timeout -k 10s "${CMD_TIMEOUT}s" "$@"; else "$@"; fi; }

retry(){
  # retry <name> <cmd...>
  local name="$1"; shift
  local n=0 delay="$BACKOFF_BASE"
  while :; do
    if TMO "$@"; then return 0; fi
    n=$((n+1))
    if (( n >= MAX_RETRIES )); then return 1; fi
    log "retry[$name] intento $n falló, durmiendo ${delay}s"
    sleep "${delay}"; delay=$((delay*2))
  done
}

to_json_string(){ node -e 'console.log(JSON.stringify(process.argv[1]))' "$1"; }

write_hil(){
  # write_hil <gate> <causa> <archivo> <linea> <logfile>
  local gate="$1" cause="$2" file="$3" line="$4" logf="$5"
  local tail_log=""; [ -f "$logf" ] && tail_log="$(tail -n 80 "$logf")"
  cat > HIL_REQUIRED.yaml <<YAML
HIL_REQUIRED:
  gate: ${gate}
  causa: ${cause}
  archivo: ${file}
  linea: ${line}
  evidencias:
    log_tail: |
$(printf '%s\n' "$tail_log" | sed 's/^/      /')
    diff: |
$(git diff --stat "${HEAD0:-HEAD^}"..HEAD 2>/dev/null | sed 's/^/      /' || true)
YAML
  if [ "$COMMIT_HIL" = "1" ]; then
    git add HIL_REQUIRED.yaml || true
    git commit -m "ci(hil): ${gate} [auto]" || true
  fi
}

rollback_if_wanted(){
  if [ "$AUTO_REVERT" = "1" ] && [ -n "$HEAD0" ]; then
    log "rollback: git revert último commit"
    git revert -n HEAD || true
    git commit -m "revert(ci): gate fail [auto]" || true
  fi
}

ensure_node(){
  have node || { echo "node no encontrado" >&2; exit 127; }
  have pnpm || { echo "pnpm no encontrado" >&2; exit 127; }
  log "node=$(node -v) pnpm=$(pnpm -v)"
}

# Contador robusto de seeds (leer arrays JSON en rutas conocidas)
count_seeds(){
  node -e '
    const fs=require("fs");
    const list = JSON.parse(process.env.SEED_FILES_JSON||"[]");
    let max=0;
    for(const p of list){ try{
      const j=JSON.parse(fs.readFileSync(p,"utf8"));
      const n=Array.isArray(j)?j.length:(Array.isArray(j?.data)?j.data.length:0);
      if(n>max) max=n;
    }catch{} }
    console.log(max);
  '
}

# ------------------ PREP ------------------
log "prep: entorno y artefactos → ${ART}"
ensure_node
echo "{}" > "${ART}/gates.json"

if [ "$SKIP_INSTALL" != "1" ]; then
  log "prep: pnpm -w install --frozen-lockfile"
  if ! pnpm -w install --frozen-lockfile >"${ART}/logs/pnpm-install.log" 2>&1; then
    log "warn: install falló (continuo). Ver ${ART}/logs/pnpm-install.log"
  fi
fi

# ------------------ GATES ------------------
G_OPENAPI="PENDING"; G_V1="PENDING"; G_SEED="PENDING"
OPENAPI_LOG="${ART}/logs/openapi-checksum.log"
V1_LOG="${ART}/logs/route-linter.log"
SEED_LOG="${ART}/logs/seed-check.log"

# Gate 1 — OPENAPI_CHECKSUM
log "gate: OPENAPI_CHECKSUM"
if have pnpm && npm pkg get scripts.openapi:checksum >/dev/null 2>&1; then
  if retry "openapi" bash -c "pnpm openapi:checksum >'$OPENAPI_LOG' 2>&1"; then
    G_OPENAPI="PASS"
  else
    G_OPENAPI="FAIL"
    write_hil "OPENAPI_CHECKSUM" "checksum no coincide" "scripts/openapi-checksum.ts" "1" "$OPENAPI_LOG"
    rollback_if_wanted
  fi
else
  G_OPENAPI="FAIL"
  echo "script openapi:checksum ausente" > "$OPENAPI_LOG"
  write_hil "OPENAPI_CHECKSUM" "script openapi:checksum ausente" "package.json" "scripts" "$OPENAPI_LOG"
  rollback_if_wanted
fi

# Gate 2 — V1_ONLY (route-linter)
log "gate: V1_ONLY (/v1-only)"
if have pnpm && npm pkg get scripts.route:linter >/dev/null 2>&1; then
  if retry "v1only" bash -c "pnpm route:linter >'$V1_LOG' 2>&1"; then
    G_V1="PASS"
  else
    G_V1="FAIL"
    write_hil "V1_ONLY" "rutas fuera de /v1 detectadas o linter falló" "scripts/route-linter.ts" "1" "$V1_LOG"
    rollback_if_wanted
  fi
else
  # Fallback heurístico (grep) si no hay script (puede dar falsos positivos)
  log "fallback: grep heurístico de rutas (puede ser ruidoso)"
  { grep -RInE "\bapp\.(get|post|put|delete|patch)\s*\(\s*['\"]\/[^v]" apps/api || true; } >"$V1_LOG" 2>&1 || true
  if [ -s "$V1_LOG" ]; then
    G_V1="FAIL"
    write_hil "V1_ONLY" "posibles rutas no versionadas detectadas (fallback)" "apps/api" "?" "$V1_LOG"
    rollback_if_wanted
  else
    G_V1="PASS"
  fi
fi

# Gate 3 — SEED_>=60
log "gate: SEED_>=60"
SEED_COUNT="0"
if have pnpm && npm pkg get scripts.seed:check60 >/dev/null 2>&1; then
  if retry "seed" bash -c "pnpm seed:check60 >'$SEED_LOG' 2>&1"; then
    G_SEED="PASS"
  else
    # fallback de conteo
    SEED_COUNT="$(SEED_FILES_JSON='$SEED_FILES_JSON' count_seeds 2>/dev/null || echo 0)"
    echo "fallback count=${SEED_COUNT}" >> "$SEED_LOG"
    if [ "${SEED_COUNT:-0}" -ge 60 ]; then
      G_SEED="PASS"
    else
      G_SEED="FAIL"
      write_hil "SEED_>=60" "seed=${SEED_COUNT} < 60" "seed/agents_master.json" "1" "$SEED_LOG"
      rollback_if_wanted
    fi
  fi
else
  SEED_COUNT="$(SEED_FILES_JSON='$SEED_FILES_JSON' count_seeds 2>/dev/null || echo 0)"
  echo "fallback count=${SEED_COUNT}" > "$SEED_LOG"
  if [ "${SEED_COUNT:-0}" -ge 60 ]; then
    G_SEED="PASS"
  else
    G_SEED="FAIL"
    write_hil "SEED_>=60" "seed=${SEED_COUNT} < 60 (sin script seed:check60)" "seed/agents_master.json" "1" "$SEED_LOG"
    rollback_if_wanted
  fi
fi

# ------------------ SALIDAS ------------------
# JSON máquina
node >"${ART}/gates.json" <<JSON
{
  "timestamp": "$(date -u +%FT%TZ)",
  "git_head_start": "$(to_json_string "$HEAD0")",
  "git_head_end": "$(git rev-parse HEAD 2>/dev/null || echo "")",
  "node": "$(node -v)",
  "pnpm": "$(pnpm -v)",
  "gates": {
    "OPENAPI_CHECKSUM": "${G_OPENAPI}",
    "V1_ONLY": "${G_V1}",
    "SEED_>=60": "${G_SEED}"
  },
  "seed_count": ${SEED_COUNT:-0},
  "logs": {
    "openapi": "${OPENAPI_LOG}",
    "v1_only": "${V1_LOG}",
    "seed": "${SEED_LOG}"
  }
}
JSON

# Humano
echo
echo "GATES MATRIX"
echo "OPENAPI_CHECKSUM: ${G_OPENAPI}"
echo "V1_ONLY: ${G_V1}"
echo "SEED_>=60: ${G_SEED}"
echo
echo "PATCH SUMMARY"
if [ -n "$HEAD0" ]; then git diff --name-only "$HEAD0"..HEAD || true; else git ls-files -m || true; fi
echo
echo "NEXT STEPS"
if [ "$G_OPENAPI" = "PASS" ] && [ "$G_V1" = "PASS" ] && [ "$G_SEED" = "PASS" ]; then
  echo "1) Ejecuta UI (Playwright) y PERF (k6) cuando lo decidas."
  echo "2) Si todo PASS, merge."
  if [ "$PUSH_ON_PASS" = "1" ]; then git push || true; fi
  exit 0
else
  echo "1) Abre HIL_REQUIRED.yaml y corrige la(s) causa(s) indicada(s)."
  echo "2) Repite este script hasta ver 3/3 PASS."
  exit 1
fi
