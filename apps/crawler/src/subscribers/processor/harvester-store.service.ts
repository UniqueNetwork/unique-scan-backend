import { Injectable, Logger } from '@nestjs/common';

import { Connection, DataSource } from 'typeorm';
import { ProcessorConfigService } from '../../config/processor.config.service';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { STATE_SCHEMA_NAME_BY_MODE } from '@common/constants';

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

  async getState(): Promise<any> {
    const forceRescan = this.processorConfigService.isRescan();
    this.logger.log({ msg: 'Run processor service...' });
    const range = this.processorConfigService.getRange();

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
        return Object.values(range);
      } catch (err) {
        // First run, no schema yet
        this.sentry.instance().captureException(err);
      }
    } else {
      const status = await this.dataSource.query(
        `SELECT * FROM ${this.stateSchema}.status `,
      );
      const statusBlock = await this.dataSource.query(
        `SELECT block_number FROM "public".block ORDER BY block_number DESC LIMIT 1;`,
      );
      if (status[0].height <= 0) {
        await this.dataSource.query(
          `UPDATE ${this.stateSchema}.status SET height = 1 WHERE id = 0`,
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
}
