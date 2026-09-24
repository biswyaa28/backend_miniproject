#!/usr/bin/env bash
# Start MongoDB (if needed), backend (5001), and frontend (5173).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/healthcare-app/backend"
FRONTEND="$ROOT/healthcare-app/frontend"
BACKEND_LOG="/tmp/healthcare-backend.log"
FRONTEND_LOG="/tmp/healthcare-frontend.log"

log() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
err() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; }

port_busy() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

# --- 1) MongoDB -------------------------------------------------------------
if pgrep -x mongod >/dev/null 2>&1; then
  log "MongoDB already running"
elif command -v brew >/dev/null 2>&1 && brew services list 2>/dev/null | grep -q '^mongodb-community'; then
  log "Starting MongoDB via Homebrew..."
  brew services start mongodb-community
  sleep 2
elif command -v mongod >/dev/null 2>&1; then
  log "Starting mongod..."
  mongod --fork --logpath /tmp/mongod.log --dbpath "${MONGO_DBPATH:-/tmp/mongo-data}" >/dev/null 2>&1 || true
  mkdir -p "${MONGO_DBPATH:-/tmp/mongo-data}"
  mongod --fork --logpath /tmp/mongod.log --dbpath "${MONGO_DBPATH:-/tmp/mongo-data}"
  sleep 1
else
  err "mongod not found. Install MongoDB or start it manually."
  exit 1
fi

if ! pgrep -x mongod >/dev/null 2>&1; then
  err "MongoDB is not running"
  exit 1
fi

# --- 2) Dependencies --------------------------------------------------------
if [ ! -d "$BACKEND/node_modules" ]; then
  log "Installing backend dependencies..."
  (cd "$BACKEND" && npm install)
fi
if [ ! -d "$FRONTEND/node_modules" ]; then
  log "Installing frontend dependencies..."
  (cd "$FRONTEND" && npm install)
fi

if [ ! -f "$BACKEND/.env" ]; then
  log "Creating backend/.env from .env.example"
  cp "$BACKEND/.env.example" "$BACKEND/.env"
fi

# --- 3) Seed demo accounts (optional, non-fatal) ----------------------------
if [ "${SKIP_SEED:-0}" != "1" ]; then
  log "Seeding demo accounts (SKIP_SEED=1 to skip)..."
  (cd "$BACKEND" && npm run seed) || log "Seed skipped/failed (OK if DB already seeded)"
fi

# --- 4) Free ports if stale listeners exist ---------------------------------
free_port() {
  local p="$1" name="$2"
  if port_busy "$p"; then
    log "Port $p busy — killing old $name..."
    lsof -nP -iTCP:"$p" -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}
free_port 5001 "backend"
free_port 5173 "frontend"

# --- 5) Start backend + frontend --------------------------------------------
# Vite defaults to IPv6 (::1); force IPv4 so curl 127.0.0.1 and the browser agree.
http_ok() {
  curl -sf -m 2 "$1" >/dev/null 2>&1 \
    || curl -sf -m 2 -g "http://[::1]${2:-}" >/dev/null 2>&1 \
    || curl -sf -m 2 "http://localhost${2:-}" >/dev/null 2>&1
}

log "Starting backend on http://localhost:5001 ..."
(cd "$BACKEND" && npm run dev >"$BACKEND_LOG" 2>&1) &
BACK_PID=$!

log "Starting frontend on http://localhost:5173 ..."
(cd "$FRONTEND" && ./node_modules/.bin/vite --host 127.0.0.1 --port 5173 >"$FRONTEND_LOG" 2>&1) &
FRONT_PID=$!

cleanup() {
  log "Stopping..."
  kill "$BACK_PID" "$FRONT_PID" 2>/dev/null || true
  free_port 5001 "backend"
  free_port 5173 "frontend"
}
trap cleanup EXIT INT TERM

# --- 6) Wait until both respond ---------------------------------------------
log "Waiting for services..."
backend_up=0
frontend_up=0
for i in $(seq 1 40); do
  if [ "$backend_up" -eq 0 ] && http_ok "http://127.0.0.1:5001/api/health" "/api/health"; then
    backend_up=1
    log "Backend is up"
  fi
  if [ "$frontend_up" -eq 0 ] && http_ok "http://127.0.0.1:5173/" "/"; then
    frontend_up=1
    log "Frontend is up"
  fi
  [ "$backend_up" -eq 1 ] && [ "$frontend_up" -eq 1 ] && break
  sleep 1
done

if [ "$backend_up" -ne 1 ]; then
  err "Backend failed to start. Log:"
  tail -30 "$BACKEND_LOG" >&2 || true
  exit 1
fi
if [ "$frontend_up" -ne 1 ]; then
  err "Frontend failed to start. Log:"
  tail -30 "$FRONTEND_LOG" >&2 || true
  exit 1
fi

cat <<'EOF'

  ================================================
   Healthcare app is RUNNING
  ================================================
   Frontend : http://localhost:5173
   Backend  : http://localhost:5001/api/health
   Logs     : /tmp/healthcare-backend.log
              /tmp/healthcare-frontend.log

   Demo logins (password: demo123)
     admin@demo.com
     doctor@demo.com
     patient@demo.com
     receptionist@demo.com
  ================================================
   Press Ctrl+C to stop both.
EOF

# Keep script alive while children run; surface logs on failure
wait
