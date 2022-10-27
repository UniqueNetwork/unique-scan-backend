import { Total } from '@entities/Total';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { StatisticsDTO } from './statistics.dto';
import { SentryWrapper } from '../utils/sentry.decorator';

@Injectable()
export class StatisticsService extends BaseService<Total, StatisticsDTO> {
  constructor(@InjectRepository(Total) private repo: Repository<Total>) {
    super();
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: IGQLQueryArgs<StatisticsDTO>,
  ): Promise<IDataListResponse<Total>> {
    const qb = this.repo.createQueryBuilder();

    qb.select(['name', 'count']);

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    const data = await qb.getRawMany();
    const count = await qb.getCount();

    return { data, count };
  }
}
