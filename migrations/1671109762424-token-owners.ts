import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class tokenowners1671109762424 implements MigrationInterface {
  name = 'tokenowners1671109762424';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tokens_owners',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'collection_id',
            type: 'bigint',
          },
          {
            name: 'token_id',
            type: 'bigint',
          },
          {
            name: 'amount',
            type: 'bigint',
          },
          {
            name: 'owner',
            type: 'text',
          },
          {
            name: 'owner_normalized',
            type: 'text',
          },
          {
            name: 'date_created',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tokens_owners"`);
  }
}
