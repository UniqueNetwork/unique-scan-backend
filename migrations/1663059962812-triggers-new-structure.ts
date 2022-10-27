/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

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
	    if ((NEW.method = any(methods) or OLD."method" = any(methods)) and NEW.values->>'collectionId' is not null) then
	        if (TG_OP = 'INSERT') then
		      	insert into collections_stats(collection_id, tokens_count, holders_count, actions_count, transfers_count)
		      	values ((NEW.values->>'collectionId')::int, 0, 0, 1, 0)
		      	ON CONFLICT (collection_id)
		      	DO UPDATE SET actions_count = collections_stats.actions_count + 1;
	        end if;

	        if (TG_OP = 'DELETE') then
	          	insert into collections_stats(collection_id, tokens_count, holders_count, actions_count, transfers_count)
	          	values ((OLD.values->>'collectionId')::int, 0, 0, 0, 0)
	          	ON CONFLICT (collection_id)
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

const collectionsUpdateTransfersStatsFn = `
  create or replace function update_collections_stats_transfers() returns trigger as $$
		begin
	    if (NEW.method = 'Transfer' and NEW.section <> 'Balances') then
	        if (TG_OP = 'INSERT' and NEW.values->>'collectionId' is not null) then
		      	insert into collections_stats(collection_id, tokens_count, holders_count, actions_count, transfers_count)
		      	values ((NEW.values->>'collectionId')::int, 0, 0, 0, 1)
		      	ON CONFLICT (collection_id)
		      	DO UPDATE SET transfers_count = collections_stats.transfers_count + 1;
	        end if;

	        if (TG_OP = 'DELETE' and OLD.values->'collectionId' is not null) then
	          	insert into collections_stats(collection_id, tokens_count, holders_count, actions_count, transfers_count)
	          	values ((OLD.values->'collectionId')::int, 0, 0, 0, 0)
	          	ON CONFLICT (collection_id)
	          	DO UPDATE SET transfers_count = collections_stats.transfers_count - 1;
	        end if;
		end if;
        return null;
        end;
        $$ LANGUAGE plpgsql;
`;

const deleteTransfersStatsTrigger = `drop trigger if exists collection_transfers_stats on event;`;
const collectionsTransfersStatsTrigger = `
  Create trigger collection_transfers_stats after insert or delete on event
  FOR EACH row
  execute function update_collections_stats_transfers();
`;

const transferFn = 'update_tokens_stats_transfers';
const transferTrigger = 'token_transfers_stats';

const tokensUpdateTransfersStatsFn = `
  create or replace function ${transferFn}() returns trigger as $$
		begin
	    if (TG_OP = 'INSERT' and NEW.method = 'Transfer' and NEW.section <> 'Balances' and NEW.values->>'tokenId' is not null) then
        insert into tokens_stats(collection_id, token_id, transfers_count)
        values ((NEW.values->>'collectionId')::int, (NEW.values->>'tokenId')::int, 1)
        ON CONFLICT (collection_id, token_id)
        DO UPDATE SET transfers_count = tokens_stats.transfers_count + 1;
		  end if;

		  if (TG_OP = 'DELETE' and OLD.method = 'Transfer' and OLD.section <> 'Balances' and OLD.values->>'tokenId' is not null) then
        insert into tokens_stats(collection_id, token_id, transfers_count)
        values ((OLD.values->'collectionId')::int, (OLD.values->>'tokenId')::int, 0)
        ON CONFLICT (collection_id, token_id)
        DO UPDATE SET transfers_count = tokens_stats.transfers_count - 1;
		  end if;

      return null;
      end;
      $$ LANGUAGE plpgsql;
`;

const deleteTokenTransfersStatsTrigger = `drop trigger if exists ${transferTrigger} on event;`;
const tokensTransfersStatsTrigger = `
  Create trigger ${transferTrigger} after insert or delete on event
  FOR EACH row
  execute function ${transferFn}();
`;

export class triggersNewStructure1663059962812 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(tokensUpdateActionsStatsFn);
    await queryRunner.query(deleteActionsStatsTrigger);
    await queryRunner.query(tokensActionsStatsTrigger);

    await queryRunner.query(collectionsUpdateTransfersStatsFn);
    await queryRunner.query(deleteTransfersStatsTrigger);
    await queryRunner.query(collectionsTransfersStatsTrigger);

    await queryRunner.query(tokensUpdateTransfersStatsFn);
    await queryRunner.query(deleteTokenTransfersStatsTrigger);
    await queryRunner.query(tokensTransfersStatsTrigger);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop function update_collections_stats_actions;`);

    await queryRunner.query(
      `drop function update_collections_stats_transfers;`,
    );

    await queryRunner.query(`drop function ${transferFn};`);
    await queryRunner.query(`drop trigger ${transferTrigger} on event;`);
  }
}
