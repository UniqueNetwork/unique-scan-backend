import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Tokens } from '@entities/Tokens';
import { SdkService } from '../sdk/sdk.service';
import { EventName } from '@common/constants';
import {
  normalizeSubstrateAddress,
  normalizeTimestamp,
  sanitizePropertiesValues,
} from '@common/utils';
import {
  CollectionInfoWithSchema,
  TokenPropertiesResult,
  TokenByIdResult,
} from '@unique-nft/sdk/tokens';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { ProcessorService } from './processor/processor.service';
import { ISubscriberService } from './subscribers.service';
import { TokenWriterService } from '../writers/token.writer.service';

@Injectable()
export class TokensSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(TokensSubscriberService.name);

  constructor(
    private sdkService: SdkService,

    private tokenWriterService: TokenWriterService,

    @InjectSentry()
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(TokensSubscriberService.name);
  }

  subscribe(processorService: ProcessorService) {
    [
      // Insert
      EventName.ITEM_CREATED,

      // Update
      EventName.TRANSFER,
      EventName.TOKEN_PROPERTY_SET,
      EventName.TOKEN_PROPERTY_DELETED,
    ].forEach((eventName) =>
      processorService.processor.addEventHandler(
        eventName,
        this.upsertHandler.bind(this),
      ),
    );

    processorService.processor.addEventHandler(
      EventName.ITEM_DESTROYED,
      this.destroyHandler.bind(this),
    );
  }

  /**
   * Extracts collection id and token id from archive event.
   */
  private extractCollectionAndTokenId(args: [number, number]): {
    collectionId: number;
    tokenId: number;
  } {
    const [collectionId, tokenId] = args;
    return {
      collectionId,
      tokenId,
    };
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
      block: { height: blockNumber },
      event: { name: eventName, args },
    } = ctx;

    const log = {
      eventName,
      blockNumber,
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
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
