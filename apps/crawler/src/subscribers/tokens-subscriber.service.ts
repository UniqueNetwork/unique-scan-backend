import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Tokens } from '@entities/Tokens';
import { SdkService } from '../sdk.service';
import { ProcessorService } from './processor.service';
import { EventName } from '@common/constants';
import {
  normalizeSubstrateAddress,
  normalizeTimestamp,
  sanitizePropertiesValues,
} from '@common/utils';
import ISubscriberService from './subscriber.interface';
import {
  CollectionInfoWithSchema,
  TokenPropertiesResult,
  TokenByIdResult,
} from '@unique-nft/sdk/tokens';

@Injectable()
export class TokensSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(TokensSubscriberService.name);

  constructor(
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
    private processorService: ProcessorService,
    private sdkService: SdkService,
  ) {}

  subscribe() {
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
  ): Promise<{
    tokenDecoded: TokenByIdResult | null;
    tokenProperties: TokenPropertiesResult | null;
    collection: CollectionInfoWithSchema | null;
  }> {
    const [tokenDecoded, tokenProperties, collection] = await Promise.all([
      this.sdkService.getToken(collectionId, tokenId),
      this.sdkService.getTokenProperties(collectionId, tokenId),
      this.sdkService.getCollection(collectionId),
    ]);

    return {
      tokenDecoded,
      tokenProperties,
      collection,
    };
  }

  prepareDataToWrite(
    tokenDecoded: TokenByIdResult,
    tokenProperties: TokenPropertiesResult,
    collection: CollectionInfoWithSchema,
  ) {
    const {
      tokenId: token_id,
      collectionId: collection_id,
      image,
      attributes,
      nestingParentToken,
      owner,
    } = tokenDecoded;

    const { owner: collectionOwner } = collection;

    let parentId = null;
    if (nestingParentToken) {
      const { collectionId, tokenId } = nestingParentToken;
      parentId = `${collectionId}_${tokenId}`;
    }

    return {
      token_id,
      collection_id,
      owner,
      owner_normalized: normalizeSubstrateAddress(owner),
      image,
      attributes,
      properties: tokenProperties
        ? sanitizePropertiesValues(tokenProperties)
        : [],
      parent_id: parentId,
      is_sold: owner !== collectionOwner,
    };
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

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

      const { tokenDecoded, tokenProperties, collection } =
        await this.getTokenData(collectionId, tokenId);

      if (tokenDecoded) {
        const dataToWrite = this.prepareDataToWrite(
          tokenDecoded,
          tokenProperties,
          collection,
        );

        log.entity = String(dataToWrite); // Just to know that data is not null

        // Write collection data into db
        await this.tokensRepository.upsert(
          {
            ...dataToWrite,
            date_of_creation:
              eventName === EventName.ITEM_CREATED
                ? normalizeTimestamp(blockTimestamp)
                : undefined,
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
