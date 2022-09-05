import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventMethod, EventSection } from '@common/constants';
import { Event } from '@entities/Event';
import { getAmount, normalizeTimestamp } from '@common/utils';
import {
  IBlockCommonData,
  IBlockItem,
  IEvent,
} from '../subscribers/blocks-subscriber.service';

@Injectable()
export class EventWriterService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  private extractAmountRawValue(
    args: string | { amount?: string; value?: string },
  ) {
    return typeof args === 'string' ? args : args?.amount || args?.value;
  }

  private extractEventItems(blockItems: IBlockItem[]): IEvent[] {
    return blockItems
      .filter(({ kind }) => kind === 'event')
      .map((item) => item.event as IEvent);
  }

  private prepareDataForDb(
    events: IEvent[],
    blockCommonData: IBlockCommonData,
  ) {
    return events
      .map((event) => {
        const { name, indexInBlock, phase, extrinsic, args } = event;
        const { blockNumber, blockTimestamp } = blockCommonData;

        const [section, method] = name.split('.') as [
          EventSection,
          EventMethod,
        ];

        const rawAmount = this.extractAmountRawValue(args);

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
      })
      .filter((item) => !!item);
  }

  async upsert({
    blockItems,
    blockCommonData,
  }: {
    blockItems: IBlockItem[];
    blockCommonData: IBlockCommonData;
  }) {
    const eventItems = this.extractEventItems(blockItems);

    const eventsData = this.prepareDataForDb(eventItems, blockCommonData);

    return this.eventsRepository.upsert(eventsData, [
      'block_number',
      'event_index',
    ]);
  }
}
