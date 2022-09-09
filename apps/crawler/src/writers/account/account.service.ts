import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import { Account } from '@entities/Account';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEthereumAddress } from '@polkadot/util-crypto';
import { Address, AllBalances } from '@unique-nft/substrate-client/types';
import { Repository } from 'typeorm';
import { SdkService } from '../../sdk/sdk.service';

export type RawAccount =
  | string
  | { value: string; __kind: 'Substrate' | 'Etherium' };

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

  async processRawAddress({
    rawAddress,
    blockTimestamp = 0,
    blockNumber = 0,
  }: {
    rawAddress: RawAccount;
    blockTimestamp?: number;
    blockNumber?: number;
  }): Promise<RawAccount> {
    const rawAddressValue =
      typeof rawAddress === 'string' ? rawAddress : rawAddress.value;

    const normalizedAddressValue = await this.upsert({
      rawAddressValue,

      // todo: Решить с пустыми blockTimestamp & blockNumber
      blockTimestamp,
      blockNumber,
    });

    return typeof rawAddress === 'string'
      ? normalizedAddressValue
      : { ...rawAddress, value: normalizedAddressValue };
  }

  /**
   * Gets balances data for every raw address value passed.
   */
  // private getBalances(rawAddressValues: string[]): Promise<AllBalances[]> {
  //   return Promise.all(
  //     rawAddressValues.map((rawAddress) =>
  //       this.sdkService.getBalances(rawAddress),
  //     ),
  //   );
  // }

  private extendEtheriumAddressBalances(
    balances: AllBalances,
    rawAddressValue: string,
  ): BalancesExtended {
    return {
      ...balances,
      etheriumAddress: isEthereumAddress(rawAddressValue)
        ? rawAddressValue
        : null,
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
    rawAddressValue,
  }: {
    blockNumber: number;
    blockTimestamp: number;
    rawAddressValue: string;
  }): Promise<Address> {
    const balances = await this.sdkService.getBalances(rawAddressValue);

    // We should keep Etherium addresses as it is, but sdk normalizes it into Substrate
    const balancesExtended = this.extendEtheriumAddressBalances(
      balances,
      rawAddressValue,
    );

    const dataToWrite = this.prepareDataForDb({
      blockNumber,
      blockTimestamp,
      balances: balancesExtended,
    });

    // Write data into db
    await this.accountsRepository.upsert(dataToWrite, ['account_id']);

    return balancesExtended.etheriumAddress || balancesExtended.address;
  }
}
