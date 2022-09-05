import { getAccount } from '../utils/accounts';
import { Sdk } from '@unique-nft/substrate-client';

export async function createSdk(seed = '//Alice'): Promise<Sdk> {
  const options = {
    chainWsUrl: process.env.TESTS_UNIQUE_WS_ENDPOINT,
    ipfsGatewayUrl: process.env.TESTS_IPFS_URL,
  };
  const signer = await getAccount(seed);
  return await Sdk.create({
    ...options,
    signer: signer.getSigner(),
  });
}

export { createToken } from './tokens';
export { createCollection } from './collections';
