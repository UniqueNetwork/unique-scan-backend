import { ScanProcessor } from './scan-processor';
import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Collections } from '@entities/Collections';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { SdkService } from './sdk.service';

@Injectable()
export class CollectionsProcessor extends ScanProcessor {
  private logger: Logger;

  constructor(
    @InjectRepository(Collections)
    private modelRepository: Repository<Collections>,
    connection: Connection,
    private sdk: SdkService,
  ) {
    super('collections', connection);

    this.logger = new Logger('CollectionsProcessor');

    this.addEventHandler(
      'common.CollectionCreated',
      this.collectionCreatedHandler.bind(this),
    );

    this.addEventHandler(
      'common.CollectionDestroyed',
      this.сollectionDestroyedHandler.bind(this),
    );

    // todo: Update collection events handler. But first we need to know what fields do we have in db.
  }

  private async getCollectionData(collectionId) {
    const { name, tokenPrefix, owner } = await this.sdk.getCollection(
      collectionId as number,
    );

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

    const collectionId = params[0].value;

    const collectionData = await this.getCollectionData(collectionId);

    const result = {
      ...collectionData,
      collectionId,
      blockNumber,
      blockTimestamp,
    };

    this.logger.verbose({ msg: `Event '${name}' processing`, ...result });

    // todo: Write collection data into db
  }

  private async сollectionDestroyedHandler(
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
    // todo: Drop collection by id
  }
}
