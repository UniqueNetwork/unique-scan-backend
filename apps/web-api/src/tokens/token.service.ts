import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import {
  IDataListResponse,
  IDateRange,
  IGQLQueryArgs,
  IStatsResponse,
} from '../utils/gql-query-args';
import { TokenDTO } from './token.dto';
import { SentryWrapper } from '../utils/sentry.decorator';

const relationsFields = {
  token_prefix: 'Collection',
  collection_name: 'Collection',
  collection_owner: 'Collection',
  collection_owner_normalized: 'Collection',
  transfers_count: 'Statistics',
};

const aliasFields = {
  collection_name: 'name',
  collection_owner: 'owner',
  collection_owner_normalized: 'owner_normalized',
  collection_description: 'description',
};

@Injectable()
export class TokenService extends BaseService<Tokens, TokenDTO> {
  constructor(@InjectRepository(Tokens) private repo: Repository<Tokens>) {
    super({ aliasFields, relationsFields });
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: IGQLQueryArgs<TokenDTO>,
  ): Promise<IDataListResponse<TokenDTO>> {
    const qb = this.repo.createQueryBuilder();

    this.applyFilters(qb, queryArgs);
    const data = await qb.getRawMany();
    const count = await this.getCountByFilters(qb, queryArgs);

    return { data, count };
  }

  public getByCollectionId(id: number, queryArgs: IGQLQueryArgs<TokenDTO>) {
    const qb = this.repo.createQueryBuilder();

    this.applyFilters(qb, {
      ...queryArgs,
      where: {
        _and: [{ collection_id: { _eq: id } }, { ...queryArgs.where }],
      },
    });

    return qb.getRawMany();
  }

  public getCollectionIdsQuery(queryArgs: IGQLQueryArgs<TokenDTO>) {
    const qb = this.repo.createQueryBuilder();
    qb.select('collection_id');
    qb.distinct();
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);

    return {
      query: qb.getQuery(),
      params: qb.getParameters(),
    };
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
    qb: SelectQueryBuilder<Tokens>,
    queryArgs: IGQLQueryArgs<TokenDTO>,
  ): void {
    this.select(qb);
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);
    this.applyDistinctOn(qb, queryArgs);
  }

  private select(qb: SelectQueryBuilder<Tokens>): void {
    qb.select('Tokens.collection_id', 'collection_id');
    qb.addSelect('Tokens.token_id', 'token_id');
    qb.addSelect('Tokens.image', 'image');
    qb.addSelect('Tokens.attributes', 'attributes');
    qb.addSelect('Tokens.properties', 'properties');
    qb.addSelect('Tokens.owner', 'owner');
    qb.addSelect('Tokens.date_of_creation', 'date_of_creation');
    qb.addSelect('Tokens.owner_normalized', 'owner_normalized');
    qb.addSelect('Tokens.parent_id', 'parent_id');
    qb.addSelect('Tokens.is_sold', 'is_sold');
    qb.leftJoinAndSelect(
      'collections',
      'Collection',
      '"Tokens".collection_id = "Collection".collection_id',
    );
    qb.addSelect('Collection.token_prefix', 'token_prefix');
    qb.addSelect('Collection.name', 'collection_name');
    qb.addSelect('Collection.owner', 'collection_owner');
    qb.addSelect('Collection.owner_normalized', 'collection_owner_normalized');
    qb.addSelect('Collection.description', 'collection_description');
    qb.addSelect('"Collection".collection_cover', 'collection_cover');
    qb.addSelect(
      `COALESCE("Statistics".transfers_count, 0::bigint)`,
      'transfers_count',
    );
    qb.addSelect(
      `concat(Collection.token_prefix, ' #', Tokens.token_id)`,
      'token_name',
    );
    qb.leftJoin(
      'tokens_stats',
      'Statistics',
      '"Tokens".token_id  = "Statistics".token_id and "Tokens".collection_id  = "Statistics".collection_id',
    );
  }
}
