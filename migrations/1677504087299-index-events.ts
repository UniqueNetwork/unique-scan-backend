import { MigrationInterface, QueryRunner } from 'typeorm';

export class indexevents1677504087299 implements MigrationInterface {
  name = 'indexevents1677504087299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "event_values_token_id" ON "event" (((values ->> 'tokenId')::int))`,
    );
    await queryRunner.query(
      `CREATE INDEX "event_values_collection_id" ON "event" (((values ->> 'collectionId')::int))`,
    );
    await queryRunner.query(
      `CREATE INDEX "event_values_nested_token_id" ON "event" (((values -> 'nestedTo' ->> 'tokenId')::int))`,
    );
    await queryRunner.query(
      `CREATE INDEX "event_values_nested_collection_id" ON "event" (((values -> 'nestedTo' ->> 'collectionId')::int))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."event_values_token_id"`);
    await queryRunner.query(`DROP INDEX "public"."event_values_collection_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."event_values_nested_token_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."event_values_nested_collection_id"`,
    );
  }
}
