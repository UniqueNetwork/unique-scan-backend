import { MigrationInterface, QueryRunner } from 'typeorm';

export class addindextokensowners1675323128108 implements MigrationInterface {
  name = 'addindextokensowners1675323128108';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "tokens_owners_general_idx" ON "tokens_owners" ("collection_id", "token_id", "owner") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."tokens_owners_general_idx"`);
  }
}
