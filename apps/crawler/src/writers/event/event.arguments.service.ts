import { Injectable } from '@nestjs/common';
import {
  EventName,
  EVENT_ARGS_ACCOUNT_KEYS,
  EVENT_ARGS_ACCOUNT_KEY_DEFAULT,
  EVENT_ARGS_COLLECTION_ID_KEY_DEFAULT,
  EVENT_ARGS_TOKEN_ID_KEY_DEFAULT,
} from '@common/constants';
import { NormalizedEventArgs, RawEventArgs } from './event.types';
import { AccountService, RawAccount } from '../account/account.service';

type EventArgsValueNormalizer = (
  rawValue: string | number | object,
) => Promise<unknown>;

/**
 * todo: Add types and description
 */
const EVENT_ARGS_DESCRIPTORS = {
  // System
  [EventName.NEW_ACCOUNT]: { accounts: 0 },

  // Common
  [EventName.APPROVED]: {
    collectionId: 0,
    tokenId: 1,
    accounts: { '2': 'sender', '3': 'spender' },
  },
  [EventName.COLLECTION_CREATED]: { collectionId: 0, accounts: 2 },
  [EventName.COLLECTION_DESTROYED]: { collectionId: 0 },
  [EventName.COLLECTION_PROPERTY_DELETED]: { collectionId: 0 },
  [EventName.COLLECTION_PROPERTY_SET]: { collectionId: 0 },
  [EventName.ITEM_CREATED]: { collectionId: 0, tokenId: 1, accounts: 2 },
  [EventName.ITEM_DESTROYED]: { collectionId: 0, tokenId: 1, accounts: 2 },
  [EventName.PROPERTY_PERMISSION_SET]: { collectionId: 0 }, // No docs, maybe wrong
  [EventName.TOKEN_PROPERTY_DELETED]: { collectionId: 0, tokenId: 1 },
  [EventName.TOKEN_PROPERTY_SET]: { collectionId: 0, tokenId: 1 },
  [EventName.TRANSFER]: {
    collectionId: 0,
    tokenId: 1,
    accounts: { '2': 'from', '3': 'to' },
  },

  // Balances
  [EventName.BALANCES_BALANCE_SET]: { accounts: { '0': 'who' } },
  [EventName.BALANCES_DEPOSIT]: { accounts: { '0': 'who' } },
  [EventName.BALANCES_WITHDRAW]: { accounts: { '0': 'who' } },
  [EventName.BALANCES_DUST_LOST]: { accounts: 0 },
  [EventName.BALANCES_ENDOWED]: { accounts: 0 },
  [EventName.BALANCES_RESERVED]: { accounts: { '0': 'who' } },
  [EventName.BALANCES_RESERVED_REPATRIATED]: {
    accounts: { '0': 'from', '1': 'to' },
  },
  [EventName.BALANCES_SLASHED]: { accounts: 0 },
  [EventName.BALANCES_TRANSFER]: { accounts: { '0': 'from', '1': 'to' } },
  [EventName.BALANCES_UNRESERVED]: { accounts: { '0': 'who' } },
  [EventName.BALANCES_WITHDRAW]: { accounts: { '0': 'who' } },

  // Unique
  [EventName.ALLOW_LIST_ADDRESS_ADDED]: { collectionId: 0, accounts: 1 },
  [EventName.ALLOW_LIST_ADDRESS_REMOVED]: { collectionId: 0, accounts: 1 },
  [EventName.COLLECTION_ADMIN_ADDED]: { collectionId: 0, accounts: 1 },
  [EventName.COLLECTION_ADMIN_REMOVED]: { collectionId: 0, accounts: 1 },
  [EventName.COLLECTION_OWNED_CHANGED]: { collectionId: 0, accounts: 1 },
  [EventName.COLLECTION_LIMIT_SET]: { collectionId: 0 },
  [EventName.COLLECTION_PERMISSION_SET]: { collectionId: 0 },
  [EventName.COLLECTION_SPONSOR_SET]: { collectionId: 0, accounts: 1 },
  [EventName.COLLECTION_SPONSOR_REMOVED]: { collectionId: 0 },
  [EventName.SPONSORSHIP_CONFIRMED]: { collectionId: 0, accounts: 1 },
};

@Injectable()
export class EventArgumentsService {
  constructor(private accountService: AccountService) {}

  static extractRawAmountValue(
    args: string | { amount?: string; value?: string },
  ) {
    return typeof args === 'string' ? args : args?.amount || args?.value;
  }

  async getNormalizedArguments(
    eventName: string,
    rawArgs: RawEventArgs,
  ): Promise<NormalizedEventArgs | null> {
    if (rawArgs == null) {
      return null;
    }

    const accountKeysMap = {};

    const otherKeysMap = {};

    // Add default account keys map
    Object.assign(
      accountKeysMap,
      Object.fromEntries(EVENT_ARGS_ACCOUNT_KEYS.map((v) => [v, v])),
    );

    const argsDescriptor = EVENT_ARGS_DESCRIPTORS[eventName];
    if (argsDescriptor) {
      const {
        accounts: accountsKeys = null, // Use null as default to be albe using keys like 0.
        collectionId: collectionIdKey = null,
        tokenId: tokenIdKey = null,
      } = argsDescriptor;

      if (accountsKeys !== null) {
        if (typeof accountsKeys === 'object') {
          Object.assign(accountKeysMap, accountsKeys);
        } else {
          accountKeysMap[accountsKeys] = EVENT_ARGS_ACCOUNT_KEY_DEFAULT;
        }
      }

      if (collectionIdKey !== null) {
        otherKeysMap[collectionIdKey] = EVENT_ARGS_COLLECTION_ID_KEY_DEFAULT;
      }

      if (tokenIdKey !== null) {
        otherKeysMap[tokenIdKey] = EVENT_ARGS_TOKEN_ID_KEY_DEFAULT;
      }
    }
    const accountsNormalized = await this.normalizeArgs(
      rawArgs,
      accountKeysMap,
      this.normalizeAccountValue.bind(this),
    );

    const otherNormalized = await this.normalizeArgs(rawArgs, otherKeysMap);

    const result = { ...accountsNormalized, ...otherNormalized };

    return Object.keys(result).length ? result : null;
  }

  private async normalizeArgs(
    rawArgs: RawEventArgs,
    keysMap: { [key: string]: string },
    valueNormalizerFn?: EventArgsValueNormalizer,
  ): Promise<NormalizedEventArgs> {
    // Args should be object or array only
    const args = typeof rawArgs === 'object' ? rawArgs : [rawArgs];

    const result = {} as NormalizedEventArgs;

    for (const [rawKey, newKey] of Object.entries(keysMap)) {
      if (args[rawKey]) {
        result[newKey] = valueNormalizerFn
          ? await valueNormalizerFn(args[rawKey])
          : args[rawKey];
      }
    }

    return result;
  }

  private async normalizeAccountValue(rawAddress: RawAccount) {
    const normalizedAddress = await this.accountService.processRawAddress({
      rawAddress,
    });

    return normalizedAddress;
  }
}
