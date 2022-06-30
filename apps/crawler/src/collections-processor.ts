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
      this.collectionCreatedHandler,
    );

    this.addEventHandler(
      'common.CollectionDestroyed',
      this.сollectionDestroyedHandler,
    );

    // todo: Update collection events handler. But first we need to know what fields do we have in db.
  }

  private collectionCreatedHandler = async (
    ctx: EventHandlerContext,
  ): Promise<void> => {
    const { name, blockNumber, blockTimestamp, params } = ctx.event;
    this.logger.verbose({
      name,
      blockNumber,
      blockTimestamp,
      params,
    });

    const collectionId = params[0].value;

    const collectionData = await this.sdk.getCollection(collectionId as number);

    console.log(collectionData);

    // todo: Write collection data into db
  };

  private сollectionDestroyedHandler = async (
    ctx: EventHandlerContext,
  ): Promise<void> => {
    const { name, blockNumber, blockTimestamp, params } = ctx.event;
    this.logger.verbose({
      name,
      blockNumber,
      blockTimestamp,
      params,
    });

    // todo: Drop collection by id
  };
}
