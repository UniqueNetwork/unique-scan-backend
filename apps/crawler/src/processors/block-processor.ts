import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EventHandlerContext,
  SubstrateBlock,
} from '@subsquid/substrate-processor';
import { Block } from '@entities/Block';
import { EventMethod, EventSection, ExtrinsicNames } from '@common/constants';
import { ScanProcessor } from './scan-processor';
import { SdkService } from '../sdk.service';

const TRANSFER = `${EventSection.BALANCES}.${EventMethod.TRANSFER}`;
const ENDOWED = `${EventSection.BALANCES}.${EventMethod.ENDOWED}`;

@Injectable()
export class BlockProcessor extends ScanProcessor {
  private logger: Logger;

  constructor(
    @InjectRepository(Block)
    private modelRepository: Repository<Block>,
    protected connection: Connection,
    protected sdkService: SdkService,
  ) {
    super('block', connection, sdkService);

    this.logger = new Logger('BlockProcessor');

    this.addExtrinsicHandler(ExtrinsicNames.TIMESTAMP_SET, async (ctx) => {
      await this.upsertHandler(ctx);
    });

    this.logger.log('Starting processor...');
  }

  private async upsertHandler(ctx: EventHandlerContext): Promise<void> {
    const { height, timestamp } = ctx.block;

    const log = {
      eventName: ExtrinsicNames.TIMESTAMP_SET,
      blockNumber: height,
      blockTimestamp: timestamp,
    };

    try {
      const blockData = await this.getBlockData(ctx.block);

      if (blockData) {
        await this.modelRepository.upsert(blockData, ['block_number']);
      }

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  private getBlockData(block: SubstrateBlock) {
    return {
      block_number: block.height,
      block_hash: block.hash,
      parent_hash: block.parentHash,
      extrinsics_root: block.extrinsicsRoot,
      state_root: block.stateRoot,
      session_length: '0',
      spec_name: block.runtimeVersion.specName,
      spec_version: block.runtimeVersion.specVersion,
      total_events: block.events.length,
      num_transfers: block.events.filter(({ name }) => name === TRANSFER)
        .length,
      new_accounts: block.events.filter(({ name }) => name === ENDOWED).length,
      total_issuance: 'block.total_issuance',
      timestamp: `${Math.floor(block.timestamp / 1000)}`,
      need_rescan: false,
      total_extrinsics: block.extrinsics.length,
    };
  }
}
