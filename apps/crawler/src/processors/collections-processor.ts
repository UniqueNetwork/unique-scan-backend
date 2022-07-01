import { ScanProcessor } from './scan-processor';
import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Collections } from '@entities/Collections';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { SdkService } from '../sdk.service';

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

    this.addEventHandler(
      'common.CollectionCreated',
      this.collectionCreatedHandler.bind(this),
    );

    this.addEventHandler(
      'common.CollectionDestroyed',
      this.collectionDestroyedHandler.bind(this),
    );

    // todo: Add update collection events handler. But first we need to know what fields do we have in db.
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

  private async collectionCreatedHandler(
    ctx: EventHandlerContext,
  ): Promise<void> {
    const { name, blockNumber, blockTimestamp, params } = ctx.event;

    const log = {
      msg: `Event '${name}' processing`,
      blockNumber,
      blockTimestamp,
      entity: null as null | object,
      collectionId: null as null | number,
    };

    try {
      const collectionId = params[0].value;

      log.collectionId = collectionId as number;

      const collectionData = await this.getCollectionData(collectionId);

      if (collectionData) {
        log.entity = collectionData;

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

  private async collectionDestroyedHandler(
    ctx: EventHandlerContext,
  ): Promise<void> {
    const { name, blockNumber, blockTimestamp, params } = ctx.event;
    const collectionId = params[0].value;

    this.logger.verbose({
      msg: `Event '${name}' processing`,
      blockNumber,
      blockTimestamp,
      collectionId,
    });

    // todo: Delete db record
  }
}
