/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';

const calcStatsQuery = `
  update collections_stats
  set holders_count = sub.holders_count
  from (
    select stat.collection_id, count(1) as holders_count
    from (
      select t.collection_id, count(1)
      from tokens t
      group by t."owner", t.collection_id
    ) as stat
    group by stat.collection_id
  ) as sub
  where collections_stats.collection_id = sub.collection_id
  ;
`;

const fnName = 'update_collections_stats_holders';
const triggerName = 'collection_holders_stats';

const tokensUpdateHoldersStatsFn = `
create or replace function ${fnName}() returns trigger as $$
  declare
    hasAnotherTokens int;
    newOwnerHasAnotherTokens int;
    oldOwnerHasTokens int;
  begin
  if (TG_OP = 'INSERT') then
    --Check owner already has token in collection
    select token_id from tokens where collection_id = NEW.collection_id and token_id != NEW.token_id and "owner" = NEW.owner limit 1 into hasAnotherTokens;
    if (hasAnotherTokens is null) then
      insert into collections_stats (collection_id, tokens_count, holders_count, actions_count)
      values (NEW.collection_id, 0, 1, 0)
      ON CONFLICT (collection_id)
      DO UPDATE SET holders_count = collections_stats.holders_count + 1;
    end if;
  end if;

  if (TG_OP = 'UPDATE' and NEW.owner != OLD.owner) then
    select token_id from tokens where collection_id = NEW.collection_id and token_id != NEW.token_id and "owner" = NEW.owner limit 1 into newOwnerHasAnotherTokens;
    select token_id from tokens where collection_id = OLD.collection_id and token_id != OLD.token_id and "owner" = OLD.owner limit 1 into oldOwnerHasTokens;
    --Previous owner has another token in this collection but new owner not.
    if (newOwnerHasAnotherTokens is null and oldOwnerHasTokens is not null) then
      insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
      values (NEW.collection_id, 0, 1, 0)
      ON CONFLICT (collection_id)
      DO UPDATE SET holders_count = collections_stats.holders_count + 1;
    end if;

   --Previous owner hasn't another tokens any more
    if (oldOwnerHasTokens is null and newOwnerHasAnotherTokens is not null) then
      insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
      values (NEW.collection_id, 0, 0, 0)
      ON CONFLICT (collection_id)
      DO UPDATE SET holders_count = collections_stats.holders_count - 1;
    end if;

  end if;


  if (TG_OP = 'DELETE') then
    --Check owner has another token in this collection
    select token_id from tokens where collection_id = OLD.collection_id and token_id != OLD.token_id and "owner" = OLD.owner limit 1 into hasAnotherTokens;
    if (hasAnotherTokens is null) then
      insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
      values (OLD.collection_id, 0, 0, 0)
      ON CONFLICT (collection_id)
      DO UPDATE SET holders_count = collections_stats.holders_count - 1;
    end if;
  end if;

  return null;
  end;
$$ LANGUAGE plpgsql;
`;

const deleteHoldersStatsTrigger = `drop trigger if exists ${triggerName} on tokens;`;
const tokensHoldersStatsTrigger = `
  Create trigger ${triggerName} after insert or update or delete on tokens
  FOR EACH row
  execute function ${fnName}();
`;

export class fixHoldersCountTrigger1662629432041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(calcStatsQuery);

      await queryRunner.query(deleteHoldersStatsTrigger);
      await queryRunner.query(tokensUpdateHoldersStatsFn);
      await queryRunner.query(tokensHoldersStatsTrigger);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('delete from collections_stats');
    await queryRunner.query(`drop function ${fnName};`);
    await queryRunner.query(`drop trigger ${triggerName} on tokens;`);
  }
}
