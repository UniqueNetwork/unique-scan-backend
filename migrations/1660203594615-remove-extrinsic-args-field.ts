import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeExtrinsicArgsField1660203594615
  implements MigrationInterface
{
  name = 'removeExtrinsicArgsField1660203594615';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "extrinsic" DROP COLUMN "args"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "extrinsic" ADD "args" text NOT NULL`);
  }
}
