import { EventName, SubscriberAction } from '@common/constants';
import {
  normalizeSubstrateAddress,
  normalizeTimestamp,
  sanitizePropertiesValues,
} from '@common/utils';
import { Tokens, TokenType } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CollectionInfoWithSchema,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';
import { Repository } from 'typeorm';
import { SdkService } from '../sdk/sdk.service';

interface TokenData {
  tokenDecoded: TokenByIdResult;
  tokenProperties: TokenPropertiesResult;
  collectionDecoded: CollectionInfoWithSchema;
}

@Injectable()
export class TokenService {
  constructor(
    private sdkService: SdkService,

    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
  ) {}

  private async getTokenData(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenData | null> {
    const tokenDecoded = await this.sdkService.getToken(collectionId, tokenId);

    if (!tokenDecoded) {
      return null;
    }
    const [tokenProperties, collectionDecoded] = await Promise.all([
      this.sdkService.getTokenProperties(collectionId, tokenId),
      this.sdkService.getCollection(collectionId),
    ]);

    return {
      tokenDecoded,
      tokenProperties,
      collectionDecoded,
    };
  }

  prepareDataForDb(tokenData: TokenData): Omit<Tokens, 'id'> {
    const { tokenDecoded, tokenProperties, collectionDecoded } = tokenData;
    const {
      tokenId: token_id,
      collectionId: collection_id,
      image,
      attributes,
      nestingParentToken,
      owner,
    } = tokenDecoded;

    const { owner: collectionOwner, tokenPrefix } = collectionDecoded;
    let tokenType = TokenType.NFT;
    let parentId = null;
    if (nestingParentToken) {
      const { collectionId, tokenId } = nestingParentToken;
      parentId = `${collectionId}_${tokenId}`;
      tokenType = TokenType.NESTED;
    }

    return {
      token_id,
      collection_id,
      owner,
      owner_normalized: normalizeSubstrateAddress(owner),
      image,
      attributes,
      properties: tokenProperties
        ? sanitizePropertiesValues(tokenProperties.properties)
        : [],
      parent_id: parentId,
      is_sold: owner !== collectionOwner,
      token_name: `${tokenPrefix} #${token_id}`,
      type: tokenType,
    };
  }

  async update({
    collectionId,
    tokenId,
    eventName,
    blockTimestamp,
  }: {
    collectionId: number;
    tokenId: number;
    eventName: string;
    blockTimestamp: number;
  }): Promise<SubscriberAction> {
    const tokenData = await this.getTokenData(collectionId, tokenId);

    let result;

    if (tokenData) {
      const preparedData = this.prepareDataForDb(tokenData);

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

      // Delete db record
      await this.delete(collectionId, tokenId);

      result = SubscriberAction.DELETE;
    }

    return result;
  }

  async delete(collectionId: number, tokenId: number) {
    return this.tokensRepository.delete({
      collection_id: collectionId,
      token_id: tokenId,
    });
  }
}
