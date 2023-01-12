import { Injectable } from '@nestjs/common';
import { BaseService } from '../utils/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokensOwners } from '@entities/TokensOwners';
import { TokenOwnersDTO } from './token-owners.dto';
import { QueryArgsTokenOwner } from './token-owners.resolver.types';
import { GraphQLResolveInfo } from 'graphql';
import { SentryWrapper } from '../utils/sentry.decorator';
import { IDataListResponse } from '../utils/gql-query-args';

@Injectable()
export class TokenOwnersService extends BaseService<
  TokensOwners,
  TokenOwnersDTO
> {
  constructor(
    @InjectRepository(TokensOwners) private repo: Repository<TokensOwners>,
  ) {
    super();
  }

  @SentryWrapper({ data: [], count: 0 })
  public async findTokenOwner(
    queryArgs: QueryArgsTokenOwner,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<TokenOwnersDTO>> {
    const qb = this.repo.createQueryBuilder();

    this.applyDistinctOn(qb, queryArgs);

    this.applyLimitOffset(qb, queryArgs);

    this.applyWhereCondition(qb, queryArgs);

    this.applyOrderCondition(qb, queryArgs);

    return this.getDataAndCountMany(qb, queryArgs);
  }
}
