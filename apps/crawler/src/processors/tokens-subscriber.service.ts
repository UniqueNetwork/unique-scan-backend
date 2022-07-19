import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Tokens } from '@entities/Tokens';
import { SdkService } from '../sdk.service';
import { ProcessorService } from './processor.service';
import { TokenInfo } from '@unique-nft/sdk/types';
import { EventName } from '@common/constants';
import { normalizeSubstrateAddress, parseNestingAddress } from '@common/utils';

@Injectable()
export class TokensSubscriberService {
  private readonly logger = new Logger(TokensSubscriberService.name);

  constructor(
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
    private processorService: ProcessorService,
    private sdkService: SdkService,
  ) {
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
      this.processorService.processor.addEventHandler(
        eventName,
        this.upsertHandler.bind(this),
      ),
    );

    this.processorService.processor.addEventHandler(
      EventName.ITEM_DESTROYED,
      this.destroyHandler.bind(this),
    );
  }

  private async getTokenData(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenInfo | null> {
    const result = await this.sdkService.getToken(collectionId, tokenId);

    return result ? result : null;
  }

  prepareDataToWrite(sdkEntity) {
    const {
      id: token_id,
      collectionId: collection_id,
      owner,
      properties: { constData: data = {} } = {},
    } = sdkEntity;

    const parsedNestingAddress = parseNestingAddress(owner);
    const parent_id = parsedNestingAddress
      ? `${parsedNestingAddress.collectionId}_${parsedNestingAddress.tokenId}`
      : null;

    return {
      token_id,
      collection_id,
      owner,
      owner_normalized: normalizeSubstrateAddress(owner),
      data,
      parent_id,
    };
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    // const { name: eventName, blockNumber, blockTimestamp, params } = ctx.event;

    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

    // console.log('ctx.event', ctx.event);
    // console.log('eventName', eventName);
    // console.log('args', args);

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      entity: null as null | object | string,
      collectionId: null as null | number,
      tokenId: null as null | number,
    };

    try {
      const [collectionId, tokenId] = args as [number, number];

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      if (tokenId === 0) {
        throw new Error('Bad tokenId');
      }

      const tokenData = await this.getTokenData(collectionId, tokenId);

      if (tokenData) {
        const dataToWrite = this.prepareDataToWrite(tokenData);

        log.entity = dataToWrite;

        // Write collection data into db
        await this.tokensRepository.upsert(
          {
            ...dataToWrite,
            date_of_creation:
              eventName === EventName.ITEM_CREATED ? blockTimestamp : undefined,
          },
          ['collection_id', 'token_id'],
        );
      } else {
        // No entity returned from sdk. Most likely it was destroyed in a future block.
        log.entity = null;

        // Delete db record
        await this.tokensRepository.delete({
          collection_id: collectionId,
          token_id: tokenId,
        });
      }

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  private async destroyHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

    // console.log('ctx.event', ctx.event);
    // console.log('eventName', eventName);
    // console.log('args', args);

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      collectionId: null as null | number,
      tokenId: null as null | number,
    };

    try {
      const [collectionId, tokenId] = args as [number, number];

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      // Delete db record
      await this.tokensRepository.delete({
        collection_id: collectionId,
        token_id: tokenId,
      });

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }
}
