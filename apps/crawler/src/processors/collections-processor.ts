import { ScanProcessor } from './scan-processor';
import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Collections } from '@entities/Collections';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { SdkService } from '../sdk.service';
import { EventName } from '@common/constants';

type CollectionData = {
  name: string;
  tokenPrefix: string;
  owner: string;
};

@Injectable()
export class CollectionsProcessor extends ScanProcessor {
  private logger: Logger;

  constructor(
    @InjectRepository(Collections)
    private modelRepository: Repository<Collections>,
    protected connection: Connection,
    protected sdkService: SdkService,
  ) {
    super('collections', connection, sdkService);

    this.logger = new Logger('CollectionsProcessor');

    // todo: Remove some items when models rework is done
    const EVENTS_TO_UPDATE_COLLECTION = [
      // Insert
      EventName.COLLECTION_CREATED,

      // Update
      EventName.COLLECTION_PROPERTY_SET,
      EventName.COLLECTION_PROPERTY_DELETED,
      EventName.PROPERTY_PERMISSION_SET,
      EventName.COLLECTION_SPONSOR_REMOVED,
      EventName.COLLECTION_ADMIN_ADDED,
      EventName.COLLECTION_ADMIN_REMOVED,
      EventName.COLLECTION_OWNED_CHANGED,
      EventName.SPONSORSHIP_CONFIRMED,
      // EventName.ALLOW_LIST_ADDRESS_ADDED, // todo: Too many events. Do we really need to process this event?
      EventName.ALLOW_LIST_ADDRESS_REMOVED,
      EventName.COLLECTION_LIMIT_SET,
      EventName.COLLECTION_SPONSOR_SET,

      // todo: debug
      // 'system.ExtrinsicSuccess',
    ];

    EVENTS_TO_UPDATE_COLLECTION.forEach((eventName) =>
      this.addEventHandler(eventName, this.upsertHandler.bind(this)),
    );

    this.addEventHandler(
      EventName.COLLECTION_DESTROYED,
      this.destroyHandler.bind(this),
    );

    this.logger.log('Starting processor...');
  }

  private async getCollectionData(
    collectionId: number,
  ): Promise<CollectionData | null> {
    const result = await this.sdkService.getCollection(collectionId as number);

    if (!result) {
      return null;
    }

    const { name, tokenPrefix, owner } = result;

    return {
      name,
      tokenPrefix,
      owner,
    };
  }

  private async upsertHandler(ctx: EventHandlerContext): Promise<void> {
    const { name: eventName, blockNumber, blockTimestamp, params } = ctx.event;

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      entity: null as null | object | string,
      collectionId: null as null | number,
    };

    try {
      const collectionId = params[0].value as number;

      log.collectionId = collectionId;

      const collectionData = await this.getCollectionData(collectionId);

      if (collectionData) {
        // todo: Do not log the full entity because now this object is too big
        log.entity = collectionData.name;

        // todo: Write collection data into db
      } else {
        log.entity = null;

        // todo: Delete db record
      }

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  private async destroyHandler(ctx: EventHandlerContext): Promise<void> {
    const { name: eventName, blockNumber, blockTimestamp, params } = ctx.event;

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      collectionId: null as null | number,
    };

    try {
      const collectionId = params[0].value as number;

      log.collectionId = collectionId;

      this.logger.verbose({ ...log });

      // todo: Delete db record
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
      process.exit(1);
    }
  }
}
