import { MigrationInterface, QueryRunner } from 'typeorm';

export class schemasV21709142009605 implements MigrationInterface {
  name = 'schemasV21709142009605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "attributes" ("id" BIGSERIAL NOT NULL, "token_id" integer NOT NULL, "collection_id" bigint NOT NULL, "trait_type" text NOT NULL, "display_type" text, "value_string" text, "value_number" integer, CONSTRAINT "PK_32216e2e61830211d3a5d7fa72c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "attributes_token_collection" ON "attributes" ("token_id", "collection_id") `
    );
    await queryRunner.query(`ALTER TABLE "collections" ADD "schema_v2" jsonb`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "schema_v2" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "attributes" ADD CONSTRAINT "FK_aabb8d18b9092592b58cb04a464" FOREIGN KEY ("token_id", "collection_id") REFERENCES "tokens"("token_id","collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" ADD CONSTRAINT "FK_9a2581e9e9299f68972a57b2bf6" FOREIGN KEY ("collection_id") REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "schema_v2"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."attributes_token_collection"`
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" DROP CONSTRAINT "FK_9a2581e9e9299f68972a57b2bf6"`
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" DROP CONSTRAINT "FK_aabb8d18b9092592b58cb04a464"`
    );
    await queryRunner.query(`DROP TABLE "attributes"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "schema_v2"`);
  }
}
