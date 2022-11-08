import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EventMethod,
  EventSection,
  EVENT_ARGS_ACCOUNT_KEYS,
} from '@common/constants';
import { Event } from '@entities/Event';
import { normalizeTimestamp } from '@common/utils';
import {
  EventsProcessingResult,
  IBlockCommonData,
  IBlockItem,
  IEvent,
} from '../../subscribers/blocks.subscriber.service';
import { EventArgumentsService } from './event.arguments.service';
import { EventArgs } from './event.types';
import { AccountRecord } from '../account/account.types';
import { TokenService } from '../token/token.service';

@Injectable()
export class EventService {
  constructor(
    private eventArgumentsService: EventArgumentsService,

    private tokenService: TokenService,
    // todo: CollectionsService

    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  private extractEventItems(blockItems: IBlockItem[]): IEvent[] {
    return blockItems
      .map((item) => {
        if (item.kind == 'event') {
          return item.event as IEvent;
        }
        return null;
      })
      .filter((v) => !!v);
  }

  private async prepareDataForDb({
    eventItems,
    blockCommonData,
  }: {
    eventItems: IEvent[];
    blockCommonData: IBlockCommonData;
  }): Promise<Event[]> {
    return Promise.all(
      eventItems.map(async (event) => {
        const {
          name: eventName,
          indexInBlock,
          phase,
          extrinsic,
          args: rawArgs,
        } = event;
        const { blockNumber, blockTimestamp } = blockCommonData;

        const [section, method] = eventName.split('.') as [
          EventSection,
          EventMethod,
        ];

        const eventValues =
          await this.eventArgumentsService.processEventArguments(
            eventName,
            rawArgs,
          );

        // todo: Remove when triggers start using event values
        const rawArgsObj = typeof rawArgs === 'object' ? rawArgs : [rawArgs];

        const amount = eventValues?.amount || null;

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
          data: JSON.stringify(rawArgsObj),
          values: eventValues,
          amount, // todo: Remove this field and use from values?
        };
      }),
    );
  }

  async process({
    blockItems,
    blockCommonData,
  }: {
    blockItems: IBlockItem[];
    blockCommonData: IBlockCommonData;
  }): Promise<EventsProcessingResult> {
    const eventItems = this.extractEventItems(blockItems);

    const events = await this.prepareDataForDb({
      blockCommonData,
      eventItems,
    });

    await this.eventsRepository.upsert(events, ['block_number', 'event_index']);

    const tokensProcessingResult = await this.tokenService.batchProcess({
      events,
      blockCommonData,
    });

    return {
      events,
      tokensProcessingResult,
    };
  }

  async processEventWithAccounts(
    eventName: string,
    rawArgs: EventArgs,
  ): Promise<AccountRecord[]> {
    const eventValues = await this.eventArgumentsService.processEventArguments(
      eventName,
      rawArgs,
    );

    const result = [];

    // Extract only accounts values.
    EVENT_ARGS_ACCOUNT_KEYS.forEach((k) => {
      if (eventValues[k]) {
        result.push(eventValues[k]);
      }
    });

    return result;
  }
}
