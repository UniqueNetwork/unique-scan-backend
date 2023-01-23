import { MigrationInterface, QueryRunner } from 'typeorm';

export class changetypetokens1674380781230 implements MigrationInterface {
  name = 'changetypetokens1674380781230';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" ALTER COLUMN "total_pieces" TYPE BIGINT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
