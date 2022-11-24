import { MigrationInterface, QueryRunner } from 'typeorm';

const collectionsDeleteCollectionsStatsFn = `
create or replace function delete_collections_stats() returns trigger as $$
  begin
    if (TG_OP = 'UPDATE' and NEW.burned = true and OLD.burned <> true) then
      delete from collections_stats where collection_id = old.collection_id;
    end if;

    if (TG_OP = 'DELETE') then
      delete from collections_stats where collection_id = old.collection_id;
    end if;

  return null;
  end;
  $$ LANGUAGE plpgsql;
`;

const deleteCollectionsDeleteTrigger = `drop trigger if exists collection_delete_stats on collections;`;
const collectionsDeleteTrigger = `
  Create trigger collection_delete_stats after update or delete on collections
  FOR EACH row
  execute function delete_collections_stats();
`;

const burnCollectionTotalStatsFn = `
        create or replace function update_collections_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
          update total set count = count + 1 where name = 'collections';
        end if;

        if  (TG_OP = 'UPDATE' and NEW.burned = true and OLD.burned <> true ) then
          update total set count = count - 1 where name = 'collections';
        end if;

        if  (TG_OP = 'DELETE') then
          update total set count = count - 1 where name = 'collections';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
`;

const removeBurnCollectionTotalStatsTrigger = `drop trigger if exists collections_total on collections;`;
const burnCollectionTotalStatsTrigger = `
        create trigger collections_total after insert or update or delete on collections
        FOR EACH row
        execute function update_collections_total();
        `;

export class burnedCollectionsTriggers1664966689659
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // if collection set burned === true
    // remove from collection_stats
    await queryRunner.query(collectionsDeleteCollectionsStatsFn);
    await queryRunner.query(deleteCollectionsDeleteTrigger);
    await queryRunner.query(collectionsDeleteTrigger);

    // decrease from total stats
    await queryRunner.query(burnCollectionTotalStatsFn);
    await queryRunner.query(removeBurnCollectionTotalStatsTrigger);
    await queryRunner.query(burnCollectionTotalStatsTrigger);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop function delete_collections_stats;`);
    await queryRunner.query(
      `drop trigger collection_delete_stats on collections;`,
    );

    await queryRunner.query(`drop function update_collections_total;`);
    await queryRunner.query(`drop trigger collections_total on collections;`);
  }
}
