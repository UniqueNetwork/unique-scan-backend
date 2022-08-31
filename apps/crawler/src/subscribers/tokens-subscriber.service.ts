import { Injectable, Logger } from '@nestjs/common';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { SdkService } from '../sdk/sdk.service';
import { EventName, SubscriberAction } from '@common/constants';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { ProcessorService } from './processor/processor.service';
import { ISubscriberService } from './subscribers.service';
import {
  ITokenData,
  TokenWriterService,
} from '../writers/token.writer.service';

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
  ): Promise<ITokenData> {
    const [tokenDecoded, tokenProperties, collectionDecoded] =
      await Promise.all([
        this.sdkService.getToken(collectionId, tokenId),
        this.sdkService.getTokenProperties(collectionId, tokenId),
        this.sdkService.getCollection(collectionId),
      ]);

    return {
      tokenDecoded,
      tokenProperties,
      collectionDecoded,
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
      collectionId: null as null | number,
      tokenId: null as null | number,
      action: null as null | SubscriberAction,
    };

    try {
      const { collectionId, tokenId } = this.extractCollectionAndTokenId(args);

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      if (tokenId === 0) {
        throw new Error('Bad tokenId');
      }

      const tokenData = await this.getTokenData(collectionId, tokenId);

      if (tokenData[0]) {
        await this.tokenWriterService.upsert({
          eventName,
          blockTimestamp,
          tokenData,
        });

        log.action = SubscriberAction.UPSERT;
      } else {
        // No entity returned from sdk. Most likely it was destroyed in a future block.

        // Delete db record
        await this.tokenWriterService.delete(collectionId, tokenId);

        log.action = SubscriberAction.DELETE;
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
      action: SubscriberAction.DELETE,
    };

    try {
      const { collectionId, tokenId } = this.extractCollectionAndTokenId(args);

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      // Delete db record
      await this.tokenWriterService.delete(collectionId, tokenId);

      this.logger.verbose({ ...log });
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
