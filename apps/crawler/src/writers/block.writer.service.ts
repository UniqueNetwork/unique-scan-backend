import { EventName } from '@common/constants';
import { normalizeTimestamp } from '@common/utils';
import { Block } from '@entities/Block';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubstrateBlock } from '@subsquid/substrate-processor';
import { Repository } from 'typeorm';
import {
  IBlockItem,
  IItemCounts,
} from '../subscribers/blocks.subscriber.service';

@Injectable()
export class BlockWriterService {
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
        const name = item.event['name'];

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
  }) {
    const {
      specId,
      parentHash,
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
      spec_name: specName,
      spec_version: specVersion,
      timestamp: String(normalizeTimestamp(blockTimestamp)),

      // Item counts
      total_events: totalEvents,
      num_transfers: numTransfers,
      new_accounts: newAccounts,
      total_extrinsics: totalExtrinsics,

      // todo or not todo
      extrinsics_root: '',
      state_root: '',
      session_length: '0',
      total_issuance: '',
      need_rescan: false,
    };
  }

  async upsert({
    block,
    blockItems,
  }: {
    block: SubstrateBlock;
    blockItems: IBlockItem[];
  }): Promise<IItemCounts> {
    const itemCounts = this.collectItemCounts(blockItems);

    const blockData = this.prepareDataForDb({ block, itemCounts });

    await this.blocksRepository.upsert(blockData, ['block_number']);

    return itemCounts;
  }
}
