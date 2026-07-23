# ADR-001: Authentication Strategy

**Date:** 2026-07-22
**Status:** Accepted
**Deciders:** Engineering Team

---

## Context

The application needs secure, stateless authentication that works locally and can scale on AWS.

## Decision

Use **JWT (JSON Web Tokens)** with a **dual-token strategy** (access token + refresh token).

### Implementation Details

| Token | TTL | Storage | Purpose |
|-------|-----|---------|---------|
| Access Token | 15 min | Memory (frontend) | API authorization |
| Refresh Token | 7 days | httpOnly cookie OR body | Token renewal |

**Refresh token security:**
- Hash stored in PostgreSQL (bcrypt, 12 rounds)
- Presence flag in Redis (fast invalidation)
- Rotation on each use (prevents replay attacks)

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Session-based** | Simple, easy revoke | Not stateless, Redis dependency |
| **JWT only** | Stateless | Cannot revoke until expiry |
| **AWS Cognito** | Managed, scalable | Costs $0.0055/MAU, AWS lock-in |
| **JWT + Refresh (chosen)** | Stateless + revocable | Two-token complexity |

## Consequences

✅ Works fully locally (no AWS needed)
✅ Can switch to Cognito in Phase 9 via `AuthProvider` abstraction
✅ Short-lived access tokens minimize exposure window
⚠️ Redis dependency for fast logout (degraded mode: rely on DB hash only)

## AIP-C01 Note

AWS Cognito is the managed identity service for AI applications on AWS.
- Supports OIDC, SAML, social login
- Integrates with API Gateway and Lambda authorizers
- Free tier: 50,000 MAU, then $0.0055/MAU
- For this project: implement JWT locally, add Cognito in Phase 9 optionally
