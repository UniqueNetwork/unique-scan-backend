import {
  EventMethod,
  EventName,
  EventSection,
  ExtrinsicMethod,
  ExtrinsicSection,
} from '@common/constants';
import {
  getAmount,
  normalizeSubstrateAddress,
  normalizeTimestamp,
} from '@common/utils';
import { Block } from '@entities/Block';
import { Event } from '@entities/Event';
import { Extrinsic } from '@entities/Extrinsic';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Prefix } from '@polkadot/util-crypto/types';
import {
  SubstrateBlock,
  SubstrateExtrinsic,
} from '@subsquid/substrate-processor';
import { Repository } from 'typeorm';
import { IBlockCommonData } from '../subscribers/blocks-subscriber.service';

interface IExtrinsicExtended extends SubstrateExtrinsic {
  name: string;
}

interface IBlockItem {
  kind: 'event' | 'call';
  name: string;
  event?: object;
  extrinsic?: object;
}

interface IEvent {
  name: string;
  extrinsic: SubstrateExtrinsic;
  indexInBlock: number;
  phase: string;
  args: { value?: string; amount?: string };
}

interface IExtrinsicRecipient {
  // Unique.transfer
  recipient?: { value: string };

  // Balances.transfer
  // Balances.transfer_all
  // Balances.transfer_keep_alive
  // Vesting.vested_transfer
  dest?: { value: string };
}

@Injectable()
export class BlockWriterService {
  constructor(
    @InjectRepository(Block)
    private blocksRepository: Repository<Block>,
  ) {}

  private prepare({
    block,
    blockItems,
  }: {
    block: SubstrateBlock;
    blockItems: IBlockItem[];
    blockCommonData: IBlockCommonData;
  }) {
    const { height: blockNumber, timestamp: blockTimestamp } = block;

    // Create block data to write
    const { specId, hash, parentHash } = block;
    const [specName, specVersion] = specId.split('@') as [string, number];

    return {
      block_number: blockNumber,
      block_hash: hash,
      parent_hash: parentHash,
      spec_name: specName,
      spec_version: specVersion,
      timestamp: String(normalizeTimestamp(blockTimestamp)),

      // events info
      total_events: eventsCount,
      num_transfers: numTransfers,
      new_accounts: newAccounts,

      // extrinsics info
      total_extrinsics: extrinsicsCount,

      // todo or not todo
      extrinsics_root: '',
      state_root: '',
      session_length: '0',
      total_issuance: '',
      need_rescan: false,
    };
  }

  private processExtrinsicItems(items: IBlockItem[]) {
    const extrinsics = items
      .filter(({ kind }) => kind === 'call')
      .map((item) => {
        const { name, extrinsic } = item;
        return { name, ...extrinsic } as IExtrinsicExtended;
      });

    return { count: extrinsics.length, extrinsics };
  }

  private processEventItems(items: IBlockItem[]) {
    const events = items
      .filter(({ kind }) => kind === 'event')
      .map((item) => item.event as IEvent);

    // Save 'amount' and 'fee' for extrinsic's events
    const extrinsicsValues = events.reduce((acc, curr) => {
      const { name, extrinsic, args } = curr;

      const extrinsicId = extrinsic?.id;
      if (!extrinsicId) {
        return acc;
      }

      const rawAmount =
        typeof args === 'string' ? args : args?.amount || args?.value;

      if (name === `${EventSection.BALANCES}.${EventMethod.TRANSFER}`) {
        // Save extrinsic amount
        acc[extrinsicId] = acc[extrinsicId] || {};
        acc[extrinsicId].amount = getAmount(rawAmount);
      } else if (name === `${EventSection.TREASURY}.${EventMethod.DEPOSIT}`) {
        // Save extrinsic fee
        acc[extrinsicId] = acc[extrinsicId] || {};
        acc[extrinsicId].fee = getAmount(rawAmount);
      } else {
        return acc;
      }

      return { ...acc };
    }, {});

    return {
      count: events.length,
      events,
      extrinsicsValues,
      numTransfers: events.filter(
        ({ name }) => name === EventName.BALANCES_TRANSFER,
      ).length,
      newAccounts: events.filter(
        ({ name }) => name === EventName.BALANCES_ENDOWED,
      ).length,
    };
  }

  async upsert({
    block,
    blockItems,
  }: {
    block: SubstrateBlock;
    items: IBlockItem[];
  }) {
    const { blockData, extrinsicsData, eventsData } = this.processBlockData({
      block,
      blockItems,
    });

    return this.blocksRepository.upsert(blockData, ['block_number']);
  }
}
