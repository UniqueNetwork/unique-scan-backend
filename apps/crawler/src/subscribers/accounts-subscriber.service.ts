import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Account } from '@entities/Account';
import { SdkService } from '../sdk/sdk.service';
import { ProcessorService } from './processor.service';
import { EventName } from '@common/constants';
import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import ISubscriberService from './subscriber.interface';
import { AllBalances } from '@unique-nft/substrate-client/types';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { Severity } from '@sentry/node';

@Injectable()
export class AccountsSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(AccountsSubscriberService.name);

  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    private processorService: ProcessorService,
    private sdkService: SdkService,
    @InjectSentry() private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(AccountsSubscriberService.name);
  }

  subscribe() {
    [
      EventName.NEW_ACCOUNT,
      EventName.COLLECTION_CREATED,
      EventName.ITEM_CREATED,
      EventName.COLLECTION_ADMIN_ADDED,
      EventName.COLLECTION_OWNED_CHANGED,
      EventName.TRANSFER,
      EventName.BALANCES_DEPOSIT,
      EventName.BALANCES_ENDOWED,
      EventName.BALANCES_WITHDRAW,
      EventName.BALANCES_TRANSFER,
    ].forEach((eventName) =>
      this.processorService.processor.addEventHandler(
        eventName,
        this.upsertHandler.bind(this),
      ),
    );
  }

  /**
   * Gets balances data for every raw address value passed.
   */
  private getBalances(rawAddressValues: string[]): Promise<AllBalances[]> {
    return Promise.all(
      rawAddressValues.map((rawAddress) =>
        this.sdkService.getBalances(rawAddress),
      ),
    );
  }

  /**
   * Collects address values from event arguments.
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
  private getAddressValues(
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

    // Convert array arguments into object format
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

  /**
   * Prepares event and balances data to write into db.
   */
  private prepareDataForDb(params: {
    timestamp: number;
    blockNumber: number;
    balances: AllBalances;
  }): Account {
    const {
      blockNumber,
      timestamp,
      balances: { address, availableBalance, lockedBalance, freeBalance },
    } = params;

    return {
      block_height: String(blockNumber),
      timestamp: String(timestamp),
      account_id: address,
      account_id_normalized: normalizeSubstrateAddress(address),
      available_balance: availableBalance.amount,
      free_balance: freeBalance.amount,
      locked_balance: lockedBalance.amount,
    };
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: rawTimestamp },
      event: { name: eventName, args },
    } = ctx;

    const log = {
      eventName,
      blockNumber,
      rawAddressValues: [],
      processedAccounts: [],
    };

    try {
      const rawAddressValues = this.getAddressValues(eventName, args);
      log.rawAddressValues = rawAddressValues;

      if (!rawAddressValues.length) {
        throw new Error('No addresses found');
      }

      // Get balances and converted address from sdk
      const balancesData = await this.getBalances(rawAddressValues);

      const timestamp = normalizeTimestamp(rawTimestamp);

      await Promise.all(
        balancesData.map((balances, addressIndex) => {
          if (!balances) {
            this.logger.warn({
              message: 'No balances data',
              addressIndex,
              ...log,
            });
            this.sentry
              .instance()
              .captureMessage(
                `No balances data for block ${blockNumber}, event: "${eventName}", addressIndex: ${addressIndex}`,
                Severity.Warning,
              );
            return null;
          }

          log.processedAccounts.push(balances.address);

          const dataToWrite = this.prepareDataForDb({
            blockNumber,
            timestamp,
            balances,
          });

          // Write data into db
          return this.accountsRepository.upsert(dataToWrite, ['account_id']);
        }),
      );

      this.logger.verbose({ ...log });
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
