import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Client } from '@unique-nft/substrate-client';
import {
  CollectionInfoWithSchema,
  PropertyKeyPermission,
  TokenByIdResult,
  TokenPropertiesResult,
  IV2Collection,
  TokenByIdResultV2,
} from '@unique-nft/substrate-client/tokens';
import { Config } from '../config/config.module';
import { SdkCache } from './sdk-cache.decorator';
import { TokenBalanceRequest } from '@unique-nft/substrate-client/refungible';
import { ChainProperties } from '@unique-nft/substrate-client/types';

import { ITotalIssuance } from '@common/constants';

export interface ISpecSystemVersion {
  spec_version: number;
  spec_name: string;
}

@Injectable()
export class SdkService {
  constructor(
    private sdk: Client,
    private configService: ConfigService<Config>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  readonly logger = new Logger(SdkService.name);

  async getLastBlockHash(): Promise<string> {
    const header = await this.sdk.api.rpc.chain.getHeader();

    return header.hash.toString();
  }

  @SdkCache('getApi')
  async getApi(hash: string) {
    const optionUpgrade = await this.sdk.api.query.system.events.at(hash);
    return optionUpgrade.toJSON();
  }

  @SdkCache('getCollection')
  async getCollection(
    collectionId: number,
    at?: string
  ): Promise<CollectionInfoWithSchema | null> {
    if (at) {
      return this.sdk.collections.get({ collectionId, at });
    } else {
      debugger;
      return this.sdk.collections.get({ collectionId });
    }
  }

  @SdkCache('getCollectionV2')
  async getCollectionV2(
    collectionId: number,
    at?: string
  ): Promise<IV2Collection | null> {
    return this.sdk.collections.getV2({ collectionId, at });
  }

  @SdkCache('getSpecLastUpgrade')
  async getSpecLastUpgrade(hash: string): Promise<ISpecSystemVersion> {
    const optionUpgrade = await this.sdk.api.query.system.lastRuntimeUpgrade.at(
      hash
    );
    const specLastUpgrade = optionUpgrade.toJSON() as any;
    return {
      spec_version: specLastUpgrade.specVersion,
      spec_name: specLastUpgrade.specName,
    };
  }

  @SdkCache('getChainProperties')
  async getChainProperties(): Promise<ChainProperties> {
    return this.sdk.common.chainProperties();
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
    at?: string
  ): Promise<TokenByIdResult | null> {
    return await this.sdk.tokens.get({ collectionId, tokenId, at });
  }

  @SdkCache('getTokenV2')
  async getTokenV2(
    collectionId: number,
    tokenId: number,
    at?: string
  ): Promise<TokenByIdResultV2 | null> {
    try {
      return await this.sdk.tokens.getV2({ collectionId, tokenId, at });
    } catch (error) {
      this.logger.error(
        `Error getting token-v2 (${collectionId}/${tokenId} @ ${at || '-'}): ${
          error.message
        }`
      );

      return null;
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
    tokenId: number
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
    at?: string
  ): Promise<{ amount: number }> {
    const { collectionId, tokenId, address } = tokenBalance;

    const collection = await this.getCollection(collectionId);

    if (collection.mode === 'ReFungible') {
      return await this.sdk.refungible.getBalance({
        collectionId,
        tokenId,
        address,
        at,
      });
    }

    return { amount: 0 };
  }

  @SdkCache('getTotalPieces')
  async getTotalPieces(
    tokenId: number,
    collectionId: number,
    at?: string
  ): Promise<ReturnType<typeof this.sdk.refungible.totalPieces>> {
    return await this.sdk.refungible.totalPieces({ tokenId, collectionId, at });
  }

  @SdkCache('getTotalSupply')
  async getTotalSupply(): Promise<ITotalIssuance> {
    // return await this.sdk.api.query.balances.totalIssuance();
    return await this.sdk.stateQueries.execute({
      endpoint: 'query',
      module: 'balances',
      method: 'totalIssuance',
    });
  }
}
