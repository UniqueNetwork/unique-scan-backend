import { encodeAddress, decodeAddress } from '@polkadot/util-crypto';
import { ETHEREUM_ADDRESS_MAX_LENGTH } from './constants';

export function normalizeSubstrateAddress(address) {
  if (address?.length <= ETHEREUM_ADDRESS_MAX_LENGTH) {
    return address;
  }

  return encodeAddress(decodeAddress(address));
}

export function normalizeTimestamp(timestamp: number) {
  return Math.floor(timestamp / 1000);
}
