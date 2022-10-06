/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';

const burnedTokensTotalStatsFn = `
  create or replace function update_tokens_total() returns trigger as $$
    begin
      if  (TG_OP = 'INSERT') then
        update total set count = count + 1 where name = 'tokens';
      end if;

      if  (TG_OP = 'UPDATE' and NEW.burned = true and OLD.burned <> true) then
        update total set count = count - 1 where name = 'tokens';
      end if;

      return null;
    end;
  $$ LANGUAGE plpgsql;
`;

const removeBurnedTokensTotalStatsTrigger = `drop trigger tokens_total on tokens;`;
const removeBurnedTokensTotalStatsFn = `drop function update_tokens_total;`;
const burnedTokensTotalStatsTrigger = `
  create trigger tokens_total after insert or update on tokens
  FOR EACH row
  execute function update_tokens_total();
`;

const tokensUpdateTokensStatsFn = `
  create or replace function update_collections_stats_tokens() returns trigger as $$
  begin
  if (TG_OP = 'INSERT') then
    insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
    values (NEW.collection_id, 1, 0, 0)
    ON CONFLICT (collection_id)
    DO UPDATE SET tokens_count = collections_stats.tokens_count + 1;
  end if;

  if (TG_OP = 'UPDATE' and NEW.collection_id != OLD.collection_id) then
    insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
    values (NEW.collection_id, 1, 0, 0)
    ON CONFLICT (collection_id)
    DO UPDATE SET tokens_count = collections_stats.tokens_count + 1;

    insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
    values (OLD.collection_id, 0, 0, 0)
    ON CONFLICT (collection_id)
    DO UPDATE SET tokens_count = collections_stats.tokens_count - 1;
  end if;


  if (TG_OP = 'UPDATE' and NEW.burned = true and OLD.burned <> true) then
    insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
    values (OLD.collection_id, 0, 0, 0)
    ON CONFLICT (collection_id)
    DO UPDATE SET tokens_count = collections_stats.tokens_count - 1;
  end if;

  return null;
  end;
  $$ LANGUAGE plpgsql;
`;

const deleteTokensStatsTrigger = `drop trigger if exists collection_tokens_stats on tokens;`;
const deleteTokensStatsFn = `drop function if exists update_collections_stats_tokens;`;
const tokensTokensStatsTrigger = `
  Create trigger collection_tokens_stats after insert or update on tokens
  FOR EACH row
  execute function update_collections_stats_tokens();
`;

const tokensUpdateHoldersStatsFn = `
create or replace function update_collections_stats_holders() returns trigger as $$
  declare
    hasAnotherTokens int;
    newOwnerHasAnotherTokens int;
    oldOwnerHasTokens int;
  begin
  if (TG_OP = 'INSERT') then
    --Check owner already has token in collection
    select token_id from tokens where collection_id = NEW.collection_id and token_id != NEW.token_id and "owner" = NEW.owner and burned = false limit 1 into hasAnotherTokens;
    if (hasAnotherTokens is null) then
      insert into collections_stats (collection_id, tokens_count, holders_count, actions_count)
      values (NEW.collection_id, 0, 1, 0)
      ON CONFLICT (collection_id)
      DO UPDATE SET holders_count = collections_stats.holders_count + 1;
    end if;
  end if;

  if (TG_OP = 'UPDATE' and NEW.owner != OLD.owner) then
    select token_id from tokens where collection_id = NEW.collection_id and token_id != NEW.token_id and "owner" = NEW.owner  and burned = false limit 1 into newOwnerHasAnotherTokens;
    select token_id from tokens where collection_id = OLD.collection_id and token_id != OLD.token_id and "owner" = OLD.owner  and burned = false limit 1 into oldOwnerHasTokens;
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


  if (TG_OP = 'UPDATE' and NEW.burned = true and OLD.burned = false) then
    --Check owner has another token in this collection
    select token_id from tokens where collection_id = OLD.collection_id and token_id != OLD.token_id and "owner" = OLD.owner and burned = false limit 1 into hasAnotherTokens;
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

const deleteHoldersStatsTrigger = `drop trigger if exists collection_holders_stats on tokens;`;
const deleteHoldersStatsFn = `drop function if exists update_collections_stats_holders;`;
const tokensHoldersStatsTrigger = `
  Create trigger collection_holders_stats after insert or update on tokens
  FOR EACH row
  execute function update_collections_stats_holders();
`;

export class burnedTokensTriggers1664975508835 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(burnedTokensTotalStatsFn);
    await queryRunner.query(removeBurnedTokensTotalStatsTrigger);
    await queryRunner.query(burnedTokensTotalStatsTrigger);

    await queryRunner.query(tokensUpdateTokensStatsFn);
    await queryRunner.query(deleteTokensStatsTrigger);
    await queryRunner.query(tokensTokensStatsTrigger);

    await queryRunner.query(tokensUpdateHoldersStatsFn);
    await queryRunner.query(deleteHoldersStatsTrigger);
    await queryRunner.query(tokensHoldersStatsTrigger);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(removeBurnedTokensTotalStatsTrigger);
    await queryRunner.query(removeBurnedTokensTotalStatsFn);

    await queryRunner.query(deleteTokensStatsTrigger);
    await queryRunner.query(deleteTokensStatsFn);

    await queryRunner.query(deleteHoldersStatsTrigger);
    await queryRunner.query(deleteHoldersStatsFn);
  }
}
