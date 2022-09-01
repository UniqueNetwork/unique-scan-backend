import { Sdk } from '@unique-nft/substrate-client';

export async function sdkFactory(chainWsUrl: string): Promise<Sdk> {
  const sdk = new Sdk({
    chainWsUrl,
  });

  await sdk.connect();

  return sdk;
}
