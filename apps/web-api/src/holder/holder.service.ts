import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, createQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { HolderDTO } from './holder.dto';

interface IQueryParameters {
  [key: string]: any;
}

@Injectable()
export class HolderService extends BaseService<Tokens, HolderDTO> {
  constructor(@InjectRepository(Tokens) private repo: Repository<Tokens>) {
    super();
  }

  public async find(
    queryArgs: IGQLQueryArgs<HolderDTO>,
  ): Promise<IDataListResponse<Tokens>> {
    const qb = this.repo.createQueryBuilder();
    qb.select(['collection_id', 'owner']);
    qb.addSelect('count(token_id)', 'count');
    qb.addGroupBy('Tokens.collection_id');
    qb.addGroupBy('Tokens.owner');
    this.applyWhereCondition(qb, queryArgs);
    const { count } = await this.getCount(qb.getQuery(), qb.getParameters());
    this.applyLimitOffset(qb, queryArgs);
    const data = await qb.getRawMany();

    return { data, count };
  }

  private async getCount(
    queryString: string,
    params: IQueryParameters,
  ): Promise<{ count: number }> {
    const countBuilder = createQueryBuilder();
    const query = this.replaceQueryParams(queryString, params);

    return countBuilder
      .select('count(true)', 'count')
      .from('(' + query + ')', 't1')
      .getRawOne();
  }

  private replaceQueryParams(queryString: string, params: IQueryParameters) {
    for (const key in params) {
      queryString = queryString.replace(`:${key}`, `'${params[key]}'`);
    }

    return queryString;
  }
}
