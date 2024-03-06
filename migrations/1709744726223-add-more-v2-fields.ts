import { MigrationInterface, QueryRunner } from 'typeorm';

export class addMoreV2Fields1709744726223 implements MigrationInterface {
  name = 'addMoreV2Fields1709744726223';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attributes" DROP CONSTRAINT "FK_aabb8d18b9092592b58cb04a464"`
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" DROP CONSTRAINT "FK_9a2581e9e9299f68972a57b2bf6"`
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "original_schema_version" text`
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "default_token_image" jsonb`
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "potential_attributes" jsonb DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "customizing" jsonb`
    );
    await queryRunner.query(`ALTER TABLE "tokens" ADD "name" text`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "image_details" jsonb`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "attributes" jsonb`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "media" jsonb`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "royalties" jsonb`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "customizing" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "customizing_overrides" jsonb`
    );
    await queryRunner.query(`ALTER TABLE "tokens" ADD "animation_url" text`);
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "animation_details" jsonb`
    );
    await queryRunner.query(`ALTER TABLE "tokens" ADD "youtube_url" text`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "created_by" text`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "background_color" text`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "external_url" text`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "locale" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "locale"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "external_url"`);
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN "background_color"`
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "youtube_url"`);
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN "animation_details"`
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "animation_url"`);
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN "customizing_overrides"`
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "customizing"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "royalties"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "media"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "attributes"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "image_details"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "customizing"`
    );
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "potential_attributes"`
    );
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "default_token_image"`
    );
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "original_schema_version"`
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" ADD CONSTRAINT "FK_9a2581e9e9299f68972a57b2bf6" FOREIGN KEY ("collection_id") REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" ADD CONSTRAINT "FK_aabb8d18b9092592b58cb04a464" FOREIGN KEY ("token_id", "collection_id") REFERENCES "tokens"("token_id","collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
