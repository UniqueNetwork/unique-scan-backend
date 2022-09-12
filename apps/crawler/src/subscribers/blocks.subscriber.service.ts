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
import { BlockWriterService } from '../writers/block.writer.service';
import { ExtrinsicService } from '../writers/extrinsic/extrinsic.service';
import { EventService } from '../writers/event/event.service';

export interface IEvent {
  name: string;
  extrinsic: SubstrateExtrinsic;
  indexInBlock: number;
  phase: string;
  args: { value?: string; amount?: string };
}

export type IBlockItem =
  | {
      kind: 'event';
      name: string;
      event: IEvent;
    }
  | {
      kind: 'call';
      name: string;
      extrinsic: SubstrateExtrinsic;
    };

export interface IBlockCommonData {
  blockNumber: number;
  blockTimestamp: number;
  ss58Prefix: Prefix;
}

export interface IItemCounts {
  totalEvents: number;
  totalExtrinsics: number;
  numTransfers: number;
  newAccounts: number;
}

@Injectable()
export class BlocksSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(BlocksSubscriberService.name);

  constructor(
    private blockWriterService: BlockWriterService,

    private extrinsicWriterService: ExtrinsicService,

    private eventService: EventService,

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
    const { block, items } = ctx;
    const { height: blockNumber, timestamp: blockTimestamp } = block;
    const blockItems = items as unknown as IBlockItem[];

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

      // Process events first to get event.values
      const eventsData = await this.eventService.upsert({
        blockCommonData,
        blockItems,
      });

      // todo: Process events first and get events values. Use event values in extrinsics for extrinsics amount, fee.
      // todo: Use Promise.allSettled() instead
      const [itemCounts] = await Promise.all([
        this.blockWriterService.upsert({
          block,
          blockItems,
        }),
        this.extrinsicWriterService.upsert({
          blockCommonData,
          blockItems,
          eventsData,
        }),
      ]);

      this.logger.verbose({
        ...log,
        ...itemCounts,
      });
    } catch (error) {
      this.logger.error({ ...log, error: error.message || error });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
