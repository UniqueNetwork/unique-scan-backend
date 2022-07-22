import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import {
  EventHandlerContext,
  SubstrateBlock,
} from '@subsquid/substrate-processor';
import { ProcessorService } from './processor.service';
import ISubscriberService from './subscriber.interface';
import { Block } from '@entities/Block';
import { normalizeTimestamp } from '@common/utils';
import { EventMethod, EventSection } from '@common/constants';

const TRANSFER = `${EventSection.BALANCES}.${EventMethod.TRANSFER}`;
const ENDOWED = `${EventSection.BALANCES}.${EventMethod.ENDOWED}`;

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
        console.log(ctx);
        console.log(ctx.items);

        const events = ctx.items
          .filter(({ kind }) => kind === 'event')
          .map((item) => item['event']);

        // const extrinsics = ctx.items
        //   .filter(({ kind }) => kind === 'call')
        //   .map((item) => {
        //     const { name, call, extrinsic } = item;
        //     return { name, ...extrinsic };
        //   });

        console.log('events', events);
      },
    );
  }

  private getBlockData(
    block: SubstrateBlock,
    events: { name: string }[],
    extrinsics: { name: string }[],
  ) {
    const { height, hash, parentHash, specId, timestamp } = block;
    const [specName, specVersion] = specId.split('@');
    return {
      block_number: height,
      block_hash: hash,
      parent_hash: parentHash,
      spec_name: specName,
      spec_version: specVersion,
      total_events: events.length,
      num_transfers: events.filter(({ name }) => name === TRANSFER).length,
      new_accounts: events.filter(({ name }) => name === ENDOWED).length,
      total_extrinsics: extrinsics.length,
      timestamp: normalizeTimestamp(timestamp),

      // todo
      extrinsics_root: '',
      state_root: '',
      session_length: '0',
      total_issuance: '', // TODO: no need. may be
      need_rescan: false,
    };
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
