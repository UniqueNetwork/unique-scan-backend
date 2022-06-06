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

  public async loadFixtures(fixturesPath: string) {
    try {
      this.connection = await createConnection(this.getTestConnectionOptions());
      await this.connection.synchronize(true);
      const loader = new Loader();

      loader.load(path.resolve(fixturesPath));

      const resolver = new Resolver();
      const fixtures = resolver.resolve(loader.fixtureConfigs);
      const builder = new Builder(this.connection, new Parser());

      for (const fixture of fixturesIterator(fixtures)) {
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
  public async clearFixtures() {
    this.connection = await createConnection(this.getTestConnectionOptions());
    const entities = this.connection.entityMetadatas;

    for (const entity of entities) {
      const repository = this.connection.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName}`);
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
