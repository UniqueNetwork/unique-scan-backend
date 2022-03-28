import { Account } from '@entities/Account';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IGQLQueryArgs } from '../utils/gql-query-args';
import { AccountDTO } from './account.dto';

@Injectable()
export class AccountService extends BaseService<Account, AccountDTO> {
  constructor(@InjectRepository(Account) private repo: Repository<Account>) {
    super();
  }

  public async find(queryArgs: IGQLQueryArgs<AccountDTO>): Promise<Account[]> {
    const qb = this.repo.createQueryBuilder();
    qb.select('Account.account_id', 'account_id');
    qb.addSelect('Account.available_balance', 'available_balance');
    qb.addSelect('Account.free_balance', 'free_balance');
    qb.addSelect('Account.locked_balance', 'locked_balance');
    qb.addSelect('Account.nonce', 'nonce');
    qb.addSelect('Account.is_staking', 'is_staking');

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    return qb.getRawMany();
  }
}
