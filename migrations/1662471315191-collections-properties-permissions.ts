import { MigrationInterface, QueryRunner } from 'typeorm';

export class collectionsPropertiesPermissions1662471315191
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "token_property_permissions" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "token_property_permissions"`,
    );
  }
}
