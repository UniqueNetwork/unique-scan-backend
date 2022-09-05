import { MigrationInterface, QueryRunner } from 'typeorm';

export class isSoldTokenField1660023211810 implements MigrationInterface {
  name = 'isSoldTokenField1660023211810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "is_sold" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "is_sold"`);
  }
}
