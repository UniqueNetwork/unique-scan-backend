import { MigrationInterface, QueryRunner } from 'typeorm';

export class tokensAddTokenNameField1660917429271
  implements MigrationInterface
{
  name = 'tokensAddTokenNameField1660917429271';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" ADD "token_name" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "token_name"`);
  }
}
