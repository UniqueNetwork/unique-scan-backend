import { MigrationInterface, QueryRunner } from 'typeorm';

export class typetokensowners1675919714002 implements MigrationInterface {
  name = 'typetokensowners1675919714002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_owners" ADD COLUMN IF NOT EXISTS "type" "public"."tokens_type_enum" NOT NULL DEFAULT 'NFT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_owners" ADD COLUMN IF NOT EXISTS "block_number" bigint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP COLUMN "type"`);
    await queryRunner.query(`DROP COLUMN "block_number"`);
  }
}
