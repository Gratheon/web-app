# Gratheon — Project Improvements & Tasks

## Architecture & Documentation

- [ ] **Document cross-service architecture** — Create a single architectural diagram (mermaid or Excalidraw) showing all microservices, their communication patterns (GraphQL router → swarm-api, event-stream-filter → redis pub-sub), and data flows. Currently scattered across individual READMEs.
- [ ] **Add a CONTRIBUTING.md at the monorepo root** — Most services have their own but there is no top-level guide explaining how to develop against multiple services simultaneously (docker-compose orchestration, shared dev environment patterns).
- [ ] **Document deployment architecture** — Each service has its own deploy.yml but the production runner setup, nginx config, immutable release strategy, and hardlink-based rsync pattern are only documented in this README. Consolidate into a central ops doc.

## CI/CD Consistency

- [ ] **Standardize CI pipelines** — Services use inconsistent patterns: alerts has `workflow_call` with separate unit/integration/manual tests, swarm-api has full Codecov coverage reporting, weather only runs `go test ./...`, telemetry-api lacks coverage upload. Define shared CI templates (GitHub Actions reusable workflows) for Go and Node.js services.
- [ ] **Add Codecov integration to all services** — Only swarm-api uploads coverage reports. Add Codecov actions to alerts, telemetry-api, weather, event-stream-filter, and user-cycle.
- [ ] **Pin GitHub Action versions with SBOM checks** — Several workflows use `actions/checkout@v4`, `setup-node@v4` without pinning exact hashes or enabling supply-chain verification (Sigstore/cosign). Add SLSA provenance or at minimum lock action versions to full SHAs.
- [ ] **Add PR status badges** — Only swarm-api and weather have codecov/CI badges in their READMEs. Add consistent status badges across all services.

## Testing Improvements

- [ ] **Expand weather service tests** — `weather/integration_test.go` is the only test file. Add unit tests for config parsing, Open-Meteo response handling, and ilmateenistus.ee integration.
- [ ] **Add coverage thresholds to CI** — swarm-api has Codecov but no fail-on-threshold policy. Configure minimum coverage percentages per service to prevent regression.
- [ ] **Create a shared test helper library** — Go services (swarm-api, telemetry-api, weather) share DB connection patterns, config loading, and migration helpers. Extract into `log-lib-go` or a new shared package.
- [ ] **Add E2E tests for the full stack** — No end-to-end test exists that spins up all dev docker-compose services together and validates the GraphQL router → service chain. Create one using justfile targets.

## Observability & Monitoring

- [ ] **Standardize logging format across services** — Go services use log-lib-go, Node.js uses log-lib (TypeScript). Ensure consistent JSON structured logging with trace IDs across all services for correlation via AppSignal.
- [ ] **Add health check endpoints to all services** — Not all microservices expose `/health` or `/ready`. Add standard health checks for monitoring and load-balancer integration.
- [ ] **Create a Grafana dashboard** — Telemetry-api collects temperature, humidity, weight data but there is no centralized visualization beyond individual service Swagger UIs. Build a shared Grafana dashboard for all bee metrics and service health.

## Infrastructure & Dev Experience

- [ ] **Standardize docker-compose dev stacks** — Each service has its own `docker-compose.dev.yml` with different project names, volume mounts, and env file patterns. Create a top-level `docker-compose.override.yml` or shared compose profiles for running multiple services simultaneously in dev.
- [ ] **Add database migration audit trail** — swarm-api uses goose migrations but there is no centralized migration registry across all services (swarm-api has MySQL, telemetry-api has Postgres). Track schema versions per service.
- [ ] **Create a local development setup guide** — A single `DEV.md` explaining how to install dependencies (nvm 25 for Node, Go toolchain, Docker, MySQL/PostgreSQL), run all services locally, and understand the full data pipeline from beehive → telemetry-api → influx.
- [ ] **Pin dependency versions in justfiles** — Several justfiles use `go mod download`, `npm ci` but call out to tools without pinning tool versions (goose, gqlgen). Add version pins for reproducibility.

## Security & Compliance

- [ ] **Add dependency vulnerability scanning** — No Dependabot, Renovate, or Trivy scans in any service's CI pipeline. Add GitHub Dependabot at the monorepo level to catch vulnerabilities across Go and Node.js dependencies.
- [ ] **Audit secrets management** — Multiple services reference `.env` files, `config.dev.json`, and hardcoded test credentials. Standardize on a single secret injection pattern (e.g., AWS Secrets Manager or HashiCorp Vault) documented at the root.
- [ ] **Add rate limiting documentation** — The `rate-limiter` service exists but is not referenced in any architecture diagram or deployment docs. Document how it integrates with graphql-router and other services.

## Content & Research Pipeline (Python scripts at project root)

- [ ] **Consolidate paper processing pipeline into a single module** — Standalone Python scripts (`search_papers.py`, `score_candidates.py`, `filter_candidates.py`, `get_recent_papers.py`, `ingest_final.py`) scattered at the monorepo root. Move them into a dedicated `research-pipeline/` package with proper packaging, tests, and CLI entry points.
- [ ] **Add data validation for candidates JSON** — No schema validation on `candidates_*.json` or `filtered_candidates.json`. Add Pydantic models or JSON Schema to ensure data integrity before ingestion.
- [ ] **Document the research pipeline ETL flow** — The Python scripts form an ETL (search → score → filter → ingest) but there is no documentation explaining the data format, scoring methodology, or filtering criteria used by `process_candidates.py` and `score_candidates.py`.

## Internationalization (i18n)

- [ ] **Automate i18n translation review** — The site supports 24 languages via duplicated template files (`front-ru.html`, etc.) but there is no automated check for missing translations when adding new content. Add a CI step that detects untranslated pages per language.
- [ ] **Reduce template duplication** — Front page uses separate `templates/front-{lang}.html` files for each language copy. Consider a translation-key system or partial-based approach to reduce maintenance burden across 24 languages.

## Monitoring & Alerting

- [ ] **Add service-level SLOs** — Define availability and latency SLOs per service (especially swarm-api and telemetry-api which handle real-time beehive data) and configure AppSignal alerts against them.
- [ ] **Create a runbook for common incidents** — Document procedures for: influxdb restart, MySQL migration failures, redis pub-sub disconnections, Telegram delivery retries exhausting, and nginx config reload failures on the production runner.

## Performance & Optimization

- [ ] **Implement query caching strategy** — swarm-api handles beehive data queries that could benefit from Redis or application-level caching to reduce database load during peak hours.
- [ ] **Optimize GraphQL resolvers** — Profile resolver execution times in swarm-api and alerts services to identify N+1 query patterns and implement DataLoader for batched fetching.
- [ ] **Add connection pooling documentation** — MySQL connections in swarm-api and Postgres in telemetry-api need documented pool configuration (max idle, max open, timeout) with performance benchmarks.

## API Versioning & Compatibility

- [ ] **Define GraphQL schema versioning policy** — Establish how breaking changes to GraphQL schemas will be handled across services (swarm-api, alerts, weather) while maintaining backward compatibility for web-app clients.
- [ ] **Add API contract testing** — Implement Pact or similar contract tests between web-app and backend services (swarm-api, telemetry-api) to prevent breaking changes from reaching production.

## Data Management

- [ ] **Implement database backup automation** — swarm-api uses MySQL, telemetry-api uses Postgres, and both need automated backup strategies with retention policies and tested restore procedures.
- [ ] **Add data migration rollback scripts** — goose migrations in swarm-api should have corresponding rollback capabilities for safe deployments and incident recovery.
- [ ] **Document data retention policies** — Define how long beehive telemetry data is stored, when historical data gets archived or purged from influxdb, and user data deletion procedures for GDPR compliance.

## Analytics & Business Intelligence

- [ ] **Set up event tracking pipeline** — Track user interactions in web-app (hive views, alert configurations, API usage) and stream to analytics platform for product decisions.
- [ ] **Create business metrics dashboard** — Monitor key Gratheon KPIs: active hives, data ingestion rates, alert delivery success rates, subscription conversions, and revenue per customer.

## Hardware Integration Testing

- [ ] **Establish hardware-software integration tests** — Create automated test procedures for validating telemetry data flow from physical beehive sensors through the full stack (telemetry-api → influxdb → web-app) without requiring actual hardware.
- [ ] **Add sensor simulation tools** — Develop mock sensor data generators for development and testing, enabling CI/CD validation of telemetry processing logic without real hive equipment.

## Documentation & Developer Experience

- [ ] **Automate API documentation generation** — Use gqlgen code generation to automatically update OpenAPI specs when GraphQL schemas change in swarm-api, alerts, and weather services.
- [ ] **Create changelog automation** — Implement semantic-release or similar tooling to generate release notes from commit messages across all microservices for coordinated releases.

## Cost Optimization

- [ ] **Audit cloud infrastructure costs** — Review AWS/GCP usage across telemetry-api (influxdb hosting), alerts (Twilio SMS, SES email), and swarm-api (MySQL RDS) with cost allocation by service.
- [ ] **Implement resource scaling policies** — Add HPA (Horizontal Pod Autoscaler) or manual scaling guidelines for services experiencing variable load (e.g., weather API calls during forecasting periods).

## User Experience & Feedback

- [ ] **Add user feedback collection mechanism** — Integrate feedback forms or NPS surveys in web-app to gather user input on feature requests and bug reports.
- [ ] **Create support ticket automation** — Stream error logs from all services into a centralized incident management system (Jira, Linear) with automatic issue creation for production errors exceeding severity thresholds.

## Compliance & Legal

- [ ] **Conduct privacy impact assessment** — Document data flows involving user PII (email, phone numbers for SMS alerts), API keys, and billing information across all services to ensure GDPR and CCPA compliance.
- [ ] **Add terms of service updates** — Update legal documentation as new features are added (multi-channel alerts, third-party integrations like Google OAuth) with proper consent mechanisms.

## Emergency Procedures

- [ ] **Create incident response playbook** — Document escalation procedures, communication templates, and post-mortem requirements for P0/P1 incidents affecting beehive monitoring or user data access.
- [ ] **Establish on-call rotation schedule** — Define developer responsibilities for production support with clear handoff procedures between team members.
