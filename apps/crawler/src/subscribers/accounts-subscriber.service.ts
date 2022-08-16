import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Account } from '@entities/Account';
import { SdkService } from '../sdk/sdk.service';
import { ProcessorService } from './processor.service';
import { EventMethod, EventSection } from '@common/constants';
import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import ISubscriberService from './subscriber.interface';
import { AllBalances } from '@unique-nft/sdk/types';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';

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
    const EVENTS_TO_UPDATE = [
      `${EventSection.BALANCES}.${EventMethod.ENDOWED}`,
      `${EventSection.COMMON}.${EventMethod.ITEM_CREATED}`,
      `${EventSection.COMMON}.${EventMethod.TRANSFER}`,
    ];

    EVENTS_TO_UPDATE.forEach((eventName) =>
      this.processorService.processor.addEventHandler(
        eventName,
        this.upsertHandler.bind(this),
      ),
    );
  }

  private async getBalancesData(
    accountId: string,
  ): Promise<AllBalances | null> {
    const result = await this.sdkService.getAccountBalances(accountId);

    return result ? result : null;
  }

  private prepareDataToWrite(params: {
    timestamp: number;
    blockNumber: number;
    balancesData: AllBalances;
  }) {
    const { blockNumber, timestamp, balancesData } = params;

    const { address, availableBalance, lockedBalance, freeBalance } =
      balancesData;

    return {
      account_id: address,
      account_id_normalized: normalizeSubstrateAddress(address),
      available_balance: availableBalance.amount,
      free_balance: freeBalance.amount,
      locked_balance: lockedBalance.amount,
      timestamp: String(timestamp),
      block_height: String(blockNumber),
    };
  }

  private getAddressFromArgs(eventName: string, args: object) {
    let address = null;
    switch (eventName) {
      case `${EventSection.BALANCES}.${EventMethod.ENDOWED}`:
        address = args['account'];
        break;
      case `${EventSection.COMMON}.${EventMethod.ITEM_CREATED}`:
        address = args[2]['value'];
        break;
      case `${EventSection.COMMON}.${EventMethod.TRANSFER}`:
        address = args[3]['value'];
        break;
    }
    return address;
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: rawTimestamp },
      event: { name: eventName, args },
    } = ctx;

    const log = {
      eventName,
      blockNumber,
      rawAccountId: null as null | string,
      accountId: null as null | string,
    };

    try {
      const rawAccountId = this.getAddressFromArgs(eventName, args);

      if (!rawAccountId) {
        throw new Error('Bad accountId');
      }

      log.rawAccountId = rawAccountId;

      const balancesData = await this.getBalancesData(rawAccountId);

      if (!balancesData) {
        throw new Error('No balances data');
      }

      const dataToWrite = this.prepareDataToWrite({
        blockNumber,
        timestamp: normalizeTimestamp(rawTimestamp),
        balancesData,
      });

      log.accountId = dataToWrite.account_id;

      // Write data into db
      await this.accountsRepository.upsert(dataToWrite, ['account_id']);

      this.logger.verbose({ ...log });
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
