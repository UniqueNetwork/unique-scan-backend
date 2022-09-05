import { EventName } from '@common/constants';
import {
  normalizeSubstrateAddress,
  normalizeTimestamp,
  sanitizePropertiesValues,
} from '@common/utils';
import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CollectionInfoWithSchema,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';
import { Repository } from 'typeorm';

export interface ITokenData {
  tokenDecoded: TokenByIdResult | null;
  tokenProperties: TokenPropertiesResult | null;
  collectionDecoded: CollectionInfoWithSchema | null;
}
@Injectable()
export class TokenWriterService {
  constructor(
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
  ) {}

  prepareDataForDb(tokenData: ITokenData) {
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
        ? sanitizePropertiesValues(tokenProperties.properties)
        : [],
      parent_id: parentId,
      is_sold: owner !== collectionOwner,
      token_name: `${tokenPrefix} #${token_id}`,
    };
  }

  async upsert({
    eventName,
    blockTimestamp,
    tokenData,
  }: {
    eventName: string;
    blockTimestamp: number;
    tokenData: ITokenData;
  }) {
    const preparedData = this.prepareDataForDb(tokenData);

    // Write token data into db
    return this.tokensRepository.upsert(
      {
        ...preparedData,
        date_of_creation:
          eventName === EventName.ITEM_CREATED
            ? normalizeTimestamp(blockTimestamp)
            : undefined,
      },
      ['collection_id', 'token_id'],
    );
  }

  async delete(collectionId: number, tokenId: number) {
    return this.tokensRepository.delete({
      collection_id: collectionId,
      token_id: tokenId,
    });
  }
}
