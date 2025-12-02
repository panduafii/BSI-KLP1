# Story 3: Admin approval workflow with audit + notification outbox

**Goal:** Provide admin/staff ability to approve, reject, or cancel bookings with full auditability and notification outbox entries.

## Acceptance Criteria
- `PATCH /bookings/:id/approve` (admin-only) sets status to APPROVED, records approver id, timestamp, and audit log entry.
- `PATCH /bookings/:id/reject` (admin-only) sets status to REJECTED with mandatory reason; frees the slot for reuse.
- `PATCH /bookings/:id/cancel` allows owner or admin; sets status to CANCELLED and logs actor.
- Approval respects room availability: fails with 409 if slot now conflicts due to other approved booking.
- Notification outbox rows are written for APPROVED, REJECTED, and CANCELLED events with payload (booking_id, status, actor, timestamp).
- Role guard returns 403 for non-admin attempts on approve/reject.

## Test Cases
- Approving a pending booking succeeds and creates audit + outbox entries.
- Rejecting requires reason and frees slot; subsequent booking for same slot can succeed.
- Cancellation by non-owner non-admin is forbidden (403).
- Concurrent approval conflict results in 409 without duplicate approvals.

## Notes
- Ensure idempotent approve/reject handlers (replaying same action should be safe/no-op with 200/204).
