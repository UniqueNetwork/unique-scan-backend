import { MigrationInterface, QueryRunner } from 'typeorm';

export class tokenStatsNestingChildrenCount1666102053882
  implements MigrationInterface
{
  name = 'tokenStatsNestingChildrenCount1666102053882';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" ADD "bundle_created" bigint`);
    await queryRunner.query(
      `CREATE INDEX "tokens_parent_id_idx" ON "tokens" ("parent_id") `,
    );

    await queryRunner.query(
      `ALTER TABLE "tokens_stats" ADD "children_count" bigint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."tokens_parent_id_idx"`);
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN "bundle_created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_stats" DROP COLUMN "children_count"`,
    );
  }
}
