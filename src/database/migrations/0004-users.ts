import { MigrationInterface, QueryRunner } from 'typeorm';

export class Users00041733011500000 implements MigrationInterface {
  name = 'Users00041733011500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "nim" varchar NOT NULL UNIQUE,
        "email" varchar UNIQUE,
        "password_hash" varchar NOT NULL,
        "role" varchar NOT NULL DEFAULT 'student',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION users_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER users_set_updated_at
      BEFORE UPDATE ON "users"
      FOR EACH ROW
      EXECUTE PROCEDURE users_set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS users_set_updated_at ON "users"');
    await queryRunner.query('DROP FUNCTION IF EXISTS users_set_updated_at');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}
