import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Account } from '@entities/Account';
import { SdkService } from '../sdk.service';
import { ProcessorService } from './processor.service';
import { EventMethod, EventSection } from '@common/constants';
import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import ISubscriberService from './subscriber.interface';
import { AllBalances } from '@unique-nft/sdk/types';

@Injectable()
export class AccountsSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(AccountsSubscriberService.name);

  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    private processorService: ProcessorService,
    private sdkService: SdkService,
  ) {}

  subscribe() {
    const EVENTS_TO_UPDATE = [
      `${EventSection.BALANCES}.${EventMethod.ENDOWED}`,
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
    accountId: string;
    timestamp: number;
    blockNumber: number;
    balancesData: AllBalances;
  }) {
    const { accountId, blockNumber, timestamp, balancesData } = params;

    const { availableBalance, lockedBalance, freeBalance } = balancesData;

    return {
      account_id: accountId,
      account_id_normalized: normalizeSubstrateAddress(accountId),
      available_balance: availableBalance.amount,
      free_balance: freeBalance.amount,
      locked_balance: lockedBalance.amount,
      timestamp: String(timestamp),
      block_height: String(blockNumber),

      // todo: no data from sdk? Critical?
      nonce: null,
      // todo: Do we need this?
      balances: JSON.stringify(balancesData),
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
      accountId: null as null | string,
    };

    try {
      const { account: accountId } = args;

      if (!accountId) {
        throw new Error('Bad accountId');
      }

      log.accountId = accountId;

      const balancesData = await this.getBalancesData(accountId);
      if (!balancesData) {
        throw new Error('No balances data');
      }

      const dataToWrite = this.prepareDataToWrite({
        accountId,
        blockNumber,
        timestamp: normalizeTimestamp(rawTimestamp),
        balancesData,
      });

      // Write data into db
      await this.accountsRepository.upsert(dataToWrite, ['account_id']);

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }
}
