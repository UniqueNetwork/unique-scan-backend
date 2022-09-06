import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventMethod, EventName, EventSection } from '@common/constants';
import { Event } from '@entities/Event';
import { getAmount, normalizeTimestamp } from '@common/utils';
import {
  IBlockCommonData,
  IBlockItem,
  IEvent,
} from '../subscribers/blocks.subscriber.service';

@Injectable()
export class EventWriterService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  static extractEventItems(blockItems: IBlockItem[]): IEvent[] {
    return blockItems
      .map((item) => {
        if (item.kind == 'event') {
          return item.event as IEvent;
        }
        return null;
      })
      .filter((v) => !!v);
  }

  static extractRawAmountValue(
    args: string | { amount?: string; value?: string },
  ) {
    return typeof args === 'string' ? args : args?.amount || args?.value;
  }

  /**
   * Extracts address values from event arguments.
   *
   * We have different kinds of args formats and should process all of them:
   * - Common.CollectionCreated
   *   [number, number, "0x8eaxxx"]
   *
   * - Common.ItemCreated
   *   [number, number, {"__kind":"Substrate","value":"0x8eaxxx"}, "1"]
   *   [number, number, {"__kind":"Ethereum","value":"0x76xxx"}, "1"]
   *
   * - Common.Transfer
   *   [number, number, {"__kind":"Ethereum","value":"0xacxxx"},{"__kind":"Ethereum","value":"0x87xxx"}, "1"]
   *   [number, number, {"__kind":"Substrate","value":"0x7cxxx"},{"__kind":"Ethereum","value":"0xf8xxx"}, "10"]
   *
   * - Unique.CollectionAdminAdded
   *   [number, {"__kind":"Ethereum","value":"0x1bxxx"}]
   *   [number, {"__kind":"Substrate","value":"0x08xxx"}]
   *
   * - Unique.CollectionOwnedChanged
   *   [number,"0xf7xxx"]
   *
   * - Balances.Deposit
   *   {"amount":"88476999937090000","who":"0x6dxxx"} // Both formats possible
   *   ['0xb892xxxx', '7911651004843']
   *
   * - Balances.Endowed
   *   {"account":"0xacxxx","freeBalance":"100000000000000000000"}
   *
   * - Balances.Transfer
   *   {"amount":"1267650600228140924496766115376","from":"0x1cbxxx","to":"0x36xxx"}
   *
   * - Balances.Withdraw
   *   {"amount":"88476999937090000","who":"0x90xxx"} // Both formats possible
   *   ['0xb892xxxx', '7937051004605']
   *
   * - System.NewAccount
   *   {"amount":"88476999937090000","who":"0x90xxx"} // Both formats possible
   *   "0xc89axxx"
   *
   */
  static extractAddressValues(
    eventName: string,
    args: string | object | (string | number)[],
  ): string[] {
    const addresses = [];

    const argsObj = {} as {
      account?: string;
      from?: string;
      to?: string;
      who?: string;
    };

    // todo: EventName.APPROVED
    // todo: EventName.BALANCES_BALANCE_SET,
    // todo: EventName.BALANCES_RESERVED,
    // todo: EventName.BALANCES_UNRESERVED,
    // todo: EventName.ALLOW_LIST_ADDRESS_ADDED,
    // todo: EventName.COLLECTION_ADMIN_REMOVED,
    // todo: EventName.COLLECTION_SPONSOR_SET,
    // todo: EventName.SPONSORSHIP_CONFIRMED,

    // Convert array arguments into object format
    if (typeof args === 'string') {
      argsObj.account = args;
    } else if (Array.isArray(args)) {
      switch (eventName) {
        case EventName.BALANCES_WITHDRAW:
        case EventName.BALANCES_DEPOSIT:
          argsObj.account = args[0] as string;
          break;
        case EventName.COLLECTION_ADMIN_ADDED:
        case EventName.COLLECTION_OWNED_CHANGED:
          argsObj.account = args[1] as string;
          break;
        case EventName.COLLECTION_CREATED:
        case EventName.ITEM_CREATED:
          argsObj.account = args[2] as string;
          break;
        case EventName.TRANSFER:
          argsObj.from = args[2] as string;
          argsObj.to = args[3] as string;
      }
    } else {
      // Args are in object format already.
      Object.assign(argsObj, args);
    }

    // Process object formatted args.
    ['account', 'who', 'from', 'to'].forEach((k) => {
      const v = argsObj[k];
      if (v) {
        addresses.push(typeof v == 'string' ? v : v?.value);
      }
    });

    return addresses;
  }

  private prepareDataForDb({
    eventItems,
    blockCommonData,
  }: {
    eventItems: IEvent[];
    blockCommonData: IBlockCommonData;
  }): Event[] {
    return eventItems.map((event) => {
      const { name, indexInBlock, phase, extrinsic, args } = event;
      const { blockNumber, blockTimestamp } = blockCommonData;

      const [section, method] = name.split('.') as [EventSection, EventMethod];

      const rawAmount = EventWriterService.extractRawAmountValue(args);

      return {
        timestamp: String(normalizeTimestamp(blockTimestamp)),
        block_number: String(blockNumber),
        event_index: indexInBlock,
        block_index: `${blockNumber}-${
          extrinsic ? extrinsic.indexInBlock : ''
        }`,
        section,
        method,
        // todo: Make more clean connect to extrinsic
        phase:
          phase === 'ApplyExtrinsic' ? String(extrinsic.indexInBlock) : phase,
        data: JSON.stringify(args),
        amount: rawAmount ? getAmount(rawAmount) : null,
      };
    });
  }

  async upsert({
    blockItems,
    blockCommonData,
  }: {
    blockItems: IBlockItem[];
    blockCommonData: IBlockCommonData;
  }) {
    const eventItems = EventWriterService.extractEventItems(blockItems);

    const eventsData = this.prepareDataForDb({
      blockCommonData,
      eventItems,
    });

    return this.eventsRepository.upsert(eventsData, [
      'block_number',
      'event_index',
    ]);
  }
}
