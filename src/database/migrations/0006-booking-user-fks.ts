import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingUserFks00061736005000000 implements MigrationInterface {
  name = 'BookingUserFks00061736005000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add FK columns (nullable) to bookings
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "requester_user_id" uuid NULL,
      ADD COLUMN IF NOT EXISTS "approved_by_user_id" uuid NULL,
      ADD COLUMN IF NOT EXISTS "cancelled_by_user_id" uuid NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "fk_booking_requester_user" FOREIGN KEY ("requester_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "fk_booking_approved_user" FOREIGN KEY ("approved_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "fk_booking_cancelled_user" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_bookings_requester_user ON "bookings" ("requester_user_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_bookings_approved_user ON "bookings" ("approved_by_user_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_user ON "bookings" ("cancelled_by_user_id");`);

    // Audit logs actor FK
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "actor_user_id" uuid NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "fk_audit_actor_user" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_actor_user ON "audit_logs" ("actor_user_id");`);

    // Maintenance tickets reporter/resolver FK
    await queryRunner.query(`
      ALTER TABLE "maintenance_tickets"
      ADD COLUMN IF NOT EXISTS "reported_by_user_id" uuid NULL,
      ADD COLUMN IF NOT EXISTS "resolved_by_user_id" uuid NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "maintenance_tickets"
      ADD CONSTRAINT "fk_maintenance_reporter_user" FOREIGN KEY ("reported_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "maintenance_tickets"
      ADD CONSTRAINT "fk_maintenance_resolver_user" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_reporter_user ON "maintenance_tickets" ("reported_by_user_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_resolver_user ON "maintenance_tickets" ("resolved_by_user_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_maintenance_resolver_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_maintenance_reporter_user`);
    await queryRunner.query(`ALTER TABLE "maintenance_tickets" DROP CONSTRAINT IF EXISTS "fk_maintenance_resolver_user"`);
    await queryRunner.query(`ALTER TABLE "maintenance_tickets" DROP CONSTRAINT IF EXISTS "fk_maintenance_reporter_user"`);
    await queryRunner.query(`ALTER TABLE "maintenance_tickets" DROP COLUMN IF EXISTS "reported_by_user_id"`);
    await queryRunner.query(`ALTER TABLE "maintenance_tickets" DROP COLUMN IF EXISTS "resolved_by_user_id"`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_actor_user`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "fk_audit_actor_user"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "actor_user_id"`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_cancelled_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_approved_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_requester_user`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "fk_booking_cancelled_user"`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "fk_booking_approved_user"`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "fk_booking_requester_user"`);
    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP COLUMN IF EXISTS "requester_user_id",
      DROP COLUMN IF EXISTS "approved_by_user_id",
      DROP COLUMN IF EXISTS "cancelled_by_user_id";
    `);
  }
}
