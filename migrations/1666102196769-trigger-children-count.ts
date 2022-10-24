/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';

const nestedFn = 'update_nested_tokens_stats';
const nestedTrigger = 'nested_token_stats';

const tokensUpdateNestedStatsFn = `
  create or replace function ${nestedFn}() returns trigger as $$
		begin
	    if (TG_OP = 'UPDATE' and jsonb_array_length(NEW.children) != jsonb_array_length(OLD.children)) then
        insert into tokens_stats(collection_id, token_id, transfers_count, children_count)
        values (NEW.collection_id, NEW.token_id, 0, jsonb_array_length(NEW.children))
        ON CONFLICT (collection_id, token_id)
        DO UPDATE SET children_count = jsonb_array_length(NEW.children);
		  end if;

		  if (TG_OP = 'UPDATE' and jsonb_array_length(NEW.children) = 0 and jsonb_array_length(OLD.children) > 0) then
        insert into tokens_stats(collection_id, token_id, transfers_count, children_count)
        values (NEW.collection_id, NEW.token_id, 0, 0)
        ON CONFLICT (collection_id, token_id)
        DO UPDATE SET children_count = 0;

        if (NEW.parent_id is null) then
          UPDATE tokens
          SET type = 'NFT', bundle_created = null
          WHERE collection_id = OLD.collection_id and token_id = OLD.token_id;
        end if;
		  end if;

      return null;
      end;
      $$ LANGUAGE plpgsql;
`;

const deleteTokenNestedTrigger = `drop trigger if exists ${nestedTrigger} on tokens;`;
const deleteNestedStatsFn = `drop function if exists ${nestedFn};`;
const tokensNestedStatsTrigger = `
  Create trigger ${nestedTrigger} after update on tokens
  FOR EACH row
  execute function ${nestedFn}();
`;

const bundleCreatedFn = 'update_bundle_created_date_fn';
const bundleCreatedTrigger = 'update_bundle_created_date_trigger';

const tokensUpdateBundleCreatedFn = `
  create or replace function ${bundleCreatedFn}() returns trigger as $$
		begin
	    if (TG_OP = 'UPDATE' and NEW.bundle_created > OLD.bundle_created) then
        NEW.bundle_created = OLD.bundle_created;
		  end if;

      return NEW;
      end;
      $$ LANGUAGE plpgsql;
`;

const deleteBundleCreatedTrigger = `drop trigger if exists ${bundleCreatedTrigger} on tokens;`;
const deleteBundleCreatedFn = `drop function if exists ${bundleCreatedFn};`;
const tokensBundleCreatedQuery = `
  Create trigger ${bundleCreatedTrigger} before update on tokens
  FOR EACH row
  execute function ${bundleCreatedFn}();
`;

export class triggerChildrenCount1666102196769 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(tokensUpdateNestedStatsFn);
    await queryRunner.query(deleteTokenNestedTrigger);
    await queryRunner.query(tokensNestedStatsTrigger);

    await queryRunner.query(tokensUpdateBundleCreatedFn);
    await queryRunner.query(deleteBundleCreatedTrigger);
    await queryRunner.query(tokensBundleCreatedQuery);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(deleteTokenNestedTrigger);
    await queryRunner.query(deleteNestedStatsFn);

    await queryRunner.query(deleteBundleCreatedTrigger);
    await queryRunner.query(deleteBundleCreatedFn);
  }
}
