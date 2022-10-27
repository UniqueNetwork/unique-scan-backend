import { MigrationInterface, QueryRunner } from 'typeorm';

export class addedEventValuesField1662716294871 implements MigrationInterface {
  name = 'addedEventValuesField1662716294871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" ADD "values" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "values"`);
  }
}
