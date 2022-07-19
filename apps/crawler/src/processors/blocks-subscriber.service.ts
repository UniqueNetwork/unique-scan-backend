import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { ProcessorService } from './processor.service';
import ISubscriberService from './subscriber.interface';
import { Block } from '@entities/Block';

@Injectable()
export class BlocksSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(BlocksSubscriberService.name);

  constructor(
    @InjectRepository(Block)
    private blocksRepository: Repository<Block>,
    private processorService: ProcessorService,
  ) {}

  subscribe() {
    this.processorService.processor.addPreHook(
      {
        data: {
          includeAllBlocks: true,
          items: true,
        },
      } as const,
      async (ctx) => {
        // console.log(ctx.block.height);
        // console.log(ctx.items);
      },
    );
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    // const { name: eventName, blockNumber, blockTimestamp, params } = ctx.event;

    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

    console.log('ctx', ctx);
    // console.log('ctx.event', ctx.event);
    // console.log('eventName', eventName);
    // console.log('args', args);

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      entity: null as null | object | string,
      collectionId: null as null | number,
      tokenId: null as null | number,
    };
  }
}
