import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingsMaintenance00031733011400000 implements MigrationInterface {
  name = 'BookingsMaintenance00031733011400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "approved_by" varchar NULL,
      ADD COLUMN IF NOT EXISTS "approved_at" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "cancelled_by" varchar NULL,
      ADD COLUMN IF NOT EXISTS "cancelled_at" timestamptz NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "maintenance_tickets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL,
        "title" varchar NOT NULL,
        "description" text NULL,
        "status" varchar NOT NULL DEFAULT 'OPEN',
        "reported_by" varchar NOT NULL,
        "resolved_by" varchar NULL,
        "resolved_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_maintenance_room" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_maintenance_room_status ON "maintenance_tickets" (room_id, status);
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION maintenance_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER maintenance_set_updated_at
      BEFORE UPDATE ON "maintenance_tickets"
      FOR EACH ROW
      EXECUTE PROCEDURE maintenance_set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS maintenance_set_updated_at ON "maintenance_tickets"'
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS maintenance_set_updated_at');
    await queryRunner.query('DROP TABLE IF EXISTS "maintenance_tickets"');
    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP COLUMN IF EXISTS "approved_by",
      DROP COLUMN IF EXISTS "approved_at",
      DROP COLUMN IF EXISTS "cancelled_by",
      DROP COLUMN IF EXISTS "cancelled_at";
    `);
  }
}
