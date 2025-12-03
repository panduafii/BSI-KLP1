import { MigrationInterface, QueryRunner } from 'typeorm';

export class Areas00051736000000000 implements MigrationInterface {
  name = 'Areas00051736000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "areas" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar NOT NULL UNIQUE,
        "name" varchar NOT NULL,
        "description" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TRIGGER areas_set_updated_at
      BEFORE UPDATE ON "areas"
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at();
    `);

    await queryRunner.query(`
      ALTER TABLE "rooms"
      ADD COLUMN IF NOT EXISTS "area_id" uuid NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "rooms"
      ADD CONSTRAINT "fk_rooms_area" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rooms_area ON "rooms" ("area_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_rooms_area`);
    await queryRunner.query(`ALTER TABLE "rooms" DROP CONSTRAINT IF EXISTS "fk_rooms_area"`);
    await queryRunner.query(`ALTER TABLE "rooms" DROP COLUMN IF EXISTS "area_id"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS areas_set_updated_at ON "areas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "areas"`);
  }
}
