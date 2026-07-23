# 🤖 AI Technical Interview Assistant

> **Portfolio-quality, production-ready AI Interview Assistant**
> Local-first • AWS-optional • Clean Architecture • AIP-C01 Prep

---

## ✨ Features

| Feature | Local | AWS |
|---------|-------|-----|
| AI Chat + Streaming | ✅ Ollama | ✅ Bedrock Claude |
| Resume Analysis | ✅ | ✅ |
| Custom RAG | ✅ pgvector | ✅ Bedrock KB |
| Interview Engine | ✅ | ✅ |
| Answer Evaluation | ✅ | ✅ |
| File Storage | ✅ Local/MinIO | ✅ S3 |
| Observability | ✅ Winston | ✅ CloudWatch |

---

## 🚀 Quick Start

### Prerequisites

- Docker + Docker Compose
- Node.js 20+
- pnpm 9+
- (Optional) Ollama for local LLM

### 1. Clone & Setup

```bash
git clone <repo-url>
cd ai-interview-assistant
cp .env.example .env
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, Ollama
docker compose up -d

# Pull a local model (first time ~4GB download)
docker exec ai-interview-ollama ollama pull llama3
docker exec ai-interview-ollama ollama pull nomic-embed-text
```

### 3. Install & Setup Backend

```bash
pnpm install

# Generate Prisma client
pnpm --filter @repo/backend prisma:generate

# Run migrations
pnpm --filter @repo/backend prisma:migrate

# Seed dev data
pnpm --filter @repo/backend prisma:seed
```

### 4. Run Development

```bash
# Run all apps
pnpm dev

# Or run individually
pnpm --filter @repo/backend dev     # http://localhost:3001
pnpm --filter @repo/frontend dev    # http://localhost:3000
```

### 5. API Documentation

Open [http://localhost:3001/api/docs](http://localhost:3001/api/docs) for Swagger UI.

**Dev credentials:**
- Admin: `admin@ai-interview.dev` / `Admin123!`
- User: `user@ai-interview.dev` / `User123!`

---

## 🏗️ Architecture

```
ai-interview-assistant/
├── apps/
│   ├── backend/          # NestJS 10 + Prisma + Clean Architecture
│   └── frontend/         # Next.js 15 + shadcn/ui (Phase 1+)
├── packages/
│   ├── types/            # Shared TypeScript contracts
│   ├── tsconfig/         # Base TS configs
│   └── eslint-config/    # Shared ESLint
├── docs/
│   ├── adr/              # Architecture Decision Records
│   └── diagrams/         # Mermaid diagrams
└── infrastructure/
    └── postgres/         # DB init scripts
```

### Provider Pattern (Local ↔ AWS)

```bash
# .env switches:
AI_PROVIDER=local|bedrock
EMBEDDING_PROVIDER=local|titan
STORAGE_PROVIDER=local|s3
KNOWLEDGE_PROVIDER=custom|bedrock-kb
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui |
| Backend | NestJS 10, TypeScript, Prisma, JWT |
| Database | PostgreSQL 16 + pgvector |
| Cache | Redis 7 |
| Local AI | Ollama (llama3, mistral, qwen2.5, deepseek) |
| AWS AI | Amazon Bedrock (Claude, Nova, Titan) |
| Storage | Local FS / MinIO / Amazon S3 |
| DevOps | Docker Compose, Turborepo, GitHub Actions |

---

## 🧪 Testing

```bash
pnpm test              # All tests
pnpm --filter @repo/backend test:cov   # Backend with coverage
pnpm --filter @repo/backend test:e2e   # E2E tests
```

---

## 📚 Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (this) | ✅ Complete |
| 2 | File Upload + Text Extraction | ⏳ |
| 3 | Ollama Chat + Streaming | ⏳ |
| 4 | Prompt Management | ⏳ |
| 5 | Custom RAG (pgvector) | ⏳ |
| 6 | Interview Engine | ⏳ |
| 7 | Evaluation Engine | ⏳ |
| 8 | Dashboard | ⏳ |
| 9 | AWS Integration | ⏳ |
| 10 | Bedrock Knowledge Base | ⏳ |
| 11 | Production Hardening | ⏳ |

---

## 📋 AIP-C01 Certification Coverage

This project covers all exam domains:

- **Fundamentals of Generative AI** — LLM architecture, model comparison
- **Fundamentals of AWS AI Services** — Bedrock, SageMaker overview
- **Prompt Engineering** — Templates, few-shot, CoT, XML prompts
- **RAG** — Custom pgvector RAG + Bedrock Knowledge Base
- **Embeddings** — Local (nomic) + AWS (Titan), dimensions, similarity
- **AI Safety & Governance** — Prompt injection, guardrails, validation
- **Cost Optimization** — Token counting, provider comparison, caching
