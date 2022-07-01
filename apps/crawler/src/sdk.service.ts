import { Injectable } from '@nestjs/common';
import { Sdk } from '@unique-nft/sdk';
import '@unique-nft/sdk/tokens';

@Injectable()
export class SdkService {
  private sdk: Sdk;

  constructor() {
    (async () => {
      this.sdk = await Sdk.create({
        chainWsUrl: process.env.CHAIN_WS_URL,
      });
    })();
  }

  async getCollection(collectionId: number) {
    await this.sdk.api.isReady;

    return this.sdk.collections.get({ collectionId });
  }
}
