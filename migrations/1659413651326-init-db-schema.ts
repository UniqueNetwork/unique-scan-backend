import { MigrationInterface, QueryRunner } from "typeorm";

export class initDbSchema1659413651326 implements MigrationInterface {
    name = 'initDbSchema1659413651326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "account" ("account_id" text NOT NULL, "balances" text NOT NULL, "available_balance" text, "free_balance" text NOT NULL, "locked_balance" text NOT NULL, "nonce" text, "timestamp" bigint NOT NULL, "block_height" bigint NOT NULL, "account_id_normalized" text NOT NULL, CONSTRAINT "PK_ea08b54a9d7322975ffc57fc612" PRIMARY KEY ("account_id"))`);
        await queryRunner.query(`CREATE INDEX "account_account_id_normalized_idx" ON "account" ("account_id_normalized") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "account_pkey" ON "account" ("account_id") `);
        await queryRunner.query(`CREATE TABLE "block" ("block_number" bigint NOT NULL, "block_hash" text NOT NULL, "parent_hash" text NOT NULL, "extrinsics_root" text NOT NULL, "state_root" text, "session_length" bigint, "spec_name" text NOT NULL, "spec_version" integer NOT NULL, "total_events" integer NOT NULL, "num_transfers" integer NOT NULL, "new_accounts" integer NOT NULL, "total_issuance" text NOT NULL, "timestamp" bigint NOT NULL, "need_rescan" boolean NOT NULL DEFAULT false, "total_extrinsics" integer NOT NULL, CONSTRAINT "PK_f40192bd17405d84ecdb4163bbf" PRIMARY KEY ("block_number"))`);
        await queryRunner.query(`CREATE INDEX "block_need_rescan_idx" ON "block" ("need_rescan") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "block_pkey" ON "block" ("block_number") `);
        await queryRunner.query(`CREATE TABLE "chain" ("block_height" bigint NOT NULL, "session_index" integer NOT NULL, "total_issuance" text NOT NULL, "active_accounts" bigint NOT NULL, "timestamp" bigint NOT NULL, CONSTRAINT "PK_ce99674360edb92c44b5f7601b1" PRIMARY KEY ("block_height"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "chain_pkey" ON "chain" ("block_height") `);
        await queryRunner.query(`CREATE TABLE "collections_stats" ("collection_id" bigint NOT NULL, "tokens_count" bigint NOT NULL, "holders_count" bigint NOT NULL, "actions_count" bigint NOT NULL, CONSTRAINT "PK_33a1823860d26b0d3df7378e118" PRIMARY KEY ("collection_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "collections_stats_pkey" ON "collections_stats" ("collection_id") `);
        await queryRunner.query(`CREATE TABLE "tokens" ("id" BIGSERIAL NOT NULL, "token_id" integer NOT NULL, "owner" character varying(255) NOT NULL, "data" jsonb NOT NULL DEFAULT '{}', "collection_id" bigint NOT NULL, "date_of_creation" bigint, "owner_normalized" text NOT NULL, "parent_id" text, CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "tokens_owner_normalized_idx" ON "tokens" ("owner_normalized") `);
        await queryRunner.query(`CREATE INDEX "tokens_collection_id_token_id_owner_idx" ON "tokens" ("collection_id", "token_id", "owner") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "tokens_pkey" ON "tokens" ("id") `);
        await queryRunner.query(`CREATE TABLE "collections" ("collection_id" bigint NOT NULL, "owner" text NOT NULL, "name" text, "description" text, "offchain_schema" text, "token_limit" bigint NOT NULL, "const_chain_schema" jsonb DEFAULT '{}', "variable_on_chain_schema" jsonb DEFAULT '{}', "limits_account_ownership" bigint, "limits_sponsore_data_size" integer, "limits_sponsore_data_rate" integer, "owner_can_transfer" boolean, "owner_can_destroy" boolean, "sponsorship" character varying(255), "schema_version" character varying(255), "token_prefix" character varying(255), "mode" character varying(255), "mint_mode" boolean, "date_of_creation" bigint, "owner_normalized" text NOT NULL, "collection_cover" character varying(255), CONSTRAINT "REL_99da6be64f1143a7284b242860" UNIQUE ("collection_id"), CONSTRAINT "PK_99da6be64f1143a7284b242860c" PRIMARY KEY ("collection_id"))`);
        await queryRunner.query(`CREATE INDEX "collections_owner_normalized_idx" ON "collections" ("owner_normalized") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "collections_pkey" ON "collections" ("collection_id") `);
        await queryRunner.query(`CREATE TABLE "event" ("block_number" bigint NOT NULL, "event_index" integer NOT NULL, "section" text NOT NULL, "method" text NOT NULL, "phase" text NOT NULL, "data" text NOT NULL, "timestamp" bigint, "amount" text, "block_index" text, CONSTRAINT "PK_5feb877560ae26472f653a55151" PRIMARY KEY ("block_number", "event_index"))`);
        await queryRunner.query(`CREATE INDEX "event_section_method_phase_idx" ON "event" ("section", "method", "phase") `);
        await queryRunner.query(`CREATE INDEX "event_method_idx" ON "event" ("method") `);
        await queryRunner.query(`CREATE INDEX "event_block_index_idx" ON "event" ("block_index") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "event_pkey" ON "event" ("block_number", "event_index") `);
        await queryRunner.query(`CREATE TABLE "extrinsic" ("block_number" bigint NOT NULL, "extrinsic_index" integer NOT NULL, "is_signed" boolean NOT NULL, "signer" text, "section" text NOT NULL, "method" text NOT NULL, "args" text NOT NULL, "hash" text NOT NULL, "success" boolean NOT NULL, "timestamp" bigint, "amount" text, "fee" text, "block_index" character varying(255), "to_owner" character varying(255), "signer_normalized" text, "to_owner_normalized" text, CONSTRAINT "PK_fac303f78b7869f51e06bcf0fee" PRIMARY KEY ("block_number", "extrinsic_index"))`);
        await queryRunner.query(`CREATE INDEX "extrinsic_to_owner_idx" ON "extrinsic" ("to_owner") `);
        await queryRunner.query(`CREATE INDEX "extrinsic_timestamp_idx" ON "extrinsic" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "extrinsic_signer_idx" ON "extrinsic" ("signer") `);
        await queryRunner.query(`CREATE INDEX "extrinsic_section_idx" ON "extrinsic" ("section") `);
        await queryRunner.query(`CREATE INDEX "extrinsic_method_idx" ON "extrinsic" ("method") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "extrinsic_block_index_idx" ON "extrinsic" ("block_index") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "extrinsic_pkey" ON "extrinsic" ("block_number", "extrinsic_index") `);
        await queryRunner.query(`CREATE TABLE "harvester_error" ("block_number" bigint NOT NULL, "error" text NOT NULL, "timestamp" bigint NOT NULL, CONSTRAINT "PK_64fb188fae307b5b57475fee4dd" PRIMARY KEY ("block_number"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "harvester_error_pkey" ON "harvester_error" ("block_number") `);
        await queryRunner.query(`CREATE TABLE "system" ("block_height" bigint NOT NULL, "chain" text NOT NULL, "node_name" text NOT NULL, "node_version" text NOT NULL, "timestamp" bigint NOT NULL, CONSTRAINT "PK_750dc08616ec76d7579032bf805" PRIMARY KEY ("block_height"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "system_pkey" ON "system" ("block_height") `);
        await queryRunner.query(`CREATE TABLE "total" ("name" text NOT NULL, "count" bigint NOT NULL, CONSTRAINT "PK_0d49adbdadbeefabc73ada4920d" PRIMARY KEY ("name"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "total_pkey" ON "total" ("name") `);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "FK_0c3081d08354c10d3553f4678d0" FOREIGN KEY ("collection_id") REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "collections" ADD CONSTRAINT "FK_99da6be64f1143a7284b242860c" FOREIGN KEY ("collection_id") REFERENCES "collections_stats"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collections" DROP CONSTRAINT "FK_99da6be64f1143a7284b242860c"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_0c3081d08354c10d3553f4678d0"`);
        await queryRunner.query(`DROP INDEX "public"."total_pkey"`);
        await queryRunner.query(`DROP TABLE "total"`);
        await queryRunner.query(`DROP INDEX "public"."system_pkey"`);
        await queryRunner.query(`DROP TABLE "system"`);
        await queryRunner.query(`DROP INDEX "public"."harvester_error_pkey"`);
        await queryRunner.query(`DROP TABLE "harvester_error"`);
        await queryRunner.query(`DROP INDEX "public"."extrinsic_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."extrinsic_block_index_idx"`);
        await queryRunner.query(`DROP INDEX "public"."extrinsic_method_idx"`);
        await queryRunner.query(`DROP INDEX "public"."extrinsic_section_idx"`);
        await queryRunner.query(`DROP INDEX "public"."extrinsic_signer_idx"`);
        await queryRunner.query(`DROP INDEX "public"."extrinsic_timestamp_idx"`);
        await queryRunner.query(`DROP INDEX "public"."extrinsic_to_owner_idx"`);
        await queryRunner.query(`DROP TABLE "extrinsic"`);
        await queryRunner.query(`DROP INDEX "public"."event_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."event_block_index_idx"`);
        await queryRunner.query(`DROP INDEX "public"."event_method_idx"`);
        await queryRunner.query(`DROP INDEX "public"."event_section_method_phase_idx"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP INDEX "public"."collections_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."collections_owner_normalized_idx"`);
        await queryRunner.query(`DROP TABLE "collections"`);
        await queryRunner.query(`DROP INDEX "public"."tokens_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."tokens_collection_id_token_id_owner_idx"`);
        await queryRunner.query(`DROP INDEX "public"."tokens_owner_normalized_idx"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
        await queryRunner.query(`DROP INDEX "public"."collections_stats_pkey"`);
        await queryRunner.query(`DROP TABLE "collections_stats"`);
        await queryRunner.query(`DROP INDEX "public"."chain_pkey"`);
        await queryRunner.query(`DROP TABLE "chain"`);
        await queryRunner.query(`DROP INDEX "public"."block_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."block_need_rescan_idx"`);
        await queryRunner.query(`DROP TABLE "block"`);
        await queryRunner.query(`DROP INDEX "public"."account_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."account_account_id_normalized_idx"`);
        await queryRunner.query(`DROP TABLE "account"`);
    }

}
