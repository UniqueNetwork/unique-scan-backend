import { MigrationInterface, QueryRunner } from "typeorm";

export class collectionsPropertiesAndAttributesSchemaFields1659594941647 implements MigrationInterface {
    name = 'collectionsPropertiesAndAttributesSchemaFields1659594941647'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "extrinsic" DROP COLUMN "doc"`);
        await queryRunner.query(`ALTER TABLE "collections" ADD "properties" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "collections" ADD "attributes_schema" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "block" ALTER COLUMN "total_extrinsics" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "block" ALTER COLUMN "total_extrinsics" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "collections_stats" ADD CONSTRAINT "UQ_33a1823860d26b0d3df7378e118" UNIQUE ("collection_id")`);
        await queryRunner.query(`DROP INDEX "public"."tokens_collection_id_token_id_owner_idx"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "tokens_pkey"`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "tokens_pkey" PRIMARY KEY ("token_id", "collection_id", "id")`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "PK_9cd454ecc1fe265dd0b7e7f23b3"`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "PK_c67a9dacb7b5f6ecfc8e8db81be" PRIMARY KEY ("id", "collection_id")`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "PK_c67a9dacb7b5f6ecfc8e8db81be"`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "collections" ALTER COLUMN "owner_can_transfer" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collections" ALTER COLUMN "owner_can_transfer" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "collections" ALTER COLUMN "owner_can_destroy" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collections" ALTER COLUMN "owner_can_destroy" DROP DEFAULT`);
        await queryRunner.query(`CREATE UNIQUE INDEX "account_pkey" ON "account" ("account_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "block_pkey" ON "block" ("block_number") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "chain_pkey" ON "chain" ("block_height") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "collections_stats_pkey" ON "collections_stats" ("collection_id") `);
        await queryRunner.query(`CREATE INDEX "tokens_collection_id_token_id_owner_idx" ON "tokens" ("collection_id", "token_id", "owner") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "tokens_pkey" ON "tokens" ("token_id", "collection_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "collections_pkey" ON "collections" ("collection_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "event_pkey" ON "event" ("block_number", "event_index") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "extrinsic_pkey" ON "extrinsic" ("block_number", "extrinsic_index") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "harvester_error_pkey" ON "harvester_error" ("block_number") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "system_pkey" ON "system" ("block_height") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "total_pkey" ON "total" ("name") `);
        await queryRunner.query(`ALTER TABLE "collections_stats" ADD CONSTRAINT "FK_33a1823860d26b0d3df7378e118" FOREIGN KEY ("collection_id") REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "FK_0c3081d08354c10d3553f4678d0" FOREIGN KEY ("collection_id") REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_0c3081d08354c10d3553f4678d0"`);
        await queryRunner.query(`ALTER TABLE "collections_stats" DROP CONSTRAINT "FK_33a1823860d26b0d3df7378e118"`);
        await queryRunner.query(`DROP INDEX "public"."total_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."system_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."harvester_error_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."extrinsic_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."event_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."collections_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."tokens_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."tokens_collection_id_token_id_owner_idx"`);
        await queryRunner.query(`DROP INDEX "public"."collections_stats_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."chain_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."block_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."account_pkey"`);
        await queryRunner.query(`ALTER TABLE "collections" ALTER COLUMN "owner_can_destroy" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "collections" ALTER COLUMN "owner_can_destroy" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collections" ALTER COLUMN "owner_can_transfer" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "collections" ALTER COLUMN "owner_can_transfer" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "PK_3001e89ada36263dabf1fb6210a"`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "PK_c67a9dacb7b5f6ecfc8e8db81be" PRIMARY KEY ("id", "collection_id")`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "PK_c67a9dacb7b5f6ecfc8e8db81be"`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "PK_9cd454ecc1fe265dd0b7e7f23b3" PRIMARY KEY ("id", "token_id", "collection_id")`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "tokens_pkey"`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "tokens_pkey" PRIMARY KEY ("token_id", "collection_id")`);
        await queryRunner.query(`CREATE INDEX "tokens_collection_id_token_id_owner_idx" ON "tokens" ("token_id", "owner", "collection_id") `);
        await queryRunner.query(`ALTER TABLE "collections_stats" DROP CONSTRAINT "UQ_33a1823860d26b0d3df7378e118"`);
        await queryRunner.query(`ALTER TABLE "block" ALTER COLUMN "total_extrinsics" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "block" ALTER COLUMN "total_extrinsics" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "attributes_schema"`);
        await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "properties"`);
        await queryRunner.query(`ALTER TABLE "extrinsic" ADD "doc" text NOT NULL`);
    }

}
