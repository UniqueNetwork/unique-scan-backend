import { MigrationInterface, QueryRunner } from "typeorm";

export class tokensPropertiesAttributesSchema1659688051455 implements MigrationInterface {
    name = 'tokensPropertiesAttributesSchema1659688051455'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "properties" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "attributes" jsonb NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "attributes"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "properties"`);
    }

}
