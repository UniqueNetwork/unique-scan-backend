import { MigrationInterface, QueryRunner } from 'typeorm';

export class addedEventArgsField1662716294871 implements MigrationInterface {
  name = 'addedEventArgsField1662716294871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" ADD "args" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "args"`);
  }
}
