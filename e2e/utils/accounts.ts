import { KeyringAccount, KeyringProvider } from '@unique-nft/accounts/keyring';
import { KeyringOptions } from '@polkadot/keyring/types';

export async function getAccount(seed: string): Promise<KeyringAccount> {
  const options: KeyringOptions = {
    type: 'sr25519',
  };
  const provider = new KeyringProvider(options);
  await provider.init();
  const account: KeyringAccount | undefined = provider.addSeed(
    seed,
  ) as KeyringAccount;

  if (!account) {
    throw new Error(`Account with seed ${seed} not found`);
  }

  return account;
}
