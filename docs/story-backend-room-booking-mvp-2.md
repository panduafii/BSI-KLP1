# Story 2: Booking request API with conflict detection

**Goal:** Allow authenticated users to submit booking requests with conflict prevention and retrieval endpoints.

## Acceptance Criteria
- `POST /bookings` accepts room_id, start_time, end_time, purpose, priority; requires requester identity/role from headers/JWT stub.
- Server validates time range (start < end, future), room exists, and requester role is allowed.
- Conflict detection: exclusion constraint on `bookings` table (room_id + tsrange) for PENDING/APPROVED plus service-layer pre-check; overlapping requests are rejected with `409 BOOKING_CONFLICT` and `conflict_flag=true`.
- `GET /bookings/:id` returns booking details including status, priority, conflict_flag, and audit summary.
- `GET /bookings` supports filters by status/date/room and paginates results.
- Booking creation writes audit log entry (PENDING) and notification outbox record (type `BOOKING_SUBMITTED`).

## Test Cases
- Creating a valid booking returns 201 with PENDING status and audit record.
- Submitting overlapping booking for the same room/time returns 409 and does not persist.
- List endpoint respects filters and pagination; requester sees own bookings; admin sees all (if implemented in guard).
- Audit log entry exists for each booking create.

## Notes
- Normalize all times to UTC; use ISO 8601 in API.
- Priority enum: LOW, NORMAL, HIGH; default NORMAL.
