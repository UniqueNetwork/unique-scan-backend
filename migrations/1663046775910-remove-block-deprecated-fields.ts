import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeBlockDeprecatedFields1663046775910
  implements MigrationInterface
{
  name = 'removeBlockDeprecatedFields1663046775910';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."block_need_rescan_idx"`);
    await queryRunner.query(`ALTER TABLE "block" DROP COLUMN "session_length"`);
    await queryRunner.query(`ALTER TABLE "block" DROP COLUMN "total_issuance"`);
    await queryRunner.query(`ALTER TABLE "block" DROP COLUMN "need_rescan"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "block" ADD "need_rescan" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "block" ADD "total_issuance" text NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "block" ADD "session_length" bigint`);
    await queryRunner.query(
      `CREATE INDEX "block_need_rescan_idx" ON "block" ("need_rescan") `,
    );
  }
}
