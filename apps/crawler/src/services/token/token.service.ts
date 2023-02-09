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
import { ITokenEntities, Tokens, TokenType } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SdkService } from '../../sdk/sdk.service';
import {
  IBlockCommonData,
  ItemsBatchProcessingResult,
} from '../../subscribers/blocks.subscriber.service';
import { TokenNestingService } from './nesting.service';
import { TokenData, TokenOwnerData } from './token.types';
import { chunk } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.module';
import { CollectionService } from '../collection.service';
import { TokensOwners } from '@entities/TokensOwners';

@Injectable()
export class TokenService {
  constructor(
    private sdkService: SdkService,
    private nestingService: TokenNestingService,
    private collectionService: CollectionService,
    private configService: ConfigService<Config>,
    @InjectRepository(TokensOwners)
    private tokensOwnersRepository: Repository<TokensOwners>,
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
  ) {}

  async prepareDataForDb(
    tokenData: TokenData,
    blockHash: string,
    totalPieces: number,
    blockTimestamp?: number,
    needCheckNesting = false,
  ): Promise<Omit<Tokens, 'id'>> {
    let nestedType = false;
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

    //const tokenBalance = await this.sdkService.getRFTBalances();

    let tokenType =
      tokenDecoded.collection.mode === 'NFT' ? TokenType.NFT : TokenType.RFT;
    let parentId = null;

    if (nestingParentToken) {
      const { collectionId, tokenId } = nestingParentToken;
      parentId = `${collectionId}_${tokenId}`;
      nestedType = true;
    }

    const children: ITokenEntities[] = needCheckNesting
      ? await this.nestingService.handleNesting(
          tokenData,
          blockHash,
          blockTimestamp,
        )
      : token?.children ?? [];

    if (isBundle) {
      nestedType = true;
    }

    if (!children.length && !parentId) {
      tokenType =
        tokenDecoded.collection.mode === 'NFT' ? TokenType.NFT : TokenType.RFT;
    }
    const ownerCollection = owner || collectionOwner;
    return {
      token_id,
      collection_id,
      owner: ownerCollection,
      owner_normalized: normalizeSubstrateAddress(ownerCollection),
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
      total_pieces: totalPieces,
      nested: nestedType,
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
    let data = [];
    for (const chunk of eventChunks) {
      const result = await Promise.allSettled(
        chunk.map((event) => {
          const { section, method, values } = event;
          const { collectionId, tokenId } = values as unknown as {
            collectionId: number;
            tokenId: number;
          };

          const { blockHash, blockTimestamp, blockNumber } = blockCommonData;
          const eventName = `${section}.${method}`;

          if (
            eventName === 'Common.ItemCreated' ||
            eventName === 'Common.Transfer'
          ) {
            data = JSON.parse(event.data);
          }

          if (eventName === 'Common.ItemDestroyed') {
            data = JSON.parse(event.data);

            return this.update({
              blockNumber,
              collectionId,
              tokenId,
              eventName,
              blockTimestamp,
              blockHash,
              data,
            });
          }

          if (TOKEN_UPDATE_EVENTS.includes(eventName)) {
            return this.update({
              blockNumber,
              collectionId,
              tokenId,
              eventName,
              blockTimestamp,
              blockHash,
              data,
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
    blockNumber,
    collectionId,
    tokenId,
    eventName,
    blockTimestamp,
    blockHash,
    data,
  }: {
    blockNumber: number;
    collectionId: number;
    tokenId: number;
    eventName: string;
    blockTimestamp: number;
    blockHash: string;
    data: any;
  }): Promise<SubscriberAction> {
    const tokenData = await this.getTokenData(collectionId, tokenId, blockHash);

    let result;
    if (tokenData) {
      const { tokenDecoded } = tokenData;
      const needCheckNesting = eventName === EventName.TRANSFER;

      const pieces = await this.sdkService.getTotalPieces(
        tokenId,
        collectionId,
      );

      if (data.length != 0) {
        const typeMode = tokenDecoded.collection.mode;
        const tokenOwner: TokenOwnerData = {
          owner: tokenDecoded.owner || tokenDecoded.collection.owner,
          owner_normalized: normalizeSubstrateAddress(
            tokenDecoded.owner || tokenDecoded.collection.owner,
          ),
          collection_id: collectionId,
          token_id: tokenId,
          date_created: String(normalizeTimestamp(blockTimestamp)),
          amount: pieces.amount,
          type: typeMode === 'ReFungible' ? 'RFT' : typeMode,
          block_number: blockNumber,
        };

        await this.checkAndSaveOrUpdateTokenOwnerPart(tokenOwner);
      }

      const preparedData = await this.prepareDataForDb(
        tokenData,
        blockHash,
        pieces?.amount,
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

  private extractTokenEvents(events: Event[]) {
    return events.filter(({ section, method }) => {
      const eventName = `${section}.${method}`;
      return (
        TOKEN_UPDATE_EVENTS.includes(eventName) ||
        TOKEN_BURN_EVENTS.includes(eventName)
      );
    });
  }

  private async checkAndSaveOrUpdateTokenOwnerPart(tokenOwner: TokenOwnerData) {
    const ownerToken = await this.tokensOwnersRepository.findOne({
      where: {
        owner: tokenOwner.owner,
        collection_id: tokenOwner.collection_id,
        token_id: tokenOwner.token_id,
      },
    });

    if (ownerToken) {
      await this.tokensOwnersRepository.update(
        {
          owner: tokenOwner.owner,
          collection_id: tokenOwner.collection_id,
          token_id: tokenOwner.token_id,
        },
        {
          amount: tokenOwner.amount,
          block_number: tokenOwner.block_number,
          type: tokenOwner.type,
        },
      );
    } else {
      await this.tokensOwnersRepository.save(tokenOwner);
    }
  }
}
