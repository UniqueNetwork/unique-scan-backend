/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';
import { Total } from '../common/entities/Total';

export class accountsTriggersFix1661761544305 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `drop trigger if exists update_supply on account;`,
      );

      // accounts stats
      const stat = await queryRunner.query(
        `
          select
            coalesce(sum(available_balance::double precision), 0) as circulating,
            coalesce(sum(locked_balance::double precision), 0) as locked,
            count(*) filter (where available_balance <> '0' or locked_balance <> '0') as holders
          from account a
        `,
      );
      const { locked = 0, circulating = 0, holders = 0 } = stat[0];

      await queryRunner.manager.upsert(
        Total,
        { count: Math.floor(locked), name: 'locked_supply' },
        ['name'],
      );

      await queryRunner.manager.upsert(
        Total,
        { count: Math.floor(circulating), name: 'circulating_supply' },
        ['name'],
      );

      await queryRunner.manager.upsert(
        Total,
        { count: holders, name: 'holders' },
        ['name'],
      );

      await queryRunner.query(
        `
        create or replace function update_account_supply() returns trigger as $$
        begin
        if (TG_OP = 'INSERT' and new.available_balance <> '0') then
          update total set count = count + new.available_balance::double precision where name = 'circulating_supply';
        end if;

        if (TG_OP = 'UPDATE' and new.available_balance <> old.available_balance) then
          update total set count = count + new.available_balance::double precision - old.available_balance::double precision
           where name = 'circulating_supply';
        end if;

        if (TG_OP = 'INSERT' and new.locked_balance <> '0') then
          update total set count = count + new.locked_balance::double precision where name = 'locked_supply';
        end if;

        if (TG_OP = 'UPDATE' and new.locked_balance <> old.locked_balance) then
          update total set count = count + new.locked_balance::double precision - old.locked_balance::double precision
           where name = 'locked_supply';
        end if;

        if (TG_OP = 'INSERT' and (new.locked_balance <> '0' or new.available_balance <> '0')) then
          update total set count = count + 1 where name = 'holders';
        end if;

        if (TG_OP = 'UPDATE'
         and new.locked_balance = '0' and old.locked_balance <> '0'
          and new.available_balance = '0' and old.available_balance <> '0'
        ) then
          update total set count = count - 1 where name = 'holders';
        end if;

        if (TG_OP = 'UPDATE'
          and ((old.locked_balance = '0' and new.locked_balance <> '0')
           or (old.available_balance = '0' and new.available_balance <> '0'))) then
          update total set count = count + 1 where name = 'holders';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
      );

      await queryRunner.query(
        `
        create trigger update_supply AFTER INSERT OR UPDATE OR DELETE ON account
        FOR EACH ROW
        EXECUTE FUNCTION update_account_supply();
        `,
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop trigger update_supply on account;`);
    await queryRunner.query(`drop function update_account_supply;`);
  }
}
