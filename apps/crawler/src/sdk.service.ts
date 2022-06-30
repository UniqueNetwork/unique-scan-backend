import { Injectable } from '@nestjs/common';
import { Sdk } from '@unique-nft/sdk';
import '@unique-nft/sdk/tokens';

@Injectable()
export class SdkService {
  private sdk: Sdk;
  constructor() {
    Sdk.create({
      chainWsUrl: process.env.CHAIN_WS,
      //   signer: await createSigner({
      //     seed: '//Alice', // Signer seed phrase if you want to sign extrinsics
      //   }),
    }).then((sdk) => {
      this.sdk = sdk;
    });
  }

  getCollection(collectionId: number) {
    return this.sdk.collections.get({ collectionId });
  }
}
