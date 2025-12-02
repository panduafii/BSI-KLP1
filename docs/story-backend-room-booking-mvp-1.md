# Story 1: Project scaffold, configuration, and master data seeding

**Goal:** Establish NestJS project skeleton, configuration, database connectivity, health endpoint, and seed room master data from reference files.

## Acceptance Criteria
- NestJS 10 project boots with global validation pipe, logging, and request ID middleware.
- `.env.example` includes DATABASE_URL, REDIS_URL, JWT_SECRET, PORT, LOG_LEVEL; config validation fails fast on missing values.
- PostgreSQL connection configured via TypeORM DataSource; baseline migrations created for `rooms` (and optional `room_slots`).
- Health endpoint `GET /health` returns 200 with DB connectivity check.
- Seed script ingests `reference-data/*.csv|json` into `rooms` (code, name, capacity, location, features) and is runnable via `npm run seed:rooms`.
- Linting (ESLint/Prettier) and testing (Jest) scripts present and passing.

## Test Cases
- Health endpoint returns `{ status: 'ok', db: 'up' }` when DB reachable.
- Config validation rejects startup when required envs are missing or malformed.
- Seed script populates rooms table and is idempotent (re-runs do not duplicate rows).
- Lint/test scripts exit zero on a clean checkout.

## Notes
- Use UUID primary keys; timestamps with `NOW()` defaults.
- Keep seed mapping deterministic; log skipped/invalid rows.
