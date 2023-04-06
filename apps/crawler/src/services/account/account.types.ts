import { Address } from '@unique-nft/substrate-client/types';

export type AccountRecord =
  | Address
  | { value: Address; __kind: 'Substrate' | 'Etherium' };

export type AccountAddressData =
  | { substrate?: Address; etherium?: Address }
  | Address;
