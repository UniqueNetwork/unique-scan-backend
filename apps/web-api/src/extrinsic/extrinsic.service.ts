import { Extrinsic } from '@entities/Extrinsic';
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
import { ExtrinsicDTO } from './extrinsic.dto';
import { ExtrinsicsStatsEnumType } from './extrinsic.resolver';

const aliasFields = {
  from_owner: 'signer',
  from_owner_normalized: 'signer_normalized',
};

@Injectable()
export class ExtrinsicService extends BaseService<Extrinsic, ExtrinsicDTO> {
  constructor(
    @InjectRepository(Extrinsic) private repo: Repository<Extrinsic>,
  ) {
    super({ aliasFields });
  }

  public async find(
    queryArgs: IGQLQueryArgs<ExtrinsicDTO>,
  ): Promise<IDataListResponse<ExtrinsicDTO>> {
    const qb = this.repo.createQueryBuilder();

    qb.select('Extrinsic.block_index', 'block_index');
    qb.addSelect('Extrinsic.block_number', 'block_number');
    qb.addSelect('Extrinsic.signer', 'from_owner');
    qb.addSelect('Extrinsic.signer_normalized', 'from_owner_normalized');
    qb.addSelect('Extrinsic.to_owner', 'to_owner');
    qb.addSelect('Extrinsic.to_owner_normalized', 'to_owner_normalized');
    qb.addSelect('Extrinsic.hash', 'hash');
    qb.addSelect('Extrinsic.success', 'success');
    qb.addSelect('Extrinsic.timestamp', 'timestamp');
    qb.addSelect('Extrinsic.method', 'method');
    qb.addSelect('Extrinsic.section', 'section');
    qb.addSelect(`NULLIF(Extrinsic.amount, 'NaN')`, 'amount');
    qb.addSelect('Extrinsic.fee', 'fee');

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
    type,
  }: IDateRange & { type?: ExtrinsicsStatsEnumType }): Promise<
    IStatsResponse[]
  > {
    const qb = await this.repo.createQueryBuilder();
    qb.select(`date_trunc('hour', TO_TIMESTAMP(timestamp))`, 'date');
    qb.addSelect('count(*)', 'count');
    qb.groupBy('date');

    if (fromDate) {
      qb.where(`"timestamp" >= ${this.formatDate(fromDate)}`);
    }
    if (toDate) {
      qb.andWhere(`"timestamp" <= ${this.formatDate(fromDate)}`);
    }

    if (type === ExtrinsicsStatsEnumType.COINS) {
      qb.andWhere(`"section" = 'balances'`);
      qb.andWhere(`"method" = 'transfer'`);
    } else if (type === ExtrinsicsStatsEnumType.TOKENS) {
      qb.andWhere(`"section" != 'balances'`);
      qb.andWhere(`"method" = 'transfer'`);
    }

    return qb.getRawMany();
  }
}
