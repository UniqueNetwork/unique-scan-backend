import { Tokens, TokenType } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import {
  GQLOrderByParamsArgs,
  IDataListResponse,
  IDateRange,
  IGQLQueryArgs,
  IStatsResponse,
} from '../utils/gql-query-args';
import { TokenDTO } from './token.dto';
import { SentryWrapper } from '../utils/sentry.decorator';
import { QueryArgs } from './token.resolver.types';

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
    queryArgs: QueryArgs,
  ): Promise<IDataListResponse<TokenDTO>> {
    const qb = this.repo.createQueryBuilder();

    this.applyFilters(qb, queryArgs);

    return this.getDataAndCount(qb, queryArgs);
  }

  @SentryWrapper({ data: [], count: 0 })
  public async findBundles(
    queryArgs: QueryArgs,
  ): Promise<IDataListResponse<TokenDTO>> {
    const qb = this.repo.createQueryBuilder();
    qb.andWhere('parent_id is null');
    qb.andWhere(`type = ${TokenType.NESTED}`);

    this.applyFilters(qb, queryArgs);
    return this.getDataAndCount(qb, queryArgs);
  }

  public async findOne(queryArgs: QueryArgs): Promise<TokenDTO> {
    const qb = this.repo.createQueryBuilder();

    this.applyFilters(qb, queryArgs);

    return qb.getRawOne();
  }

  public async getBundleRoot(
    collection_id: number,
    token_id: number,
  ): Promise<TokenDTO> {
    const qb = this.repo.createQueryBuilder();

    await this.selectTokenFields(qb);

    qb.where(
      new Brackets((qb) => {
        qb.where('parent_id is null').andWhere(
          `children @> '[{"token_id": ${token_id}, "collection_id": ${collection_id}}]'::jsonb`,
        );
      }),
    );

    qb.orWhere(
      new Brackets((qb) => {
        qb.where('parent_id is null')
          .andWhere('token_id = :token_id', {
            token_id: token_id,
          })
          .andWhere('collection_id = :collection_id', {
            collection_id: collection_id,
          })
          .andWhere(`type = :type`, { type: TokenType.NESTED });
      }),
    );

    return qb.getRawOne();
  }

  public getByCollectionId(id: number, queryArgs: QueryArgs) {
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

  public findNestingChildren(collection_id: number, token_id: number) {
    const qb = this.repo.createQueryBuilder();

    const queryArgs = {
      where: {
        parent_id: { _eq: `${collection_id}_${token_id}` },
      },
      limit: null,
      order_by: {
        token_id: GQLOrderByParamsArgs.asc,
      },
    };

    this.selectTokenFields(qb);
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    return qb.getRawMany();
  }

  public async statistic({
    fromDate,
    toDate,
  }: IDateRange): Promise<IStatsResponse[]> {
    const qb = await this.repo.createQueryBuilder();
    qb.select("date_trunc('hour', TO_TIMESTAMP(date_of_creation))", 'date');
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
    queryArgs: QueryArgs,
  ): void {
    this.select(qb);

    this.applyDistinctOn(qb, queryArgs);
    this.applyLimitOffset(qb, queryArgs);

    this.applyWhereCondition(qb, queryArgs);

    this.applyAttributesFilter(qb, queryArgs);

    this.applyOrderCondition(qb, queryArgs);
  }

  private applyAttributesFilter(
    qb: SelectQueryBuilder<Tokens>,
    queryArgs: QueryArgs,
  ): void {
    const attributesFilter = queryArgs?.attributes_filter;

    if (!Array.isArray(attributesFilter)) {
      return;
    }

    qb.andWhere(
      new Brackets((qb) => {
        attributesFilter.forEach(({ key, raw_value: rawValue }) => {
          const rawValueParsed = JSON.parse(rawValue);

          if (typeof rawValueParsed === 'object') {
            // Text field in format {_: "value"}
            qb.orWhere(`attributes->'${key}'->'rawValue'='${rawValue}'::jsonb`);
          } else {
            // Select and multiselect field
            qb.orWhere(
              new Brackets((qb) => {
                qb.where(
                  `attributes->'${key}'->>'rawValue'='${String(rawValue)}'`,
                ).orWhere(
                  // Search value in array
                  // eslint-disable-next-line max-len
                  `attributes->'${key}'->>'rawValue' ~ '^\\[\\s*((\\S+\\s*,\\s*)|\\s*)*(${rawValue})((\\s*,\\s*\\S+)|\\s*)*\\]$'`,
                );
              }),
            );
          }
        });
      }),
    );
  }

  private selectTokenFields(qb: SelectQueryBuilder<Tokens>): void {
    qb.select('Tokens.collection_id', 'collection_id');
    qb.addSelect('Tokens.token_id', 'token_id');
    qb.addSelect('Tokens.image', 'image');
    qb.addSelect('Tokens.attributes', 'attributes');
    qb.addSelect('Tokens.properties', 'properties');
    qb.addSelect('Tokens.owner', 'owner');
    qb.addSelect('Tokens.date_of_creation', 'date_of_creation');
    qb.addSelect('Tokens.bundle_created', 'bundle_created');
    qb.addSelect('Tokens.owner_normalized', 'owner_normalized');
    qb.addSelect('Tokens.parent_id', 'parent_id');
    qb.addSelect('Tokens.is_sold', 'is_sold');
    qb.addSelect('Tokens.burned', 'burned');
    qb.addSelect('Tokens.token_name', 'token_name');
  }

  private select(qb: SelectQueryBuilder<Tokens>): void {
    this.selectTokenFields(qb);

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
      'COALESCE("Statistics".transfers_count, 0)',
      'transfers_count',
    );
    qb.addSelect(`COALESCE("Statistics".children_count, 0)`, 'children_count');
    qb.leftJoin(
      'tokens_stats',
      'Statistics',
      '"Tokens".token_id  = "Statistics".token_id and "Tokens".collection_id  = "Statistics".collection_id',
    );
  }
}
