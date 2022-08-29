import BigNumber from 'bignumber.js';
import { encodeAddress, decodeAddress } from '@polkadot/util-crypto';
import { ETHEREUM_ADDRESS_MAX_LENGTH } from './constants';
import { Prefix } from '@polkadot/util-crypto/types';

export function normalizeSubstrateAddress(address, ss58Format?: Prefix) {
  if (address?.length <= ETHEREUM_ADDRESS_MAX_LENGTH) {
    return address;
  }

  return encodeAddress(decodeAddress(address), ss58Format);
}

export function normalizeTimestamp(timestamp: number) {
  return Math.floor(timestamp / 1000);
}

export function getAmount(strNum: string) {
  BigNumber.config({
    EXPONENTIAL_AT: [-30, 30],
  });

  const result = new BigNumber(strNum);
  const dividedBy = result.dividedBy('1000000000000000000').toString();

  return dividedBy;
}

export function sanitizeUnicodeString(str) {
  return str.replace(/\\u0000|\x00/g, '');
}

export function sanitizePropertiesValues(
  propertiesArr: { key: string; value: string }[],
) {
  return propertiesArr.map(({ key, value }) => ({
    key,
    value: sanitizeUnicodeString(value),
  }));
}
