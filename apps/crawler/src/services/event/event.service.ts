import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EVENT_ARGS_ACCOUNT_KEYS,
  EventMethod,
  EventSection,
  SubscriberName,
} from '@common/constants';
import { Event } from '@entities/Event';
import { capitalize } from '@common/utils';
import { EventArgumentsService } from './event.arguments.service';
import { EvmService } from '../evm/evm.service';
import { TokenService } from '../token/token.service';
import { CollectionService } from '../collection.service';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.module';
import {
  BlockEntity,
  EventEntity,
} from '@unique-nft/harvester/src/database/entities';

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
    const arr = [];
    return blockItems
      .map((item) => {
        const event = [];
        for (const eva of item.events) {
          event.push({ ...eva, indexExtrinsics: item.index });
        }
        return event;
      })
      .filter((v) => !!v)
      .flatMap((num) => num);
  }

  private async prepareDataForDbNew(
    eventItems,
    block: BlockEntity,
  ): Promise<Event[]> {
    return Promise.all(
      eventItems.map(async (event, num) => {
        const section = capitalize(event.section);
        const method = capitalize(event.method);
        const eventName = `${section}.${method}`;

        const evenData = await this.eventArgumentsService.eventDataConverter(
          event.dataJson,
          eventName,
        );

        //console.dir({ eventName, evenData }, { depth: 3 });

        const amount = evenData?.values?.amount || null;
        return {
          block_number: String(block.id),
          event_index: num,
          section,
          method,
          phase: String(num),
          data: JSON.stringify(evenData.data) || JSON.stringify(event.dataJson),
          values: evenData.values || null,
          timestamp: block.timestamp.getTime(),
          amount, // todo: Remove this field and use from values?
          block_index: `${block.id}-${event.indexExtrinsics}`,
        };
      }),
    );
  }

  async extractEventsFromBlock(block: BlockEntity): Promise<Event[]> {
    const eventItems = this.extractEventItemsNew(block.extrinsics);
    return await this.prepareDataForDbNew(eventItems, block);
  }

  async upsert(events: Event[]): Promise<void> {
    await this.eventsRepository.upsert(events, ['block_number', 'event_index']);
  }

  async process(block: BlockEntity): Promise<any> {
    const events = await this.extractEventsFromBlock(block);

    const ethereumEvents = events.filter(
      ({ section, method }) =>
        section === EventSection.ETHEREUM && method === EventMethod.EXECUTED,
    );
    const speckEvents = events.filter(
      ({ section, method }) =>
        section === 'ParachainSystem' && method === 'ValidationFunctionApplied',
    );

    // this.evmService.parseEvents(
    //   ethereumEvents,
    //   block.timestamp.getTime(),
    // ).then(); // todo понять нужны ли вообще. оооочень долго отрабатывает (2 минуты)

    await this.upsert(events);

    const subscribersConfig = this.configService.get('subscribers');

    let collectionsResult = null;
    if (subscribersConfig[SubscriberName.COLLECTIONS]) {
      collectionsResult = await this.collectionService.batchProcess({
        events,
        blockCommonData: {
          block_hash: block.hash,
          timestamp: block.timestamp.getTime(),
        },
      });
      if (
        collectionsResult.totalEvents >= 1 &&
        collectionsResult.rejected.length === 0 &&
        collectionsResult.collection.collectionId === undefined
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
        blockCommonData: {
          block_hash: block.hash,
          block_number: block.id,
          timestamp: block.timestamp.getTime(),
        },
      });
      if (tokensResult.totalEvents >= 4) {
        this.logToken.log(
          `Save event in collection: ${tokensResult.collection} token: ${tokensResult.token}`,
        );
      }
    }

    return {
      speckHash: speckEvents.length === 1 ? block.hash : null,
      collectionsResult,
      tokensResult,
      events,
    };
  }
}
