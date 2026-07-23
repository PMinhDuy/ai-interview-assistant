# ADR-002: Vector Database — pgvector vs Dedicated Vector DB

**Date:** 2026-07-22
**Status:** Accepted

---

## Context

RAG (Retrieval-Augmented Generation) requires storing and querying vector embeddings for similarity search.

## Decision

Use **pgvector** extension on PostgreSQL instead of a dedicated vector database.

## Comparison

| Feature | pgvector | Pinecone | Weaviate | OpenSearch |
|---------|----------|----------|----------|------------|
| **Self-hosted** | ✅ Free | ❌ Serverless only | ✅ | ✅ |
| **AWS Managed** | Aurora PG | ❌ | ❌ | ✅ OpenSearch Serverless |
| **Cost (dev)** | $0 (local) | $70+/mo | $0 (local) | $0 (local) |
| **Cost (prod)** | ~$50/mo (RDS) | $70-500/mo | $0-100/mo | $100-500/mo |
| **Dimensions** | Up to 2000 | Up to 20000 | Up to 65536 | Up to 16000 |
| **Index types** | IVFFlat, HNSW | Proprietary | HNSW | HNSW |
| **SQL integration** | ✅ Native | ❌ | ❌ | Partial |
| **Operational complexity** | Low | Very Low | Medium | High |

## Why pgvector Won

1. **Zero additional infrastructure** — vectors live in the same DB as all other data
2. **SQL joins** — can filter embeddings by user, document type, date in one query
3. **Transactions** — embedding insert + metadata update is ACID
4. **Local development** — works in Docker Compose with `pgvector/pgvector:pg16`
5. **AWS path** — Aurora PostgreSQL supports pgvector natively

## Configuration

```sql
-- cosine distance (best for text embeddings)
SELECT id, content, 1 - (vector <=> query_vector) AS similarity
FROM embeddings
ORDER BY vector <=> query_vector
LIMIT 5;

-- Index for performance (use after loading >10k vectors)
CREATE INDEX ON embeddings USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);
```

## Limitations

- Max ~1M vectors before needing index tuning
- HNSW better for recall (available in pgvector 0.5+)
- Cannot do real-time approximate search at 100M+ scale (use dedicated DB then)

## AIP-C01 Note

**Amazon OpenSearch Serverless** is the AWS-managed vector search service used by Bedrock Knowledge Bases.
- Automatically scales
- Cost: ~$0.24/OCU-hour (can get expensive fast)
- Used internally by Bedrock Knowledge Base (Phase 10)
- For our custom RAG (Phase 5): pgvector is sufficient and free

**When to migrate to OpenSearch:**
- > 10M embeddings
- < 10ms P99 search latency requirement
- Multi-tenant with complex ACL
