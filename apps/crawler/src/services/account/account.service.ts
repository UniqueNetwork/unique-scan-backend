import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import { Account } from '@entities/Account';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEthereumAddress } from '@polkadot/util-crypto';
import { Address, AllBalances } from '@unique-nft/substrate-client/types';
import { Repository } from 'typeorm';
import { SdkService } from '../../sdk/sdk.service';
import { AccountRecord } from './account.types';

type BalancesExtended = AllBalances & {
  etheriumAddress?: string;
};

@Injectable()
export class AccountService {
  constructor(
    private sdkService: SdkService,

    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  async processRawAccountRecord({
    account,
    blockTimestamp = 0,
    blockNumber = 0,
  }: {
    account: AccountRecord;
    blockTimestamp?: number;
    blockNumber?: number;
  }): Promise<AccountRecord> {
    const rawAddress = this.getAccountAddress(account);

    const balances = await this.sdkService.getBalances(rawAddress);

    // We should keep Etherium addresses as it is, but sdk normalizes it into Substrate
    const balancesExtended = this.extendEtheriumAddressBalances(
      balances,
      rawAddress,
    );

    const normalizedAddress = await this.upsert({
      // todo: Решить с пустыми blockTimestamp & blockNumber
      blockTimestamp,
      blockNumber,

      balances: balancesExtended,
    });

    return this.updateAccountAddress(account, normalizedAddress);
  }

  private getAccountAddress(account: AccountRecord): Address {
    return typeof account === 'string' ? account : account.value;
  }

  private updateAccountAddress(
    account: AccountRecord,
    address: Address,
  ): AccountRecord {
    return typeof account === 'string'
      ? address
      : { ...account, value: address };
  }

  private extendEtheriumAddressBalances(
    balances: AllBalances,
    address: Address,
  ): BalancesExtended {
    return {
      ...balances,
      etheriumAddress: isEthereumAddress(address) ? address : null,
    };
  }

  /**
   * Prepares event and balances data to write into db.
   */
  private prepareDataForDb(params: {
    blockTimestamp: number;
    blockNumber: number;
    balances: BalancesExtended;
  }): Account {
    const {
      blockNumber,
      blockTimestamp,
      balances: {
        address,
        etheriumAddress,
        availableBalance,
        lockedBalance,
        freeBalance,
      },
    } = params;

    return {
      block_height: String(blockNumber),
      timestamp: String(normalizeTimestamp(blockTimestamp)),
      account_id: etheriumAddress ? etheriumAddress : address,
      account_id_normalized: etheriumAddress
        ? address
        : normalizeSubstrateAddress(address),
      available_balance: availableBalance.amount,
      free_balance: freeBalance.amount,
      locked_balance: lockedBalance.amount,
    };
  }

  async upsert({
    blockNumber,
    blockTimestamp,
    balances,
  }: {
    blockNumber: number;
    blockTimestamp: number;
    balances: BalancesExtended;
  }): Promise<Address> {
    const dataToWrite = this.prepareDataForDb({
      blockNumber,
      blockTimestamp,
      balances,
    });

    // Write data into db
    await this.accountsRepository.upsert(dataToWrite, ['account_id']);

    return balances.etheriumAddress || balances.address;
  }
}
