import { MigrationInterface, QueryRunner } from 'typeorm';

export class unqindextokensowners1676377784283 implements MigrationInterface {
  name = 'unqindextokensowners1676377784283';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `TRUNCATE TABLE tokens_owners RESTART IDENTITY CASCADE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "tokens_owners_idx" ON "tokens_owners" ("token_id", "collection_id","owner")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."tokens_owners_idx"`);
  }
}
