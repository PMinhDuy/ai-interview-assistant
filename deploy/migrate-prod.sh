#!/usr/bin/env bash
# =============================================================
# migrate-prod.sh — Run Prisma migrations against Production DB
#
# Usage:
#   ./deploy/migrate-prod.sh [stage]
#
# This script runs ONLY `prisma migrate deploy` (safe — no prompt,
# does NOT create new migrations). Migrations must be created locally
# and committed to the repository first.
# =============================================================

set -euo pipefail

STAGE="${1:-prod}"
MONOREPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🗄️  Running Prisma Migrations for stage: ${STAGE}"
echo ""

cd "${MONOREPO_ROOT}/apps/backend"

# Load prod env
if [ -f ".env.${STAGE}" ]; then
  echo "  → Loading .env.${STAGE}..."
  set -a; source ".env.${STAGE}"; set +a
elif [ -z "${DIRECT_URL:-}" ]; then
  echo "❌  ERROR: DIRECT_URL is not set."
  echo "   Set it in .env.${STAGE} or export it before running this script."
  exit 1
fi

echo "  → Generating Prisma client..."
npx prisma generate

echo "  → Deploying migrations to production database..."
npx prisma migrate deploy

echo ""
echo "✅  Migrations applied successfully!"
