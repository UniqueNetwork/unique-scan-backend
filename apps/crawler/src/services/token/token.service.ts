import {
  EventName,
  SubscriberAction,
  TOKEN_BURN_EVENTS,
  TOKEN_UPDATE_EVENTS,
} from '@common/constants';
import {
  getParentCollectionAndToken,
  normalizeSubstrateAddress,
  normalizeTimestamp,
  sanitizePropertiesValues,
} from '@common/utils';
import { Event } from '@entities/Event';
import { ITokenEntities, Tokens, TokenType } from '@entities/Tokens';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TokenNestingService } from './nesting.service';
import { TokenData, TokenOwnerData } from './token.types';
import { chunk } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.module';
import { CollectionService } from '../collection.service';
import { TokensOwners } from '@entities/TokensOwners';
import { yellow } from '@nestjs/common/utils/cli-colors.util';
import { SdkService } from '@common/sdk/sdk.service';
import { Attribute } from '@common/entities';
import { encodeV2AttributesAsV1 } from './utils';

const tryGetNormalizedAddress = (data: any[], index: number) => {
  const field = data[index];
  const address = field?.substrate || field?.ethereum || field?.value;

  if (!address) {
    throw new Error(
      `Address not found in ${JSON.stringify(data)} at index ${index}`
    );
  }

  return normalizeSubstrateAddress(address);
};

@Injectable()
export class TokenService {
  private logger = new Logger(TokenService.name);
  constructor(
    private sdkService: SdkService,
    private nestingService: TokenNestingService,
    private collectionService: CollectionService,
    private configService: ConfigService<Config>,
    @InjectRepository(TokensOwners)
    private tokensOwnersRepository: Repository<TokensOwners>,
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
    @InjectRepository(Attribute)
    private attributeRepository: Repository<Attribute>
  ) {}

  async prepareDataForDb(
    tokenData: TokenData,
    blockHash: string,
    totalPieces: number,
    blockTimestamp?: number,
    needCheckNesting = false
  ): Promise<Omit<Tokens, 'id' | 'attributes'>> {
    let nested = false;
    const { tokenDecoded, tokenDecodedV2, tokenProperties, isBundle } =
      tokenData;

    const {
      tokenId: token_id,
      collectionId: collection_id,
      nestingParentToken,
      owner,
    } = tokenDecoded;

    let attributes_v1 = tokenDecoded.attributes;

    if (
      Object.keys(attributes_v1).length === 0 &&
      tokenDecodedV2.attributes.length
    ) {
      try {
        attributes_v1 = encodeV2AttributesAsV1(tokenDecodedV2.attributes);
      } catch (error) {
        this.logger.error(error);
      }
    }

    const image_v1 = tokenDecoded.image;
    if (!image_v1.fullUrl && tokenDecodedV2?.image)
      image_v1.fullUrl = tokenDecodedV2.image;

    const { owner: collectionOwner, tokenPrefix } = tokenDecoded.collection;

    const token = await this.tokensRepository.findOneBy({
      collection_id,
      token_id,
    });

    let tokenType =
      tokenDecoded.collection.mode === 'NFT' ? TokenType.NFT : TokenType.RFT;
    let parentId = null;

    if (nestingParentToken) {
      const { collectionId, tokenId } = nestingParentToken;
      parentId = `${collectionId}_${tokenId}`;
      nested = true;
    }

    const children: ITokenEntities[] = needCheckNesting
      ? await this.nestingService.handleNesting(
          tokenData,
          blockHash,
          blockTimestamp
        )
      : token?.children ?? [];

    if (isBundle) nested = true;

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
      image_v1,
      image: tokenDecodedV2?.image || null,
      attributes_v1,
      properties: tokenProperties.properties
        ? sanitizePropertiesValues(tokenProperties.properties)
        : [],
      parent_id: parentId,
      is_sold: owner !== collectionOwner,
      token_name: `${tokenPrefix} #${token_id}`,
      burned: false,
      type: tokenType,
      children,
      bundle_created: tokenType === TokenType.NFT ? null : undefined,
      total_pieces: totalPieces,
      nested,
      schema_v2: tokenDecodedV2 || null,
    };
  }

  async batchProcess({
    events,
    blockCommonData,
  }: {
    events: Event[];
    blockCommonData: {
      block_hash: string;
      block_number: number;
      timestamp: number;
    };
  }): Promise<any> {
    const tokenEventsRaw = this.extractTokenEvents(events);

    const same = {};
    const tokenEvents = [];
    tokenEventsRaw.forEach((event) => {
      const { section, method, values } = event;
      const { collectionId, tokenId } = values as unknown as {
        collectionId: number;
        tokenId: number;
      };
      const hash = `${section}${method}${collectionId}${tokenId}`;
      if (!same[hash]) {
        tokenEvents.push(event);
      }
      same[hash] = true;
    });

    const eventChunks = chunk(
      tokenEvents,
      this.configService.get('scanTokensBatchSize')
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

          const { block_hash, timestamp, block_number } = blockCommonData;
          const eventName = `${section}.${method}`;

          if (eventName === 'Common.ItemCreated') {
            data = JSON.parse(event.data);
          }

          if (eventName === 'Common.ItemDestroyed') {
            data = JSON.parse(event.data);

            return this.update({
              blockNumber: block_number,
              collectionId,
              tokenId,
              eventName,
              blockTimestamp: timestamp,
              blockHash: block_hash,
              data,
            });
          }

          if (TOKEN_UPDATE_EVENTS.includes(eventName)) {
            if (eventName === 'Common.Transfer') {
              data = JSON.parse(event.data);
            }
            return this.update({
              blockNumber: block_number,
              collectionId,
              tokenId,
              eventName,
              blockTimestamp: timestamp,
              blockHash: block_hash,
              data,
            });
          } else {
            return this.burn(collectionId, tokenId);
          }
        })
      );

      // todo: Process rejected tokens again or maybe process sdk disconnect
      rejected = [
        ...rejected,
        ...result.filter(({ status }) => status === 'rejected'),
      ];
    }

    return {
      totalEvents: tokenEvents.length,
      collection: data.length >= 4 ? data[0] : null,
      token: data.length >= 4 ? data[1] : null,
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
    if (tokenId === 0) {
      return;
    }
    const tokenData = await this.getTokenData(collectionId, tokenId, blockHash);

    let result;
    if (tokenData) {
      // create or update token and token owners
      const { tokenDecoded, tokenDecodedV2 } = tokenData;
      const needCheckNesting = eventName === EventName.TRANSFER;

      let pieces = 1;
      if (tokenDecoded.collection.mode !== 'NFT') {
        pieces = (
          await this.sdkService.getTotalPieces(tokenId, collectionId, blockHash)
        ).amount;
      }

      const dbTokenEntity = await this.prepareDataForDb(
        tokenData,
        blockHash,
        pieces,
        blockTimestamp,
        needCheckNesting
      );

      if (data.length != 0) {
        const typeMode =
          tokenDecoded.collection.mode === 'ReFungible'
            ? 'RFT'
            : tokenDecoded.collection.mode;

        switch (tokenDecoded.collection.mode) {
          case 'NFT':
            await this.saveNFTOwnerToken(
              tokenDecoded,
              collectionId,
              tokenId,
              blockNumber,
              blockTimestamp,
              dbTokenEntity,
              typeMode,
              eventName
            );

            break;
          case 'ReFungible':
            await this.saveReFungibleOwnerToken(
              collectionId,
              tokenId,
              blockNumber,
              blockHash,
              data,
              dbTokenEntity,
              typeMode,
              eventName,
              blockTimestamp
            );
            break;
        }
      }

      // Write token data into db

      if (eventName === EventName.ITEM_CREATED) {
        dbTokenEntity.date_of_creation = normalizeTimestamp(blockTimestamp);
        dbTokenEntity.created_at_block_hash = blockHash;
        dbTokenEntity.created_at_block_number = blockNumber;
        dbTokenEntity.updated_at_block_hash = blockHash;
        dbTokenEntity.updated_at_block_number = blockNumber;
      } else {
        dbTokenEntity.updated_at_block_hash = blockHash;
        dbTokenEntity.updated_at_block_number = blockNumber;
      }

      const existingToken = await this.tokensRepository.findOne({
        where: {
          token_id: dbTokenEntity.token_id,
          collection_id: dbTokenEntity.collection_id,
        },
      });

      if (existingToken) {
        await this.tokensRepository.update(
          {
            id: existingToken.id,
          },
          dbTokenEntity
        );

        await this.attributeRepository.delete({
          collection_id: collectionId,
          token_id: tokenId,
        });
      } else {
        await this.tokensRepository.insert(dbTokenEntity);
      }

      await this.attributeRepository.insert(
        tokenDecodedV2.attributes.map((a) =>
          Attribute.fromIV2Attribute(a, { collectionId, tokenId })
        )
      );

      result = SubscriberAction.UPSERT;
    } else {
      // burn token and update token owners
      const ownerToken = tryGetNormalizedAddress(data, 2);

      await this.burnTokenOwnerPart({
        collection_id: collectionId,
        token_id: tokenId,
        owner: ownerToken,
        owner_normalized: ownerToken,
        block_number: blockNumber,
      });

      const pieceToken = await this.sdkService.getRFTBalances({
        address: ownerToken,
        collectionId: collectionId,
        tokenId: tokenId,
      });

      if (pieceToken.amount === 0) {
        this.logger.error(
          `Destroy token full amount: ${pieceToken.amount} / collection: ${collectionId} / token: ${tokenId}`
        );
        // No entity returned from sdk. Most likely it was destroyed in a future block.
        await this.burn(collectionId, tokenId);
        result = SubscriberAction.DELETE;
      }
    }

    return result;
  }

  private async saveReFungibleOwnerToken(
    collectionId,
    tokenId,
    blockNumber,
    blockHash,
    data,
    preparedData,
    typeMode,
    eventName,
    blockTimestamp
  ) {
    const arrayToken = [];

    await this.tokensRepository.update(
      {
        collection_id: collectionId,
        token_id: tokenId,
      },
      {
        burned: false,
      }
    );

    const ownerAddress = tryGetNormalizedAddress(data, 2);

    const pieceFrom = await this.sdkService.getRFTBalances(
      {
        address: ownerAddress,
        collectionId: collectionId,
        tokenId: tokenId,
      },
      blockHash
    );
    arrayToken.push({
      owner: ownerAddress,
      owner_normalized: ownerAddress,
      collection_id: collectionId,
      token_id: tokenId,
      date_created: String(normalizeTimestamp(blockTimestamp)),
      amount: pieceFrom.amount,
      type: preparedData.type || typeMode,
      block_number: blockNumber,
      parent_id: preparedData.parent_id,
      children: preparedData.children,
    });
    if (data.length === 5) {
      const owner = tryGetNormalizedAddress(data, 3);
      const pieceTo = await this.sdkService.getRFTBalances(
        {
          address: owner,
          collectionId: collectionId,
          tokenId: tokenId,
        },
        blockHash
      );
      let parentId = null;
      let nested = false;
      const toNestedAddress = getParentCollectionAndToken(owner);
      if (toNestedAddress) {
        parentId = `${toNestedAddress.collectionId}_${toNestedAddress.tokenId}`;
        nested = true;
      }
      arrayToken.push({
        owner: owner,
        owner_normalized: owner,
        collection_id: collectionId,
        token_id: tokenId,
        date_created: String(normalizeTimestamp(blockTimestamp)),
        amount: pieceTo.amount,
        type: preparedData.type || typeMode,
        block_number: blockNumber,
        parent_id: parentId,
        children: preparedData.children,
        nested: nested,
      });
    }

    for (const tokenOwnerData of arrayToken) {
      if (tokenOwnerData.amount === 0) {
        await this.tokensOwnersRepository.delete({
          collection_id: tokenOwnerData.collection_id,
          token_id: tokenOwnerData.token_id,
          owner: tokenOwnerData.owner,
        });
      } else {
        await this.tokensOwnersRepository.upsert({ ...tokenOwnerData }, [
          'collection_id',
          'token_id',
          'owner',
        ]);
        this.logger.log(
          `${eventName} token: ${tokenOwnerData.token_id} collection:` +
            ` ${tokenOwnerData.collection_id} in ${tokenOwnerData.block_number}`
        );
      }
    }
  }

  private async saveNFTOwnerToken(
    tokenDecoded,
    collectionId,
    tokenId,
    blockNumber,
    blockTimestamp,
    preparedData,
    typeMode,
    eventName
  ) {
    const tokenOwner: TokenOwnerData = {
      owner: tokenDecoded.owner || tokenDecoded.collection.owner,
      owner_normalized: normalizeSubstrateAddress(
        tokenDecoded.owner || tokenDecoded.collection.owner
      ),
      collection_id: collectionId,
      token_id: tokenId,
      date_created: String(normalizeTimestamp(blockTimestamp)),
      amount: 1,
      type: preparedData.type || typeMode,
      block_number: blockNumber,
      parent_id: preparedData.parent_id,
      children: preparedData.children,
    };
    await this.tokensOwnersRepository.delete({
      collection_id: collectionId,
      token_id: tokenId,
    });
    await this.tokensOwnersRepository.upsert({ ...tokenOwner }, [
      'collection_id',
      'token_id',
      'owner',
    ]);
    this.logger.log(
      `${eventName} token: ${yellow(
        String(tokenOwner.token_id)
      )} collection: ${yellow(String(tokenOwner.collection_id))} in ${
        tokenOwner.block_number
      }`
    );
  }

  async burn(collectionId: number, tokenId: number): Promise<any> {
    await this.nestingService.removeTokenFromParents(collectionId, tokenId);

    return this.tokensRepository.update(
      {
        collection_id: collectionId,
        token_id: tokenId,
      },
      {
        burned: true,
      }
    );
  }

  private async getTokenData(
    collectionId: number,
    tokenId: number,
    blockHash: string
  ): Promise<TokenData | null> {
    let tokenDecoded = null;
    let tokenDecodedV2 = null;
    let tokenProperties = null;
    let isBundle = false;

    try {
      tokenDecoded = await this.sdkService.getToken(
        collectionId,
        tokenId,
        blockHash
      );

      if (!tokenDecoded) return null;

      tokenDecodedV2 = await this.sdkService.getTokenV2(
        collectionId,
        tokenId,
        blockHash
      );

      const [tokenPropertiesRaw, isBundleRaw] = await Promise.all([
        this.sdkService.getTokenProperties(collectionId, tokenId),
        this.sdkService.isTokenBundle(collectionId, tokenId, blockHash),
      ]);

      tokenProperties = tokenPropertiesRaw;
      isBundle = isBundleRaw;
    } catch (e) {
      tokenDecoded = await this.sdkService.getToken(collectionId, tokenId);

      if (!tokenDecoded) return null;

      tokenDecodedV2 = await this.sdkService.getTokenV2(
        collectionId,
        tokenId,
        blockHash
      );

      const [tokenPropertiesRaw, isBundleRaw] = await Promise.all([
        this.sdkService.getTokenProperties(collectionId, tokenId),
        this.sdkService.isTokenBundle(collectionId, tokenId),
      ]);

      tokenProperties = tokenPropertiesRaw;
      isBundle = isBundleRaw;
    }

    return {
      tokenDecoded,
      tokenDecodedV2,
      tokenProperties,
      isBundle,
    };
  }

  private extractTokenEvents(events: Event[]) {
    const filtered = events.filter(({ section, method }) => {
      const eventName = `${section}.${method}`;
      return (
        TOKEN_UPDATE_EVENTS.includes(eventName) ||
        TOKEN_BURN_EVENTS.includes(eventName)
      );
    });

    return filtered.sort((a, b) => {
      const aEventName = `${a.section}.${a.method}`;
      const bEventName = `${b.section}.${b.method}`;

      return (
        TOKEN_UPDATE_EVENTS.indexOf(aEventName) -
        TOKEN_UPDATE_EVENTS.indexOf(bEventName)
      );
    });
  }

  private async burnTokenOwnerPart(tokenOwner: TokenOwnerData) {
    const ownerToken = await this.tokensOwnersRepository.findOne({
      where: {
        owner: tokenOwner.owner,
        collection_id: tokenOwner.collection_id,
        token_id: tokenOwner.token_id,
      },
    });

    if (ownerToken) {
      await this.tokensOwnersRepository.delete({
        id: ownerToken.id,
      });
    }
  }
}
