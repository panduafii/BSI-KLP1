# Story 4: Maintenance reporting and room blocking

**Goal:** Allow staff/admin to log maintenance tickets that block new bookings until resolved.

## Acceptance Criteria
- `POST /maintenance` creates ticket (OPEN) with room_id, title, description, reporter; only admin/staff roles allowed.
- New booking submissions for rooms with OPEN/IN_PROGRESS maintenance are rejected with 409 `ROOM_UNAVAILABLE` and reason.
- `PATCH /maintenance/:id/resolve` sets status to RESOLVED, records resolver id/time, unblocks room, and writes audit + notification outbox entry.
- Maintenance list endpoint (optional) shows open tickets with room linkage for admin UI.
- Booking approval also checks maintenance block and fails if room is under maintenance.

## Test Cases
- Booking while maintenance OPEN returns 409 and does not persist booking.
- Resolving maintenance allows subsequent booking for the same room/time.
- Audit log entries exist for maintenance create/resolve; outbox rows emitted on resolve.
- Role guard blocks maintenance endpoints for non-admin/staff.

## Notes
- Consider adding maintenance reason into booking rejection message for transparency.
