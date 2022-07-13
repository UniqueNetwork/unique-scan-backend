import { Injectable } from '@nestjs/common';
import { Sdk } from '@unique-nft/sdk';
import '@unique-nft/sdk/tokens';
import { SdkOptions } from '@unique-nft/sdk/types';

@Injectable()
export class SdkService {
  private sdkPromise: Promise<Sdk>;

  constructor() {
    this.sdkPromise = Sdk.create({
      chainWsUrl: process.env.CHAIN_WS_URL,
    } as SdkOptions);
  }

  async getSdk() {
    const sdk = await this.sdkPromise;

    await sdk.api.isReady;

    return sdk;
  }

  async getCollection(collectionId: number) {
    const sdk = await this.getSdk();

    return sdk.collections.get({ collectionId });
  }

  async getCollectionLimits(collectionId: number) {
    const sdk = await this.getSdk();

    const result = await sdk.collections.getLimits({ collectionId });

    return result?.limits;
  }

  async getEvents(blockHash: string) {
    const sdk = await this.getSdk();

    return sdk.api.query.system.events.at(blockHash);
  }

  async getToken(collectionId: number, tokenId: number) {
    const sdk = await this.getSdk();

    return sdk.tokens.get({ collectionId, tokenId });
  }
}
