#!/usr/bin/env bash
# =============================================================
# deploy-backend.sh — Deploy NestJS Backend to AWS Lambda (ECR)
#
# Prerequisites:
#   - AWS CLI configured: aws configure (or IAM role attached)
#   - Docker running locally
#   - serverless framework: npm i -g serverless
#
# Usage:
#   ./deploy/deploy-backend.sh [stage] [region]
#
# Example:
#   ./deploy/deploy-backend.sh prod ap-southeast-1
# =============================================================

set -euo pipefail

STAGE="${1:-prod}"
REGION="${2:-ap-southeast-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_NAME="ai-interview-backend"
IMAGE_TAG="${STAGE}-$(git rev-parse --short HEAD)"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
ECR_IMAGE_URI="${ECR_REGISTRY}/${REPO_NAME}:${IMAGE_TAG}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AI Interview Assistant — Backend Deploy to AWS Lambda   ║"
echo "║  Stage:  ${STAGE}                                        "
echo "║  Region: ${REGION}                                       "
echo "║  Image:  ${ECR_IMAGE_URI}                                "
echo "╚══════════════════════════════════════════════════════════╝"

# ── Step 1: Ensure ECR repository exists ─────────────────────
echo ""
echo "📦 [1/5] Creating ECR repository (if not exists)..."
aws ecr describe-repositories --repository-names "${REPO_NAME}" --region "${REGION}" 2>/dev/null || \
  aws ecr create-repository \
    --repository-name "${REPO_NAME}" \
    --region "${REGION}" \
    --image-scanning-configuration scanOnPush=true \
    --output text

# ── Step 2: Authenticate Docker with ECR ─────────────────────
echo ""
echo "🔐 [2/5] Authenticating Docker with ECR..."
aws ecr get-login-password --region "${REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# ── Step 3: Build Docker Image ────────────────────────────────
echo ""
echo "🏗️  [3/5] Building Docker image (Lambda container)..."
# Run from monorepo root so COPY commands work with the workspace structure
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

docker build \
  --platform linux/amd64 \
  -f "${MONOREPO_ROOT}/apps/backend/Dockerfile.lambda" \
  -t "${REPO_NAME}:${IMAGE_TAG}" \
  "${MONOREPO_ROOT}"

# ── Step 4: Push to ECR ───────────────────────────────────────
echo ""
echo "🚀 [4/5] Pushing image to ECR..."
docker tag "${REPO_NAME}:${IMAGE_TAG}" "${ECR_IMAGE_URI}"
docker push "${ECR_IMAGE_URI}"
# Also tag as 'latest' for convenience
docker tag "${REPO_NAME}:${IMAGE_TAG}" "${ECR_REGISTRY}/${REPO_NAME}:${STAGE}-latest"
docker push "${ECR_REGISTRY}/${REPO_NAME}:${STAGE}-latest"

echo "✅  Image pushed: ${ECR_IMAGE_URI}"

# ── Step 5: Deploy with Serverless Framework ─────────────────
echo ""
echo "⚡ [5/5] Deploying Lambda function via Serverless Framework..."
cd "${MONOREPO_ROOT}/apps/backend"

# Load .env.prod if present
if [ -f ".env.${STAGE}" ]; then
  echo "  → Loading .env.${STAGE}..."
  set -a; source ".env.${STAGE}"; set +a
fi

export ECR_IMAGE_URI="${ECR_IMAGE_URI}"

npx serverless deploy --stage "${STAGE}" --region "${REGION}" --verbose

echo ""
echo "══════════════════════════════════════════════════════════"
echo "✅  BACKEND DEPLOYED SUCCESSFULLY!"
echo "   Lambda Function:  ai-interview-backend-${STAGE}-api"
echo "   API Gateway URL:  (check Serverless output above)"
echo ""
echo "   📝 Next Steps:"
echo "   1. Copy the API Gateway URL shown above"
echo "   2. Set NEXT_PUBLIC_API_URL in Cloudflare Pages environment"
echo "   3. Run DB migrations:  ./deploy/migrate-prod.sh"
echo "══════════════════════════════════════════════════════════"
