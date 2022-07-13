import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Event } from '@entities/Event';
import { EventName, EventPhase } from '@common/constants';
import { ScanProcessor } from './scan-processor';
import { UtilsService } from '@common/utils/utils.service';
import { ProcessorConfigService } from '../processor.config.service';

@Injectable()
export class EventProcessor {
  name = 'event';
  private logger: Logger;
  private processor: ScanProcessor;

  constructor(
    @InjectRepository(Event)
    private modelRepository: Repository<Event>,
    private utils: UtilsService,
    protected connection: Connection,
    private processorConfigService: ProcessorConfigService,
  ) {
    this.processor = new ScanProcessor(
      this.name,
      this.connection,
      processorConfigService.getDataSource(),
      processorConfigService.getRange(),
      processorConfigService.getTypesBundle(),
    );

    this.logger = new Logger('EventProcessor');

    Object.values(EventName).forEach((name) => {
      this.processor.addEventHandler(name, async (ctx) => {
        await this.upsertHandler(ctx, name);
      });
    });

    this.logger.log('Starting processor...');
  }

  private async upsertHandler(
    ctx: EventHandlerContext,
    eventName: string,
  ): Promise<void> {
    const { height, timestamp } = ctx.block;

    const log = {
      eventName,
      blockNumber: height,
      blockTimestamp: timestamp,
    };

    try {
      const data = this.getData(ctx);
      await this.modelRepository.upsert(data, ['block_number', 'event_index']);
      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  private getData(ctx: EventHandlerContext) {
    const { block, event } = ctx;

    const result = {
      block_number: event.blockNumber,
      event_index: event.indexInBlock,
      section: event.section,
      method: event.method,
      phase: event.extrinsic
        ? JSON.stringify({ applyExtrinsic: event.extrinsic.indexInBlock })
        : EventPhase.INITIALIZATION,
      data: JSON.stringify(event.params),
      timestamp: `${Math.floor(block.timestamp / 1000)}`,
      amount: '0',
      block_index: `${event.blockNumber}-${event.indexInBlock}`,
    };

    result.amount = this.utils.parseAmount(result);

    return result;
  }

  public run(): void {
    const params = this.processorConfigService.getAllParams();

    this.logger.log({
      msg: `Starting ${this.name} crawler...`,
      params,
    });

    this.processor.run();
  }
}
