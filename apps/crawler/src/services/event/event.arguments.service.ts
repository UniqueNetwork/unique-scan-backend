import { Injectable } from '@nestjs/common';
import {
  EVENT_ARGS_ACCOUNT_KEYS,
  EVENT_ARGS_AMOUNT_KEY_DEFAULT,
  EVENT_ARGS_AMOUNT_KEYS,
  EVENT_ARGS_COLLECTION_ID_KEY_DEFAULT,
  EVENT_ARGS_TOKEN_ID_KEY_DEFAULT,
  EventName,
} from '@common/constants';
import { EventArgs, EventValues } from './event.types';
import { AccountService } from '../account/account.service';
import { capitalize, getAmount } from '@common/utils';
import { AccountRecord } from '../account/account.types';
import { nesting } from '@unique-nft/utils/address';
import * as console from 'console';
type EventArgsValueNormalizer = (
  rawValue: string | number | object,
) => Promise<unknown>;

type EventArgsDescriptor = {
  accounts?: number | { [rawKey: string]: string };
  collectionId?: number;
  tokenId?: number;
  amount?: number | { [rawKey: string]: string };
};

type EventArgsDescriptorProc = {
  account?: number | { [rawKey: string]: string };
  collectionId?: number;
  tokenId?: number;
  amount?: number | { [rawKey: string]: string };
  props?: Function;
};

type EventArgsProc = Omit<EventArgsDescriptorProc, 'props'>;

const EVENT_ARGS_DESCRIPTORS = {
  // System
  [EventName.NEW_ACCOUNT]: { account: 0 },

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
  private self: EventArgumentsService;
  private event_args_parser = {};

  constructor(private accountService: AccountService) {
    this.self = this;
    this.event_args_parser = {
      // System
      [EventName.NEW_ACCOUNT]: {
        account: 0,
        props: this.parserBalances.bind(this),
      },

      // Common
      [EventName.APPROVED]: {
        collectionId: 0,
        tokenId: 1,
        sender: 2,
        spender: 3,
      },
      [EventName.COLLECTION_CREATED]: {
        collectionId: 0,
        tokenId: 1,
        account: 2,
      },
      [EventName.COLLECTION_DESTROYED]: { collectionId: 0 },
      [EventName.COLLECTION_PROPERTY_DELETED]: { collectionId: 0 },
      [EventName.COLLECTION_PROPERTY_SET]: { collectionId: 0 },
      [EventName.ITEM_CREATED]: {
        collectionId: 0,
        tokenId: 1,
        account: 2,
        amount: 3,
        props: this.parserItemCreated.bind(this),
      },
      [EventName.ITEM_DESTROYED]: { collectionId: 0, tokenId: 1, account: 2 },
      [EventName.PROPERTY_PERMISSION_SET]: { collectionId: 0 }, // No docs, maybe wrong
      [EventName.TOKEN_PROPERTY_DELETED]: { collectionId: 0, tokenId: 1 },
      [EventName.TOKEN_PROPERTY_SET]: {
        collectionId: 0,
        tokenId: 1,
        props: this.parserTokenProperty.bind(this),
      },
      [EventName.TRANSFER]: {
        collectionId: 0,
        tokenId: 1,
        from: 2,
        to: 3,
      },

      // Balances
      [EventName.BALANCES_BALANCE_SET]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
      },
      [EventName.BALANCES_DEPOSIT]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
      },

      [EventName.BALANCES_DUST_LOST]: {
        account: 0,
        props: this.parserBalances.bind(this),
      },
      [EventName.BALANCES_ENDOWED]: {
        account: 0,
        freeBalance: 1,
        props: this.parserBalances.bind(this),
      },
      [EventName.BALANCES_RESERVED]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
      },
      [EventName.BALANCES_RESERVED_REPATRIATED]: {
        from: 0,
        to: 1,
        props: this.parserBalances.bind(this),
      },
      [EventName.BALANCES_SLASHED]: {
        account: 0,
        props: this.parserBalances.bind(this),
      },
      [EventName.BALANCES_TRANSFER]: {
        from: 0,
        to: 1,
        amount: 2,
        props: this.parserBalancesTransfer.bind(this),
      },
      [EventName.BALANCES_UNRESERVED]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
      },
      [EventName.BALANCES_WITHDRAW]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
      },

      // Unique
      [EventName.OLD_ALLOW_LIST_ADDRESS_ADDED]: { collectionId: 0, account: 1 },
      [EventName.ALLOW_LIST_ADDRESS_ADDED]: { collectionId: 0, account: 1 },
      [EventName.OLD_ALLOW_LIST_ADDRESS_REMOVED]: {
        collectionId: 0,
        account: 1,
      },
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
      [EventName.TREASURY_DEPOSIT]: {
        amount: 0,
        props: this.parserTreasure.bind(this),
      },
    } as { [eventName: string]: EventArgsDescriptorProc };
  }

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
    //console.log(`<<<<<<- ${eventName} ->>>>>>>`);
    //console.dir({ rawArgs, argsDescriptor }, { depth: 10 });
    const [amountValues] = await Promise.all([
      this.normalizeAmountArgs(rawArgs, argsDescriptor),
    ]);

    const nestedTo = this.normalizeNestedTokenAddr(eventName, rawArgs);

    const result: EventValues = {
      ...amountValues,
      ...nestedTo,
    };

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
    return {};
    if (argsDescriptor) {
      // Add event specific keys map.
      for (const [key, val] of Object.entries(argsDescriptor)) {
        if (
          (key === 'from' && rawArgs.length === 5) ||
          (key === 'to' && rawArgs.length === 5)
        ) {
          const getAccountData = Object.entries(rawArgs[`${val}`]).map(
            (v) => `{ "value": "${v[1]}", "__kind": "${v[0]}" }`,
          );
          //this.accountNormalizer(JSON.parse(getAccountData[0]));
          console.dir(
            { normalizeAccountArgs: JSON.parse(getAccountData[0]) },
            { depth: 10 },
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
        } else if (key === 'account') {
          if (rawArgs.length === 4) {
            const getAccountData = Object.entries(rawArgs[`${val}`]).map(
              (v) => `{ "value": "${v[1]}", "__kind": "${capitalize(v[0])}" }`,
            );
            result[key] = <any>JSON.parse(getAccountData[0]);
            this.accountNormalizer(JSON.parse(getAccountData[0]));
          }
          if (rawArgs.length === 1) {
            result[key] = rawArgs[`${val}`];
          }
        } else if (key === 'from' || key === 'to') {
          if (rawArgs.length === 5) {
            const getAccountData = Object.entries(rawArgs[`${val}`]).map(
              (v) => `{ "value": "${v[1]}", "__kind": "${capitalize(v[0])}" }`,
            );
            result[key] = JSON.parse(getAccountData[0]);
            this.accountNormalizer(JSON.parse(getAccountData[0]));
          }
          if (rawArgs.length === 3) {
            result[key] = rawArgs[`${val}`];
            this.accountNormalizer(rawArgs[`${val}`]);
          }
        } else if (
          key === 'sender' ||
          (key === 'spender' && rawArgs.length === 5)
        ) {
          const getAccountData = Object.entries(rawArgs[`${val}`]).map(
            (v) => `{ "value": "${v[1]}", "__kind": "${capitalize(v[0])}" }`,
          );
          result[key] = JSON.parse(getAccountData[0]);
          this.accountNormalizer(JSON.parse(getAccountData[0]));
        } else {
          result[key] = rawArgs[`${val}`];
        }
      }
    }
    // console.dir(result, { depth: 10 });
    return result;
  }

  private async normalizeAmountArgsOld(
    rawArgs: EventArgs,
    argsDescriptor: EventArgsDescriptor | null,
  ): Promise<EventValues> {
    const keysMap = { ...AMOUNT_ARGS_KEYS_MAP_DEFAULT };

    if (argsDescriptor) {
      // Add event specific keys map.
      const {
        amount: amountKeysMap = null, // Use null as default to be albe using keys like 0.
      } = argsDescriptor;

      if (amountKeysMap !== null) {
        if (typeof amountKeysMap === 'object') {
          Object.assign(keysMap, amountKeysMap);
        } else {
          keysMap[amountKeysMap] = EVENT_ARGS_AMOUNT_KEY_DEFAULT;
        }
      }
    }

    return this.normalize(rawArgs, keysMap, this.amountNormalizer.bind(this));
  }

  private async normalizeOtherArgs(
    rawArgs: EventArgs,
    argsDescriptor: EventArgsDescriptor | null,
  ): Promise<EventValues> {
    const keysMap = {};
    return {};
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

  private parserItemCreated(items, argsRaw) {
    const values = {} as EventValues;
    const data = [];
    Object.entries(argsRaw).map((key, val) => {
      if (key[0] == 'props') {
        return;
      }
      if (key[0] === 'account') {
        values[`${key[0]}`] = JSON.parse(
          Object.entries(items[val])
            .map(
              (data) =>
                `{ "value": "${data[1]}", "__king": "${capitalize(data[0])}" }`,
            )
            .toString(),
        );
        data.push(values[`${key[0]}`]);
      } else {
        data.push(items[`${val}`]);
        values[`${key[0]}`] = items[`${val}`];
      }
    });

    return { data, values };
  }

  private parserBalances(items, argsRaw) {
    const values = {} as EventValues;
    const valueForData = {} as EventValues;
    const data = [];
    Object.entries(argsRaw).map((key) => {
      if (key[0] == 'props') {
        return;
      }
      key[1] === 1
        ? (values[`${key[0]}`] = this.amountNormalizer(items[`${key[1]}`]))
        : (values[`${key[0]}`] = items[`${key[1]}`]);
      key[1] === 1
        ? (valueForData[`${key[0]}`] = String(BigInt(items[`${key[1]}`])))
        : (valueForData[`${key[0]}`] = items[`${key[1]}`]);
    });
    data.push(valueForData);

    return { data, values };
  }

  private parserBalancesTransfer(items, argsRaw) {
    const values = {} as EventValues;
    const valueForData = {} as EventValues;
    const data = [];
    Object.entries(argsRaw).map((key) => {
      if (key[0] == 'props') {
        return;
      }
      key[1] === 2
        ? (values[`${key[0]}`] = this.amountNormalizer(items[`${key[1]}`]))
        : (values[`${key[0]}`] = items[`${key[1]}`]);
      key[1] === 2
        ? (valueForData[`${key[0]}`] = String(BigInt(items[`${key[1]}`])))
        : (valueForData[`${key[0]}`] = items[`${key[1]}`]);
    });
    data.push(valueForData);

    return { data, values };
  }

  /**
   * Parses event {EVENT_TREASURE}
   * @param items
   * @param argsRaw
   * @private
   */
  private parserTreasure(items, argsRaw) {
    const values = {} as EventValues;
    const data = [];
    Object.entries(argsRaw).map((key, val) => {
      if (key[0] == 'props') {
        return;
      }
      values[`${key[0]}`] = this.amountNormalizer(items[`${val}`]);
      data.push({ value: this.amountNormalizer(items[`${val}`]) });
    });

    return { data, values };
  }

  private newAccountNormalizer(items, argsRaw) {}

  private parserTokenProperty(items, argsRaw) {
    //delete argsRaw['props'];
    const values = {} as EventValues;
    const data = items;
    Object.entries(argsRaw).map((key, val) => {
      if (key[0] == 'props') {
        return;
      }
      values[`${key[0]}`] = items[`${val}`];
    });

    return { data, values };
  }

  private itemNormap(items, argsRaw) {
    delete argsRaw['props'];
    return Object.entries(argsRaw);
  }

  eventDataConverter(dataArray, eventName) {
    const argsDescriptor = this.event_args_parser[eventName];

    if (!argsDescriptor) {
      return null;
    }
    const { props } = argsDescriptor;

    const amountValues = props(dataArray, argsDescriptor);

    return { eventName, amountValues, props, proc: argsDescriptor.props };
  }
}
