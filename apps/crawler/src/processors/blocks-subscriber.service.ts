import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import {
  BlockHandlerContext,
  SubstrateBlock,
} from '@subsquid/substrate-processor';
import { ProcessorService } from './processor.service';
import ISubscriberService from './subscriber.interface';
import { Block } from '@entities/Block';
import { normalizeTimestamp } from '@common/utils';
import { EventMethod, EventSection } from '@common/constants';

const EVENT_TRANSFER = `${EventSection.BALANCES}.${EventMethod.TRANSFER}`;
const EVENT_ENDOWED = `${EventSection.BALANCES}.${EventMethod.ENDOWED}`;

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
      this.upsertHandler.bind(this),
    );
  }

  private getBlockData(
    block: SubstrateBlock,
    events: { name: string }[],
    extrinsics: object[],
  ) {
    const { height, hash, parentHash, specId, timestamp } = block;
    const [specName, specVersion] = specId.split('@') as [string, number];
    return {
      block_number: height,
      block_hash: hash,
      parent_hash: parentHash,
      spec_name: specName,
      spec_version: specVersion,
      total_events: events.length,
      num_transfers: events.filter(({ name }) => name === EVENT_TRANSFER)
        .length,
      new_accounts: events.filter(({ name }) => name === EVENT_ENDOWED).length,
      total_extrinsics: extrinsics.length,
      timestamp: String(normalizeTimestamp(timestamp)),

      // todo or not todo
      extrinsics_root: '',
      state_root: '',
      session_length: '0',
      total_issuance: '', // TODO: no need. may be
      need_rescan: false,
    };
  }

  private async upsertHandler(ctx: BlockHandlerContext<Store>): Promise<void> {
    // const { name: eventName, blockNumber, blockTimestamp, params } = ctx.event;

    const { block, items } = ctx;

    const { height: blockNumber } = block;

    const log = {
      blockNumber,
    };

    try {
      const events = items
        .filter(({ kind }) => kind === 'event')
        .map((item) => item['event']);

      const extrinsics = items
        .filter(({ kind }) => kind === 'call')
        .map((item) => {
          const { name, extrinsic } = item as {
            name: string;
            extrinsic: object;
          };
          return { name, ...extrinsic };
        });

      const blockData = this.getBlockData(block, events, extrinsics);

      await this.blocksRepository.upsert(blockData, ['block_number']);

      const { total_events: totalEvents, total_extrinsics: totalExtrinsics } =
        blockData;

      this.logger.verbose({
        ...log,
        totalEvents,
        totalExtrinsics,
      });
    } catch (error) {
      this.logger.error({ ...log, error: error.message || error });
    }
  }
}
