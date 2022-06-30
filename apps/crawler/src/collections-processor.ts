import { ScanProcessor } from './scan-processor';
import { Injectable } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Collections } from '@entities/Collections';
import {
  EventHandlerContext,
  ExtrinsicHandlerContext,
} from '@subsquid/substrate-processor';

@Injectable()
export class CollectionsProcessor extends ScanProcessor {
  constructor(
    @InjectRepository(Collections)
    private modelRepository: Repository<Collections>,
    connection: Connection,
  ) {
    super('collections', connection);

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
    const { blockNumber, blockTimestamp, params } = ctx.event;
    console.log(
      'collectionCreatedHandler',
      blockNumber,
      blockTimestamp,
      params,
    );
  };

  private сollectionDestroyedHandler = async (
    ctx: EventHandlerContext,
  ): Promise<void> => {
    const { blockNumber, blockTimestamp, params } = ctx.event;
    console.log(
      'сollectionDestroyedHandler',
      blockNumber,
      blockTimestamp,
      params,
    );
  };
}
