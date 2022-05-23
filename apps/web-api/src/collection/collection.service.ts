import { Collections } from '@entities/Collections';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IGQLQueryArgs } from '../utils/gql-query-args';
import { CollectionDTO } from './collection.dto';

@Injectable()
export class CollectionService extends BaseService<Collections, CollectionDTO> {
  constructor(
    @InjectRepository(Collections) private repo: Repository<Collections>,
  ) {
    super();
  }

  public async find(
    queryArgs: IGQLQueryArgs<CollectionDTO>,
  ): Promise<CollectionDTO[]> {
    const qb = this.repo.createQueryBuilder();
    qb.select('Collections.collection_id', 'collection_id');
    qb.addSelect('Collections.owner', 'owner');
    qb.addSelect('Collections.name', 'name');
    qb.addSelect('Collections.description', 'description');
    qb.addSelect('Collections.offchain_schema', 'offchain_schema');
    qb.addSelect('Collections.token_limit', 'token_limit');
    qb.addSelect('Collections.token_prefix', 'token_prefix');
    qb.addSelect(
      `"Collections".variable_on_chain_schema::json ->> 'collectionCover'::text`,
      'collection_cover',
    );
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
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    const collections = await qb.getRawMany();
    return collections;
  }
}
