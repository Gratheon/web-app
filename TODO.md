# Gratheon Platform - Development TODO

## Priority Legend

| Emoji | Meaning | When to work on it |
|-------|---------|-------------------|
| ❤️ | Critical — blocks platform viability or security | Do now |
| 💛 | High — accelerates velocity, significant ROI | Next sprint |
| 💚 | Quality — technical debt, compounds over time | Backlog rotation |
| 💙 | Nice-to-have — polish and optimization | When nothing else pulls you |

## Effort / Impact Matrix

Use this matrix to decide **what to work on next** when multiple tasks compete:

| Category | Low effort (1-2d) | Medium effort (3-7d) | High effort (8-15d+) |
|----------|------------------|---------------------|----------------------|
| **High impact** | Quick wins — do immediately | Core bets — plan next sprint | Strategic investments — phase roadmap |
| **Low impact** | Low-priority polish | Backlog items | Nice-to-have / research |

Each task below is tagged with its effort estimate and impact rating.
Quick wins = low effort + high impact (start here).

---

## Platform Infrastructure (Monorepo)

### ❤️ Add root-level `.gitignore` — Quick Win
**Effort**: 1 day · **Impact**: High
- Prevents git history bloat from ~30MB candidate JSON files in root
- Removes accidental secret leaks (.env, configs)
- Clean up existing tracked files and add to .gitignore

### ❤️ Create root docker-compose.yml for full stack orchestration — Quick Win
**Effort**: 2 days · **Impact**: High
- Single file to bring up entire platform locally (15+ services)
- Define `gratheon-dev` network, map shared ports centrally
- Support `--profile` flag: `core`, `ml`, `edge`, `infra` subsets

### 💛 Implement cross-service integration testing — Core Bet
**Effort**: 5-7 days · **Impact**: High
- GraphQL federation spans 16+ microservices; schema changes can silently break others
- Create `integration-tests/` with Docker Compose profiles
- Write tests for critical paths: hive → weather → telemetry joins (10-15 scenarios)
- Use test containers or mock services where real DBs aren't available

### 💛 Add root-level CI/CD workflow with matrix builds — Core Bet
**Effort**: 3-4 days · **Impact**: High
- Coordinated pipeline across all services: shared caching, dependency validation
- Parallel matrix builds + schema compatibility checks on PRs
- Deploy triggers only when relevant services changed

### 💛 Add Dockerfiles for clickstack, blog-engine-md, rate-limiter — Quick Win
**Effort**: 1 day · **Impact**: Medium
- These three services lack Dockerfiles → breaks container parity
- Multi-stage alpine builds (Go), Node 24 slim (TS)
- Adds docker-compose.dev.yml / prod.yml for each

### 💛 Audit rate-limiter and add observability — Core Bet
**Effort**: 3-4 days · **Impact**: High
- Rate-limiter protects all API traffic but has no metrics, logging, or test coverage
- Add health endpoint, structured logging of denied requests, edge-case tests
- Document current rules (per-user, per-API-key, per-endpoint)

### 💛 Implement data backup strategy for all databases — Core Bet
**Effort**: 3-4 days · **Impact**: High
- Platform: MySQL, ClickHouse, Redis, InfluxDB — zero automated backups visible
- Cron/sidecar dumps + S3 with lifecycle policies (7d daily, 30d weekly)
- Test restore procedures; document RPO/RTO per service

### 💛 Implement structured data export (CSV/JSON) for apiary/hive data — Core Bet
**Effort**: 5-7 days · **Impact**: High
- Beekeepers need to back up / share hive data outside the app (GDPR portability)
- Add GraphQL `exportApiary(apiaryId, format)` resolver in swarm-api
- UI button in Hive View → "Export Data" dropdown

### 💛 Document runbooks for each service (SRE-style) — Core Bet
**Effort**: 5-7 days · **Impact**: Medium
- 19+ services with no centralized operational docs
- One file per service: start/stop, key URLs, failure patterns, log locations
- Creates `/docs/runbooks/` directory

---

## web-app (Frontend) — 65K lines, only 7.7% test coverage

### 💛 Enable Playwright E2E tests with local backend — Core Bet
**Effort**: 3-4 days · **Impact**: High
- `playwright.config.ts` exists but `webServer` is commented out; critical flows untested
- First E2E tests: login, create hive, view dashboard, upload inspection photo
- Add CI integration so E2E runs on PRs

### 💛 Implement AI Advisor feature (currently a stub) — Strategic Investment
**Effort**: 10-15 days · **Impact**: High
- `web-app/src/page/aiAdvisor/index.tsx` is ~128 lines placeholder; ML models exist but disconnected
- Wire: frame photo → image-splitter queue → varroa/queen detection results → UI overlays
- Add treatment recommendations + one-click from inspection view

### 💛 Connect detection models to web-app UI — Strategic Investment
**Effort**: 7-10 days · **Impact**: High
- Two trained models (queen mAP=0.92, varroa) are isolated from app
- Unified inference gateway + GraphQL schema extensions (FrameAnalysis, VarroaCount)
- Build UI: detection overlays, confidence cards, auto-trigger on photo upload

### 💚 Add PWA offline support verification tests — Backlog Item
**Effort**: 2-3 days · **Impact**: Medium
- Dexie + VitePWA mentioned in README but no tests verify offline behavior
- Simulate offline→online transitions; verify sync, push notifications on reconnect
- Test PWA installability and service worker updates

### 💚 Performance: audit and reduce initial bundle size — Backlog Item
**Effort**: 2-3 days · **Impact**: Medium
- 440 files with Preact + Vite should be lean; no code splitting by route yet
- Add route-based lazy loading (inspectionList, warehouse, grafana, aiAdvisor)
- Lazy-load map components and Grafana iframe embeds

### 💚 Add frontend bundle size budgeting — Backlog Item
**Effort**: 1-2 days · **Impact**: Medium
- No CI gate preventing bundle regressions for mobile beekeepers on slow connections
- Vite bundle analyzer + budget: total JS < 150KB gzipped, per-route chunk < 50KB gzipped
- Block CI if bundle exceeds threshold

---

## Backend Services — Critical Gaps

### ❤️ Add tests for entrance-observer (edge AI inference) — Core Bet
**Effort**: 5-7 days · **Impact**: High
- Runs on Jetson Orin/Nano with GPU video processing; zero tests exist
- Unit test float detection pipeline + integration: video chunk → frame → model → results
- Mock GPU for CI; run TFLite on Jetson locally; add per-frame benchmarks

### 💚 Add rate limiting to all GraphQL endpoints — Backlog Item
**Effort**: 3-4 days · **Impact**: High (security hardening)
- Rate-limiter exists but not wired into graphql-router or other services
- Wire middleware + define per-endpoint limits; add monitoring for limit hits
- Document rate limit headers in API responses

### 💚 Fix swarm-api `config.go` SafeWriteConfig() call — Quick Win
**Effort**: 1 day · **Impact**: Medium
- `viper.SafeWriteConfig()` silently overwrites production configs with dev defaults
- Replace with explicit config validation + structured logging (log-lib-go)
- Add startup health check for required env vars; document expected structure

---

## ML / Detection Models

### 💚 Add model monitoring and drift detection — Backlog Item
**Effort**: 5-7 days · **Impact**: Medium
- Models trained offline with no feedback loop or degradation tracking
- Log predictions with metadata; add user feedback ("Was varroa count accurate?")
- Track prediction distributions over time; trigger retraining on drift

---

## Documentation & Developer Experience

### 💚 Create monorepo architecture documentation — Backlog Item
**Effort**: 2-3 days · **Impact**: Medium
- 20+ components, no single document explaining how they fit together
- `ARCHITECTURE.md` with service map, Mermaid data flow diagrams, API contract overview
- Per-service quickstart guides linking to full READMEs

### 💚 Add CONTRIBUTING.md with local dev setup guide — Quick Win
**Effort**: 1 day · **Impact**: Medium
- No visible developer onboarding document; each service has its own setup instructions
- Document prerequisites (Go, Node 24 via nvm, Docker, Just); step-by-step clone → start core services
- Code style conventions and commit message format

### 💚 Standardize error reporting across the monorepo — Backlog Item
**Effort**: 5-7 days · **Impact**: Medium
- Three separate logging libraries (log-lib-go, log-lib-py, web-app Sentry); no shared taxonomy
- Define canonical error types with HTTP status mappings; create shared TS/Go package
- Add error rate metrics per service to ClickStack dashboards

### 💚 Standardize logging with shared log-lib across all services — Backlog Item
**Effort**: 3-4 days · **Impact**: Medium
- Format inconsistencies across services; no distributed tracing IDs between boundaries
- Align on structured JSON schema (trace_id, span_id, service_name); add OTel context propagation

### 💚 Add API versioning strategy for GraphQL federation — Backlog Item
**Effort**: 3-4 days · **Impact**: Medium
- 15+ services expose schemas; breaking changes cascade across all consumers
- Define deprecation lifecycle (`@deprecated(reason)`) + sunset window (2 release cycles)
- Add schema registry validation in CI that blocks breaking changes

### 💚 Improve blog-engine-md internationalization testing — Backlog Item
**Effort**: 1-2 days · **Impact**: Low
- i18n resolver has no tests; missing translations may silently fall back incorrectly
- Test fallback chain (requested lang → en → empty); verify sitemap hreflang tags

### 💙 Implement CI-based performance regression detection for entrance-observer — Nice-to-have
**Effort**: 2-3 days · **Impact**: Low
- No automated benchmarking in CI; regressions only caught when beekeepers report slow feeds
- Benchmark suite loading float32 model + measuring inference time per frame on CPU
- Run in CI; fail if regression > 15% vs main branch

---

## Effort / Impact Summary

| Priority | Quick Wins (≤2d) | Core Bets (3-7d) | Strategic (8-15d+) | Backlog / Nice | Total Est. |
|----------|------------------|------------------|--------------------|---------------|------------|
| ❤️ Critical | 2 tasks, ~3 days | 1 task, ~6 days | — | — | **~9 days** |
| 💛 High | 1 task, ~1 day | 7 tasks, ~30 days | 2 tasks, ~20 days | — | **~51 days** |
| 💚 Quality | 1 task, ~1 day | 4 tasks, ~13 days | 2 tasks, ~11 days | 2 tasks, ~3 days | **~27 days** |
| 💙 Nice | 1 task, ~2.5 days | — | — | — | **~2.5 days** |

---

## Suggested Execution Order (by Effort/Impact matrix)

### Week 1-2: Quick Wins & Foundation
1. ❤️ Add root-level `.gitignore` (1d) — immediate DX gain
2. ❤️ Create root docker-compose.yml for full stack orchestration (2d) — foundation for everything else
3. 💚 Add CONTRIBUTING.md with local dev setup guide (1d) — onboarding for any contributor

### Week 3-4: Safety Net
4. 💛 Implement cross-service integration testing (5-7d) — protects all services from silent breakage
5. 💛 Implement data backup strategy for all databases (3-4d) — prevents catastrophic loss
6. 💚 Add rate limiting to all GraphQL endpoints (3-4d) — security hardening

### Week 5-8: Revenue & Differentiation
7. 💛 Enable Playwright E2E tests with local backend (3-4d) — frontend safety net
8. 💛 Implement AI Advisor feature (10-15d) + Connect detection models to UI (7-10d) — revenue-generating work

### Week 9+: Quality & Scale
9. 💚 Performance: audit and reduce initial bundle size (2-3d)
10. 💛 Add root-level CI/CD workflow with matrix builds (3-4d)
11. 💚 Create monorepo architecture documentation (2-3d)
12. 💛 Document runbooks for each service (5-7d)
13. Remaining backlog items from table above

---

## Notes on Current State (2026-07-11)

| Area | Status | Coverage |
|------|--------|----------|
| web-app (frontend) | 440 files / 65K lines | 34 tests (7.7%) |
| swarm-api (GraphQL core) | Active development | 29 tests |
| user-cycle (auth/billing) | Feature-complete | 395 tests |
| image-splitter (ML pipeline) | Production service | 469 tests |
| event-stream-filter (WebSocket) | Active dev | 33 tests |
| entrance-observer (edge AI) | Edge deployment | **0 tests** |
| CI/CD | Per-service workflows | Missing cross-service validation |
| E2E testing | Playwright configured but disabled | Cannot run without backend |
