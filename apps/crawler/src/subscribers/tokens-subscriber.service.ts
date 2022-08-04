import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Tokens } from '@entities/Tokens';
import { SdkService } from '../sdk.service';
import { ProcessorService } from './processor.service';
import { EventName } from '@common/constants';
import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import ISubscriberService from './subscriber.interface';
import {
  TokenPropertiesResult,
  UniqueTokenDecoded,
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
    tokenDecoded: UniqueTokenDecoded | null;
    tokenProperties: TokenPropertiesResult | null;
  }> {
    const [tokenDecoded, tokenProperties] = await Promise.all([
      this.sdkService.getToken(collectionId, tokenId),
      null,
      // this.sdkService.getTokenProperties(collectionId, tokenId),
    ]);

    console.log(tokenDecoded);

    return {
      tokenDecoded,
      tokenProperties,
    };
  }

  prepareDataToWrite(sdkEntity: UniqueTokenDecoded) {
    const {
      tokenId: token_id,
      collectionId: collection_id,
      image,
      attributes,
      nestingParentToken,
    } = sdkEntity;

    const {
      owner: rawOwner,
    }: { owner: { Ethereum?: string; Substrate?: string } } = sdkEntity;

    const owner = rawOwner?.Ethereum || rawOwner?.Substrate;

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
      // todo: Find out what should we store here
      data: {
        image: image.fullUrl || image.ipfsCid,
        attributes: Array.from(Object.values(attributes)),
      },
      parent_id: parentId,
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

      const { tokenDecoded, tokenProperties } = await this.getTokenData(
        collectionId,
        tokenId,
      );

      console.log('tokenDecoded', tokenDecoded);
      console.log('tokenProperties', tokenProperties);

      if (tokenDecoded) {
        const dataToWrite = this.prepareDataToWrite(tokenDecoded);

        log.entity = dataToWrite;

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
