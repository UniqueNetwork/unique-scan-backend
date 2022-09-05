import { Injectable, Logger } from '@nestjs/common';
import { Store } from '@subsquid/typeorm-store';
import {
  BlockHandlerContext,
  SubstrateExtrinsic,
} from '@subsquid/substrate-processor';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { ISubscriberService } from './subscribers.service';
import { Prefix } from '@unique-nft/api/.';
import { ProcessorService } from './processor/processor.service';
import {
  IBlockData,
  BlockWriterService,
} from '../writers/block.writer.service';
import { ExtrinsicWriterService } from '../writers/extrinsic.writer.service';
import { EventWriterService } from '../writers/event.writer.service';

export interface IBlockItem {
  kind: 'event' | 'call';
  name: string;
  event?: object;
  extrinsic?: object;
}

export interface IEvent {
  name: string;
  extrinsic: SubstrateExtrinsic;
  indexInBlock: number;
  phase: string;
  args: { value?: string; amount?: string };
}
export interface IBlockCommonData {
  blockNumber: number;
  blockTimestamp: number;
  ss58Prefix: Prefix;
}

@Injectable()
export class BlocksSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(BlocksSubscriberService.name);

  constructor(
    private blockWriterService: BlockWriterService,

    private extrinsicWriterService: ExtrinsicWriterService,

    private eventWriterService: EventWriterService,

    @InjectSentry()
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(BlocksSubscriberService.name);
  }

  subscribe(processorService: ProcessorService) {
    processorService.processor.addPreHook(
      {
        data: {
          includeAllBlocks: true,
          items: true,
        },
      } as const,
      this.upsertHandler.bind(this),
    );
  }

  private async upsertHandler(ctx: BlockHandlerContext<Store>): Promise<void> {
    const { block, items: blockItems } = ctx;
    const { height: blockNumber, timestamp: blockTimestamp } = block;

    const log = {
      blockNumber,
    };

    try {
      const ss58Prefix = ctx._chain?.getConstant(
        'System',
        'SS58Prefix',
      ) as Prefix;

      const blockCommonData = {
        blockNumber,
        blockTimestamp,
        ss58Prefix,
      } as IBlockCommonData;

      await Promise.all([
        this.eventWriterService.upsert({
          blockItems,
          blockCommonData,
        }),
        this.extrinsicWriterService.upsert({
          blockItems,
          blockCommonData,
        }),
        this.blockWriterService.upsert({
          block,
          blockItems,
        }),
      ]);

      // const { totalEvents, totalExtrinsics } = result;

      // this.logger.verbose({
      //   ...log,
      //   totalEvents,
      //   totalExtrinsics,
      // });
    } catch (error) {
      this.logger.error({ ...log, error: error.message || error });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
