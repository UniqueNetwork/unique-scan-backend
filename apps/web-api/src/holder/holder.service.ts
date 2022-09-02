import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
    const { count } = await this.getHandleCount(qb);
    const data = await qb.getRawMany();

    return { data, count };
  }

  private async getHandleCount(qb: SelectQueryBuilder<Tokens>) {
    const query = qb
      .clone()
      .distinctOn([])
      .orderBy()
      .offset(undefined)
      .limit(undefined)
      .skip(undefined)
      .take(undefined);

    const qs = this.replaceQueryParams(query.getQuery(), query.getParameters());

    const result: [{ count?: number }] = await this.repo.query(
      `select count(1) as "count" from (${qs}) "t1"`,
    );

    return { count: result.length ? Number(result[0].count ?? 0) : 0 };
  }

  private replaceQueryParams(queryString: string, params: IQueryParameters) {
    for (const key in params) {
      queryString = queryString.replace(`:${key}`, `'${params[key]}'`);
    }

    return queryString;
  }
}
