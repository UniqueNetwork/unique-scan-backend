import BigNumber from 'bignumber.js';
import { Address } from '@unique-nft/utils';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

export function getParentCollectionAndToken(address) {
  if (Address.is.ethereumAddress(address)) {
    return Address.is.nestingAddress(address)
      ? Address.nesting.addressToIds(address)
      : undefined;
  } else {
    return undefined;
  }
}
export function normalizeSubstrateAddress(address, ss58Format?: number) {
  return Address.is.ethereumAddress(address)
    ? address
    : encodeAddress(decodeAddress(address, false, ss58Format));
  // : Address.normalize.substrateAddress(address, ss58Format);
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

  return dividedBy === 'NaN' ? '0' : dividedBy;
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

export function getObjectKeysDeep(args, result = []) {
  if (Array.isArray(args)) {
    for (let i = 0; i < args.length; i++) {
      getObjectKeysDeep(args[i], result);
    }
  } else {
    for (const key in args) {
      result.push(key);
      if (typeof args[key] == 'object' || Array.isArray(args[key])) {
        getObjectKeysDeep(args[key], result);
      }
    }
  }
  return result;
}
