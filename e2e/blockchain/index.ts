import { SdkSigner } from '@unique-nft/substrate-client/types';
import { createSigner } from '@unique-nft/substrate-client/sign';
import { Sdk } from '@unique-nft/substrate-client';

export async function createSdk(seed = '//Alice'): Promise<Sdk> {
  const options = {
    chainWsUrl: process.env.TESTS_UNIQUE_WS_ENDPOINT,
    ipfsGatewayUrl: process.env.TESTS_IPFS_URL,
  };
  const signer: SdkSigner = await createSigner({ seed });
  return await Sdk.create({
    ...options,
    signer,
  });
}

export { createToken } from './tokens';
export { createCollection } from './collections';
