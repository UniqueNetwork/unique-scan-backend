import { MigrationInterface, QueryRunner } from 'typeorm';

export class tokenParentIdIndex1666271468547 implements MigrationInterface {
  name = 'tokenParentIdIndex1666271468547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "tokens_parent_id_idx" ON "tokens" ("parent_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."tokens_parent_id_idx"`);
  }
}
