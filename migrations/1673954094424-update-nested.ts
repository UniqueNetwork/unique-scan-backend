import { MigrationInterface, QueryRunner } from 'typeorm';

export class updatenested1673954094424 implements MigrationInterface {
  name = 'updatenested1673954094424';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD IF NOT EXISTS "nested" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "nested"`);
  }
}
