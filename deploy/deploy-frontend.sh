#!/usr/bin/env bash
# =============================================================
# deploy-frontend.sh — Deploy Next.js Frontend to Cloudflare Pages
#
# Method: Static Export via `next export` + Cloudflare Pages Direct Upload
# OR: Use Cloudflare Pages Git Integration (recommended — no script needed)
#
# Prerequisites:
#   - Cloudflare account with Pages project created
#   - wrangler CLI: npm i -g wrangler
#   - Logged in: wrangler login
#   - CLOUDFLARE_ACCOUNT_ID set in environment
#
# Usage:
#   CLOUDFLARE_ACCOUNT_ID=xxx ./deploy/deploy-frontend.sh [project-name] [branch]
#
# Example:
#   CLOUDFLARE_ACCOUNT_ID=abc123 ./deploy/deploy-frontend.sh ai-interview-assistant production
# =============================================================

set -euo pipefail

PROJECT_NAME="${1:-ai-interview-assistant}"
BRANCH="${2:-production}"
MONOREPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${MONOREPO_ROOT}/apps/frontend"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AI Interview Assistant — Frontend Deploy to Cloudflare  ║"
echo "║  Project: ${PROJECT_NAME}                                "
echo "║  Branch:  ${BRANCH}                                      "
echo "╚══════════════════════════════════════════════════════════╝"

# ── Verify env vars ───────────────────────────────────────────
if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "❌  ERROR: CLOUDFLARE_ACCOUNT_ID is not set."
  echo "   Export it or prefix the command:"
  echo "   CLOUDFLARE_ACCOUNT_ID=xxx ./deploy/deploy-frontend.sh"
  exit 1
fi

if [ -z "${NEXT_PUBLIC_API_URL:-}" ]; then
  echo "❌  ERROR: NEXT_PUBLIC_API_URL is not set."
  echo "   Set it to your AWS API Gateway endpoint:"
  echo "   NEXT_PUBLIC_API_URL=https://xxx.execute-api.ap-southeast-1.amazonaws.com/api/v1"
  exit 1
fi

# ── Build Next.js ─────────────────────────────────────────────
echo ""
echo "🏗️  [1/3] Building Next.js app for production..."
cd "${FRONTEND_DIR}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" pnpm build

# ── Deploy to Cloudflare Pages ────────────────────────────────
echo ""
echo "🚀 [2/3] Deploying to Cloudflare Pages..."
npx wrangler pages deploy .next \
  --project-name="${PROJECT_NAME}" \
  --branch="${BRANCH}" \
  --commit-message="Deploy $(git rev-parse --short HEAD)"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "✅  FRONTEND DEPLOYED SUCCESSFULLY!"
echo ""
echo "   Cloudflare Pages URL: https://${BRANCH}.${PROJECT_NAME}.pages.dev"
echo "   (or your custom domain if configured in Cloudflare dashboard)"
echo ""
echo "   📝 Post-Deploy Checklist:"
echo "   1. Set NEXT_PUBLIC_API_URL env var in Cloudflare Pages dashboard"
echo "      Settings → Environment variables → Production"
echo "   2. Configure custom domain (optional)"
echo "   3. Test the deployed app end-to-end"
echo "══════════════════════════════════════════════════════════"
