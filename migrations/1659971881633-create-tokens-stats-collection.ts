/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class createTokensStatsCollection1659971881633
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tokens_stats" ("id" BIGSERIAL NOT NULL, "token_id" integer NOT NULL, "collection_id" bigint NOT NULL, "transfers_count" bigint NOT NULL, CONSTRAINT "REL_6ac2fd9b097d5ece012ee28b90" UNIQUE ("token_id", "collection_id"), CONSTRAINT "PK_1da9b0ad1e4e8f36ad2412c4577" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "tokens_stats_pkey" ON "tokens_stats" ("collection_id", "token_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" ADD "transfers_count" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_stats" ADD CONSTRAINT "FK_6ac2fd9b097d5ece012ee28b905" FOREIGN KEY ("token_id", "collection_id") REFERENCES "tokens"("token_id","collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_stats" DROP CONSTRAINT "FK_6ac2fd9b097d5ece012ee28b905"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" DROP COLUMN "transfers_count"`,
    );
    await queryRunner.query(`DROP INDEX "public"."tokens_stats_pkey"`);
    await queryRunner.query(`DROP TABLE "tokens_stats"`);
  }
}
