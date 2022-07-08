import { ScanProcessor } from './scan-processor';
import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tokens } from '@entities/Tokens';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { SdkService } from '../sdk.service';
import { EventName } from '@common/constants';
import { normalizeSubstrateAddress } from '@common/utils';

type TokenData =
  | {
      name: string;
      tokenPrefix: string;
      owner: string;
    }
  | object; // todo: remove me

@Injectable()
export class TokensProcessor extends ScanProcessor {
  private readonly logger = new Logger(TokensProcessor.name);

  constructor(
    @InjectRepository(Tokens)
    private modelRepository: Repository<Tokens>,
    protected connection: Connection,
    protected sdkService: SdkService,
  ) {
    super('tokens', connection, sdkService);

    // todo: Remove some items when models rework is done
    const EVENTS_TO_UPDATE = [
      // Insert
      EventName.ITEM_CREATED,

      // Update
      EventName.TRANSFER,

      // todo: Or maybe these events are reletad to collection?
      EventName.TOKEN_PROPERTY_SET,
      EventName.TOKEN_PROPERTY_DELETED,
    ];

    EVENTS_TO_UPDATE.forEach((eventName) =>
      this.addEventHandler(eventName, this.upsertHandler.bind(this)),
    );

    this.addEventHandler(
      EventName.ITEM_DESTROYED,
      this.destroyHandler.bind(this),
    );

    this.logger.log('Starting processor...');
  }

  private async getTokenData(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenData | null> {
    const result = await this.sdkService.getToken(collectionId, tokenId);

    return result ? result : null;
  }

  prepareDataToWrite(sdkEntity) {
    // console.log('sdkEntity', sdkEntity);

    const {
      id: token_id,
      collectionId: collection_id,
      owner,
      properties: { constData: data = {} } = {},
    } = sdkEntity;

    return {
      token_id,
      collection_id,
      owner,
      owner_normalized: normalizeSubstrateAddress(owner),
      data,
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
      tokenId: null as null | number,
    };

    try {
      const collectionId = params[0].value as number;
      const tokenId = params[1].value as number;

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      const tokenData = await this.getTokenData(collectionId, tokenId);

      if (tokenData) {
        const dataToWrite = this.prepareDataToWrite(tokenData);
        // console.log('dataToWrite', dataToWrite);

        log.entity = dataToWrite;

        // Write collection data into db
        await this.modelRepository.upsert(
          {
            ...dataToWrite,
            date_of_creation:
              eventName === EventName.ITEM_CREATED ? blockTimestamp : undefined,
          },
          ['collection_id', 'token_id'],
        );
      } else {
        log.entity = null;

        // todo: Delete db record
        // await this.modelRepository.delete(collectionId, tokenId);
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
      tokenId: null as null | number,
    };

    try {
      const collectionId = params[0].value as number;
      const tokenId = params[1].value as number;

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      this.logger.verbose({ ...log });

      // todo: Delete db record
      // await this.modelRepository.delete(collectionId);
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
      process.exit(1);
    }
  }
}
