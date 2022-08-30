// import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CollectionInfoWithSchema,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/sdk/tokens';
import { Repository } from 'typeorm';

@Injectable()
export class TokenWriterService {
  constructor(
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
  ) {}

  prepareDataForDb(
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

    const { owner: collectionOwner, tokenPrefix } = collection;

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

  upsert({
    blockNumber,
    blockTimestamp,
    balances,
  }: {
    blockNumber: number;
    blockTimestamp: number;
    balances: AllBalances;
  }) {
    const dataToWrite = this.prepareDataForDb({
      blockNumber,
      timestamp: normalizeTimestamp(blockTimestamp),
      balances,
    });

    // Write data into db
    return this.accountsRepository.upsert(dataToWrite, ['account_id']);
  }

  delete(collectionId: number, tokenId: number) {
    return this.tokensRepository.delete({
      collection_id: collectionId,
      token_id: tokenId,
    });
  }
}
