import { MigrationInterface, QueryRunner } from 'typeorm';

export class collectionsPropertiesAttributesSchema1659595740365
  implements MigrationInterface
{
  name = 'collectionsPropertiesAttributesSchema1659595740365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "properties" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "attributes_schema" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "attributes_schema"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "properties"`,
    );
  }
}
