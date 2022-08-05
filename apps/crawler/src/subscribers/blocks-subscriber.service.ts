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
import { Extrinsic } from '@entities/Extrinsic';
import { Event } from '@entities/Event';

const EVENT_TRANSFER = `${EventSection.BALANCES}.${EventMethod.TRANSFER}`;
const EVENT_ENDOWED = `${EventSection.BALANCES}.${EventMethod.ENDOWED}`;

const EXTRINSICS_TRANSFER_METHODS = [
  ExtrinsicMethod.TRANSFER,
  ExtrinsicMethod.TRANSFER_FROM,
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

interface IBlockCommonData {
  timestamp: number;
  blockNumber: number;
}

@Injectable()
export class BlocksSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(BlocksSubscriberService.name);

  constructor(
    @InjectRepository(Block)
    private blocksRepository: Repository<Block>,

    @InjectRepository(Extrinsic)
    private extrinsicsRepository: Repository<Extrinsic>,

    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,

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

    // Save 'amount' and 'fee' for extrinsic's events
    const extrinsicsValues = events.reduce((acc, curr) => {
      const { name, extrinsic, args } = curr;

      const extrinsicId = extrinsic?.id;
      if (!extrinsicId) {
        return acc;
      }

      const rawAmount = args?.amount || args?.value;

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
      numTransfers: events.filter(({ name }) => name === EVENT_TRANSFER).length,
      newAccounts: events.filter(({ name }) => name === EVENT_ENDOWED).length,
    };
  }

  private processContextData(block: SubstrateBlock, items: IBlockItem[]) {
    const processedEventsItems = this.processEventItems(items);

    const processedExtrinsicsItems = this.processExtrinsicItems(items);

    const { height: blockNumber, timestamp: rawTimestamp } = block;
    const timestamp = normalizeTimestamp(rawTimestamp);
    const blockCommonData = { blockNumber, timestamp } as IBlockCommonData;

    // Create extrinsics data to write
    const { extrinsicsValues } = processedEventsItems;
    const { extrinsics } = processedExtrinsicsItems;
    const extrinsicsDataToWrite = this.getExtrinsicsDataToWrite(
      extrinsics,
      extrinsicsValues,
      blockCommonData,
    );

    // Create events data to write
    const { events } = processedEventsItems;
    const eventsDataToWrite = this.getEventsDataToWrite(
      events,
      blockCommonData,
    );

    // Create block data to write
    const { specId, hash, parentHash } = block;
    const [specName, specVersion] = specId.split('@') as [string, number];

    const {
      count: eventsCount,
      numTransfers,
      newAccounts,
    } = processedEventsItems;

    const { count: extrinsicsCount } = processedExtrinsicsItems;

    const blockDataToWrite = {
      block_number: blockNumber,
      block_hash: hash,
      parent_hash: parentHash,
      spec_name: specName,
      spec_version: specVersion,
      timestamp: String(timestamp),

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

    return {
      blockData: blockDataToWrite,
      extrinsicsData: extrinsicsDataToWrite,
      eventsData: eventsDataToWrite,
    };
  }

  private getExtrinsicsDataToWrite(
    extrinsics: IExtrinsicExtended[],
    extrinsicsEventValues: {
      [key: string]: { amount?: string; fee?: string };
    },
    blockCommonData: IBlockCommonData,
  ) {
    return extrinsics
      .map((extrinsic) => {
        const { name } = extrinsic;
        const [section, method] = name.split('.') as [
          ExtrinsicSection,
          ExtrinsicMethod,
        ];

        let signer = null;
        const { signature } = extrinsic;
        if (signature) {
          ({
            address: { value: signer },
          } = signature);
        }

        const {
          call: { args },
        } = extrinsic;

        let toOwner = null;
        if (EXTRINSICS_TRANSFER_METHODS.includes(method)) {
          const recipientAddress = args as IExtrinsicRecipient;
          toOwner =
            recipientAddress?.recipient?.value || recipientAddress?.dest?.value;
        }

        const { id, hash, indexInBlock, success } = extrinsic;

        const { amount = '0', fee = '0' } = extrinsicsEventValues[id] || {};

        const { timestamp, blockNumber } = blockCommonData;

        return {
          timestamp: String(timestamp),
          block_number: String(blockNumber),
          block_index: `${blockNumber}-${indexInBlock}`,
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
          // todo: Do we realy need that data?
          args: JSON.stringify(args),
          amount,
          fee,
        };
      })
      .filter((item) => !!item);
  }

  private getEventsDataToWrite(
    events: IEvent[],
    blockCommonData: IBlockCommonData,
  ) {
    return events
      .map((event) => {
        const { name, indexInBlock, phase, extrinsic, args } = event;
        const { timestamp, blockNumber } = blockCommonData;

        const [section, method] = name.split('.') as [
          EventSection,
          EventMethod,
        ];

        const rawAmount = args?.amount || args?.value;

        return {
          timestamp: String(timestamp),
          block_number: String(blockNumber),
          event_index: indexInBlock,
          block_index: `${blockNumber}-${extrinsic.indexInBlock}`,
          section,
          method,
          // todo: Make more clean connect to extrinsic
          phase:
            phase === 'ApplyExtrinsic' ? String(extrinsic.indexInBlock) : phase,
          data: JSON.stringify(args),
          amount: rawAmount ? getAmount(rawAmount) : null,
        };
      })
      .filter((item) => !!item);
  }

  private async upsertHandler(ctx: BlockHandlerContext<Store>): Promise<void> {
    const { block, items } = ctx;

    const { height: blockNumber } = block;

    const log = {
      blockNumber,
    };

    try {
      const { blockData, extrinsicsData, eventsData } = this.processContextData(
        block,
        items,
      );

      await Promise.all([
        this.blocksRepository.upsert(blockData, ['block_number']),
        this.extrinsicsRepository.upsert(extrinsicsData, [
          'block_number',
          'extrinsic_index',
        ]),
        this.eventsRepository.upsert(eventsData, [
          'block_number',
          'event_index',
        ]),
      ]);

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
