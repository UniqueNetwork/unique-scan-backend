import { MigrationInterface, QueryRunner } from 'typeorm';

export class tokenDataAndImageFieldsRework1660026849038
  implements MigrationInterface
{
  name = 'tokenDataAndImageFieldsRework1660026849038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "data"`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "image" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "tokens" ALTER COLUMN "attributes" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ALTER COLUMN "attributes" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" ALTER COLUMN "attributes" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ALTER COLUMN "attributes" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "image"`);
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "data" jsonb NOT NULL DEFAULT '{}'`,
    );
  }
}
