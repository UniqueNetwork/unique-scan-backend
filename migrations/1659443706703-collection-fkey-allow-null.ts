import { MigrationInterface, QueryRunner } from 'typeorm';

export class collectionFkeyAllowNull1659443706703
  implements MigrationInterface
{
  name = 'collectionFkeyAllowNull1659443706703';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" DROP CONSTRAINT "FK_99da6be64f1143a7284b242860c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" ADD CONSTRAINT "UQ_33a1823860d26b0d3df7378e118" UNIQUE ("collection_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT "FK_0c3081d08354c10d3553f4678d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" ADD CONSTRAINT "FK_33a1823860d26b0d3df7378e118" FOREIGN KEY ("collection_id") REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_0c3081d08354c10d3553f4678d0" FOREIGN KEY ("collection_id") REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT "FK_0c3081d08354c10d3553f4678d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" DROP CONSTRAINT "FK_33a1823860d26b0d3df7378e118"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_0c3081d08354c10d3553f4678d0" FOREIGN KEY ("collection_id") REFERENCES "collections"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections_stats" DROP CONSTRAINT "UQ_33a1823860d26b0d3df7378e118"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ADD CONSTRAINT "FK_99da6be64f1143a7284b242860c" FOREIGN KEY ("collection_id") REFERENCES "collections_stats"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
