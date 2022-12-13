/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';

const calcStatsQuery = `
  insert into collections_stats
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
          'CollectionOwnerChanged',
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
          where e.method = 'Transfer' and e.section <> 'Balances'
        ) as ce
      group by ce.collection_id
    ) as transfers on transfers.collection_id = c.collection_id
    order by c.collection_id desc
    ;
`;

const tokensUpdateActionsStatsFn = `
create or replace function update_collections_stats_actions() returns trigger as $$
        declare methods text[] := array[
			  'CollectionCreated',
			  'CollectionDestroyed',
			  'CollectionSponsorRemoved',
			  'CollectionAdminAdded',
			  'CollectionOwnerChanged',
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
		      	ON CONFLICT (collection_id)
		      	DO UPDATE SET actions_count = collections_stats.actions_count + 1;
	        end if;

	        if (TG_OP = 'DELETE') then
	          	insert into collections_stats(collection_id, tokens_count, holders_count, actions_count)
	          	values ((OLD.data::json->0)::text::int, 0, 0, 0)
	          	ON CONFLICT (collection_id)
	          	DO UPDATE SET actions_count = collections_stats.actions_count - 1;
	        end if;
		end if;
        return null;
        end;
        $$ LANGUAGE plpgsql;
`;

export class collectionStatsTriggersFix1670929199000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`delete from collections_stats`);
      await queryRunner.query(calcStatsQuery);
      await queryRunner.query(tokensUpdateActionsStatsFn);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`delete from collections_stats`);
    await queryRunner.query(`drop function update_collections_stats_actions;`);
  }
}
