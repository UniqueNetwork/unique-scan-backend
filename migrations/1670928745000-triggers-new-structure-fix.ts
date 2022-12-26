/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

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



export class triggersNewStructureFix1670928745000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(tokensUpdateActionsStatsFn);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop function update_collections_stats_actions;`);
  }
}
