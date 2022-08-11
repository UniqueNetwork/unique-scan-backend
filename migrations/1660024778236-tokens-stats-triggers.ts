import { MigrationInterface, QueryRunner } from 'typeorm';

const calcStatsQuery = `
  insert into tokens_stats (token_id, collection_id, transfers_count)
  select token_id, collection_id, count(true) as transfers_count
  from (
    select
        (e.data::json->0)::text::int as collection_id,
        (e.data::json->1)::text::int as token_id
    from event e
    where e.method = 'Transfer' and e.section <> 'Balances'
  ) as ce
  group by ce.collection_id, ce.token_id
  ;
`;

const transferFn = 'update_tokens_stats_transfers';
const transferTrigger = 'token_transfers_stats';

const tokensUpdateTransfersStatsFn = `
create or replace function ${transferFn}() returns trigger as $$
		begin
	    if (TG_OP = 'INSERT' and NEW.method = 'Transfer' and NEW.section <> 'Balances') then
        insert into tokens_stats(collection_id, token_id, transfers_count)
        values ((NEW.data::json->0)::text::int, (NEW.data::json->1)::text::int, 1)
        ON CONFLICT (collection_id, token_id)
        DO UPDATE SET transfers_count = tokens_stats.transfers_count + 1;
		  end if;

		  if (TG_OP = 'DELETE' and OLD.method = 'Transfer' and OLD.section <> 'Balances') then
        insert into tokens_stats(collection_id, token_id, transfers_count)
        values ((NEW.data::json->0)::text::int, (NEW.data::json->1)::text::int, 0)
        ON CONFLICT (collection_id, token_id)
        DO UPDATE SET transfers_count = tokens_stats.transfers_count - 1;
		  end if;

      return null;
      end;
      $$ LANGUAGE plpgsql;
`;

const deleteTransfersStatsTrigger = `drop trigger if exists ${transferTrigger} on event;`;
const collectionsTransfersStatsTrigger = `
  Create trigger ${transferTrigger} after insert or delete on event
  FOR EACH row
  execute function ${transferFn}();
`;

export class tokensStatsTriggers1660024778236 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`delete from collections_stats`);
      await queryRunner.query(calcStatsQuery);

      await queryRunner.query(tokensUpdateTransfersStatsFn);
      await queryRunner.query(deleteTransfersStatsTrigger);
      await queryRunner.query(collectionsTransfersStatsTrigger);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop function ${transferFn};`);
    await queryRunner.query(`drop trigger ${transferTrigger} on event;`);
  }
}
