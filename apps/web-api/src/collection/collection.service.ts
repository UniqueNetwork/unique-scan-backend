import { Collections } from '@entities/Collections';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { isEmpty } from 'lodash';
import { BaseService } from '../utils/base.service';
import { OperatorMethods } from '../utils/base.service.types';
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

const relationsFields = {
  tokens_count: 'Statistics',
  actions_count: 'Statistics',
  holders_count: 'Statistics',
  transfers_count: 'Statistics',
};

@Injectable()
export class CollectionService extends BaseService<Collections, CollectionDTO> {
  constructor(
    @InjectRepository(Collections) private repo: Repository<Collections>,
    @Inject(forwardRef(() => TokenService)) private tokenService: TokenService,
  ) {
    super({ relationsFields, relations: ['tokens'] });
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: IGQLQueryArgs<CollectionDTO>,
  ): Promise<IDataListResponse<CollectionDTO>> {
    const qb = this.repo.createQueryBuilder();
    this.applyFilters(qb, queryArgs);

    return this.getDataAndCount(qb, queryArgs);
  }

  public async findOne(
    queryArgs: IGQLQueryArgs<CollectionDTO>,
  ): Promise<CollectionDTO> {
    const qb = this.repo.createQueryBuilder();

    this.applyFilters(qb, queryArgs);

    return qb.getRawOne();
  }

  public getCollectionById(id: number): Promise<CollectionDTO> {
    return this.findOne({
      where: { collection_id: { _eq: id } },
    });
  }

  public async statistic({
    fromDate,
    toDate,
  }: IDateRange): Promise<IStatsResponse[]> {
    const qb = await this.repo.createQueryBuilder();
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

  private applyFilters(
    qb: SelectQueryBuilder<Collections>,
    queryArgs: IGQLQueryArgs<CollectionDTO>,
  ): void {
    this.select(qb);
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

  private select(qb: SelectQueryBuilder<Collections>): void {
    qb.select('Collections.collection_id', 'collection_id');
    qb.addSelect('Collections.owner', 'owner');
    qb.addSelect('Collections.owner_normalized', 'owner_normalized');
    qb.addSelect('Collections.name', 'name');
    qb.addSelect('Collections.description', 'description');
    qb.addSelect('Collections.offchain_schema', 'offchain_schema');
    qb.addSelect('Collections.token_limit', 'token_limit');
    qb.addSelect('Collections.token_prefix', 'token_prefix');
    qb.addSelect('Collections.collection_cover', 'collection_cover');
    qb.addSelect('Collections.mode', 'type');
    qb.addSelect('Collections.mint_mode', 'mint_mode');
    qb.addSelect('Collections.attributes_schema', 'attributes_schema');
    qb.addSelect(
      'Collections.limits_account_ownership',
      'limits_account_ownership',
    );
    qb.addSelect(
      'Collections.limits_sponsore_data_size',
      'limits_sponsore_data_size',
    );
    qb.addSelect(
      'Collections.limits_sponsore_data_rate',
      'limits_sponsore_data_rate',
    );
    qb.addSelect('Collections.owner_can_transfer', 'owner_can_transfer');
    qb.addSelect('Collections.owner_can_destroy', 'owner_can_destroy');
    qb.addSelect('Collections.schema_version', 'schema_version');
    qb.addSelect('Collections.sponsorship', 'sponsorship');
    qb.addSelect('Collections.const_chain_schema', 'const_chain_schema');
    qb.addSelect('Collections.properties', 'properties');
    qb.addSelect(
      'Collections.token_properties_permissions',
      'token_properties_permissions',
    );
    qb.addSelect(
      `COALESCE("Statistics".tokens_count, 0::bigint)`,
      'tokens_count',
    );
    qb.addSelect(
      `COALESCE("Statistics".holders_count, 0::bigint)`,
      'holders_count',
    );
    qb.addSelect(
      `COALESCE("Statistics".actions_count, 0::bigint)`,
      'actions_count',
    );
    qb.addSelect(
      `COALESCE("Statistics".transfers_count, 0::bigint)`,
      'transfers_count',
    );
    qb.addSelect('Collections.date_of_creation', 'date_of_creation');
    qb.leftJoin(
      'collections_stats',
      'Statistics',
      '"Collections".collection_id = "Statistics".collection_id',
    );
  }
}
