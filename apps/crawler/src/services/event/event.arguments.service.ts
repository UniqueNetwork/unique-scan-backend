import { Injectable } from '@nestjs/common';
import { EventName } from '@common/constants';
import { EventArgs, EventValues } from './event.types';
import { AccountService } from '../account/account.service';
import { capitalize, checkoutAddress, getAmount } from '@common/utils';
import { AccountAddressData, AccountRecord } from '../account/account.types';
import { nesting } from '@unique-nft/utils/address';
import * as console from 'console';
type EventArgsValueNormalizer = (
  rawValue: string | number | object,
) => Promise<unknown>;

interface EventData {
  data: any;
  values: any;
}

type EventArgsDescriptorProc = {
  account?: number | { [rawKey: string]: string };
  collectionId?: number;
  tokenId?: number;
  amount?: number | { [rawKey: string]: string };
  props?: Function;
};

const EVENT_ACCOUNT_ACTIVE = [
  // Balances
  EventName.BALANCES_BALANCE_SET,
  EventName.BALANCES_DEPOSIT,
  EventName.BALANCES_DUST_LOST,
  EventName.BALANCES_ENDOWED,
  EventName.BALANCES_RESERVED,
  EventName.BALANCES_RESERVED_REPATRIATED,
  EventName.BALANCES_SLASHED,
  EventName.BALANCES_TRANSFER,
  EventName.BALANCES_UNRESERVED,
  EventName.BALANCES_WITHDRAW,

  // Common
  EventName.APPROVED,
  EventName.COLLECTION_CREATED,
  EventName.ITEM_CREATED,
  EventName.ITEM_DESTROYED,
  EventName.TRANSFER,

  // System
  EventName.NEW_ACCOUNT,

  // Unique
  EventName.OLD_ALLOW_LIST_ADDRESS_ADDED,
  EventName.OLD_ALLOW_LIST_ADDRESS_REMOVED,
  EventName.OLD_COLLECTION_ADMIN_ADDED,
  EventName.OLD_COLLECTION_ADMIN_REMOVED,
  EventName.OLD_COLLECTION_OWNED_CHANGED,
  EventName.OLD_COLLECTION_SPONSOR_SET,
  EventName.OLD_COLLECTION_SPONSOR_REMOVED,
  EventName.OLD_SPONSORSHIP_CONFIRMED,

  EventName.ALLOW_LIST_ADDRESS_ADDED,
  EventName.ALLOW_LIST_ADDRESS_REMOVED,
  EventName.COLLECTION_ADMIN_ADDED,
  EventName.COLLECTION_ADMIN_REMOVED,
  EventName.COLLECTION_OWNED_CHANGED,
  EventName.COLLECTION_SPONSOR_SET,
  EventName.COLLECTION_SPONSOR_REMOVED,
  EventName.SPONSORSHIP_CONFIRMED,
];

@Injectable()
export class EventArgumentsService {
  private self: EventArgumentsService;
  private EVENT_ARGS_PARSER = {};

  constructor(private accountService: AccountService) {
    this.self = this;
    this.EVENT_ARGS_PARSER = {
      // System
      [EventName.NEW_ACCOUNT]: {
        account: 0,
        props: this.parserBalances.bind(this),
        owner: 0,
      },

      // Common
      [EventName.APPROVED]: {
        collectionId: 0,
        tokenId: 1,
        sender: 2,
        spender: 3,
        success: 4,
        props: this.parserApprovedOrCommonTransfer.bind(this),
        owner: 2,
      },
      [EventName.COLLECTION_CREATED]: {
        collectionId: 0,
        tokenId: 1,
        account: 2,
        props: this.parserCollection.bind(this),
        owner: 2,
      },
      [EventName.COLLECTION_DESTROYED]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      },
      [EventName.COLLECTION_PROPERTY_DELETED]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      },
      [EventName.COLLECTION_PROPERTY_SET]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      },
      [EventName.ITEM_CREATED]: {
        collectionId: 0,
        tokenId: 1,
        account: 2,
        amount: 3,
        props: this.parserItemCreated.bind(this),
        owner: 2,
      },
      [EventName.ITEM_DESTROYED]: {
        collectionId: 0,
        tokenId: 1,
        account: 2,
        props: this.parserItemCreated.bind(this),
        owner: 2,
      },
      [EventName.PROPERTY_PERMISSION_SET]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      }, // No docs, maybe wrong
      [EventName.TOKEN_PROPERTY_DELETED]: {
        collectionId: 0,
        tokenId: 1,
        props: this.parserTokenProperty.bind(this),
      },
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
        amount: 4,
        props: this.parserApprovedOrCommonTransfer.bind(this),
        owner: 2,
      },

      // Balances
      [EventName.BALANCES_BALANCE_SET]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
        owner: 0,
      },
      [EventName.BALANCES_DEPOSIT]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
        owner: 0,
      },

      [EventName.BALANCES_DUST_LOST]: {
        account: 0,
        props: this.parserBalances.bind(this),
        owner: 0,
      },
      [EventName.BALANCES_ENDOWED]: {
        account: 0,
        freeBalance: 1,
        props: this.parserBalances.bind(this),
        owner: 0,
      },
      [EventName.BALANCES_RESERVED]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
        owner: 0,
      },
      [EventName.BALANCES_RESERVED_REPATRIATED]: {
        from: 0,
        to: 1,
        props: this.parserBalances.bind(this),
        owner: 0,
      },
      [EventName.BALANCES_SLASHED]: {
        account: 0,
        props: this.parserBalances.bind(this),
        owner: 0,
      },
      [EventName.BALANCES_TRANSFER]: {
        from: 0,
        to: 1,
        amount: 2,
        props: this.parserBalancesTransfer.bind(this),
        owner: 0,
      },
      [EventName.BALANCES_UNRESERVED]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
        owner: 0,
      },
      [EventName.BALANCES_WITHDRAW]: {
        who: 0,
        amount: 1,
        props: this.parserBalances.bind(this),
        owner: 0,
      },

      // Unique
      [EventName.OLD_ALLOW_LIST_ADDRESS_ADDED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.ALLOW_LIST_ADDRESS_ADDED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.OLD_ALLOW_LIST_ADDRESS_REMOVED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
      },
      [EventName.ALLOW_LIST_ADDRESS_REMOVED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.OLD_COLLECTION_ADMIN_ADDED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.COLLECTION_ADMIN_ADDED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.OLD_COLLECTION_ADMIN_REMOVED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.COLLECTION_ADMIN_REMOVED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.OLD_COLLECTION_OWNED_CHANGED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.COLLECTION_OWNED_CHANGED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.OLD_COLLECTION_LIMIT_SET]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      },
      [EventName.COLLECTION_LIMIT_SET]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      },
      [EventName.OLD_COLLECTION_PERMISSION_SET]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      },

      [EventName.COLLECTION_PERMISSION_SET]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      },
      [EventName.OLD_COLLECTION_SPONSOR_SET]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.COLLECTION_SPONSOR_SET]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.OLD_COLLECTION_SPONSOR_REMOVED]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      },
      [EventName.COLLECTION_SPONSOR_REMOVED]: {
        collectionId: 0,
        props: this.parserCollection.bind(this),
      },
      [EventName.OLD_SPONSORSHIP_CONFIRMED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },
      [EventName.SPONSORSHIP_CONFIRMED]: {
        collectionId: 0,
        account: 1,
        props: this.parserCollection.bind(this),
        owner: 1,
      },

      // Treasury
      [EventName.TREASURY_DEPOSIT]: {
        amount: 0,
        props: this.parserTreasure.bind(this),
      },
    } as { [eventName: string]: EventArgsDescriptorProc };
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
      result.nestedTo = nesting.addressToIds(rawArgs[3].ethereum);
    } finally {
      return result;
    }
  }

  private accountConverter(address: AccountAddressData): AccountRecord {
    let resultAddress;
    if (typeof address === 'string') {
      resultAddress = JSON.parse(
        `{ "value": "${address}" , "__king": "${checkoutAddress(address)}" }`,
      );
    } else {
      resultAddress = address.substrate
        ? JSON.parse(
            `{ "value": "${address.substrate}" , "__king": "Substrate" }`,
          )
        : JSON.parse(
            `{ "value": "${address.ethereum}" , "__king": "Ethereum" }`,
          );
    }
    return JSON.parse(JSON.stringify(resultAddress));
  }

  private async accountNormalizer(account: AccountRecord) {
    return await this.accountService.processRawAccountRecord({ account });
  }

  private amountNormalizer(amount: string) {
    return amount ? getAmount(amount) : null;
  }

  private async parserApprovedOrCommonTransfer(
    items,
    argsRaw,
  ): Promise<EventData> {
    const values = {} as EventValues;
    const data = [];
    Object.entries(argsRaw).map(async (key, val) => {
      if (key[0] == 'props') {
        return;
      }
      if (key[0] === 'owner') {
        await this.accountNormalizer(this.accountConverter(items[`${key[1]}`]));
        return;
      }
      if (key[0] === 'sender' || key[0] === 'from') {
        values[`${key[0]}`] = this.accountConverter(
          items[`${key[1]}`],
        ).toString();
        data.push(values[`${key[0]}`]);
      } else if (key[0] === 'spender' || key[0] === 'to') {
        values[`${key[0]}`] = this.accountConverter(
          items[`${key[1]}`],
        ).toString();
        data.push(values[`${key[0]}`]);
      } else {
        data.push(items[`${val}`]);
        values[`${key[0]}`] = items[`${val}`];
      }
    });

    return { data, values };
  }

  private async parserItemCreated(items, argsRaw): Promise<EventData> {
    const values = {} as EventValues;
    const data = [];
    Object.entries(argsRaw).map(async (key, val) => {
      if (key[0] == 'props') {
        return;
      }
      if (key[0] === 'owner') {
        await this.accountNormalizer(this.accountConverter(items[`${key[1]}`]));
        return;
      }
      if (key[0] === 'account') {
        const accountValue = this.accountConverter(items[`${key[1]}`]);

        // @ts-ignore
        values[`${key[0]}`] = accountValue;
        data.push(accountValue);
      } else {
        data.push(items[`${val}`]);
        values[`${key[0]}`] = items[`${val}`];
      }
    });
    return { data, values };
  }

  private async parserBalances(items, argsRaw): Promise<EventData> {
    const values = {} as EventValues;
    const data = {};
    Object.entries(argsRaw).map((key) => {
      if (key[0] == 'props') {
        return;
      }
      if (key[0] === 'owner') {
        this.accountNormalizer(this.accountConverter(items[`${key[1]}`]));
        return;
      }
      key[1] === 1
        ? (values[`${key[0]}`] = this.amountNormalizer(items[`${key[1]}`]))
        : (values[`${key[0]}`] = items[`${key[1]}`]);
      key[1] === 1
        ? (data[`${key[0]}`] = String(BigInt(items[`${key[1]}`])))
        : (data[`${key[0]}`] = items[`${key[1]}`]);
    });

    return { data, values };
  }

  private async parserBalancesTransfer(items, argsRaw): Promise<EventData> {
    const values = {} as EventValues;
    const valueForData = {} as EventValues;
    const data = [];
    Object.entries(argsRaw).map((key) => {
      if (key[0] == 'props') {
        return;
      }
      if (key[0] === 'owner') {
        this.accountNormalizer(this.accountConverter(items[`${key[1]}`]));
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
  private async parserTreasure(items, argsRaw): Promise<EventData> {
    const values = {} as EventValues;
    const data = [];
    Object.entries(argsRaw).map((key) => {
      if (key[0] == 'props') {
        return;
      }
      values[`${key[0]}`] = this.amountNormalizer(items[`${key[1]}`]);
      data.push({ value: this.amountNormalizer(items[`${key[1]}`]) });
    });

    return { data, values };
  }

  private async parserCollection(items, argsRaw): Promise<EventData> {
    const values = {} as EventValues;
    const data = items;
    Object.entries(argsRaw).map((key, val) => {
      if (key[0] == 'props') {
        return;
      }
      if (key[0] === 'account') {
        values[`${key[0]}`] = JSON.parse(`{ "value": "${items[`${val}`]}" }`);
      } else {
        values[`${key[0]}`] = items[`${val}`];
      }
    });

    return { data, values };
  }

  private async parserTokenProperty(items, argsRaw): Promise<EventData> {
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

  async eventDataConverter(
    dataArray: EventArgs,
    eventName: string,
  ): Promise<EventData> {
    if (!dataArray) {
      return null;
    }

    const accountEvent = EVENT_ACCOUNT_ACTIVE[eventName];

    const argsDescriptor = this.EVENT_ARGS_PARSER[eventName];

    if (!argsDescriptor) {
      return { values: null, data: null };
    }
    const { props } = argsDescriptor;

    const [convertDescriptor] = await Promise.all([
      props(dataArray, argsDescriptor),
    ]);

    const { values, data } = convertDescriptor;
    const nestedTo = this.normalizeNestedTokenAddr(eventName, dataArray);

    const valuesData = { ...values, ...nestedTo };

    return { values: Object.keys(valuesData).length ? valuesData : null, data };
  }
}
