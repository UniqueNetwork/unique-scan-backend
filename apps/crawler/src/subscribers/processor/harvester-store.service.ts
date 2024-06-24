import { Injectable, Logger } from '@nestjs/common';

import { Connection, DataSource } from 'typeorm';
import { ProcessorConfigService } from '../../config/processor.config.service';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { STATE_SCHEMA_NAME_BY_MODE } from '@common/constants';

type RescanState = [number, number];
type ScanState = [number];

@Injectable()
export class HarvesterStoreService {
  private stateSchema;
  private readonly logger = new Logger(HarvesterStoreService.name);

  constructor(
    private dataSource: DataSource,
    private connection: Connection,
    private processorConfigService: ProcessorConfigService,
    @InjectSentry() private readonly sentry: SentryService,
  ) {
    this.stateSchema = this.processorConfigService.isRescan()
      ? STATE_SCHEMA_NAME_BY_MODE.RESCAN
      : STATE_SCHEMA_NAME_BY_MODE.SCAN;
  }

  async getState(): Promise<ScanState | RescanState> {
    this.logger.log(`Using schema ${this.stateSchema}`);

    const forceRescan = this.processorConfigService.isRescan();
    const range = this.processorConfigService.getRange();

    this.logger.log({
      msg: 'Run processor service...',
      forceRescan: forceRescan || false,
      range: range,
    });

    if (forceRescan && !isNaN(range.from)) {
      try {
        // Set status height to range.from to rescan old blocks
        await this.dataSource.query(
          `UPDATE ${this.stateSchema}.status SET height = ${range.from} WHERE id = 0`,
        );

        this.logger.log({
          msg: 'Start rescan processor service...',
          forceRescan,
          ...this.processorConfigService.getAllParams(),
        });

        return [range.from, range.to];
      } catch (err) {
        this.logger.error(err);
        // First run, no schema yet
        this.sentry.instance().captureException(err);
      }
    } else {
      const status = await this.dataSource.query(
        `SELECT * FROM ${this.stateSchema}.status `,
      );

      this.logger.log({ status });

      const statusBlock = await this.dataSource.query(
        `SELECT block_number FROM "public".block ORDER BY block_number DESC LIMIT 1;`,
      );

      if (status[0].height <= 0) {
        await this.dataSource.query(
          `UPDATE ${this.stateSchema}.status SET height = 0 WHERE id = 0`,
        );
      }

      this.logger.log({
        msg: 'Start scan processor service...',
        statusScan: status[0].height,
        lastSavedBlock: statusBlock.block_number,
      });

      return [status[0].height];
    }
  }

  async updateState(block_number: number) {
    await this.dataSource.query(
      `UPDATE ${this.stateSchema}.status SET height = ${block_number} WHERE id = 0`,
    );
  }

  async connect(): Promise<void> {
    try {
      await this.connection.transaction('SERIALIZABLE', async (em) => {
        await em.query(`CREATE SCHEMA IF NOT EXISTS ${this.stateSchema}`);
        await em.query(`
                    CREATE TABLE IF NOT EXISTS ${this.stateSchema}.status (
                        id int primary key,
                        height int not null
                    )
                `);
        const status: { height: number }[] = await em.query(
          `SELECT height FROM ${this.stateSchema}.status WHERE id = 0`,
        );
        if (status.length == 0) {
          await em.query(
            `INSERT INTO ${this.stateSchema}.status (id, height) VALUES (0, 0)`,
          );
          return 0;
        } else {
          return status[0].height;
        }
      });
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await this.connection.destroy().catch(() => {}); // ignore error
      this.sentry.instance().captureException(e);
      throw e;
    }
  }
}
