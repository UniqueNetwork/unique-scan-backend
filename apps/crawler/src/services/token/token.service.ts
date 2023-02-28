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
import * as console from 'console';

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
      burned: false,
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

          if (eventName === 'Common.ItemCreated') {
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
            if (eventName === 'Common.Transfer') {
              data = JSON.parse(event.data);
            }
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

      let pieces = 1;
      if (tokenDecoded.collection.mode !== 'NFT') {
        pieces = (
          await this.sdkService.getTotalPieces(tokenId, collectionId, blockHash)
        ).amount;
      }

      const preparedData = await this.prepareDataForDb(
        tokenData,
        blockHash,
        pieces,
        blockTimestamp,
        needCheckNesting,
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
              preparedData,
              typeMode,
              eventName,
            );

            break;
          case 'ReFungible':
            await this.saveReFungibleOwnerToken(
              collectionId,
              tokenId,
              blockNumber,
              blockHash,
              data,
              preparedData,
              typeMode,
              eventName,
              blockTimestamp,
            );
            break;
        }
      }

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
      const ownerToken = normalizeSubstrateAddress(data[2].value);

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
        console.error(
          `Destroy token full amount: ${pieceToken.amount} / collection: ${collectionId} / token: ${tokenId}`,
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
    blockTimestamp,
  ) {
    const arrayToken = [];

    const testToken = await this.tokensRepository.update(
      {
        collection_id: collectionId,
        token_id: tokenId,
      },
      {
        burned: false,
      },
    );

    console.log(collectionId, tokenId, testToken);
    const pieceFrom = await this.sdkService.getRFTBalances(
      {
        address: normalizeSubstrateAddress(data[2].value),
        collectionId: collectionId,
        tokenId: tokenId,
      },
      blockHash,
    );
    arrayToken.push({
      owner: normalizeSubstrateAddress(data[2].value),
      owner_normalized: normalizeSubstrateAddress(data[2].value),
      collection_id: collectionId,
      token_id: tokenId,
      date_created: String(normalizeTimestamp(blockTimestamp)),
      amount: pieceFrom.amount,
      type: preparedData.type || typeMode,
      block_number: blockNumber,
      parent_id: preparedData.parent_id,
      children: preparedData.children,
    });
    console.log(
      blockNumber,
      eventName,
      typeMode,
      collectionId,
      tokenId,
      data.length === 4 ? data[3] : null,
      pieceFrom.amount,
      normalizeSubstrateAddress(data[2].value),
    );
    if (data.length === 5) {
      const owner = normalizeSubstrateAddress(data[3].value);
      const pieceTo = await this.sdkService.getRFTBalances(
        {
          address: owner,
          collectionId: collectionId,
          tokenId: tokenId,
        },
        blockHash,
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
        owner_normalized: normalizeSubstrateAddress(data[3].value),
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
      console.log(
        blockNumber,
        eventName,
        typeMode,
        collectionId,
        tokenId,
        data.length === 5 ? data[4] : null,
        '-',
        pieceTo.amount,
        normalizeSubstrateAddress(data[2].value),
        normalizeSubstrateAddress(data[3].value),
      );
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
    eventName,
  ) {
    const pieceToken = await this.sdkService.getRFTBalances({
      address: tokenDecoded.owner || tokenDecoded.collection.owner,
      collectionId: collectionId,
      tokenId: tokenId,
    });
    const tokenOwner: TokenOwnerData = {
      owner: tokenDecoded.owner || tokenDecoded.collection.owner,
      owner_normalized: normalizeSubstrateAddress(
        tokenDecoded.owner || tokenDecoded.collection.owner,
      ),
      collection_id: collectionId,
      token_id: tokenId,
      date_created: String(normalizeTimestamp(blockTimestamp)),
      amount: pieceToken.amount,
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
    console.log(
      blockNumber,
      eventName,
      typeMode,
      collectionId,
      tokenId,
      tokenDecoded.owner || tokenDecoded.collection.owner,
    );
  }

  async burn(
    collectionId: number,
    tokenId: number,
    owner?: string,
  ): Promise<any> {
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

  private async burnTokenOwnerPart(tokenOwner: TokenOwnerData) {
    const ownerToken = await this.tokensOwnersRepository.findOne({
      where: {
        owner: tokenOwner.owner,
        collection_id: tokenOwner.collection_id,
        token_id: tokenOwner.token_id,
      },
    });

    if (ownerToken) {
      // await this.tokensOwnersRepository.update(
      //   {
      //     id: ownerToken.id,
      //   },
      //   {
      //     amount: 0,
      //     block_number: tokenOwner.block_number,
      //   },
      // );
      await this.tokensOwnersRepository.delete({
        id: ownerToken.id,
      });
    }
  }

  private async checkAndSaveOrUpdateTokenOwnerPart(tokenOwner: TokenOwnerData) {
    const ownerToken = await this.tokensOwnersRepository.findOne({
      where: {
        owner: tokenOwner.owner,
        collection_id: tokenOwner.collection_id,
        token_id: tokenOwner.token_id,
      },
    });
    if (ownerToken != null) {
      await this.tokensOwnersRepository.update(
        {
          id: ownerToken.id,
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
