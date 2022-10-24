import { MigrationInterface, QueryRunner } from 'typeorm';

export class tokenTypeField1664949825234 implements MigrationInterface {
  name = 'tokenTypeField1664949825234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_type_enum" AS ENUM('NFT', 'FRACTIONAL', 'NESTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "type" "public"."tokens_type_enum" NOT NULL DEFAULT 'NFT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "children" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."tokens_type_enum"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "children"`);
  }
}
