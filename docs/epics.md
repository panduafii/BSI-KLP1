# Epic 1: Backend MVP for Campus Room Booking

**Objective:** Deliver a production-ready backend service for campus room booking that enforces conflict-free scheduling, auditable approvals, and maintenance-aware availability.

**Business Outcomes:**
- Prevent double bookings and fake requests through verified identity, conflict checks, and auditability.
- Give admins a clear approval queue with priority context and maintenance status.
- Provide a stable API surface for future UI/mobile clients and notification delivery.

**Non-Goals (this epic):** Frontend/UI, SSO integration, real-time scraping, SMS/email delivery (outbox only), analytics.

**Dependencies:** PostgreSQL 16, Redis 7 (locking/outbox), reference data for rooms/slots.

**Stories:**
1. Project scaffold, configuration, and master data seeding
2. Booking request API with conflict detection
3. Admin approval workflow with audit + notification outbox
4. Maintenance reporting and room blocking
