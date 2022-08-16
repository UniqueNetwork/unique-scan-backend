import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '@entities/Account';
import { SdkService } from '../sdk/sdk.service';
import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import { AllBalances } from '@unique-nft/sdk/types';
import IScannerService from './scanner.interface';
import { ConfigService } from '@nestjs/config';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';

@Injectable()
export class AccountsScannerService implements IScannerService {
  private readonly logger = new Logger(AccountsScannerService.name);

  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    private configService: ConfigService,
    private sdkService: SdkService,
    @InjectSentry() private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(AccountsScannerService.name);
  }

  async scan() {
    this.logger.log('Start full scan...');

    const PARALLEL_TASKS = this.configService.get('PARALLEL_TASKS') || 10;
    const currentBlockNumber = await this.sdkService.getCurrentBlockNumber();
    const accountsIds = await this.sdkService.getAccountsIds();

    try {
      while (accountsIds.length > 0) {
        const accountsIdsForProcessing = accountsIds.splice(0, PARALLEL_TASKS);
        await Promise.all(
          accountsIdsForProcessing.map((accountId) =>
            this.processAccount({
              accountId,
              blockNumber: currentBlockNumber,
            }),
          ),
        );

        this.logger.verbose(
          `Processed ${accountsIdsForProcessing.length} accounts`,
        );
      }
    } catch (error) {
      this.logger.error(error);
      this.sentry.instance().captureException({ error });
    }

    this.logger.log(`Processed ${accountsIds.length} active accounts`);
  }

  private async processAccount({
    accountId,
    blockNumber,
  }: {
    accountId: string;
    blockNumber: number;
  }) {
    const log = { accountId };

    try {
      const balancesData = await this.getBalancesData(accountId);

      if (!balancesData) {
        throw new Error('No balances data');
      }

      const dataToWrite = this.prepareDataToWrite({
        blockNumber,
        timestamp: normalizeTimestamp(Date.now()),
        balancesData,
      });

      // Write data into db
      await this.accountsRepository.upsert(dataToWrite, ['account_id']);
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }

  private async getBalancesData(accountId: string): Promise<AllBalances> {
    return this.sdkService.getAccountBalances(accountId);
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
}
