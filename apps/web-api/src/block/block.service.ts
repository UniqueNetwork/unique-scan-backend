import { Block } from '@entities/Block';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { BlockDto } from './block.dto';
import { SentryWrapper } from '../utils/sentry.decorator';
import { GraphQLResolveInfo } from 'graphql';

@Injectable()
export class BlockService extends BaseService<Block, BlockDto> {
  constructor(@InjectRepository(Block) private repo: Repository<Block>) {
    super();
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: IGQLQueryArgs<BlockDto>,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<Block>> {
    const qb = this.repo.createQueryBuilder();

    this.applySelect(qb, this.getQueryFields(queryInfo));
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    return this.getDataAndCount(qb, queryArgs);
  }
}
