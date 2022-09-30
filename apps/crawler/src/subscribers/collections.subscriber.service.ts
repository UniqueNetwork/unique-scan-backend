import { Injectable, Logger } from '@nestjs/common';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Store } from '@subsquid/typeorm-store';
import { EventName, SubscriberAction } from '@common/constants';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { CollectionService } from '../services/collection.service';
import { ProcessorService } from './processor/processor.service';
import { ISubscriberService } from './subscribers.service';

@Injectable()
export class CollectionsSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(CollectionsSubscriberService.name);

  constructor(
    private collectionService: CollectionService,
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

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: blockTimestamp, hash },
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

      log.action = await this.collectionService.update({
        collectionId,
        eventName,
        blockTimestamp,
      });

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
      action: SubscriberAction.DELETE,
    };

    try {
      const collectionId = this.extractCollectionId(args);

      log.collectionId = collectionId;

      await this.collectionService.burnCollection(collectionId);

      this.logger.verbose({ ...log });
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
