import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventMethod, EventSection, SubscriberName } from '@common/constants';
import { Event } from '@entities/Event';
import { capitalize } from '@common/utils';
import { EventArgumentsService } from './event.arguments.service';
import { EvmService } from '../evm/evm.service';
import { TokenService } from '../token/token.service';
import { CollectionService } from '../collection.service';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.module';
import { EventEntity } from '@unique-nft/harvester/src/database/entities';

@Injectable()
export class EventService {
  private logCollection = new Logger('EventService_Collection');
  private logToken = new Logger('EventService_Token');
  constructor(
    private eventArgumentsService: EventArgumentsService,
    private evmService: EvmService,
    private tokenService: TokenService,
    private collectionService: CollectionService,
    private configService: ConfigService<Config>,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  private extractEventItemsNew(blockItems: any): EventEntity[] {
    return blockItems
      .map((item) => {
        return item.events as EventEntity;
      })
      .filter((v) => !!v)
      .flatMap((num) => num);
  }

  private async prepareDataForDbNew(
    eventItems,
    blockCommonData,
  ): Promise<Event[]> {
    return Promise.all(
      eventItems.map(async (event, num) => {
        const { block_number, timestamp } = blockCommonData;
        const section = capitalize(event.section);
        const method = capitalize(event.method);
        const eventName = `${section}.${method}`;
        const eventValues =
          await this.eventArgumentsService.processEventArgumentsNew(
            eventName,
            event.dataJson,
          );

        const amount = eventValues?.amount || null;
        return {
          block_number: String(block_number),
          event_index: num,
          section,
          method,
          phase: String(num),
          data: JSON.stringify(event.dataJson),
          values: eventValues,
          timestamp,
          amount, // todo: Remove this field and use from values?
          block_index: `${block_number}-${num}`,
        };
      }),
    );
  }

  async process(blockItems, blockCommonData): Promise<any> {
    const eventItems = this.extractEventItemsNew(blockItems);

    const events = await this.prepareDataForDbNew(eventItems, blockCommonData);

    const ethereumEvents = events.filter(
      ({ section, method }) =>
        section === EventSection.ETHEREUM && method === EventMethod.EXECUTED,
    );
    const speckEvents = events.filter(
      ({ section, method }) =>
        section === 'ParachainSystem' && method === 'ValidationFunctionApplied',
    );
    await this.evmService.parseEvents(
      ethereumEvents,
      blockCommonData.timestamp,
    );

    await this.eventsRepository.upsert(events, ['block_number', 'event_index']);

    const subscribersConfig = this.configService.get('subscribers');

    let collectionsResult = null;
    if (subscribersConfig[SubscriberName.COLLECTIONS]) {
      collectionsResult = await this.collectionService.batchProcess({
        events,
        blockCommonData,
      });
      if (
        collectionsResult.totalEvents >= 1 &&
        collectionsResult.rejected.length === 0
      ) {
        this.logCollection.log(
          `Save event collection: ${collectionsResult.collection.collectionId}`,
        );
      }
    }

    let tokensResult = null;
    if (subscribersConfig[SubscriberName.TOKENS]) {
      tokensResult = await this.tokenService.batchProcess({
        events,
        blockCommonData,
      });
      if (tokensResult.totalEvents >= 4) {
        this.logToken.log(
          `Save event in collection: ${tokensResult.collection} token: ${tokensResult.token}`,
        );
      }
    }

    return {
      speckHash: speckEvents.length === 1 ? blockCommonData.block_hash : null,
      collectionsResult,
      tokensResult,
      events,
    };
  }
}
