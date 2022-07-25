import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import {
  BlockHandlerContext,
  SubstrateBlock,
  SubstrateExtrinsic,
} from '@subsquid/substrate-processor';
import { ProcessorService } from './processor.service';
import ISubscriberService from './subscriber.interface';
import { Block } from '@entities/Block';
import {
  getAmount,
  normalizeSubstrateAddress,
  normalizeTimestamp,
} from '@common/utils';
import {
  EventMethod,
  EventSection,
  ExtrinsicMethod,
  ExtrinsicSection,
} from '@common/constants';

const EVENT_TRANSFER = `${EventSection.BALANCES}.${EventMethod.TRANSFER}`;
const EVENT_ENDOWED = `${EventSection.BALANCES}.${EventMethod.ENDOWED}`;

const EXTRINSICS_SECTIONS_TO_SKIP = [
  ExtrinsicSection.PARACHAIN_SYSTEM,
  ExtrinsicSection.TIMESTAMP,
];

const EXTRINSICS_TRANSFER_METHODS = [
  ExtrinsicMethod.TRANSFER,
  ExtrinsicMethod.TRANSFER_ALL,
  ExtrinsicMethod.TRANSFER_KEEP_ALIVE,
  ExtrinsicMethod.VESTED_TRANSFER,
];
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

    // Save amount and fee for extrinsic's events
    const valuesByExtrinsics = events.reduce((acc, curr) => {
      const { name, extrinsic, args } = curr;

      const extrinsicId = extrinsic?.id;
      if (!extrinsicId) {
        return acc;
      }

      if (name === `${EventSection.BALANCES}.${EventMethod.TRANSFER}`) {
        // Save extrinsic amount
        acc[extrinsicId] = acc[extrinsicId] || {};
        acc[extrinsicId].amount = getAmount(args.amount);
      } else if (name === `${EventSection.TREASURY}.${EventMethod.DEPOSIT}`) {
        // Save extrinsic fee
        acc[extrinsicId] = acc[extrinsicId] || {};
        acc[extrinsicId].fee = getAmount(args.value);
      } else {
        return acc;
      }

      return { ...acc };
    }, {});

    return {
      count: events.length,
      events,
      valuesByExtrinsics,
      numTransfers: events.filter(({ name }) => name === EVENT_TRANSFER).length,
      newAccounts: events.filter(({ name }) => name === EVENT_ENDOWED).length,
    };
  }

  private processData(block: SubstrateBlock, items: IBlockItem[]) {
    const { height, hash, parentHash, specId, timestamp: rawTimestamp } = block;

    const timestamp = normalizeTimestamp(rawTimestamp);

    const processedEvents = this.processEventItems(items);

    const { valuesByExtrinsics } = processedEvents;

    const { extrinsics, count: extrinsicsCount } =
      this.processExtrinsicItems(items);

    const extrinsicsData = this.getExtrinsicsData(
      extrinsics,
      valuesByExtrinsics,
    ).map((item) => ({
      block_number: height,
      block_index: `${height}-${item.extrinsic_index}`, // todo: Do we need this field?
      timestamp,
      ...item,
    }));

    if (extrinsicsData.length) {
      console.log(extrinsicsData);
    }

    const [specName, specVersion] = specId.split('@') as [string, number];

    return {
      block_number: height,
      block_hash: hash,
      parent_hash: parentHash,
      spec_name: specName,
      spec_version: specVersion,
      timestamp: String(timestamp),

      // events info
      total_events: processedEvents.count,
      num_transfers: processedEvents.numTransfers,
      new_accounts: processedEvents.newAccounts,

      // extrinsics info
      total_extrinsics: extrinsicsCount,

      // todo or not todo
      extrinsics_root: '',
      state_root: '',
      session_length: '0',
      total_issuance: '', // TODO: no need. may be
      need_rescan: false,
    };
  }

  private getExtrinsicsData(
    extrinsics: IExtrinsicExtended[],
    valuesByExtrinsics: {
      [key: string]: { amount?: string; fee?: string };
    },
  ) {
    return extrinsics
      .map(
        ({
          id,
          name,
          hash,
          indexInBlock,
          success,
          call: { args },
          signature,
        }) => {
          const [section, method] = name.split('.') as [
            ExtrinsicSection,
            ExtrinsicMethod,
          ];

          // Skip processing common extrinsic types
          if (EXTRINSICS_SECTIONS_TO_SKIP.includes(section)) {
            return null;
          }

          let signer = null;
          if (signature) {
            ({
              address: { value: signer },
            } = signature);
          }

          let toOwner = null;
          if (EXTRINSICS_TRANSFER_METHODS.includes(method)) {
            const recipientAddress = args as IExtrinsicRecipient;
            toOwner =
              recipientAddress?.recipient?.value ||
              recipientAddress?.dest?.value;
          }

          const { amount = '0', fee = '0' } = valuesByExtrinsics[id] || {};

          return {
            extrinsic_index: indexInBlock,
            section,
            method,
            hash,
            success,
            is_signed: !!signature,
            signer,
            signer_normalized: signer && normalizeSubstrateAddress(signer),
            to_owner: toOwner,
            to_owner_normalized: toOwner && normalizeSubstrateAddress(toOwner),
            args: '', // JSON.stringify(args), // todo: Do we realy need that data? ,
            amount,
            fee,
          };
        },
      )
      .filter((item) => !!item);
  }

  private async upsertHandler(ctx: BlockHandlerContext<Store>): Promise<void> {
    const { block, items } = ctx;

    const { height: blockNumber } = block;

    const log = {
      blockNumber,
    };

    try {
      // Writing block model
      // @ts-ignore
      const blockData = this.processData(block, items);

      await this.blocksRepository.upsert(blockData, ['block_number']);

      // todo: Writing events models

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
