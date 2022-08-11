import * as path from 'path';
import {
  Builder,
  fixturesIterator,
  Loader,
  Parser,
  Resolver,
} from 'typeorm-fixtures-cli/dist';
import { Connection, createConnection, getRepository } from 'typeorm';
import { createDatabase, dropDatabase } from 'typeorm-extension';
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
      const options = this.getTestConnectionOptions();
      await this.createTestDatabase();

      this.connection = await createConnection(options);
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

  public async createTestDatabase() {
    const options = this.getTestConnectionOptions();
    await createDatabase({
      options,
      ifNotExist: true,
    });
  }

  public async clearFixtures() {
    const options = this.getTestConnectionOptions();
    try {
      await dropDatabase({ options });
    } catch {
      // eslint-disable-next-line no-console
      console.error('dropDatabase error');
      process.exit(0);
    }
  }

  private getTestConnectionOptions() {
    return {
      ...typeormConfig,
    } as PostgresConnectionOptions;
  }
}
