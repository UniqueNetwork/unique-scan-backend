/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';
import { Total } from '../common/entities/Total';

export class totalStatsTriggersFix1659610454950 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`drop trigger if exists update_total on total;`);
      await queryRunner.query(`drop trigger if exists blocks_total ON block;`);
      await queryRunner.query(
        `drop trigger if exists extrinsic_total on extrinsic;`,
      );
      await queryRunner.query(`drop trigger if exists events_total on event;`);
      await queryRunner.query(
        `drop trigger if exists collections_total on collections;`,
      );
      await queryRunner.query(`drop trigger if exists tokens_total on tokens;`);
      await queryRunner.query(
        `drop trigger if exists transfers_total on extrinsic;`,
      );
      await queryRunner.query(
        `drop trigger if exists update_supply on account;`,
      );

      await queryRunner.query(`
        INSERT INTO total (name, count)
        VALUES('blocks', (SELECT count(*) FROM block))
        ON CONFLICT (name)
        DO
        UPDATE SET count = (SELECT count(*) FROM block);
      `);

      await queryRunner.query(
        `
        create or replace function update_blocks_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
        update total set count = count + 1 where name = 'blocks';
        end if;

        if  (TG_OP = 'DELETE') then
        update total set count = count - 1 where name = 'blocks';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
      );

      await queryRunner.query(
        `
        create trigger blocks_total AFTER INSERT OR DELETE ON block
        FOR EACH ROW
        EXECUTE FUNCTION update_blocks_total();
        `,
      );

      await queryRunner.query(`
        INSERT INTO total (name, count)
        VALUES('extrinsics', (SELECT count(*) FROM extrinsic))
        ON CONFLICT (name)
        DO
        UPDATE SET count = (SELECT count(*) FROM extrinsic);
      `);

      await queryRunner.query(
        `
        create or replace function update_extrinsics_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
        update total set count = count + 1 where name = 'extrinsics';
        end if;

        if  (TG_OP = 'DELETE') then
        update total set count = count - 1 where name = 'extrinsics';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
      );

      await queryRunner.query(
        `
        create trigger extrinsic_total after insert or delete on extrinsic
        FOR EACH row
        execute function update_extrinsics_total();
        `,
      );

      await queryRunner.query(`
        INSERT INTO total (name, count)
        VALUES('events', (SELECT count(*) FROM event))
        ON CONFLICT (name)
        DO
        UPDATE SET count = (SELECT count(*) FROM event);
      `);

      await queryRunner.query(
        `
        create or replace function update_events_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
        update total set count = count + 1 where name = 'events';
        end if;

        if  (TG_OP = 'DELETE') then
        update total set count = count - 1 where name = 'events';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
      );

      await queryRunner.query(
        `
        create trigger events_total after insert or delete on event
        FOR EACH row
        execute function update_events_total();
        `,
      );

      await queryRunner.query(`
        INSERT INTO total (name, count)
        VALUES('collections', (SELECT count(*) FROM collections))
        ON CONFLICT (name)
        DO
        UPDATE SET count = (SELECT count(*) FROM collections);
      `);

      await queryRunner.query(
        `
        create or replace function update_collections_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
          update total set count = count + 1 where name = 'collections';
        end if;

        if  (TG_OP = 'DELETE') then
          update total set count = count - 1 where name = 'collections';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
      );

      await queryRunner.query(
        `
        create trigger collections_total after insert or delete on collections
        FOR EACH row
        execute function update_collections_total();
        `,
      );

      await queryRunner.query(`
        INSERT INTO total (name, count)
        VALUES('tokens', (SELECT count(*) FROM tokens))
        ON CONFLICT (name)
        DO
        UPDATE SET count = (SELECT count(*) FROM tokens);
      `);

      await queryRunner.query(
        `
        create or replace function update_tokens_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
          update total set count = count + 1 where name = 'tokens';
        end if;

        if  (TG_OP = 'DELETE') then
          update total set count = count - 1 where name = 'tokens';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
      );

      await queryRunner.query(
        `
        create trigger tokens_total after insert or delete on tokens
        FOR EACH row
        execute function update_tokens_total();
        `,
      );

      await queryRunner.query(`
        INSERT INTO total (name, count)
        VALUES('transfers', (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer'))
        ON CONFLICT (name)
        DO
        UPDATE SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer');
      `);

      await queryRunner.query(
        `
        create or replace function update_transfers_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT' and new.section = 'balances' and new.method = 'transfer') then
          update total set count = count + 1 where name = 'transfers';
        end if;

        if  (TG_OP = 'DELETE' and old.section = 'balances' and old.method = 'transfer') then
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

      // accounts stats
      const stat = await queryRunner.query(
        `
          select
            coalesce(sum(available_balance::double precision), 0) as locked,
            coalesce(sum(locked_balance::double precision), 0) as circulating,
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
        if  (TG_OP = 'INSERT' and new.available_balance <> '0') then
          update total set count = count + new.available_balance::double precision where name = 'locked_supply';
        end if;

        if  (TG_OP = 'UPDATE' and new.available_balance <> old.available_balance) then
          update total set count = count + new.available_balance::double precision - old.available_balance::double precision
           where name = 'locked_supply';
        end if;

        if  (TG_OP = 'INSERT' and new.locked_balance <> '0') then
          update total set count = count + new.locked_balance::double precision where name = 'circulating_supply';
        end if;

        if  (TG_OP = 'UPDATE' and new.locked_balance <> old.locked_balance) then
          update total set count = count + new.locked_balance::double precision - old.locked_balance::double precision
           where name = 'circulating_supply';
        end if;

        if  (TG_OP = 'INSERT' and (new.locked_balance <> '0' or new.available_balance <> '0')) then
          update total set count = count + 1 where name = 'holders';
        end if;

        if  (TG_OP = 'UPDATE'
         and new.locked_balance = '0' and old.locked_balance <> '0'
          and new.available_balance = '0' and old.available_balance <> '0'
        ) then
          update total set count = count - 1 where name = 'holders';
        end if;

        if  (TG_OP = 'UPDATE'
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
    await queryRunner.query(`drop trigger blocks_total on block;`);
    await queryRunner.query(`drop function update_blocks_total;`);

    await queryRunner.query(`drop trigger extrinsic_total on extrinsic;`);
    await queryRunner.query(`drop function update_extrinsics_total;`);

    await queryRunner.query(`drop trigger events_total on event;`);
    await queryRunner.query(`drop function update_events_total;`);

    await queryRunner.query(`drop trigger collections_total on collections;`);
    await queryRunner.query(`drop function update_collections_total;`);

    await queryRunner.query(`drop trigger tokens_total on tokens;`);
    await queryRunner.query(`drop function update_tokens_total;`);

    await queryRunner.query(`drop trigger transfers_total on extrinsic;`);
    await queryRunner.query(`drop function update_transfers_total;`);

    await queryRunner.query(`drop trigger update_supply on account;`);
    await queryRunner.query(`drop function update_account_supply0;`);

    await queryRunner.query(`drop trigger update_total on extrinsic;`);
    await queryRunner.query(`drop function update_total_supply;`);
  }
}
