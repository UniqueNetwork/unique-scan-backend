import { Extrinsic } from '@entities/Extrinsic';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventSection, ExtrinsicMethod } from '@common/constants';
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
import { SentryWrapper } from '../utils/sentry.decorator';
import { GraphQLResolveInfo } from 'graphql';

const aliasFields = {
  from_owner: 'signer',
  from_owner_normalized: 'signer_normalized',
};

const customQueryFields = {
  amount: `NULLIF(Extrinsic.amount, 'NaN')`,
};

@Injectable()
export class ExtrinsicService extends BaseService<Extrinsic, ExtrinsicDTO> {
  constructor(
    @InjectRepository(Extrinsic) private repo: Repository<Extrinsic>,
  ) {
    super({ aliasFields, customQueryFields });
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: IGQLQueryArgs<ExtrinsicDTO>,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<ExtrinsicDTO>> {
    const qb = this.repo.createQueryBuilder();

    this.applySelect(qb, queryArgs, this.getQueryFields(queryInfo));

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    return this.getDataAndCount(qb, queryArgs);
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
      qb.andWhere('method = :method', { method: ExtrinsicMethod.TRANSFER });
      qb.andWhere('section = :section', { section: EventSection.BALANCES });
    } else if (type === ExtrinsicsStatsEnumType.TOKENS) {
      qb.andWhere('method = :method', { method: ExtrinsicMethod.TRANSFER });
      qb.andWhere('section != :section', { section: EventSection.BALANCES });
    }

    return qb.getRawMany();
  }
}
