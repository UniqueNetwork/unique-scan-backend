import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EventMethod,
  EventSection,
  EVENT_ARGS_ACCOUNT_KEYS,
  SubscriberName,
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
import { EvmService } from '../evm/evm.service';
import { TokenService } from '../token/token.service';
import { CollectionService } from '../collection.service';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.module';
import * as console from 'console';

@Injectable()
export class EventService {
  constructor(
    private eventArgumentsService: EventArgumentsService,
    private evmService: EvmService,

    private tokenService: TokenService,

    private collectionService: CollectionService,

    private configService: ConfigService<Config>,

    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  private extractEventItems(blockItems: IBlockItem[]): IEvent[] {
    return blockItems
      .map((item) => {
        if (item.kind === 'event') {
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

    const ethereumEvents = events.filter(
      ({ section, method }) =>
        section === EventSection.ETHEREUM && method === EventMethod.EXECUTED,
    );

    await this.evmService.parseEvents(
      ethereumEvents,
      blockCommonData.blockTimestamp,
    );

    await this.eventsRepository.upsert(events, ['block_number', 'event_index']);

    const subscribersConfig = this.configService.get('subscribers');

    let collectionsResult = null;
    if (subscribersConfig[SubscriberName.COLLECTIONS]) {
      collectionsResult = await this.collectionService.batchProcess({
        events,
        blockCommonData,
      });
    }

    let tokensResult = null;
    if (subscribersConfig[SubscriberName.TOKENS]) {
      tokensResult = await this.tokenService.batchProcess({
        events,
        blockCommonData,
      });
    }

    return {
      events,
      collectionsResult,
      tokensResult,
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
