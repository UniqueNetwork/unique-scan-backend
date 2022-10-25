import { MigrationInterface, QueryRunner } from 'typeorm';

export class eventDataChangeType1666630144559 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE event ALTER data TYPE JSONB USING data::JSONB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE event ALTER data TYPE JSONB USING data::text;
    `);
  }
}
