import * as path from 'path';
import {
  Builder,
  fixturesIterator,
  Loader,
  Parser,
  Resolver,
} from 'typeorm-fixtures-cli/dist';
import { Connection, createConnection, getRepository } from 'typeorm';
import typeormConfig from '@common/typeorm.config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class Fixtures {
  private connection: Connection | undefined;
  private readonly path: string;
  private readonly pattern: RegExp;

  constructor(path: string, pattern = '') {
    this.path = path;
    if (pattern) {
      this.pattern = new RegExp(pattern);
    }
  }

  public async loadFixtures() {
    try {
      // TODO: need create new test db for all test instance
      this.connection = await createConnection(this.getTestConnectionOptions());
      await this.connection.synchronize(true);

      const loader = new Loader();
      loader.load(path.resolve(this.path));

      const resolver = new Resolver();
      const fixtures = resolver.resolve(loader.fixtureConfigs);
      const builder = new Builder(this.connection, new Parser());
      let fixturesList = Array.from(fixturesIterator(fixtures));
      if (this.pattern) {
        fixturesList = fixturesList.filter(({ entity }) =>
          this.pattern.test(entity),
        );
      }

      for (const fixture of fixturesList) {
        const entity = await builder.build(fixture);
        await getRepository(entity.constructor.name).save(entity);
      }
    } catch (err) {
      throw err;
    } finally {
      if (this.connection) {
        await this.connection.close();
      }
    }
  }

  // clear test db
  // TODO: need remove test db
  public async clearFixtures() {
    this.connection = await createConnection(this.getTestConnectionOptions());
    const entities = this.connection.entityMetadatas;

    const relatedTables = ['collections', 'tokens', 'collections_stats'];
    for (const entity of entities) {
      // dont work with related data
      if (!relatedTables.includes(entity.tableName)) {
        const repository = this.connection.getRepository(entity.name);
        await repository.query(`DELETE FROM ${entity.tableName}`);
      }
    }

    if (this.connection) {
      await this.connection.close();
    }
  }

  private getTestConnectionOptions() {
    return {
      ...typeormConfig,
      name: 'test_connection',
    } as PostgresConnectionOptions;
  }
}
