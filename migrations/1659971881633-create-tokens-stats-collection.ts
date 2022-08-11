/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class createTokensStatsCollection1659971881633
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections_stats" DROP CONSTRAINT "FK_33a1823860d26b0d3df7378e118"`,
    );
    await queryRunner.query(
      `CREATE TABLE "tokens_stats" ("id" BIGSERIAL NOT NULL, "token_id" bigint NOT NULL, "collection_id" bigint NOT NULL, "transfers_count" bigint NOT NULL, CONSTRAINT "PK_1da9b0ad1e4e8f36ad2412c4577" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "tokens_stats_pkey" ON "tokens_stats" ("collection_id", "token_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" ADD "transfers_count" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" DROP CONSTRAINT "UQ_33a1823860d26b0d3df7378e118"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections_stats" ADD CONSTRAINT "UQ_33a1823860d26b0d3df7378e118" UNIQUE ("collection_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" DROP COLUMN "transfers_count"`,
    );
    await queryRunner.query(`DROP INDEX "public"."tokens_stats_pkey"`);
    await queryRunner.query(`DROP TABLE "tokens_stats"`);
    await queryRunner.query(
      `ALTER TABLE "collections_stats" ADD CONSTRAINT "FK_33a1823860d26b0d3df7378e118" FOREIGN KEY ("collection_id") REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
