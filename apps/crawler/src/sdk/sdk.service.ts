import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Client } from '@unique-nft/substrate-client';
import {
  CollectionInfoWithSchema,
  PropertyKeyPermission,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';
import { Config } from '../config/config.module';
import { SdkCache } from './sdk-cache.decorator';
import { TokenBalanceRequest } from '@unique-nft/substrate-client/refungible';

@Injectable()
export class SdkService {
  constructor(
    private sdk: Client,
    private configService: ConfigService<Config>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @SdkCache('getApi')
  async getApi(hash) {
    const optionUpgrade = await this.sdk.api.query.system.events.at(hash);
    return optionUpgrade.toJSON();
  }

  @SdkCache('getCollection')
  getCollection(
    collectionId: number,
    at?: string,
  ): Promise<CollectionInfoWithSchema | null> {
    return this.sdk.collections.get({ collectionId, at });
  }

  @SdkCache('getCollectionLimits')
  async getCollectionLimits(collectionId: number, at?: string) {
    const result = await this.sdk.collections.getLimits({ collectionId, at });
    return result?.limits;
  }

  @SdkCache('getTokenPropertyPermissions')
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

  @SdkCache('getToken')
  async getToken(
    collectionId: number,
    tokenId: number,
    at?: string,
  ): Promise<TokenByIdResult | null> {
    if (at) {
      return await this.sdk.tokens.get({ collectionId, tokenId, at });
    } else {
      return await this.sdk.tokens.get({ collectionId, tokenId });
    }
  }

  @SdkCache('isTokenBundle')
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

  @SdkCache('getTokenProperties')
  getTokenProperties(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenPropertiesResult | null> {
    return this.sdk.tokens.properties({ collectionId, tokenId });
  }

  @SdkCache('getBalances')
  async getBalances(rawAddress: string) {
    return this.sdk.balance.get({ address: rawAddress });
  }

  @SdkCache('getRFTBalances')
  async getRFTBalances(
    tokenBalance: TokenBalanceRequest,
    at?: string,
  ): Promise<any> {
    const collection = await this.getCollection(tokenBalance.collectionId);
    if (collection.mode === 'NFT') {
      return {
        amount: 1,
      };
    }
    if (collection.mode === 'ReFungible') {
      let dataCheckNalance;
      if (at) {
        dataCheckNalance = {
          address: `${tokenBalance.address}`,
          collectionId: tokenBalance.collectionId,
          tokenId: tokenBalance.tokenId,
          at,
        };
      } else {
        dataCheckNalance = {
          address: `${tokenBalance.address}`,
          collectionId: tokenBalance.collectionId,
          tokenId: tokenBalance.tokenId,
        };
      }
      return await this.sdk.refungible.getBalance(dataCheckNalance);
    }
  }

  @SdkCache('getTotalPieces')
  async getTotalPieces(
    tokenId: number,
    collectionId: number,
    at?: string,
  ): Promise<any> {
    if (at) {
      return await this.sdk.refungible.totalPieces({
        tokenId,
        collectionId,
        at,
      });
    } else {
      return await this.sdk.refungible.totalPieces({
        tokenId,
        collectionId,
      });
    }
  }
}
