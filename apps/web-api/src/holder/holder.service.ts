import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { HolderDTO } from './holder.dto';
import { SentryWrapper } from '../utils/sentry.decorator';

interface IQueryParameters {
  [key: string]: any;
}

@Injectable()
export class HolderService extends BaseService<Tokens, HolderDTO> {
  constructor(@InjectRepository(Tokens) private repo: Repository<Tokens>) {
    super();
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: IGQLQueryArgs<HolderDTO>,
  ): Promise<IDataListResponse<Tokens>> {
    const qb = this.repo.createQueryBuilder();
    qb.select(['collection_id', 'owner', 'owner_normalized']);
    qb.addSelect('count(token_id)', 'count');
    qb.addGroupBy('Tokens.collection_id');
    qb.addGroupBy('owner');
    qb.addGroupBy('owner_normalized');
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);
    this.applyLimitOffset(qb, queryArgs);
    const { count } = await this.getHandleCount(
      qb.getQuery(),
      qb.getParameters(),
    );
    const data = await qb.getRawMany();

    return { data, count };
  }

  private async getHandleCount(
    queryString: string,
    params: IQueryParameters,
  ): Promise<{ count: number }> {
    const query = this.replaceQueryParams(queryString, params);
    const countQueryResult: [{ count?: string }] = await this.repo.query(
      `select count(1) as "count" from (${query}) "t1"`,
    );

    if (countQueryResult.length === 1) {
      const count = Number(countQueryResult[0].count);
      return { count };
    }

    return { count: 0 };
  }

  private replaceQueryParams(queryString: string, params: IQueryParameters) {
    for (const key in params) {
      queryString = queryString.replace(`:${key}`, `'${params[key]}'`);
    }
    queryString = queryString
      .replace(/limit.\S{1,100}/i, '')
      .replace(/offset.\S{1,100}/i, '')
      .trim();
    return queryString;
  }
}
