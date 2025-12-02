# BSI-KLP1 - Technical Specification

**Author:** Pandu
**Date:** 2025-12-01
**Project Level:** Quick Flow MVP (Greenfield)
**Change Type:** New feature (backend MVP)
**Development Context:** Backend MVP for campus room-booking system

---

## Context

### Available Documents

- `docs/bmm-brainstorming-session-2025-12-01.md` – Mind Mapping + Five Whys output covering backend MVP scope for scheduling, approvals, anti-fraud, and maintenance reporting.
- `docs/bmm-workflow-status.yaml` – Workflow tracker indicating Quick Flow / greenfield path with brainstorming completed and tech-spec pending.
- No PRD, research, or brownfield documentation detected yet.

### Project Stack

- Greenfield: no dependency manifests yet; stack decisions are defined in this spec.
- Chosen stack: Node.js 20 LTS, NestJS 10.3.x, TypeScript 5.3.x, PostgreSQL 16, Redis 7.2.x (locking/queues), TypeORM 0.3.x, Jest 29 + Supertest 6 for tests.
- Infrastructure: .env-driven config, Docker-friendly; migrations via TypeORM CLI.

### Existing Codebase Structure

- Greenfield project – no existing application code. Implementation will define initial module boundaries, data models, and testing conventions.

---

## The Change

### Problem Statement

- Frequent booking conflicts and missing notifications cause double-booked rooms and delays.
- No verified identity on booking requests allows fiktif/abuse.
- Approval workflow is manual and lacks auditable history or priority indicators.
- Maintenance issues are not linked to room availability, so rooms under repair can still be booked.

### Proposed Solution

- Build a NestJS-based REST API that manages master data (rooms, time slots), booking requests, approvals, and maintenance tickets.
- Enforce conflict detection at the database layer (PostgreSQL exclusion constraint on time ranges) and at the service layer before persisting.
- Track booking lifecycle states (PENDING → APPROVED/REJECTED → CANCELLED) with audit logs and priority/urgency metadata for admins.
- Require authenticated caller identity + role on every request; log all state changes with actor and timestamp.
- Block bookings for rooms with open maintenance tickets; reopen automatically when tickets close.
- Emit notification outbox records for status changes (email/SMS integration can consume later).

### Scope

**In Scope:**
- Establish backend project structure (NestJS) with modules for rooms, bookings, approvals, maintenance, notifications, and auth/RBAC.
- Database schema/migrations for rooms, bookings (with time-range exclusion), maintenance tickets, audit logs, and notification outbox.
- REST endpoints for: room catalog (list/detail), booking submission, availability check, approval/rejection, cancellation, maintenance create/update, and status retrieval.
- Role/identity handling: accept authenticated user id + role (student/lecturer/admin/staff) via header or JWT stub; enforce role checks on admin actions.
- Seeding master data from `reference-data/` (room list/slot data) into PostgreSQL.
- Basic observability: structured logging, request tracing ID, and health check endpoint.

**Out of Scope:**
- Frontend/UI layers; mobile apps.
- SSO/LDAP integration (stub only), payments, or SMS/email delivery (outbox only).
- Real-time integrations to ruang.fit scraping; recurring bookings; advanced scheduling optimizations.
- Multi-tenant support, analytics dashboards, or SLA/policy automation.
- IoT sensor integration.

---

## Implementation Details

### Source Tree Changes

- `package.json` / `tsconfig.json` / `nest-cli.json` – project tooling definitions.
- `src/main.ts` – Nest bootstrap with global validation pipe, logging, and request ID middleware.
- `src/app.module.ts` – root module wiring config/database/modules.
- `src/config/` – configuration service + validation schema (env vars), database config.
- `src/common/` – interceptors (logging), filters (HTTP exception), decorators for request context.
- `src/modules/auth/` – role guard, request context extraction, lightweight JWT/header strategy.
- `src/modules/rooms/` – controller, service, entity, DTOs, repository for room master data.
- `src/modules/bookings/` – controller, service, entity, DTOs, repository, conflict checker.
- `src/modules/maintenance/` – controller, service, entity for room maintenance tickets; blocks bookings.
- `src/modules/notifications/` – outbox entity + service stub to enqueue notification events.
- `src/modules/audit/` – audit log entity + service to record state transitions.
- `src/database/migrations/` – SQL migrations for all entities (rooms, bookings, maintenance, audit, outbox).
- `test/` – unit tests (services) and e2e tests (HTTP via Supertest) covering booking lifecycle and maintenance blocking.

### Technical Approach

- Language/runtime: TypeScript 5.3.x on Node.js 20 LTS.
- Framework: NestJS 10.3.x with modular architecture (controller → service → repository pattern).
- ORM: TypeORM 0.3.x targeting PostgreSQL 16; migrations generated and committed.
- Concurrency: PostgreSQL exclusion constraint on `tsrange` (start_time, end_time) per room for PENDING/APPROVED bookings; service-level pre-check plus transaction to avoid race conditions; Redis lock (short-lived) for double-submit protection on the same room+timeslot.
- Booking lifecycle: states PENDING, APPROVED, REJECTED, CANCELLED. Only APPROVED blocks the slot; PENDING is checked by exclusion; CANCELLED/REJECTED free the slot.
- Maintenance: OPEN, IN_PROGRESS, RESOLVED. OPEN/IN_PROGRESS mark room as unavailable for new bookings; bookings hitting blocked rooms are rejected with reason.
- Priority/urgency: store `priority` (LOW/NORMAL/HIGH) and `urgency_note`; expose to admin list/queue.
- Identity & RBAC: accept `x-user-id` + `x-user-role` headers (student|lecturer|staff|admin) in MVP; guard admin-only actions (approval, maintenance resolution, seeding) and enforce requester ownership on cancellation.
- Audit trail: log every state change with actor, timestamp, and previous → next state; store in `audit_logs` table.
- Notifications: write notification outbox rows for APPROVED/REJECTED/CANCELLED/MAINTENANCE events for downstream delivery.

### Existing Patterns to Follow

- Greenfield conventions to establish:
  - Module-per-domain (`rooms`, `bookings`, `maintenance`, `notifications`, `auth`, `audit`).
  - DTOs with `class-validator` + `class-transformer`; global ValidationPipe with whitelist/forbidNonWhitelisted.
  - Services are stateless and injected; repositories wrap TypeORM entity manager; avoid business logic in controllers.
  - Error handling via Nest HTTP exceptions with structured error codes; logging via Nest `Logger` with request ID context.
  - Tests follow `*.spec.ts` naming, colocated under `test/` with Nest testing module; Supertest for e2e.

### Integration Points

- PostgreSQL 16 – primary data store for rooms, bookings, maintenance, audit, notification outbox.
- Redis 7.2 – optional locking/queue for idempotency and notification dispatch trigger.
- Notification consumer – future integration reads `notification_outbox`; MVP only persists outbox rows.
- Reference data – seed rooms/slots from `reference-data/*.csv|json` into `rooms` and `room_slots` tables via migration/seed script.
- Observability – expose `/health` endpoint; structured logs to stdout; ready for container log aggregation.

---

## Development Context

### Relevant Existing Code

None – greenfield project. All references will be established by this spec.

### Dependencies

**Framework/Libraries:**
- NestJS 10.3.x, TypeScript 5.3.x, TypeORM 0.3.x, class-validator 0.14.x, class-transformer 0.5.x, @nestjs/config 3.x, @nestjs/jwt 11.x, bcrypt 5.x (password hashing if needed), rxjs 7.8.x.

**Internal Modules:**
- Auth (request context + guards), Rooms, Bookings, Maintenance, Notifications (outbox), Audit (state change log), Config.

### Configuration Changes

- Add `.env.example` with:
  - `DATABASE_URL=postgres://user:pass@localhost:5432/bsi_klp1`
  - `JWT_SECRET=local-dev-secret`
  - `PORT=3000`
  - `LOG_LEVEL=debug|info`
- Config validation schema to enforce required envs at boot.
- TypeORM config (DataSource) referencing env vars; migration CLI script.

### Existing Conventions (Brownfield)

Greenfield project – conventions to be defined in this document.

### Test Framework & Standards

- Jest 29.7.x for unit tests; Supertest 6.3.x for e2e HTTP tests.
- Coverage goal: minimum 70% statements/branches on services; critical flows (booking conflict, approval, maintenance block) covered by e2e.
- Use testing module with in-memory PostgreSQL (pg + test DB) or Dockerized Postgres for e2e; mock Redis when not needed.

---

## Implementation Stack

- Node.js 20 LTS
- NestJS 10.3.x
- TypeScript 5.3.x
- PostgreSQL 16
- Redis 7.2.x
- TypeORM 0.3.x (migrations)
- Jest 29.7.x, Supertest 6.3.x
- ESLint 8.57.x, Prettier 3.x

---

## Technical Details

- **Schema (initial):**
  - `rooms`: id (uuid), code, name, capacity, location, features (jsonb), is_active, created_at, updated_at.
  - `room_slots` (optional if using ranges): id, room_id, weekday, start_time, end_time, capacity_override, created_at.
  - `bookings`: id (uuid), room_id, requester_id, requester_role, purpose, priority, start_time, end_time, status (PENDING/APPROVED/REJECTED/CANCELLED), conflict_flag, approved_by, approved_at, rejection_reason, created_at, updated_at. Exclusion constraint on `room_id` + `tsrange(start_time, end_time)` where status in (PENDING, APPROVED).
  - `maintenance_tickets`: id, room_id, title, description, status (OPEN/IN_PROGRESS/RESOLVED), reported_by, resolved_by, created_at, updated_at, resolved_at.
  - `audit_logs`: id, actor_id, actor_role, entity_type, entity_id, action, from_state, to_state, created_at, metadata (jsonb).
  - `notification_outbox`: id, event_type, payload (jsonb), status (PENDING/SENT/FAILED), created_at.
- **APIs (HTTP, JSON):**
  - `GET /health` – liveness/DB check.
  - `GET /rooms` – list rooms with availability flags; optional filters (capacity >=, features).
  - `POST /bookings` – submit request; validates time range, conflicts, maintenance blocks; returns booking id + status.
  - `GET /bookings/:id` – fetch booking with audit trail summary.
  - `PATCH /bookings/:id/approve` – admin-only; sets APPROVED, emits outbox, writes audit.
  - `PATCH /bookings/:id/reject` – admin-only; sets REJECTED with reason.
  - `PATCH /bookings/:id/cancel` – owner or admin; sets CANCELLED.
  - `GET /bookings` – list/filter by status/date/room.
  - `POST /maintenance` – create ticket for a room (admin/staff); blocks new bookings.
  - `PATCH /maintenance/:id/resolve` – mark resolved; unblock room; emit outbox.
- **Validation:** strict DTO validation; reject overlapping start/end, require purpose, priority, and requester identity/role.
- **Security:**
  - MVP auth: accept signed JWT or trusted headers (`x-user-id`, `x-user-role`); extendable to SSO later.
  - Role guard for admin/staff endpoints; ownership guard for cancellation.
  - Input sanitization via class-validator; rate limit optional via Redis.
- **Concurrency & Consistency:** use DB transaction per booking create/approval; rely on exclusion constraint for overlaps; optional Redis lock keyed by `room_id:tsrange` to reduce 409 collisions.
- **Observability:** structured logs with request ID; basic metrics hooks ready (counter for bookings/approvals/errors); return error codes with trace ID.

---

## Development Setup

- Prereqs: Node.js 20, PostgreSQL 16, Redis 7 available locally (docker-compose recommended).
- Install deps: `npm install` (after scaffolding with Nest CLI `npx @nestjs/cli new bsi-klp1-api --package-manager npm`).
- Copy env: `cp .env.example .env` and fill DB/Redis secrets.
- Run migrations: `npm run typeorm migration:run` (configure script via TypeORM CLI + ts-node).
- Start dev: `npm run start:dev`.
- Run tests: `npm test` (unit) and `npm run test:e2e` (Supertest against test DB).
- Seed reference data: `npm run seed:rooms` reading `reference-data/*` into `rooms` (provide script under `scripts/seed-rooms.ts`).

---

## Implementation Guide

### Setup Steps

- Scaffold NestJS project and add ESLint/Prettier configs.
- Add config module + env validation; set up logging and request ID middleware.
- Configure TypeORM datasource + migration scripts; create baseline migration with schema above.
- Add Docker Compose for Postgres/Redis (optional but recommended for local parity).
- Prepare `.env.example` and seed script for reference data.

### Implementation Steps

- Implement `rooms` module (entity, service, controller) and seed pipeline from `reference-data`.
- Implement `bookings` module with DTO validation, conflict detection (service + exclusion constraint), create/list/detail endpoints.
- Implement `auth` guard for role checking using headers/JWT stub; apply to admin-only routes.
- Implement approval/rejection/cancellation handlers with audit logging and notification outbox writes.
- Implement `maintenance` module to create/resolve tickets and block bookings for affected rooms.
- Wire notification outbox entity/service; expose endpoint/log to inspect pending notifications.
- Add health check and basic observability (logging, request ID).
- Write unit tests for services (conflict detection, status transitions) and e2e tests for booking lifecycle + maintenance block.

### Testing Strategy

- Unit: services (conflict detection logic, status transitions, maintenance blocking), repositories mocked.
- Integration/e2e: Supertest hitting HTTP endpoints against test Postgres; cases for overlapping bookings, approval, rejection, cancellation, maintenance block/unblock.
- Regression: ensure exclusion constraint prevents overlaps even under concurrent requests (simulate with parallel test).
- Manual: smoke via `curl`/REST client for primary flows; verify logs and outbox entries.

### Acceptance Criteria

- Booking submission rejects invalid ranges and overlapping slots; returns booking id with PENDING status.
- Approval endpoint updates status to APPROVED, records audit log, and writes notification outbox row.
- Rejection stores reason and frees slot for reuse; cancellation by owner or admin works.
- Maintenance OPEN prevents new bookings for the room; RESOLVED unblocks.
- Role guard enforces admin-only on approval/reject/maintenance resolve; non-admin attempts return 403.
- Health endpoint returns 200 and DB connectivity status.
- Tests: unit + e2e passing; migrations run cleanly on fresh database.

---

## Developer Resources

### File Paths Reference

- `src/main.ts`, `src/app.module.ts` – application entry/wiring.
- `src/config/*` – configuration and env validation.
- `src/modules/rooms/*` – room master data APIs and seeding.
- `src/modules/bookings/*` – booking lifecycle APIs and conflict logic.
- `src/modules/maintenance/*` – maintenance ticket APIs and blocking logic.
- `src/modules/notifications/*` – outbox model/service.
- `src/modules/audit/*` – audit logging service/entity.
- `test/` – unit and e2e specs.

### Key Code Locations

- Conflict detection logic in `src/modules/bookings/booking.service.ts`.
- Exclusion constraint defined in migration under `src/database/migrations/*-create-bookings.ts`.
- Maintenance block check in `booking.service` before insert/approve.
- Audit logging in `src/modules/audit/audit.service.ts` invoked on every state change.

### Testing Locations

- `test/bookings.service.spec.ts` – unit tests for conflict and status transitions.
- `test/bookings.e2e-spec.ts` – end-to-end booking flow and overlap prevention.
- `test/maintenance.e2e-spec.ts` – maintenance block/unblock scenarios.

### Documentation to Update

- `docs/tech-spec.md` (this file) when schema/endpoints evolve.
- `README.md` with setup/run instructions and env variables.
- `docs/epics.md` and story files as implementation proceeds.

---

## UX/UI Considerations

- JSON APIs must return clear status codes and machine-readable error codes (e.g., `BOOKING_CONFLICT`, `ROOM_UNAVAILABLE`, `FORBIDDEN_ROLE`).
- Include `priority`, `status`, `conflict_flag`, and `audit` summary in booking responses for admin UI consumption.
- Provide consistent date/time format (ISO 8601, UTC) and pagination on list endpoints.

---

## Testing Approach

- Automated-first: unit + e2e in CI; gate merges on passing tests and migration checks.
- Use test database per run; migrate down/up cleanly before suites.
- Add lightweight contract tests for response shape of booking endpoints.

---

## Deployment Strategy

### Deployment Steps

- Build container image with multi-stage (Node 20 base); run `npm run build` then `npm ci --only=production`.
- Run DB migrations on startup (`npm run typeorm migration:run`).
- Provide `docker-compose` for local and Helm/k8s-ready manifests later.
- Expose health check for load balancer; set resource limits for Node process.

### Rollback Plan

- Keep previous image tagged; rollback by re-deploying prior image and rolling back last migration if schema-breaking (pair forward-only migrations with safe toggles).
- Maintain backup of database before major releases; verify migration down scripts in non-prod.

### Monitoring

- Health endpoint + structured logs; add basic counters (bookings submitted/approved/rejected, maintenance open) exported via `/metrics` stub for future Prometheus.
- Alert on elevated 5xx or DB connection failures.
