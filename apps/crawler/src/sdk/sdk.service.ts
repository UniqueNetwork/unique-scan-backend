import { Injectable } from '@nestjs/common';
import { Sdk } from '@unique-nft/substrate-client';
import {
  CollectionInfoWithSchema,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';

@Injectable()
export class SdkService {
  constructor(private sdk: Sdk) {}

  getCollection(
    collectionId: number,
  ): Promise<CollectionInfoWithSchema | null> {
    return this.sdk.collections.get_new({ collectionId });
  }

  async getCollectionLimits(collectionId: number) {
    const result = await this.sdk.collections.getLimits({ collectionId });
    return result?.limits;
  }

  getToken(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenByIdResult | null> {
    return this.sdk.tokens.get_new({ collectionId, tokenId });
  }

  getTokenProperties(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenPropertiesResult | null> {
    return this.sdk.tokens.properties({ collectionId, tokenId });
  }

  getBalances(rawAddress: string) {
    return this.sdk.balance.get({ address: rawAddress });
  }
}
