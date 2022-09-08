import { MigrationInterface, QueryRunner } from 'typeorm';

export class wasBurnForCollectionsAndTokens1662528527275
  implements MigrationInterface
{
  name = 'wasBurnForCollectionsAndTokens1662528527275';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "was_burn" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "was_burn" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "was_burn"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "was_burn"`);
  }
}
