import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import { Account } from '@entities/Account';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AllBalances } from '@unique-nft/sdk/types';
import { Repository } from 'typeorm';

@Injectable()
export class AccountWriterService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

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

  upsert({
    blockNumber,
    blockTimestamp,
    balances,
  }: {
    blockNumber: number;
    blockTimestamp: number;
    balances: AllBalances;
  }) {
    const dataToWrite = this.prepareDataForDb({
      blockNumber,
      timestamp: normalizeTimestamp(blockTimestamp),
      balances,
    });

    // Write data into db
    return this.accountsRepository.upsert(dataToWrite, ['account_id']);
  }
}
