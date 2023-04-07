import { Address } from '@unique-nft/substrate-client/types';

export type AccountRecord =
  | Address
  | { value: Address; __kind: 'Substrate' | 'Ethereum' };

export type AccountAddressData =
  | { substrate?: Address; ethereum?: Address }
  | Address;
