import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sdk } from '@unique-nft/substrate-client';
import {
  CollectionInfoWithSchema,
  PropertyKeyPermission,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';
import { AllBalances } from '@unique-nft/substrate-client/types';
import { Config } from '../config/config.module';
import { SdkCache } from './sdk-cache.decorator';

@Injectable()
export class SdkService {
  constructor(
    private sdk: Sdk,
    private configService: ConfigService<Config>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @SdkCache('getCollection')
  getCollection(
    collectionId: number,
    at: string,
  ): Promise<CollectionInfoWithSchema | null> {
    return this.sdk.collections.get({ collectionId, at });
  }

  @SdkCache('getCollectionLimits')
  async getCollectionLimits(collectionId: number, at: string) {
    const result = await this.sdk.collections.getLimits({ collectionId, at });
    return result?.limits;
  }

  @SdkCache('getTokenPropertyPermissions')
  async getTokenPropertyPermissions(collectionId: number) {
    let result: PropertyKeyPermission[] = [];
    try {
      const property = await this.sdk.collections.propertyPermissions({
        collectionId,
      });

      result = property?.propertyPermissions;
    } catch {}

    return result;
  }

  @SdkCache('getToken')
  getToken(
    collectionId: number,
    tokenId: number,
    at: string,
  ): Promise<TokenByIdResult | null> {
    return this.sdk.tokens.get({ collectionId, tokenId, at });
  }

  @SdkCache('getTokenProperties')
  getTokenProperties(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenPropertiesResult | null> {
    return this.sdk.tokens.properties({ collectionId, tokenId });
  }

  @SdkCache('getBalances')
  async getBalances(rawAddress: string): Promise<AllBalances> {
    return this.sdk.balance.get({ address: rawAddress });
  }
}
