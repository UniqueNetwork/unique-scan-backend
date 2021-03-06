import { Injectable, Logger } from '@nestjs/common';
import { SubstrateProcessor } from '@subsquid/substrate-processor';
import {
  TypeormDatabase,
  Store,
  TypeormDatabaseOptions,
} from '@subsquid/typeorm-store';
import { Connection, DataSource } from 'typeorm';
import { ProcessorConfigService } from '../processor.config.service';

interface IScanDatabaseOptions extends TypeormDatabaseOptions {
  stateSchema: string;
  con: DataSource;
}

class ScanDatabase extends TypeormDatabase {
  constructor(options: IScanDatabaseOptions) {
    const { con, ...typeormDatabaseOptions } = options;
    super(typeormDatabaseOptions);
    this.con = con;
  }

  async connect(): Promise<number> {
    try {
      const height = await this.con.transaction('SERIALIZABLE', async (em) => {
        await em.query(`CREATE SCHEMA IF NOT EXISTS ${this.statusSchema}`);
        await em.query(`
                    CREATE TABLE IF NOT EXISTS ${this.statusSchema}.status (
                        id int primary key,
                        height int not null
                    )
                `);
        const status: { height: number }[] = await em.query(
          `SELECT height FROM ${this.statusSchema}.status WHERE id = 0`,
        );
        if (status.length == 0) {
          await em.query(
            `INSERT INTO ${this.statusSchema}.status (id, height) VALUES (0, -1)`,
          );
          return -1;
        } else {
          return status[0].height;
        }
      });
      return height;
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await this.con.destroy().catch(() => {}); // ignore error
      throw e;
    }
  }
}

@Injectable()
export class ProcessorService {
  private stateSchema = 'scan_status';

  private substrateProcessor: SubstrateProcessor<Store>;

  private readonly logger = new Logger(ProcessorService.name);

  constructor(
    private dataSource: DataSource,
    private connection: Connection,
    private processorConfigService: ProcessorConfigService,
  ) {
    const db = new ScanDatabase({
      stateSchema: this.stateSchema,
      con: this.connection,
    });

    this.substrateProcessor = new SubstrateProcessor(db);

    this.substrateProcessor
      .setDataSource(this.processorConfigService.getDataSource())
      .setBlockRange(this.processorConfigService.getRange());
  }

  async run(forceRescan) {
    this.logger.log({
      msg: 'Run processor service...',
      forceRescan,
      ...this.processorConfigService.getAllParams(),
    });

    const range = this.processorConfigService.getRange();

    if (forceRescan && !isNaN(range.from)) {
      try {
        // Set status height to range.from to rescan old blocks
        await this.dataSource.query(
          `UPDATE ${this.stateSchema}.status SET height = ${range.from} WHERE id = 0`,
        );
      } catch (err) {
        // First run, no schema yet
      }
    }

    return this.processor.run();
  }

  get processor() {
    return this.substrateProcessor;
  }
}
