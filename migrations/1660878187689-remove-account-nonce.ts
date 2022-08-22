import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeAccountNonce1660878187689 implements MigrationInterface {
  name = 'removeAccountNonce1660878187689';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "nonce"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account" ADD "nonce" text`);
  }
}
