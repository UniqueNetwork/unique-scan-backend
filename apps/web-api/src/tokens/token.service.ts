import { Tokens, TokenType } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import {
  IDataListResponse,
  IDateRange,
  IGQLQueryArgs,
  IStatsResponse,
} from '../utils/gql-query-args';
import { TokenDTO } from './token.dto';
import { SentryWrapper } from '../utils/sentry.decorator';
import { QueryArgs } from './token.resolver.types';
import { GraphQLResolveInfo } from 'graphql';
import { IRelations } from '../utils/base.service.types';
import { FieldsListOptions } from 'graphql-fields-list';

const COLLECTION_RELATION_ALIAS = 'Collection';
const STATISTICS_RELATION_ALIAS = 'Statistics';

const relationsFields = {
  token_prefix: COLLECTION_RELATION_ALIAS,
  collection_name: COLLECTION_RELATION_ALIAS,
  collection_owner: COLLECTION_RELATION_ALIAS,
  collection_owner_normalized: COLLECTION_RELATION_ALIAS,
  collection_cover: COLLECTION_RELATION_ALIAS,
  collection_description: COLLECTION_RELATION_ALIAS,

  transfers_count: STATISTICS_RELATION_ALIAS,
  children_count: STATISTICS_RELATION_ALIAS,
};

const aliasFields = {
  collection_name: 'name',
  collection_owner: 'owner',
  collection_owner_normalized: 'owner_normalized',
  collection_description: 'description',
};

const customQueryFields = {
  transfers_count: `COALESCE("${STATISTICS_RELATION_ALIAS}".transfers_count, 0)`,
  children_count: `COALESCE("${STATISTICS_RELATION_ALIAS}".children_count, 0)`,
};

@Injectable()
export class TokenService extends BaseService<Tokens, TokenDTO> {
  constructor(@InjectRepository(Tokens) private repo: Repository<Tokens>) {
    super({ aliasFields, relationsFields, customQueryFields });
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: QueryArgs,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<TokenDTO>> {
    const qb = this.repo.createQueryBuilder();

    this.applyArgs(qb, queryArgs, queryInfo);

    return this.getDataAndCount(qb, queryArgs);
  }

  @SentryWrapper({ data: [], count: 0 })
  public async findBundles(
    queryArgs: QueryArgs,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<TokenDTO>> {
    const qb = this.repo.createQueryBuilder();

    qb.andWhere('parent_id is null');
    qb.andWhere(`type = :type`, { type: TokenType.NESTED });

    this.applyArgs(qb, queryArgs, queryInfo);

    return this.getDataAndCount(qb, queryArgs);
  }

  public async getBundleRoot(
    collection_id: number,
    token_id: number,
    queryInfo: GraphQLResolveInfo,
  ): Promise<TokenDTO> {
    const qb = this.repo.createQueryBuilder();

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
          .andWhere('"Tokens".token_id = :token_id', {
            token_id,
          })
          .andWhere('"Tokens".collection_id = :collection_id', {
            collection_id,
          })
          .andWhere(`type = :type`, { type: TokenType.NESTED });
      }),
    );

    this.select(qb, {}, queryInfo, { skip: ['__*'] });

    return qb.getRawOne();
  }

  public getByCollectionId(
    id: number,
    queryArgs: QueryArgs,
    queryInfo: GraphQLResolveInfo,
  ) {
    const qb = this.repo.createQueryBuilder();

    qb.where('collection_id = :id', { id });
    this.applyWhereCondition(qb, queryArgs);

    const queryFields = this.getQueryFields(queryInfo, { skip: ['__*'] });

    this.applySelect(qb, {}, queryFields);

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

  public findNestingChildren(
    collection_id: number,
    token_id: number,
    queryInfo: GraphQLResolveInfo,
  ) {
    const qb = this.repo.createQueryBuilder();

    const parentCredentials = `${collection_id}_${token_id}`;
    qb.where('parent_id = :parentCredentials', { parentCredentials });
    // qb.limit(null);
    qb.orderBy('token_id', 'ASC');

    this.select(qb, {}, queryInfo, { skip: ['__*'] });

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

  private applyArgs(
    qb: SelectQueryBuilder<Tokens>,
    queryArgs: QueryArgs,
    queryInfo: GraphQLResolveInfo,
  ): void {
    this.select(qb, queryArgs, queryInfo);

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

  private select(
    qb: SelectQueryBuilder<Tokens>,
    queryArgs: QueryArgs,
    queryInfo: GraphQLResolveInfo,
    queryFieldsOptions?: FieldsListOptions,
  ): void {
    const queryFields = this.getQueryFields(queryInfo, queryFieldsOptions);

    const relations = {
      [COLLECTION_RELATION_ALIAS]: {
        table: 'collections',
        on: `"Tokens".collection_id = "${COLLECTION_RELATION_ALIAS}".collection_id`,
      },
      [STATISTICS_RELATION_ALIAS]: {
        table: 'tokens_stats',
        on: `"Tokens".token_id = "${STATISTICS_RELATION_ALIAS}".token_id 
        AND "Tokens".collection_id  = "${STATISTICS_RELATION_ALIAS}".collection_id`,
      },
    } as IRelations;

    this.applySelect(qb, queryArgs, queryFields, relations);
  }
}
