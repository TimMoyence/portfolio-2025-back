#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/test/db-integration.compose.yaml"
PROJECT_NAME="portfolio2025-dbint"

cleanup() {
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d --wait

RUN_DB_INTEGRATION=true \
DB_HOST=127.0.0.1 \
DB_PORT=55432 \
DB_USERNAME=postgres \
DB_PASSWORD=postgres \
DB_NAME=portfolio_2025_ci \
npm run test:integration:db -- --runInBand
