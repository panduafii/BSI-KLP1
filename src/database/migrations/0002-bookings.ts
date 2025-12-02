import { MigrationInterface, QueryRunner } from 'typeorm';

export class Bookings00021733011300000 implements MigrationInterface {
  name = 'Bookings00021733011300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bookings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL,
        "requester_id" varchar NOT NULL,
        "requester_role" varchar NOT NULL,
        "purpose" text NOT NULL,
        "priority" varchar NOT NULL DEFAULT 'NORMAL',
        "start_time" timestamptz NOT NULL,
        "end_time" timestamptz NOT NULL,
        "status" varchar NOT NULL DEFAULT 'PENDING',
        "conflict_flag" boolean NOT NULL DEFAULT false,
        "rejection_reason" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_bookings_room" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION bookings_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER bookings_set_updated_at
      BEFORE UPDATE ON "bookings"
      FOR EACH ROW
      EXECUTE PROCEDURE bookings_set_updated_at();
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT bookings_no_overlap
      EXCLUDE USING GIST (
        room_id WITH =,
        tstzrange(start_time, end_time) WITH &&
      ) WHERE (status IN ('PENDING','APPROVED'));
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_room_status ON "bookings" (room_id, status);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "action" varchar NOT NULL,
        "actor_id" varchar NOT NULL,
        "actor_role" varchar NOT NULL,
        "from_state" varchar NULL,
        "to_state" varchar NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_audit_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_outbox" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "event_type" varchar NOT NULL,
        "payload" jsonb NOT NULL,
        "status" varchar NOT NULL DEFAULT 'PENDING',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_outbox_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "notification_outbox"');
    await queryRunner.query('DROP TABLE IF EXISTS "audit_logs"');
    await queryRunner.query('DROP TRIGGER IF EXISTS bookings_set_updated_at ON "bookings"');
    await queryRunner.query('DROP FUNCTION IF EXISTS bookings_set_updated_at');
    await queryRunner.query('DROP TABLE IF EXISTS "bookings"');
  }
}
