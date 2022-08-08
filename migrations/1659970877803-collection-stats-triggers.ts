/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';

const calcStatsQuery = `
  insert into collections_stats(collection_id, tokens_count, holders_count, actions_count, transfers_count)
  select
    c.collection_id,
    coalesce(tk.tokens_count, 0) as tokens_count,
    coalesce(tholders.holders_count, 0) as holders_count,
    coalesce(cevents.actions_count, 0) as actions_count,
    coalesce(transfers.transfers_count, 0) as transfers_count
    FROM collections c
    left join (
      select
      t.collection_id as collection_id,
      count(t.id) as tokens_count
      from tokens t
      group by t.collection_id
    ) as tk on tk.collection_id = c.collection_id
    left join (
      select
      taq.collection_id,
      count(taq.collection_id) as holders_count
      from (
        select
        t.collection_id
        from tokens t
        group by t."owner", t.collection_id
      ) as taq
      group by taq.collection_id
    ) as tholders on tholders.collection_id = c.collection_id
    left join (
      select
      collection_id,
      count(collection_id) as actions_count
      from
      (
        select
        (e.data::json->0)::text::int as collection_id
        from
        event e
        where e.method in (
          'CollectionCreated',
          'CollectionDestroyed',
          'CollectionSponsorRemoved',
          'CollectionAdminAdded',
          'CollectionOwnedChanged',
          'SponsorshipConfirmed',
          'CollectionAdminRemoved',
          'AllowListAddressRemoved',
          'AllowListAddressAdded',
          'CollectionLimitSet',
          'CollectionSponsorSet',
          'ConstOnChainSchemaSet',
          'MintPermissionSet',
          'OffchainSchemaSet',
          'PublicAccessModeSet',
          'SchemaVersionSet',
          'VariableOnChainSchemaSet',
          'ItemCreated',
          'ItemDestroyed'
        )
      ) as ce
      group by ce.collection_id
      order by ce.collection_id
    ) as cevents on cevents.collection_id=c.collection_id
    left join (
      select collection_id, count(collection_id) as transfers_count
      from
        (
          select (e.data::json->0)::text::int as collection_id
          from event e
          where e.method = 'Transfer' and e.sections <> 'Balances'
        ) as ce
      group by ce.collection_id
    ) as transfers on transfers.collection_id = c.collection_id
    order by c.collection_id desc
    ;
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
    select token_id from tokens where collection_id = NEW.collection_id and token_id != NEW.token_id and "owner" = NEW.owner limit 1 into hasAnotherTokens;
    if (hasAnotherTokens is null) then
      insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
      values (NEW.collection_id, 0, 1, 0)
      ON CONFLICT ON CONSTRAINT collections_stats_pkey
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
      ON CONFLICT ON CONSTRAINT collections_stats_pkey
      DO UPDATE SET holders_count = collections_stats.holders_count + 1;
    end if;

   --Previous owner hasn't another tokens any more
    if (oldOwnerHasTokens is null) then
      insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
      values (NEW.collection_id, 0, 0, 0)
      ON CONFLICT ON CONSTRAINT collections_stats_pkey
      DO UPDATE SET holders_count = collections_stats.holders_count - 1;
    end if;

  end if;


  if (TG_OP = 'DELETE') then
    --Check owner has another token in this collection
    select token_id from tokens where collection_id = OLD.collection_id and token_id != OLD.token_id and "owner" = OLD.owner limit 1 into hasAnotherTokens;
    if (hasAnotherTokens is null) then
      insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
      values (OLD.collection_id, 0, 0, 0)
      ON CONFLICT ON CONSTRAINT collections_stats_pkey
      DO UPDATE SET holders_count = collections_stats.holders_count - 1;
    end if;
  end if;

  return null;
  end;
$$ LANGUAGE plpgsql;
`;

const deleteHoldersStatsTrigger = `drop trigger if exists collection_holders_stats on total;`;
const tokensHoldersStatsTrigger = `
  Create trigger collection_holders_stats after insert or update or delete on tokens
  FOR EACH row
  execute function update_collections_stats_holders();
`;

const tokensUpdateTokensStatsFn = `
create or replace function update_collections_stats_tokens() returns trigger as $$
begin
if (TG_OP = 'INSERT') then
  insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
  values (NEW.collection_id, 1, 0, 0)
  ON CONFLICT ON CONSTRAINT collections_stats_pkey
  DO UPDATE SET tokens_count = collections_stats.tokens_count + 1;
end if;

if (TG_OP = 'UPDATE' and NEW.collection_id != OLD.collection_id) then
  insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
  values (NEW.collection_id, 1, 0, 0)
  ON CONFLICT ON CONSTRAINT collections_stats_pkey
  DO UPDATE SET tokens_count = collections_stats.tokens_count + 1;

  insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
    values (OLD.collection_id, 0, 0, 0)
    ON CONFLICT ON CONSTRAINT collections_stats_pkey
    DO UPDATE SET tokens_count = collections_stats.tokens_count - 1;
end if;


if (TG_OP = 'DELETE') then
    insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
    values (OLD.collection_id, 0, 0, 0)
    ON CONFLICT ON CONSTRAINT collections_stats_pkey
    DO UPDATE SET tokens_count = collections_stats.tokens_count - 1;
end if;

return null;
end;
$$ LANGUAGE plpgsql;
`;

const deleteTokensStatsTrigger = `drop trigger if exists collection_tokens_stats on total;`;
const tokensTokensStatsTrigger = `
  Create trigger collection_tokens_stats after insert or update or delete on tokens
  FOR EACH row
  execute function update_collections_stats_tokens();
`;

const tokensUpdateActionsStatsFn = `
create or replace function update_collections_stats_actions() returns trigger as $$
        declare methods text[] := array[
			  'CollectionCreated',
			  'CollectionDestroyed',
			  'CollectionSponsorRemoved',
			  'CollectionAdminAdded',
			  'CollectionOwnedChanged',
			  'SponsorshipConfirmed',
			  'CollectionAdminRemoved',
			  'AllowListAddressRemoved',
			  'AllowListAddressAdded',
			  'CollectionLimitSet',
			  'CollectionSponsorSet',
			  'ConstOnChainSchemaSet',
			  'MintPermissionSet',
			  'OffchainSchemaSet',
			  'PublicAccessModeSet',
			  'SchemaVersionSet',
			  'VariableOnChainSchemaSet',
			  'ItemCreated',
			  'ItemDestroyed'
			];
		begin
	    if (NEW.method = any(methods) or OLD."method" = any(methods)) then
	        if (TG_OP = 'INSERT') then
		      	insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
		      	values ((NEW.data::json->0)::text::int, 0, 0, 1)
		      	ON CONFLICT ON CONSTRAINT collections_stats_pkey
		      	DO UPDATE SET actions_count = collections_stats.actions_count + 1;
	        end if;

	        if (TG_OP = 'DELETE') then
	          	insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
	          	values ((OLD.data::json->0)::text::int, 0, 0, 0)
	          	ON CONFLICT ON CONSTRAINT collections_stats_pkey
	          	DO UPDATE SET actions_count = collections_stats.actions_count - 1;
	        end if;
		end if;
        return null;
        end;
        $$ LANGUAGE plpgsql;
`;

const deleteActionsStatsTrigger = `drop trigger if exists collection_actions_stats on event;`;
const tokensActionsStatsTrigger = `
  Create trigger collection_actions_stats after insert or delete on event
  FOR EACH row
  execute function update_collections_stats_actions();
`;

const collectionsDeleteCollectionsStatsFn = `
create or replace function delete_collections_stats() returns trigger as $$
  begin
  if (TG_OP = 'DELETE') then
  delete from collections_stats where collection_id = old.collection_id;
  end if;

  return null;
  end;
$$ LANGUAGE plpgsql;
`;

const deleteCollectionsDeleteTrigger = `drop trigger if exists collection_delete_stats on collections;`;
const collectionsDeleteTrigger = `
  Create trigger collection_delete_stats after delete on collections
  FOR EACH row
  execute function delete_collections_stats();
`;

const collectiosUpdateTransfersStatsFn = `
create or replace function update_collections_stats_transfers() returns trigger as $$
		begin
	    if (NEW.method = 'Transfer' and NEW.sections <> 'Balances') then
	        if (TG_OP = 'INSERT') then
		      	insert into collections_stats(collection_id, tokens_count, holders_count, actions_count, transfers_count)
		      	values ((NEW.data::json->0)::text::int, 0, 0, 0, 1)
		      	ON CONFLICT ON CONSTRAINT collections_stats_pkey
		      	DO UPDATE SET transfers_count = collections_stats.transfers_count + 1;
	        end if;

	        if (TG_OP = 'DELETE') then
	          	insert into collections_stats(collection_id, tokens_count, holders_count, actions_count, transfers_count)
	          	values ((OLD.data::json->0)::text::int, 0, 0, 0, 0)
	          	ON CONFLICT ON CONSTRAINT collections_stats_pkey
	          	DO UPDATE SET transfers_count = collections_stats.transfers_count - 1;
	        end if;
		end if;
        return null;
        end;
        $$ LANGUAGE plpgsql;
`;

const deleteTransfersStatsTrigger = `drop trigger if exists collection_transfers_stats on event;`;
const collectionTransfersStatsTrigger = `
  Create trigger collection_transfers_stats after insert on event
  FOR EACH row
  execute function update_collections_stats_transfers();
`;

export class collectionStatsTriggers1659679545086
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`delete from collections_stats`);
      await queryRunner.query(calcStatsQuery);
      await queryRunner.query(deleteHoldersStatsTrigger);

      await queryRunner.query(tokensUpdateHoldersStatsFn);
      await queryRunner.query(tokensHoldersStatsTrigger);

      await queryRunner.query(tokensUpdateTokensStatsFn);
      await queryRunner.query(deleteTokensStatsTrigger);
      await queryRunner.query(tokensTokensStatsTrigger);

      await queryRunner.query(tokensUpdateActionsStatsFn);
      await queryRunner.query(deleteActionsStatsTrigger);
      await queryRunner.query(tokensActionsStatsTrigger);

      await queryRunner.query(collectionsDeleteCollectionsStatsFn);
      await queryRunner.query(deleteCollectionsDeleteTrigger);
      await queryRunner.query(collectionsDeleteTrigger);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`delete from collections_stats`);

    await queryRunner.query(`drop function update_collections_stats_holders;`);
    await queryRunner.query(`drop trigger collection_holders_stats on tokens;`);

    await queryRunner.query(`drop function update_collections_stats_tokens;`);
    await queryRunner.query(`drop trigger collection_tokens_stats on tokens;`);

    await queryRunner.query(`drop function update_collections_stats_actions;`);
    await queryRunner.query(`drop trigger collection_actions_stats on tokens;`);
  }
}
