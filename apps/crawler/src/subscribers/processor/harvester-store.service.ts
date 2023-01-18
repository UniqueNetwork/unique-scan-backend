import { Injectable, Logger } from '@nestjs/common';

import { Connection, DataSource } from 'typeorm';
import { ProcessorConfigService } from '../../config/processor.config.service';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { STATE_SCHEMA_NAME_BY_MODE } from '@common/constants';
import { StoreBaseService } from './store-base.service';
import * as console from 'console';

@Injectable()
export class HarvesterStoreService {
  private stateSchema;

  private stateDataSource;
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

    const db = new StoreBaseService({
      stateSchema: this.stateSchema,
      con: this.connection,
    });
    this.stateDataSource = db.connect();
  }

  async getState(forceRescan = false): Promise<any> {
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
        this.sentry.instance().captureException(err);
      }
    }
    const status = await this.dataSource.query(
      `SELECT * FROM ${this.stateSchema}.status `,
    );
    return status[0].height;
  }
}
