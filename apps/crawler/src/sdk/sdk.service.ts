import { Injectable } from '@nestjs/common';
import { Sdk } from '@unique-nft/sdk';
import '@unique-nft/sdk/tokens';
import '@unique-nft/sdk/balance';
import { SdkOptions } from '@unique-nft/sdk/types';
import {
  CollectionInfoWithSchema,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/sdk/tokens';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SdkService {
  private sdkPromise: Promise<Sdk>;

  constructor(private configService: ConfigService) {
    this.sdkPromise = Sdk.create({
      chainWsUrl: this.configService.get('CHAIN_WS_URL'),
    } as SdkOptions);
  }

  private async getSdk() {
    const sdk = await this.sdkPromise;

    await sdk.api.isReady;

    return sdk;
  }

  async getCollection(
    collectionId: number,
  ): Promise<CollectionInfoWithSchema | null> {
    const sdk = await this.getSdk();

    return sdk.collections.get_new({ collectionId });
  }

  async getCollectionLimits(collectionId: number) {
    const sdk = await this.getSdk();

    const result = await sdk.collections.getLimits({ collectionId });

    return result?.limits;
  }

  async getToken(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenByIdResult | null> {
    const sdk = await this.getSdk();

    return sdk.tokens.get_new({ collectionId, tokenId });
  }

  async getTokenProperties(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenPropertiesResult | null> {
    const sdk = await this.getSdk();

    return sdk.tokens.properties({ collectionId, tokenId });
  }

  async getBalances(accountId: string) {
    const sdk = await this.getSdk();

    return sdk.balance.get({ address: accountId });
  }
}
