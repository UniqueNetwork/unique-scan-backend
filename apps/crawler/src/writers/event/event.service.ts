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
} from '../../subscribers/blocks.subscriber.service';
import { EventArgumentsService } from './event.arguments.service';

@Injectable()
export class EventService {
  constructor(
    private eventArgumentsService: EventArgumentsService,

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

  private prepareDataForDb({
    eventItems,
    blockCommonData,
  }: {
    eventItems: IEvent[];
    blockCommonData: IBlockCommonData;
  }): Event[] {
    return eventItems.map((event) => {
      const { name, indexInBlock, phase, extrinsic, args: rawArgs } = event;
      const { blockNumber, blockTimestamp } = blockCommonData;

      const [section, method] = name.split('.') as [EventSection, EventMethod];

      const argsNormalized = this.eventArgumentsService.getNormalizedArguments(
        name,
        rawArgs,
      );

      // todo: Получать amount из нормализованных аргументов
      const rawAmount = EventArgumentsService.extractRawAmountValue(rawArgs);

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
        data: JSON.stringify(rawArgs),
        args: JSON.stringify(argsNormalized), // todo: Add field into entity
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
    const eventItems = EventService.extractEventItems(blockItems);

    // console.log(
    //   'eventItems',
    //   eventItems
    //     .filter(({ name }) => ![EventName.EXTRINSIC_SUCCESS].includes(name))
    //     .map(({ name, args }) => ({
    //       name,
    //       args,
    //     })),
    // );

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
