import { SentryService } from '@ntegral/nestjs-sentry';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

interface IScanDatabaseOptions {
  stateSchema: string;
  con: DataSource;
}

@Injectable()
export class StoreBaseService {
  // private readonly sentry = new SentryService();
  //
  // constructor(options: IScanDatabaseOptions) {
  //   const { con, ...typeormDatabaseOptions } = options;
  //   super(typeormDatabaseOptions);
  //   this.con = con;
  // }
  //
  // async connect(): Promise<number> {
  //   try {
  //     const height = await this.con.transaction('SERIALIZABLE', async (em) => {
  //       await em.query(`CREATE SCHEMA IF NOT EXISTS ${this.statusSchema}`);
  //       await em.query(`
  //                   CREATE TABLE IF NOT EXISTS ${this.statusSchema}.status (
  //                       id int primary key,
  //                       height int not null
  //                   )
  //               `);
  //       const status: { height: number }[] = await em.query(
  //         `SELECT height FROM ${this.statusSchema}.status WHERE id = 0`,
  //       );
  //       if (status.length == 0) {
  //         await em.query(
  //           `INSERT INTO ${this.statusSchema}.status (id, height) VALUES (0, -1)`,
  //         );
  //         return -1;
  //       } else {
  //         return status[0].height;
  //       }
  //     });
  //     return height;
  //   } catch (e: any) {
  //     // eslint-disable-next-line @typescript-eslint/no-empty-function
  //     await this.con.destroy().catch(() => {}); // ignore error
  //     this.sentry.instance().captureException(e);
  //     throw e;
  //   }
  // }
}
