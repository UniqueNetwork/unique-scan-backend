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
    ];

    EVENTS_TO_UPDATE_COLLECTION.forEach((eventName) =>
      this.addEventHandler(eventName, this.collectionUpsertHandler.bind(this)),
    );

    this.addEventHandler(
      EventName.COLLECTION_DESTROYED,
      this.collectionDestroyHandler.bind(this),
    );
  }

  private async getCollectionData(
    collectionId,
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

  private async collectionUpsertHandler(
    ctx: EventHandlerContext,
  ): Promise<void> {
    const { name, blockNumber, blockTimestamp, params } = ctx.event;

    const log = {
      msg: `collectionUpsertHandler() for '${name}' event`,
      blockNumber,
      blockTimestamp,
      entity: null as null | object | string,
      collectionId: null as null | number,
    };

    try {
      const collectionId = params[0].value;

      log.collectionId = collectionId as number;

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

  private async collectionDestroyHandler(
    ctx: EventHandlerContext,
  ): Promise<void> {
    const { name, blockNumber, blockTimestamp, params } = ctx.event;
    const collectionId = params[0].value;

    this.logger.verbose({
      msg: `collectionDestroyHandler() for '${name}' event`,
      blockNumber,
      blockTimestamp,
      collectionId,
    });

    // todo: Delete db record
  }
}
