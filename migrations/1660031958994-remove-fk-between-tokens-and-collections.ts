import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeFkBetweenTokensAndCollections1660031958994
  implements MigrationInterface
{
  name = 'removeFkBetweenTokensAndCollections1660031958994';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT "FK_0c3081d08354c10d3553f4678d0"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_0c3081d08354c10d3553f4678d0" FOREIGN KEY ("collection_id") 
      REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
