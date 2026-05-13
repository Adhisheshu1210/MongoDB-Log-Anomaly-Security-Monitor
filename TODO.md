# Unified AI-Powered MongoDB Intelligence Platform - Implementation TODO

> Track progress for extending the existing MERN + FastAPI project (do NOT rebuild from scratch).

## Phase 0 — Baseline & Design
- [x] Repo reconnaissance: verified existing Express/FastAPI/React modules
- [x] Define new enterprise module boundaries (search, nlq, schema-ai, migration-ai, threat intel)
- [x] Extend RBAC permission matrix mapping for new endpoints (design only; implementation pending)
- [x] Extend Socket.IO event taxonomy for new capabilities (design only; implementation pending)


## Phase 1 — Backend Foundations
- [x] Create new backend route/service scaffolding for:
  - Semantic Search (/api/search)
  - NLQ (/api/nlq)
  - Schema Assistant (/api/schema)
  - Migration Center (/api/migration)
- [ ] Add new Mongoose models for AI metadata and jobs
- [ ] Add orchestration services (AI Orchestrator layer) with sandboxing


## Phase 2 — AI Service Extensions (FastAPI)
- [ ] Expand ai-service/src/main.py to include new routers/endpoints
- [ ] Add modules:
  - ai-service/src/semantic-search/
  - ai-service/src/nlq/
  - ai-service/src/schema-ai/
  - ai-service/src/migration-ai/
- [ ] Implement embedding generation + NLQ query spec generation
- [ ] Add safe transformation/validation-only behavior for migration

## Phase 3 — Realtime & Analytics
- [ ] Emit Socket.IO events:
  - search:indexed, search:query-completed
  - nlq:query-completed
  - schema:analyzed
  - migration:progress
  - ai:insight
- [ ] Add search analytics persistence + dashboard APIs

## Phase 4 — Frontend Extensions
- [ ] Add pages:
  - Semantic Search
  - AI Query Assistant
  - Schema Assistant
  - Migration Center
  - Threat Intelligence
- [ ] Update sidebar navigation config and role-based navigation
- [ ] Add API client methods + realtime listeners

## Phase 5 — Security Hardening
- [ ] Add query sandbox validator (NLQ execute)
- [ ] Block destructive Mongo ops
- [ ] Ensure RBAC checks for all AI execution endpoints
- [ ] Add audit logging hooks for AI actions

## Phase 6 — Vector Search & Migration Ops (Production readiness)
- [ ] Atlas Vector Search integration (embedding indexing)
- [ ] Job queueing / worker scaling strategy (Redis/BullMQ if needed)
- [ ] Observability (structured logs, health checks, metrics)

## Phase 7 — Documentation & Finalization
- [ ] Update root README + backend DOCUMENTATION_INDEX
- [ ] Add RBAC permission matrix documentation update
- [ ] Add API documentation section + endpoint list
- [ ] Add AI workflow diagrams (markdown)

## Phase 8 — Test & Validate
- [ ] Manual/API tests for each new endpoint
- [ ] End-to-end flow validation for NLQ + semantic search + schema analysis
- [ ] Docker/K8s smoke tests

