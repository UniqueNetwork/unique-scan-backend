import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EvmTransaction } from '@entities/EvmTransaction';
import { GraphQLResolveInfo } from 'graphql';
import { FieldsListOptions } from 'graphql-fields-list';
import { BaseService } from '../utils/base.service';
import { IDataListResponse } from '../utils/gql-query-args';
import { SentryWrapper } from '../utils/sentry.decorator';
import { EvmTransactionDTO } from './evm-transaction.dto';
import { QueryArgs } from './evm-transaction.resolver';

@Injectable()
export class EvmTransactionService extends BaseService<
  EvmTransaction,
  EvmTransactionDTO
> {
  constructor(
    @InjectRepository(EvmTransaction) private repo: Repository<EvmTransaction>,
  ) {
    super();
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: QueryArgs,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<EvmTransaction>> {
    const qb = this.repo.createQueryBuilder();

    this.applyArgs(qb, queryArgs, queryInfo);

    return this.getDataAndCount(qb, queryArgs);
  }

  private applyArgs(
    qb: SelectQueryBuilder<EvmTransaction>,
    queryArgs: QueryArgs,
    queryInfo: GraphQLResolveInfo,
  ): void {
    this.select(qb, queryArgs, queryInfo);

    this.applyDistinctOn(qb, queryArgs);

    this.applyLimitOffset(qb, queryArgs);

    this.applyWhereCondition(qb, queryArgs);

    this.applyOrderCondition(qb, queryArgs);
  }

  private select(
    qb: SelectQueryBuilder<EvmTransaction>,
    queryArgs: QueryArgs,
    queryInfo: GraphQLResolveInfo,
    queryFieldsOptions?: FieldsListOptions,
  ): void {
    const queryFields = this.getQueryFields(queryInfo, queryFieldsOptions);

    this.applySelect(qb, queryArgs, queryFields);
  }
}
