import { MigrationInterface, QueryRunner } from 'typeorm';

export class fixTotalTransfersTrigger1661155973963
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `drop trigger if exists transfers_total on extrinsic;`,
      );

      await queryRunner.query(`
        INSERT INTO total (name, count)
        VALUES('transfers', (SELECT count(*) FROM extrinsic WHERE method = 'transfer'))
        ON CONFLICT (name)
        DO
        UPDATE SET count = (SELECT count(*) FROM extrinsic WHERE method = 'transfer');
      `);

      await queryRunner.query(
        `
        create or replace function update_transfers_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT' and new.method = 'transfer') then
          update total set count = count + 1 where name = 'transfers';
        end if;

        if  (TG_OP = 'DELETE' and old.method = 'transfer') then
          update total set count = count - 1 where name = 'transfers';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
      );

      await queryRunner.query(
        `
        create trigger transfers_total after insert or delete on extrinsic
        FOR EACH row
        execute function update_transfers_total();
        `,
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop trigger transfers_total on extrinsic;`);
    await queryRunner.query(`drop function update_transfers_total;`);
  }
}
