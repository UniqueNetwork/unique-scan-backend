import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeAccountBalanceField1659954827364
  implements MigrationInterface
{
  name = 'removeAccountBalanceField1659954827364';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "balances"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "balances" text NOT NULL`,
    );
  }
}
