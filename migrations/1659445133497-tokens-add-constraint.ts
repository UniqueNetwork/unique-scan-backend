import { MigrationInterface, QueryRunner } from 'typeorm';

export class tokensAddConstraint1659445133497 implements MigrationInterface {
  name = 'tokensAddConstraint1659445133497';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."tokens_pkey"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "tokens_pkey" ON "tokens" ("token_id", "collection_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."tokens_pkey"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "tokens_pkey" ON "tokens" ("id") `,
    );
  }
}
