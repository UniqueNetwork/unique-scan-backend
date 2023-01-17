import { MigrationInterface, QueryRunner } from 'typeorm';

export class updatenesteddata1673954094930 implements MigrationInterface {
  name = 'updatenesteddata1673954094930';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
