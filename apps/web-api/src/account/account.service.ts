import { Account } from '@entities/Account';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import {
  IDataListResponse,
  IDateRange,
  IGQLQueryArgs,
  IStatsResponse,
} from '../utils/gql-query-args';
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
    qb.addSelect('Account.balances', 'balances');
    qb.addSelect('Account.available_balance', 'available_balance');
    qb.addSelect('Account.free_balance', 'free_balance');
    qb.addSelect('Account.locked_balance', 'locked_balance');
    qb.addSelect('Account.nonce', 'nonce');
    qb.addSelect('Account.timestamp', 'timestamp');
    qb.addSelect('Account.block_height', 'block_height');
    qb.addSelect('Account.account_id_normalized', 'account_id_normalized');

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);
    const data = await qb.getRawMany();
    const count = await qb.getCount();
    return { data, count };
  }

  public async statistic({
    fromDate,
    toDate,
  }: IDateRange): Promise<IStatsResponse[]> {
    const qb = await this.repo.createQueryBuilder();
    qb.select(`date_trunc('hour', TO_TIMESTAMP(timestamp))`, 'date');
    qb.addSelect('count(*)', 'count');
    qb.groupBy('date');
    qb.orderBy('date', 'DESC');

    if (fromDate) {
      qb.where(`"timestamp" >= ${this.formatDate(fromDate)}`);
    }
    if (toDate) {
      qb.andWhere(`"timestamp" <= ${this.formatDate(fromDate)}`);
    }

    return qb.getRawMany();
  }
}
