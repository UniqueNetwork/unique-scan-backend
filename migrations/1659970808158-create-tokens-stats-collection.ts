/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class createTokensStatsCollection1659970808158
  implements MigrationInterface
{
  name = 'createTokensStatsCollection1659970808158';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tokens_stats" ("token_id" integer NOT NULL, "transfers_count" bigint NOT NULL, CONSTRAINT "REL_583c70481dd4af6653f84d82c1" UNIQUE ("token_id"), CONSTRAINT "PK_583c70481dd4af6653f84d82c1f" PRIMARY KEY ("token_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "tokens_stats_pkey" ON "tokens_stats" ("token_id") `,
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "properties"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "attributes"`);
    await queryRunner.query(
      `ALTER TABLE "collections_stats" ADD "transfers_count" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_stats" ADD CONSTRAINT "FK_583c70481dd4af6653f84d82c1f" FOREIGN KEY ("token_id") REFERENCES "tokens"("token_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_stats" DROP CONSTRAINT "FK_583c70481dd4af6653f84d82c1f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" DROP COLUMN "transfers_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "attributes" jsonb NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "properties" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(`DROP INDEX "public"."tokens_stats_pkey"`);
    await queryRunner.query(`DROP TABLE "tokens_stats"`);
  }
}
