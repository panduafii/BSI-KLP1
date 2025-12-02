import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init00011733011200000 implements MigrationInterface {
  name = 'Init00011733011200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rooms" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar NOT NULL UNIQUE,
        "name" varchar NOT NULL,
        "capacity" integer NOT NULL DEFAULT 0,
        "location" varchar NULL,
        "features" jsonb NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER rooms_set_updated_at
      BEFORE UPDATE ON "rooms"
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS rooms_set_updated_at ON "rooms"');
    await queryRunner.query('DROP FUNCTION IF EXISTS set_updated_at');
    await queryRunner.query('DROP TABLE IF EXISTS "rooms"');
  }
}
