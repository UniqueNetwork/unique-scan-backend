import { EventName } from '@common/constants';
import { normalizeTimestamp } from '@common/utils';
import { Block } from '@entities/Block';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubstrateBlock } from '@subsquid/substrate-processor';
import { Repository } from 'typeorm';
import {
  IBlockDataContainer,
  IBlockItem,
  IItemCounts,
} from '../subscribers/blocks.subscriber.service';

@Injectable()
export class BlockService {
  constructor(
    @InjectRepository(Block)
    private blocksRepository: Repository<Block>,
  ) {}

  private collectItemCounts(blockItems: IBlockItem[]) {
    const itemCounts = {
      totalEvents: 0,
      totalExtrinsics: 0,
      numTransfers: 0,
      newAccounts: 0,
    };

    blockItems.forEach((item) => {
      const { kind } = item;

      if (kind === 'event') {
        // Event
        itemCounts.totalEvents += 1;

        const {
          event: { name },
        } = item;

        if (name === EventName.BALANCES_TRANSFER) {
          itemCounts.numTransfers += 1;
        } else if (name === EventName.BALANCES_ENDOWED) {
          itemCounts.newAccounts += 1;
        }
      } else {
        // Extrinsic
        itemCounts.totalExtrinsics += 1;
      }
    });

    return itemCounts;
  }

  private prepareDataForDb({
    block,
    itemCounts,
  }: {
    block: SubstrateBlock;
    itemCounts: IItemCounts;
  }): Block {
    const {
      specId,
      parentHash,
      stateRoot,
      extrinsicsRoot,
      hash: blockHash,
      height: blockNumber,
      timestamp: blockTimestamp,
    } = block;

    const [specName, specVersion] = specId.split('@') as [string, number];

    const { totalEvents, totalExtrinsics, numTransfers, newAccounts } =
      itemCounts;

    return {
      block_number: blockNumber,
      block_hash: blockHash,
      parent_hash: parentHash,
      extrinsics_root: extrinsicsRoot,
      state_root: stateRoot,
      spec_name: specName,
      spec_version: specVersion,
      timestamp: String(normalizeTimestamp(blockTimestamp)),

      // Item counts
      total_events: totalEvents,
      num_transfers: numTransfers,
      new_accounts: newAccounts,
      total_extrinsics: totalExtrinsics,
    };
  }

  async upsertNew(blockData): Promise<IBlockDataContainer> {
    await this.blocksRepository.upsert(blockData, ['block_number']);
    return blockData;
  }
}
