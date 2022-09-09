import { Injectable } from '@nestjs/common';
import {
  EventName,
  EVENT_ARGS_ACCOUNT_KEYS,
  EVENT_ARGS_ACCOUNT_KEY_DEFAULT,
  EVENT_ARGS_COLLECTION_ID_KEY_DEFAULT,
  EVENT_ARGS_TOKEN_ID_KEY_DEFAULT,
} from '@common/constants';
import { NormalizedEventArgs, RawEventArgs } from './event.types';
import { SdkService } from '../../sdk/sdk.service';

type EventArgsValueNormalizer = (rawValue: string | number | object) => unknown;

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
  [EventName.PROPERTY_PERMISSION_SET]: {
    collectionId: 0,
    tokenId: 1,
    accounts: 2,
  },
  [EventName.TOKEN_PROPERTY_DELETED]: {
    collectionId: 0,
    tokenId: 1,
    accounts: 2,
  },
  [EventName.TOKEN_PROPERTY_SET]: {
    collectionId: 0,
    tokenId: 1,
    accounts: 2,
  },
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
  constructor(private sdkService: SdkService) {}

  static extractRawAmountValue(
    args: string | { amount?: string; value?: string },
  ) {
    return typeof args === 'string' ? args : args?.amount || args?.value;
  }

  getNormalizedArguments(
    eventName: string,
    rawArgs: RawEventArgs,
  ): NormalizedEventArgs | null {
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

    const result = {
      ...this.normalizeArgs(
        rawArgs,
        accountKeysMap,
        this.normalizeAccountValue.bind(this),
      ),
      ...this.normalizeArgs(rawArgs, otherKeysMap),
    };

    return Object.keys(result).length ? result : null;
  }

  private normalizeArgs(
    rawArgs: RawEventArgs,
    keysMap: { [key: string]: string },
    valueNormalizerFn?: EventArgsValueNormalizer,
  ): NormalizedEventArgs {
    // Args should be object or array only
    const args = typeof rawArgs === 'object' ? rawArgs : [rawArgs];

    const result = {} as NormalizedEventArgs;

    Object.entries(keysMap).forEach(([key, newKey]) => {
      if (args[key]) {
        result[newKey] = valueNormalizerFn
          ? valueNormalizerFn(args[key])
          : args[key];
      }
    });

    return result;
  }

  private normalizeAccountValue(rawValue: string | object) {
    // todo: Go to sdk

    // todo: get inner value if object

    return rawValue;
  }

  /**
   * Extracts address values from event args.
   *
   * We have different kinds of args formats and should process all of them:
   * - Common.CollectionCreated
   *   [number, number, "0x8eaxxx"]
   *
   * - Common.ItemCreated
   *   [number, number, {"__kind":"Substrate","value":"0x8eaxxx"}, "1"]
   *   [number, number, {"__kind":"Ethereum","value":"0x76xxx"}, "1"]
   *
   * - Common.Transfer
   *   [number, number, {"__kind":"Ethereum","value":"0xacxxx"},{"__kind":"Ethereum","value":"0x87xxx"}, "1"]
   *   [number, number, {"__kind":"Substrate","value":"0x7cxxx"},{"__kind":"Ethereum","value":"0xf8xxx"}, "10"]
   *
   * - Unique.CollectionAdminAdded
   *   [number, {"__kind":"Ethereum","value":"0x1bxxx"}]
   *   [number, {"__kind":"Substrate","value":"0x08xxx"}]
   *
   * - Unique.CollectionOwnedChanged
   *   [number,"0xf7xxx"]
   *
   * - Balances.Deposit
   *   {"amount":"88476999937090000","who":"0x6dxxx"} // Both formats possible
   *   ['0xb892xxxx', '7911651004843']
   *
   * - Balances.Endowed
   *   {"account":"0xacxxx","freeBalance":"100000000000000000000"}
   *
   * - Balances.Transfer
   *   {"amount":"1267650600228140924496766115376","from":"0x1cbxxx","to":"0x36xxx"}
   *
   * - Balances.Withdraw
   *   {"amount":"88476999937090000","who":"0x90xxx"} // Both formats possible
   *   ['0xb892xxxx', '7937051004605']
   *
   * - System.NewAccount
   *   {"amount":"88476999937090000","who":"0x90xxx"} // Both formats possible
   *   "0xc89axxx"
   *
   */
  static extractAddressValues(
    eventName: string,
    args: string | object | (string | number)[],
  ): string[] {
    const addresses = [];

    const argsObj = {} as {
      account?: string;
      from?: string;
      to?: string;
      who?: string;
    };

    // todo: EventName.APPROVED
    // todo: EventName.BALANCES_BALANCE_SET,
    // todo: EventName.BALANCES_RESERVED,
    // todo: EventName.BALANCES_UNRESERVED,
    // todo: EventName.ALLOW_LIST_ADDRESS_ADDED,
    // todo: EventName.COLLECTION_ADMIN_REMOVED,
    // todo: EventName.COLLECTION_SPONSOR_SET,
    // todo: EventName.SPONSORSHIP_CONFIRMED,

    // Convert array args into object format
    if (typeof args === 'string') {
      argsObj.account = args;
    } else if (Array.isArray(args)) {
      switch (eventName) {
        case EventName.BALANCES_WITHDRAW:
        case EventName.BALANCES_DEPOSIT:
          argsObj.account = args[0] as string;
          break;
        case EventName.COLLECTION_ADMIN_ADDED:
        case EventName.COLLECTION_OWNED_CHANGED:
          argsObj.account = args[1] as string;
          break;
        case EventName.COLLECTION_CREATED:
        case EventName.ITEM_CREATED:
          argsObj.account = args[2] as string;
          break;
        case EventName.TRANSFER:
          argsObj.from = args[2] as string;
          argsObj.to = args[3] as string;
      }
    } else {
      // Args are in object format already.
      Object.assign(argsObj, args);
    }

    // Process object formatted args.
    ['account', 'who', 'from', 'to'].forEach((k) => {
      const v = argsObj[k];
      if (v) {
        addresses.push(typeof v == 'string' ? v : v?.value);
      }
    });

    return addresses;
  }
}
