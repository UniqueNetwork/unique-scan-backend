import { EventName } from '@common/constants';
import { Injectable } from '@nestjs/common';

export const EVENTS_WITH_ADDRESSES = [];

// type ArgsDescriptor = {
//   accounts?: string | number | { [oldKey: string]: string };
//   collectionId?: number;
//   tokenId?: number;
// };

const EVENT_ARGS_DESCRIPTORS = {
  [EventName.ITEM_CREATED]: {
    accounts: 2,
  },
  [EventName.ITEM_DESTROYED]: {
    accounts: 2,
  },
  [EventName.TRANSFER]: {
    collectionId: 0,
    tokenId: 1,
    accounts: { '2': 'from', '3': 'to' },
  },
  [EventName.APPROVED]: {
    collectionId: 0,
    tokenId: 1,
    accounts: { '2': 'sender', '3': 'spender' },
  },
  [EventName.COLLECTION_CREATED]: {
    collectionId: 0,
    accounts: 2,
  },
};

export type RawEventArgs =
  | number
  | string
  | object
  | (string | number | object)[];

const ACCOUNT_KEY_DEFAULT = 'account';
const COLLECTION_ID_KEY_DEFAULT = 'collectionId';
const TOKEN_ID_KEY_DEFAULT = 'tokenId';

const ACCOUNT_KEYS = [ACCOUNT_KEY_DEFAULT, 'who', 'from', 'to'] as const;

type AccountKey = typeof ACCOUNT_KEYS[number];

export type NormalizedEventArgs = {
  collectionId?: number;
  tokenId?: number;
} & { [key in AccountKey]: string | undefined };

@Injectable()
export class EventArgumentsService {
  static extractRawAmountValue(
    args: string | { amount?: string; value?: string },
  ) {
    return typeof args === 'string' ? args : args?.amount || args?.value;
  }

  normalizeArguments(
    eventName: string,
    rawArgs: RawEventArgs,
  ): NormalizedEventArgs | null {
    const args = typeof rawArgs === 'object' ? rawArgs : [rawArgs];
    // const argsObj = Array.isArray(args)
    //   ? Object.fromEntries(args.map((v, i) => [v, i]))
    //   : args;

    let result = {} as NormalizedEventArgs;

    const argsDescriptor = EVENT_ARGS_DESCRIPTORS[eventName];

    let keysMap = {};

    keysMap = {
      ...keysMap,
      ...Object.fromEntries(ACCOUNT_KEYS.map((v) => [v, v])),
    };

    if (argsDescriptor) {
      const {
        accounts: accountsKeys,
        collectionId: collectionIdKey = null,
        tokenId: tokenIdKey = null,
      } = argsDescriptor;

      if (accountsKeys !== null) {
        if (typeof accountsKeys === 'object') {
          keysMap = {
            ...keysMap,
            ...accountsKeys,
          };
        } else {
          keysMap[accountsKeys] = ACCOUNT_KEY_DEFAULT;
        }
      }

      if (collectionIdKey !== null) {
        keysMap[collectionIdKey] = COLLECTION_ID_KEY_DEFAULT;
      }

      if (tokenIdKey !== null) {
        keysMap[tokenIdKey] = TOKEN_ID_KEY_DEFAULT;
      }
    }

    result = {
      ...result,
      ...this.normalizeAccounts(args, keysMap),
    };

    return Object.keys(result).length ? result : null;
  }

  private normalizeAccounts(
    args: object,
    accountKeysMap: { [key: string]: string },
  ): NormalizedEventArgs {
    const result = {} as NormalizedEventArgs;

    Object.entries(accountKeysMap).forEach(([key, newKey]) => {
      // console.log(key, newKey, args);
      if (args[key]) {
        // todo: Go to sdk
        // todo: get inner value if object
        const newValue = args[key];

        result[newKey] = newValue;
      }
    });

    return result;
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
