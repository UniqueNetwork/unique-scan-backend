import { MigrationInterface, QueryRunner } from 'typeorm';

export class createContractModel1664268955105 implements MigrationInterface {
  name = 'createContractModel1664268955105';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contract" 
       ("contract_id" text NOT NULL, "abi" text NOT NULL, CONSTRAINT "PK_2f25fae55a3bd80337501b310e3" 
       PRIMARY KEY ("contract_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "contract_pkey" ON "contract" ("contract_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."contract_pkey"`);
    await queryRunner.query(`DROP TABLE "contract"`);
  }
}
