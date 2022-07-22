import { encodeAddress, decodeAddress } from '@polkadot/util-crypto';
import {
  ETHEREUM_ADDRESS_MAX_LENGTH,
  NESTING_ADDRESS_COLLECTION_ID_LENGTH,
  NESTING_ADDRESS_PREFIX,
  NESTING_ADDRESS_TOKEN_ID_LENGTH,
} from './constants';

export function normalizeSubstrateAddress(address) {
  if (address?.length <= ETHEREUM_ADDRESS_MAX_LENGTH) {
    return address;
  }

  return encodeAddress(decodeAddress(address));
}

export function parseNestingAddress(address) {
  const match = address.match(
    RegExp(
      `^${NESTING_ADDRESS_PREFIX}(.{${NESTING_ADDRESS_COLLECTION_ID_LENGTH}})(.{${NESTING_ADDRESS_TOKEN_ID_LENGTH}})$`,
    ),
  );

  if (!match) {
    return null;
  }

  const [, collectionIdString, tokenIdString] = match;

  return {
    collectionId: parseInt(collectionIdString, 16) || null,
    tokenId: parseInt(tokenIdString, 16) || null,
  };
}

export function normalizeTimestamp(timestamp: number) {
  return Math.floor(timestamp / 1000);
}
