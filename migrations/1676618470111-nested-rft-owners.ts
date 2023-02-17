import { MigrationInterface, QueryRunner } from 'typeorm';

export class nestedrftowners16766184701113 implements MigrationInterface {
  name = 'nestedrftowners16766184701113';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_owners" ADD COLUMN IF NOT EXISTS "parent_id" text DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_owners" ADD COLUMN IF NOT EXISTS "nested" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_owners" ADD COLUMN IF NOT EXISTS "children" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP COLUMN "parent_id"`);
    await queryRunner.query(`DROP COLUMN "nested"`);
    await queryRunner.query(`DROP COLUMN "children"`);
  }
}
