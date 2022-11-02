import { Client } from '@unique-nft/substrate-client';

export async function sdkFactory(chainWsUrl: string) {
  const sdk = await Client.create({
    chainWsUrl,
  });

  await sdk.connect();

  return sdk;
}
