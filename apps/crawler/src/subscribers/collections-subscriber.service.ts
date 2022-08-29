import { Injectable, Logger } from '@nestjs/common';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Store } from '@subsquid/typeorm-store';
import { EventName, SubscriberAction } from '@common/constants';
import {
  CollectionInfoWithSchema,
  CollectionLimits,
} from '@unique-nft/sdk/tokens';
import { SdkService } from '../sdk/sdk.service';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { CollectionWriterService } from '../writers/collection.writer.service';
import { ProcessorService } from './processor/processor.service';
import { ISubscriberService } from './subscribers.service';

@Injectable()
export class CollectionsSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(CollectionsSubscriberService.name);

  constructor(
    private sdkService: SdkService,

    private collectionWriterService: CollectionWriterService,

    @InjectSentry()
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(CollectionsSubscriberService.name);
  }

  subscribe(processorService: ProcessorService) {
    [
      EventName.COLLECTION_CREATED,
      EventName.COLLECTION_PROPERTY_SET,
      EventName.COLLECTION_PROPERTY_DELETED,
      EventName.PROPERTY_PERMISSION_SET,
      EventName.COLLECTION_SPONSOR_REMOVED,
      EventName.COLLECTION_OWNED_CHANGED,
      EventName.SPONSORSHIP_CONFIRMED,
      EventName.COLLECTION_LIMIT_SET,
      EventName.COLLECTION_SPONSOR_SET,
    ].forEach((eventName) =>
      processorService.processor.addEventHandler(
        eventName,
        this.upsertHandler.bind(this),
      ),
    );

    processorService.processor.addEventHandler(
      EventName.COLLECTION_DESTROYED,
      this.destroyHandler.bind(this),
    );
  }

  /**
   * Extracts collection id from archive event.
   */
  private extractCollectionId(args): number {
    return typeof args === 'number' ? args : (args[0] as number);
  }

  /**
   * Recieves collection data from sdk.
   */
  private async getCollectionData(
    collectionId: number,
  ): Promise<[CollectionInfoWithSchema | null, CollectionLimits | null]> {
    return Promise.all([
      this.sdkService.getCollection(collectionId),
      this.sdkService.getCollectionLimits(collectionId),
    ]);
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

    const log = {
      eventName,
      blockNumber,
      collectionId: null as null | number,
      action: null as null | SubscriberAction,
    };

    try {
      const collectionId = this.extractCollectionId(args);

      log.collectionId = collectionId;

      const collectionData = await this.getCollectionData(collectionId);

      if (collectionData[0]) {
        await this.collectionWriterService.upsert({
          eventName,
          blockTimestamp,
          collectionData,
        });

        log.action = SubscriberAction.UPSERT;
      } else {
        // No entity returned from sdk. Most likely it was destroyed in a future block.
        await this.collectionWriterService.delete(collectionId);

        log.action = SubscriberAction.DELETE;
      }

      this.logger.verbose({ ...log });
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }

  private async destroyHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber },
      event: { name: eventName, args },
    } = ctx;

    const log = {
      eventName,
      blockNumber,
      collectionId: null as null | number,
      action: null as null | SubscriberAction,
    };

    try {
      const collectionId = this.extractCollectionId(args);

      log.collectionId = collectionId;

      await this.collectionWriterService.delete(collectionId);

      log.action = SubscriberAction.DELETE;

      this.logger.verbose({ ...log });
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
