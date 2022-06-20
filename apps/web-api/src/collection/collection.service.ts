import { Collections } from '@entities/Collections';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { pickBy, isEmpty } from 'lodash';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { CollectionDTO } from './collection.dto';
import { TokenDTO } from '../tokens/token.dto';
import { TokenService } from '../tokens/token.service';

const relationsFields = {
  tokens_count: 'Statistics',
  actions_count: 'Statistics',
  holders_count: 'Statistics',
};

type TCollectionWithTokens = CollectionDTO & { tokens?: TokenDTO[] };

@Injectable()
export class CollectionService extends BaseService<Collections, CollectionDTO> {
  private relations: string[] = [];

  constructor(
    @InjectRepository(Collections) private repo: Repository<Collections>,
    @Inject(forwardRef(() => TokenService)) private tokenService: TokenService,
  ) {
    super({ relationsFields });

    const relations = this.repo.metadata.ownRelations;
    relations.forEach(({ propertyName }) => {
      this.relations.push(propertyName);
    });
  }

  public async find(
    queryArgs: IGQLQueryArgs<CollectionDTO>,
  ): Promise<IDataListResponse<CollectionDTO>> {
    const qb = this.repo.createQueryBuilder();
    this.applyFilters(qb, queryArgs);

    const data = await qb.getRawMany();
    const count = await this.getCountByFilters(qb, queryArgs);

    return { data, count };
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

  private applyFilters(
    qb: SelectQueryBuilder<Collections>,
    queryArgs: IGQLQueryArgs<CollectionDTO>,
  ): void {
    this.select(qb);
    this.applyTokensSubQuery(qb, queryArgs);
    this.applyLimitOffset(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);
    this.applyWhereCondition(qb, this.getCollectionQueryArgs(queryArgs));
    this.applyDistinctOn(qb, queryArgs);
  }

  private applyTokensSubQuery(
    qb: SelectQueryBuilder<Collections>,
    queryArgs: IGQLQueryArgs<TCollectionWithTokens>,
  ) {
    if (queryArgs.where?.tokens) {
      const { query, params } = this.tokenService.getCollectionIdsQuery({
        limit: null,
        where: queryArgs.where.tokens,
      } as IGQLQueryArgs<TokenDTO>);

      if (!isEmpty(params)) {
        qb.andWhere(`Collections.collection_id IN ( ${query} )`, params);
      }
    }
  }

  private getCollectionQueryArgs(queryArgs: IGQLQueryArgs<CollectionDTO>) {
    return {
      ...queryArgs,
      where: pickBy(
        queryArgs.where,
        (_val, key: string) => !this.relations.includes(key),
      ),
    } as IGQLQueryArgs<CollectionDTO>;
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
    qb.addSelect('"Collections".collection_cover', 'collection_cover');
    qb.addSelect('Collections.mode', 'type');
    qb.addSelect('Collections.mint_mode', 'mint_mode');
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
    qb.addSelect(
      `CASE
        WHEN COALESCE("Statistics".tokens_count, 0::bigint) > 0 THEN COALESCE("Statistics".tokens_count, 0::bigint)
        ELSE 0::bigint
      END`,
      'tokens_count',
    );
    qb.addSelect(
      `CASE
        WHEN COALESCE("Statistics".holders_count, 0::bigint) > 0 THEN COALESCE("Statistics".holders_count, 0::bigint)
        ELSE 0::bigint
      END`,
      'holders_count',
    );
    qb.addSelect(
      `CASE
        WHEN COALESCE("Statistics".actions_count, 0::bigint) > 0 THEN COALESCE("Statistics".actions_count, 0::bigint)
        ELSE 0::bigint
      END`,
      'actions_count',
    );
    qb.addSelect('Collections.date_of_creation', 'date_of_creation');
    qb.leftJoin('Collections.statistics', 'Statistics');
  }
}
