import { Injectable } from '@nestjs/common';
import {
  EventName,
  EVENT_ARGS_ACCOUNT_KEYS,
  EVENT_ARGS_ACCOUNT_KEY_DEFAULT,
  EVENT_ARGS_AMOUNT_KEYS,
  EVENT_ARGS_AMOUNT_KEY_DEFAULT,
  EVENT_ARGS_COLLECTION_ID_KEY_DEFAULT,
  EVENT_ARGS_TOKEN_ID_KEY_DEFAULT,
  EventModeCollection,
} from '@common/constants';
import { EventValues, EventArgs } from './event.types';
import { AccountService } from '../account/account.service';
import { getAmount } from '@common/utils';
import { AccountRecord } from '../account/account.types';
import { nesting } from '@unique-nft/utils/address';
import * as console from 'console';
import { red } from 'cli-color';

type EventArgsValueNormalizer = (
  rawValue: string | number | object,
) => Promise<unknown>;

type EventArgsDescriptor = {
  accounts?: number | { [rawKey: string]: string };
  collectionId?: number;
  tokenId?: number;
  amount?: number | { [rawKey: string]: string };
};

const EVENT_ARGS_DESCRIPTORS = {
  // System
  [EventName.NEW_ACCOUNT]: { accounts: 0 },

  // Common
  [EventName.APPROVED]: { collectionId: 0, tokenId: 1, sender: 2, spender: 3 },
  [EventName.COLLECTION_CREATED]: { account: 2, collectionId: 0, tokenId: 1 },
  [EventName.COLLECTION_DESTROYED]: { collectionId: 0 },
  [EventName.COLLECTION_PROPERTY_DELETED]: { collectionId: 0 },
  [EventName.COLLECTION_PROPERTY_SET]: { collectionId: 0 },
  [EventName.ITEM_CREATED]: { collectionId: 0, tokenId: 1, account: 2 },
  [EventName.ITEM_DESTROYED]: { collectionId: 0, tokenId: 1, account: 2 },
  [EventName.PROPERTY_PERMISSION_SET]: { collectionId: 0 }, // No docs, maybe wrong
  [EventName.TOKEN_PROPERTY_DELETED]: { collectionId: 0, tokenId: 1 },
  [EventName.TOKEN_PROPERTY_SET]: { collectionId: 0, tokenId: 1 },
  [EventName.TRANSFER]: { collectionId: 0, tokenId: 1, from: 2, to: 3 },

  // Balances
  [EventName.BALANCES_BALANCE_SET]: { who: 0, amount: 1 },
  [EventName.BALANCES_DEPOSIT]: { who: 0, amount: 1 },
  [EventName.BALANCES_WITHDRAW]: { who: 0, amount: 1 },
  [EventName.BALANCES_DUST_LOST]: { account: 0 },
  [EventName.BALANCES_ENDOWED]: { account: 0 },
  [EventName.BALANCES_RESERVED]: { who: 0, amount: 1 },
  [EventName.BALANCES_RESERVED_REPATRIATED]: { from: 0, to: 1 },
  [EventName.BALANCES_SLASHED]: { account: 0 },
  [EventName.BALANCES_TRANSFER]: { from: 0, to: 1, amount: 2 },
  [EventName.BALANCES_UNRESERVED]: { who: 0, amount: 1 },
  [EventName.BALANCES_WITHDRAW]: { who: 0, amount: 1 },

  // Unique
  [EventName.OLD_ALLOW_LIST_ADDRESS_ADDED]: { collectionId: 0, account: 1 },
  [EventName.ALLOW_LIST_ADDRESS_ADDED]: { collectionId: 0, account: 1 },
  [EventName.OLD_ALLOW_LIST_ADDRESS_REMOVED]: { collectionId: 0, account: 1 },
  [EventName.ALLOW_LIST_ADDRESS_REMOVED]: { collectionId: 0, account: 1 },
  [EventName.OLD_COLLECTION_ADMIN_ADDED]: { collectionId: 0, account: 1 },
  [EventName.COLLECTION_ADMIN_ADDED]: { collectionId: 0, account: 1 },
  [EventName.OLD_COLLECTION_ADMIN_REMOVED]: { collectionId: 0, account: 1 },
  [EventName.COLLECTION_ADMIN_REMOVED]: { collectionId: 0, account: 1 },
  [EventName.OLD_COLLECTION_OWNED_CHANGED]: { collectionId: 0, account: 1 },
  [EventName.COLLECTION_OWNED_CHANGED]: { collectionId: 0, account: 1 },
  [EventName.OLD_COLLECTION_LIMIT_SET]: { collectionId: 0 },
  [EventName.COLLECTION_LIMIT_SET]: { collectionId: 0 },
  [EventName.OLD_COLLECTION_PERMISSION_SET]: { collectionId: 0 },
  [EventName.COLLECTION_PERMISSION_SET]: { collectionId: 0 },
  [EventName.OLD_COLLECTION_SPONSOR_SET]: { collectionId: 0, account: 1 },
  [EventName.COLLECTION_SPONSOR_SET]: { collectionId: 0, account: 1 },
  [EventName.OLD_COLLECTION_SPONSOR_REMOVED]: { collectionId: 0 },
  [EventName.COLLECTION_SPONSOR_REMOVED]: { collectionId: 0 },
  [EventName.OLD_SPONSORSHIP_CONFIRMED]: { collectionId: 0, account: 1 },
  [EventName.SPONSORSHIP_CONFIRMED]: { collectionId: 0, account: 1 },

  // Treasury
  [EventName.TREASURY_DEPOSIT]: { amount: 0 },
} as { [eventName: string]: EventArgsDescriptor };

const ACCOUNT_ARGS_KEYS_MAP_DEFAULT = Object.fromEntries(
  EVENT_ARGS_ACCOUNT_KEYS.map((v) => [v, v]),
);

const AMOUNT_ARGS_KEYS_MAP_DEFAULT = Object.fromEntries(
  EVENT_ARGS_AMOUNT_KEYS.map((v) => [v, EVENT_ARGS_AMOUNT_KEY_DEFAULT]),
);

@Injectable()
export class EventArgumentsService {
  constructor(private accountService: AccountService) {}

  /**
   * Extracts data values from raw event arguments:
   * - collectionId
   * - tokenId
   * - account addresses - transforms into chain specific format and stores account via AccountService
   * - amount
   *
   * and returns those event values.
   */

  async processEventArgumentsNew(
    eventName: string,
    rawArgs: EventArgs,
  ): Promise<EventValues | null> {
    if (!rawArgs) {
      return null;
    }

    const argsDescriptor = EVENT_ARGS_DESCRIPTORS[eventName];
    //console.log(red(`<<<<<<- ${eventName} ->>>>>>>`));
    //console.dir({ rawArgs, argsDescriptor }, { depth: 10 });
    const [accountsValues, amountValues, otherValues] = await Promise.all([
      this.normalizeAccountArgs(rawArgs, argsDescriptor),
      this.normalizeAmountArgs(rawArgs, argsDescriptor),
      this.normalizeOtherArgs(rawArgs, argsDescriptor),
    ]);
    //console.dir({ accountsValues, amountValues, otherValues }, { depth: 10 });
    const nestedTo = this.normalizeNestedTokenAddr(eventName, rawArgs);

    const result: EventValues = {
      ...accountsValues,
      ...amountValues,
      ...otherValues,
      ...nestedTo,
    };
    //console.log('RESULT: ', result);
    return Object.keys(result).length ? result : null;
  }

  private normalize(
    rawArgs: EventArgs,
    keysMap: { [key: string]: string },
    valueNormalizerFn?: EventArgsValueNormalizer,
  ): EventValues {
    // Args should be object or array only
    const args = typeof rawArgs === 'object' ? rawArgs : [rawArgs];

    const result = {} as EventValues;

    for (const [rawKey, newKey] of Object.entries(keysMap)) {
      if (args[rawKey]) {
        result[newKey] = valueNormalizerFn
          ? valueNormalizerFn(args[rawKey])
          : args[rawKey];
      }
    }

    return result;
  }

  private normalizeNestedTokenAddr(
    eventName: string,
    rawArgs: any,
  ): EventValues {
    const result = {} as EventValues;

    if (
      eventName != EventName.TRANSFER ||
      !Array.isArray(rawArgs) ||
      !rawArgs[3]
    ) {
      return result;
    }

    try {
      result.nestedTo = nesting.addressToIds(rawArgs[3].ethereum); // TODO: check utils nested object
    } finally {
      return result;
    }
  }

  private async normalizeAccountArgs(
    rawArgs: any,
    argsDescriptor: EventArgsDescriptor | null,
  ): Promise<EventValues> {
    const result = {} as EventValues;

    if (argsDescriptor) {
      // Add event specific keys map.
      for (const [key, val] of Object.entries(argsDescriptor)) {
        if (key === 'from' || (key === 'to' && rawArgs.length === 5)) {
          const getAccountData = Object.entries(rawArgs[`${val}`]).map(
            (v) => `{ "value": "${v[1]}", "__kind": "${v[0]}" }`,
          );
          result[key] = JSON.parse(getAccountData[0]);
        } else {
          result[key] = rawArgs[`${val}`];
        }
      }
    }

    return result;
  }

  private async normalizeAmountArgs(
    rawArgs: any,
    argsDescriptor: EventArgsDescriptor | null,
  ): Promise<EventValues> {
    const result = {} as EventValues;
    if (argsDescriptor) {
      for (const [key, val] of Object.entries(argsDescriptor)) {
        if (key === 'amount') {
          const amNumber = BigInt(rawArgs[`${val}`]).toString();
          result[key] = this.amountNormalizer(amNumber);
        } else if (key === 'account' && rawArgs.length === 4) {
          const getAccountData = Object.entries(rawArgs[`${val}`]).map(
            (v) => `{ "value": "${v[1]}", "__kind": "${v[0]}" }`,
          );
          result[key] = <any>JSON.parse(getAccountData[0]);
        } else if (key === 'from' || (key === 'to' && rawArgs.length === 5)) {
          const getAccountData = Object.entries(rawArgs[`${val}`]).map(
            (v) => `{ "value": "${v[1]}", "__kind": "${v[0]}" }`,
          );
          result[key] = JSON.parse(getAccountData[0]);
        } else if (
          key === 'sender' ||
          (key === 'spender' && rawArgs.length === 5)
        ) {
          const getAccountData = Object.entries(rawArgs[`${val}`]).map(
            (v) => `{ "value": "${v[1]}", "__kind": "${v[0]}" }`,
          );
          result[key] = JSON.parse(getAccountData[0]);
        } else {
          result[key] = rawArgs[`${val}`];
        }
      }
    }
    // console.dir(result, { depth: 10 });
    return result;
  }

  private async normalizeOtherArgs(
    rawArgs: EventArgs,
    argsDescriptor: EventArgsDescriptor | null,
  ): Promise<EventValues> {
    const keysMap = {};

    if (argsDescriptor) {
      // Add event specific keys map.
      const {
        collectionId: collectionIdKey = null, // Use null as default to be albe using keys like 0.
        tokenId: tokenIdKey = null,
      } = argsDescriptor;

      if (collectionIdKey !== null) {
        keysMap[collectionIdKey] = EVENT_ARGS_COLLECTION_ID_KEY_DEFAULT;
      }

      if (tokenIdKey !== null) {
        keysMap[tokenIdKey] = EVENT_ARGS_TOKEN_ID_KEY_DEFAULT;
      }
    }

    return this.normalize(rawArgs, keysMap);
  }

  private async accountNormalizer(account: AccountRecord) {
    return this.accountService.processRawAccountRecord({ account });
  }

  private amountNormalizer(amount: string) {
    return amount ? getAmount(amount) : null;
  }
}
