import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sdk } from '@unique-nft/substrate-client';
import {
  CollectionInfoWithSchema,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';
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

  @SdkCache('getToken')
  getToken(
    collectionId: number,
    tokenId: number,
    at: string,
  ): Promise<TokenByIdResult | null> {
    return this.sdk.tokens.get_new({ collectionId, tokenId, at });
  }

  @SdkCache('getTokenProperties')
  getTokenProperties(
    collectionId: number,
    tokenId: number,
    at: string,
  ): Promise<TokenPropertiesResult | null> {
    return this.sdk.tokens.properties({ collectionId, tokenId, at });
  }

  @SdkCache('getBalances')
  getBalances(rawAddress: string) {
    return this.sdk.balance.get({ address: rawAddress });
  }
}
