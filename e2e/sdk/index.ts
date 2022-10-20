import { Sdk } from '@unique-nft/substrate-client';
import { KeyringAccount } from '@unique-nft/accounts/keyring';

export async function createSdk(account: KeyringAccount): Promise<Sdk> {
  const options = {
    chainWsUrl: process.env.TESTS_UNIQUE_WS_ENDPOINT,
    ipfsGatewayUrl: process.env.TESTS_IPFS_URL,
  };
  return await Sdk.create({
    ...options,
    signer: account.getSigner(),
  });
}

export { createToken } from './tokens';
export { createCollection } from './collections';
