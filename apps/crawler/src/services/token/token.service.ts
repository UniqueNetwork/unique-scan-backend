import {
  EventName,
  SubscriberAction,
  TOKEN_BURN_EVENTS,
  TOKEN_UPDATE_EVENTS,
} from '@common/constants';
import {
  normalizeSubstrateAddress,
  normalizeTimestamp,
  sanitizePropertiesValues,
} from '@common/utils';
import { Event } from '@entities/Event';
import { Tokens, TokenType, ITokenEntities } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SdkService } from '../../sdk/sdk.service';
import {
  ItemsBatchProcessingResult,
  IBlockCommonData,
} from '../../subscribers/blocks.subscriber.service';
import { TokenNestingService } from './nesting.service';
import { TokenData } from './token.types';
import { chunk } from 'lodash';
import { CollectionMode } from '@unique-nft/substrate-client/tokens';

import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.module';
import { CollectionService } from '../collection.service';
@Injectable()
export class TokenService {
  constructor(
    private sdkService: SdkService,
    private nestingService: TokenNestingService,
    private collectionService: CollectionService,
    private configService: ConfigService<Config>,
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
  ) {}

  private async getTokenData(
    collectionId: number,
    tokenId: number,
    blockHash: string,
  ): Promise<TokenData | null> {
    let tokenDecoded = await this.sdkService.getToken(collectionId, tokenId);
    if (!tokenDecoded) {
      tokenDecoded = await this.sdkService.getToken(
        collectionId,
        tokenId,
        blockHash,
      );
    }

    if (!tokenDecoded) {
      return null;
    }

    // TODO: delete after rft support
    if (
      tokenDecoded.owner === '' ||
      tokenDecoded.collection.mode === CollectionMode.ReFungible
    ) {
      return null;
    }

    const [tokenProperties, isBundle] = await Promise.all([
      this.sdkService.getTokenProperties(collectionId, tokenId),
      this.sdkService.isTokenBundle(collectionId, tokenId),
    ]);

    return {
      tokenDecoded,
      tokenProperties,
      isBundle,
    };
  }

  async prepareDataForDb(
    tokenData: TokenData,
    blockHash: string,
    blockTimestamp?: number,
    needCheckNesting = false,
  ): Promise<Omit<Tokens, 'id'>> {
    const { tokenDecoded, tokenProperties, isBundle } = tokenData;

    const {
      tokenId: token_id,
      collectionId: collection_id,
      image,
      attributes,
      nestingParentToken,
      owner,
    } = tokenDecoded;

    const { owner: collectionOwner, tokenPrefix } = tokenDecoded.collection;

    const token = await this.tokensRepository.findOneBy({
      collection_id,
      token_id,
    });

    let tokenType = TokenType.NFT;
    let parentId = null;
    if (nestingParentToken) {
      const { collectionId, tokenId } = nestingParentToken;
      parentId = `${collectionId}_${tokenId}`;
      tokenType = TokenType.NESTED;
    }

    const children: ITokenEntities[] = needCheckNesting
      ? await this.nestingService.handleNesting(
          tokenData,
          blockHash,
          blockTimestamp,
        )
      : token?.children ?? [];

    if (isBundle) {
      tokenType = TokenType.NESTED;
    }

    if (!children.length && !parentId) {
      tokenType = TokenType.NFT;
    }

    return {
      token_id,
      collection_id,
      owner,
      owner_normalized: normalizeSubstrateAddress(owner),
      image,
      attributes,
      properties: tokenProperties.properties
        ? sanitizePropertiesValues(tokenProperties.properties)
        : [],
      parent_id: parentId,
      is_sold: owner !== collectionOwner,
      token_name: `${tokenPrefix} #${token_id}`,
      burned: token?.burned ?? false,
      type: tokenType,
      children,
      bundle_created: tokenType === TokenType.NFT ? null : undefined,
    };
  }

  async batchProcess({
    events,
    blockCommonData,
  }: {
    events: Event[];
    blockCommonData: IBlockCommonData;
  }): Promise<ItemsBatchProcessingResult> {
    const tokenEvents = this.extractTokenEvents(events);

    const eventChunks = chunk(
      tokenEvents,
      this.configService.get('scanTokensBatchSize'),
    );

    let rejected = [];
    for (const chunk of eventChunks) {
      const result = await Promise.allSettled(
        chunk.map((event) => {
          const { section, method, values } = event;
          const { collectionId, tokenId } = values as unknown as {
            collectionId: number;
            tokenId: number;
          };

          const { blockHash, blockTimestamp } = blockCommonData;
          const eventName = `${section}.${method}`;

          if (TOKEN_UPDATE_EVENTS.includes(eventName)) {
            return this.update({
              collectionId,
              tokenId,
              eventName,
              blockTimestamp,
              blockHash,
            });
          } else {
            return this.burn(collectionId, tokenId);
          }
        }),
      );

      // todo: Process rejected tokens again or maybe process sdk disconnect
      rejected = [
        ...rejected,
        ...result.filter(({ status }) => status === 'rejected'),
      ];
    }

    return {
      totalEvents: tokenEvents.length,
      rejected,
    };
  }

  async update({
    collectionId,
    tokenId,
    eventName,
    blockTimestamp,
    blockHash,
  }: {
    collectionId: number;
    tokenId: number;
    eventName: string;
    blockTimestamp: number;
    blockHash: string;
  }): Promise<SubscriberAction> {
    const tokenData = await this.getTokenData(collectionId, tokenId, blockHash);

    let result;

    if (tokenData) {
      const needCheckNesting = eventName === EventName.TRANSFER;
      const preparedData = await this.prepareDataForDb(
        tokenData,
        blockHash,
        blockTimestamp,
        needCheckNesting,
      );

      // Write token data into db
      await this.tokensRepository.upsert(
        {
          ...preparedData,
          date_of_creation:
            eventName === EventName.ITEM_CREATED
              ? normalizeTimestamp(blockTimestamp)
              : undefined,
        },
        ['collection_id', 'token_id'],
      );

      result = SubscriberAction.UPSERT;
    } else {
      // No entity returned from sdk. Most likely it was destroyed in a future block.
      await this.burn(collectionId, tokenId);

      result = SubscriberAction.DELETE;
    }

    return result;
  }

  async burn(collectionId: number, tokenId: number) {
    await this.nestingService.removeTokenFromParents(collectionId, tokenId);

    return this.tokensRepository.update(
      {
        collection_id: collectionId,
        token_id: tokenId,
      },
      {
        burned: true,
      },
    );
  }

  private extractTokenEvents(events: Event[]) {
    return events.filter(({ section, method }) => {
      const eventName = `${section}.${method}`;
      return (
        TOKEN_UPDATE_EVENTS.includes(eventName) ||
        TOKEN_BURN_EVENTS.includes(eventName)
      );
    });
  }
}
