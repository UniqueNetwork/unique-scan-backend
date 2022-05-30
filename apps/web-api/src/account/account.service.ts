import { Account } from '@entities/Account';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { AccountDTO } from './account.dto';

@Injectable()
export class AccountService extends BaseService<Account, AccountDTO> {
  constructor(@InjectRepository(Account) private repo: Repository<Account>) {
    super();
  }

  public async find(
    queryArgs: IGQLQueryArgs<AccountDTO>,
  ): Promise<IDataListResponse<Account>> {
    const qb = this.repo.createQueryBuilder();
    qb.select('Account.account_id', 'account_id');
    qb.addSelect('Account.available_balance', 'available_balance');
    qb.addSelect('Account.free_balance', 'free_balance');
    qb.addSelect('Account.locked_balance', 'locked_balance');
    qb.addSelect('Account.nonce', 'nonce');
    qb.addSelect('Account.timestamp', 'timestamp');
    qb.addSelect('Account.block_height', 'block_height');
    qb.addSelect('Account.account_id_normalized', 'account_id_normalized');

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    const data = await qb.getRawMany();
    const count = await qb.getCount();
    return { data, count };
  }
}
