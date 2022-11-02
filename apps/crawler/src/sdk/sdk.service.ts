import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Sdk } from '@unique-nft/substrate-client';
import {
  CollectionInfoWithSchema,
  PropertyKeyPermission,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';
import { SdkCache } from './sdk-cache.decorator';

@Injectable()
export class SdkService {
  constructor(
    private sdk: Sdk,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @SdkCache({
    key: 'getCollection',
    blockHashIndex: 1,
  })
  getCollection(
    collectionId: number,
    at?: string,
  ): Promise<CollectionInfoWithSchema | null> {
    return this.sdk.collections.get({ collectionId, at });
  }

  @SdkCache({
    key: 'getCollectionLimits',
    blockHashIndex: 1,
  })
  async getCollectionLimits(collectionId: number, at?: string) {
    const result = await this.sdk.collections.getLimits({ collectionId, at });
    return result?.limits;
  }

  @SdkCache({
    key: 'getTokenPropertyPermissions',
    blockHashIndex: 1,
  })
  async getTokenPropertyPermissions(collectionId: number, at?: string) {
    try {
      const property = await this.sdk.collections.propertyPermissions({
        collectionId,
        at: at ? `0x${at}` : undefined,
      });

      return property?.propertyPermissions;
    } catch {
      return [] as PropertyKeyPermission[];
    }
  }

  @SdkCache({
    key: 'getToken',
    blockHashIndex: 2,
  })
  getToken(
    collectionId: number,
    tokenId: number,
    at?: string,
  ): Promise<TokenByIdResult | null> {
    return this.sdk.tokens.get({ collectionId, tokenId, at });
  }

  @SdkCache({
    key: 'isTokenBundle',
    blockHashIndex: 2,
  })
  isTokenBundle(collectionId: number, tokenId: number, at?: string) {
    return this.sdk.tokens.isBundle({ collectionId, tokenId, at });
  }

  getTokenBundle(collectionId: number, tokenId: number, at?: string) {
    return this.sdk.tokens.getBundle({
      collectionId,
      tokenId,
      at,
    });
  }

  getTokenParents(collectionId: number, tokenId: number, at?: string) {
    return this.sdk.tokens.parent({ collectionId, tokenId, at });
  }

  @SdkCache({ key: 'getTokenProperties' })
  getTokenProperties(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenPropertiesResult | null> {
    return this.sdk.tokens.properties({ collectionId, tokenId });
  }

  @SdkCache({ key: 'getBalances' })
  async getBalances(rawAddress: string) {
    return this.sdk.balance.get({ address: rawAddress });
  }
}
