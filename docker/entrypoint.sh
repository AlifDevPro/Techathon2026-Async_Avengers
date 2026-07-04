#!/bin/sh
set -e

export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"

echo "=============================================="
echo " Office Energy Monitor"
echo " Dashboard : http://0.0.0.0:${PORT}/dashboard"
echo " API       : ${API_BASE_URL}/api/devices"
echo "=============================================="

if [ -f "./server.js" ]; then
  echo "Starting Next.js (standalone)..."
  node server.js &
else
  echo "Starting Next.js..."
  node node_modules/next/dist/bin/next start -H "$HOSTNAME" -p "$PORT" &
fi
NEXT_PID=$!

echo "Waiting for API..."
ready=0
i=0
while [ "$i" -lt 45 ]; do
  if wget -qO- "http://127.0.0.1:${PORT}/api/devices" >/dev/null 2>&1; then
    ready=1
    break
  fi
  i=$((i + 1))
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  echo "ERROR: API did not become ready in time."
  kill "$NEXT_PID" 2>/dev/null || true
  exit 1
fi
echo "API ready."

BOT_PID=""
if [ -n "$DISCORD_BOT_TOKEN" ]; then
  echo "Starting Discord bot..."
  node node_modules/tsx/dist/cli.mjs scripts/run-bot.ts &
  BOT_PID=$!
else
  echo "DISCORD_BOT_TOKEN not set — running dashboard only."
fi

shutdown() {
  echo "Shutting down..."
  kill "$NEXT_PID" 2>/dev/null || true
  [ -n "$BOT_PID" ] && kill "$BOT_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  exit 0
}
trap shutdown TERM INT

if [ -n "$BOT_PID" ]; then
  wait "$NEXT_PID" "$BOT_PID" 2>/dev/null || wait
else
  wait "$NEXT_PID"
fi
