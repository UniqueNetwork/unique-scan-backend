import { ScanProcessor } from './scan-processor';
import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Collections } from '@entities/Collections';
import { EventHandlerContext } from '@subsquid/substrate-processor';

@Injectable()
export class CollectionsProcessor extends ScanProcessor {
  private logger: Logger;
  constructor(
    @InjectRepository(Collections)
    private modelRepository: Repository<Collections>,
    connection: Connection,
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
