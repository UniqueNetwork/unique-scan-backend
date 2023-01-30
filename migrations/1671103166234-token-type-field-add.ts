import { MigrationInterface, QueryRunner } from 'typeorm';

export class tokenTypeFieldAdd1671103166234 implements MigrationInterface {
  name = 'tokenTypeFieldAdd1671103166234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(
      `SELECT true as exists FROM information_schema.columns WHERE table_name='tokens' and column_name='total_pieces'`,
    );
    if (!existing) {
      await queryRunner.query(
        `ALTER TABLE "tokens" ADD "total_pieces" integer NOT NULL DEFAULT 1`,
      );

      await queryRunner.query(
        `alter type tokens_type_enum rename to _tokens_type_enum;`,
      );
      await queryRunner.query(
        `alter table tokens rename column "type" to "m_type";`,
      );

      await queryRunner.query(
        `CREATE TYPE "public"."tokens_type_enum" AS ENUM('NFT','RFT','FRACTIONAL', 'NESTED')`,
      );
      await queryRunner.query(
        `ALTER TABLE "tokens" ADD "type" "public"."tokens_type_enum" NOT NULL DEFAULT 'NFT'`,
      );
      await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "m_type"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE "public"."tokens_type_enum"`);
    await queryRunner.query(`DROP COLUMN "total_pieces"`);
  }
}
