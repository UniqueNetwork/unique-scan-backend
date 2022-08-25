import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sdk } from '@unique-nft/sdk';
import {
  CollectionInfoWithSchema,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/sdk/tokens';
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
  ): Promise<CollectionInfoWithSchema | null> {
    return this.sdk.collections.get_new({ collectionId });
  }

  @SdkCache('getCollectionLimits')
  async getCollectionLimits(collectionId: number) {
    const result = await this.sdk.collections.getLimits({ collectionId });
    return result?.limits;
  }

  @SdkCache('getToken')
  getToken(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenByIdResult | null> {
    return this.sdk.tokens.get_new({ collectionId, tokenId });
  }

  @SdkCache('getTokenProperties')
  getTokenProperties(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenPropertiesResult | null> {
    return this.sdk.tokens.properties({ collectionId, tokenId });
  }

  @SdkCache('getBalances')
  async getBalances(rawAddress: string) {
    const result = await this.sdk.balance.get({ address: rawAddress });
    return result;
  }
}
