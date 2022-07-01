import { Injectable } from '@nestjs/common';
import { Sdk } from '@unique-nft/sdk';
import '@unique-nft/sdk/tokens';

@Injectable()
export class SdkService {
  private sdkPromise: Promise<Sdk>;

  constructor() {
    this.sdkPromise = Sdk.create({
      chainWsUrl: process.env.CHAIN_WS_URL,
    });
  }

  private async getSdk() {
    const sdk = await this.sdkPromise;

    await sdk.api.isReady;

    return sdk;
  }

  async getCollection(collectionId: number) {
    const sdk = await this.getSdk();

    return sdk.collections.get({ collectionId });
  }
}
