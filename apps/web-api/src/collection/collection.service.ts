import { Collections } from '@entities/Collections';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { isEmpty } from 'lodash';
import { BaseService } from '../utils/base.service';
import { IRelations, OperatorMethods } from '../utils/base.service.types';
import {
  IDataListResponse,
  IDateRange,
  IGQLQueryArgs,
  IStatsResponse,
  TWhere,
} from '../utils/gql-query-args';
import { CollectionDTO } from './collection.dto';
import { TokenDTO } from '../tokens/token.dto';
import { TokenService } from '../tokens/token.service';
import { SentryWrapper } from '../utils/sentry.decorator';
import { GraphQLResolveInfo } from 'graphql';

const STATISTICS_RELATION_ALIAS = 'Statistics';

const relationsFields = {
  tokens_count: STATISTICS_RELATION_ALIAS,
  actions_count: STATISTICS_RELATION_ALIAS,
  holders_count: STATISTICS_RELATION_ALIAS,
  transfers_count: STATISTICS_RELATION_ALIAS,
};

const customQueryFields = {
  type: 'mode',
  tokens_count: `COALESCE("${STATISTICS_RELATION_ALIAS}".tokens_count, 0::bigint)`,
  actions_acount: `'COALESCE("${STATISTICS_RELATION_ALIAS}".actions_count, 0::bigint)`,
  holders_count: `COALESCE("${STATISTICS_RELATION_ALIAS}".holders_count, 0::bigint)`,
  transfers_count: `COALESCE("${STATISTICS_RELATION_ALIAS}".transfers_count, 0::bigint)`,
};

@Injectable()
export class CollectionService extends BaseService<Collections, CollectionDTO> {
  constructor(
    @InjectRepository(Collections) private repo: Repository<Collections>,
    @Inject(forwardRef(() => TokenService)) private tokenService: TokenService,
  ) {
    super({ relationsFields, customQueryFields, relations: ['tokens'] });
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: IGQLQueryArgs<CollectionDTO>,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<CollectionDTO>> {
    const qb = this.repo.createQueryBuilder();

    this.applyArgs(qb, queryArgs, queryInfo);

    return this.getDataAndCount(qb, queryArgs);
  }

  public async findOne(
    queryArgs: IGQLQueryArgs<CollectionDTO>,
  ): Promise<CollectionDTO> {
    const qb = this.repo.createQueryBuilder();

    // todo: разобраться с отсутсвием info - создавать полный объект и передавать его
    // this.applyArgs(qb, queryArgs);

    return qb.getRawOne();
  }

  public getCollectionById(id: number): Promise<CollectionDTO> {
    return this.findOne({
      where: { collection_id: { _eq: id } },
    });
  }

  public statistic({
    fromDate,
    toDate,
  }: IDateRange): Promise<IStatsResponse[]> {
    const qb = this.repo.createQueryBuilder();
    qb.select(`date_trunc('hour', TO_TIMESTAMP(date_of_creation))`, 'date');
    qb.addSelect('count(*)', 'count');
    qb.groupBy('date');

    if (fromDate) {
      qb.where(`"date_of_creation" >= ${this.formatDate(fromDate)}`);
    }

    if (toDate) {
      qb.andWhere(`"date_of_creation" <= ${this.formatDate(fromDate)}`);
    }

    return qb.getRawMany();
  }

  private applyArgs(
    qb: SelectQueryBuilder<Collections>,
    queryArgs: IGQLQueryArgs<CollectionDTO>,
    queryInfo: GraphQLResolveInfo,
  ): void {
    this.select(qb, queryInfo);

    this.applyLimitOffset(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);
    this.applyWhereCondition(
      qb,
      queryArgs,
      this.applyRelationFilter.bind(this),
    );
    this.applyDistinctOn(qb, queryArgs);
  }

  private applyRelationFilter(
    qb: SelectQueryBuilder<Collections>,
    where: TWhere<TokenDTO>,
    op?: OperatorMethods.AND,
  ) {
    const { query, params } = this.tokenService.getCollectionIdsQuery({
      limit: null,
      where,
    } as IGQLQueryArgs<TokenDTO>);

    if (!isEmpty(params)) {
      qb[op](`Collections.collection_id IN ( ${query} )`, params);
    }
  }

  private select(
    qb: SelectQueryBuilder<Collections>,
    queryInfo?: GraphQLResolveInfo,
  ): void {
    const queryFields = this.getQueryFields(queryInfo);

    console.log(queryFields);

    const relations = {
      [STATISTICS_RELATION_ALIAS]: {
        table: 'collections_stats',
        on: `"Collections".collection_id = "${STATISTICS_RELATION_ALIAS}".collection_id`,
      },
    } as IRelations;

    this.applySelect(qb, queryFields, relations);
  }
}
