import { MigrationInterface, QueryRunner } from 'typeorm';

export class updatenested1673954094424 implements MigrationInterface {
  name = 'updatenested1673954094424';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD IF NOT EXISTS "nested" boolean NOT NULL DEFAULT false`,
    );
    try {
      await queryRunner.query(
        `UPDATE tokens SET nested = true WHERE type = "NESTED"`,
      );
      await queryRunner.query(
        `UPDATE tokens SET type = "NFT" WHERE type = "NESTED" AND total_pieces = 1`,
      );
      await queryRunner.query(
        `UPDATE tokens SET type = "RFT" WHERE type = "NESTED" AND total_pieces > 1`,
      );
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "nested"`);
  }
}
