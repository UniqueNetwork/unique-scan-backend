import { Injectable } from '@nestjs/common';
import { Sdk } from '@unique-nft/sdk';
import '@unique-nft/sdk/tokens';
import '@unique-nft/sdk/balance';
import { SdkOptions } from '@unique-nft/sdk/types';

@Injectable()
export class SdkService {
  private sdkPromise: Promise<Sdk>;

  constructor() {
    this.sdkPromise = Sdk.create({
      chainWsUrl: process.env.CHAIN_WS_URL,
    } as SdkOptions);
  }

  private async getSdk() {
    const sdk = await this.sdkPromise;

    await sdk.api.isReady;

    return sdk;
  }

  async getCollection(collectionId: number) {
    const sdk = await this.getSdk();

    const result = await sdk.collections.get_new({ collectionId });

    return result;
  }

  async getCollectionLimits(collectionId: number) {
    const sdk = await this.getSdk();

    const result = await sdk.collections.getLimits({ collectionId });

    return result?.limits;
  }

  async getToken(collectionId: number, tokenId: number) {
    const sdk = await this.getSdk();

    const result = await sdk.tokens.get_new({ collectionId, tokenId });

    return result;
  }

  async getAccountBalances(accountId: string) {
    const sdk = await this.getSdk();

    const result = await sdk.balance.get({ address: accountId });

    return result;
  }
}
