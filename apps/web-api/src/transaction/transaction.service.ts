import { EventMethod, EventSection, JOIN_TYPE } from '@common/constants';
import { Event } from '@entities/Event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { TransactionDTO } from './transaction.dto';
import { SentryWrapper } from '../utils/sentry.decorator';
import { GraphQLResolveInfo } from 'graphql';
import { IRelations } from '../utils/base.service.types';

const EXTRINSIC_RELATION_ALIAS = 'Extrinsic';
const COLLECTION_RELATION_ALIAS = 'Collection';
const TOKEN_RELATION_ALIAS = 'Token';

const aliasFields = {
  owner: 'signer',
  owner_normalized: 'signer_normalized',
  collection_name: 'name',
};

const relationsFields = {
  owner: EXTRINSIC_RELATION_ALIAS,
  owner_normalized: EXTRINSIC_RELATION_ALIAS,
  to_owner: EXTRINSIC_RELATION_ALIAS,
  to_owner_normalized: EXTRINSIC_RELATION_ALIAS,

  collection_name: COLLECTION_RELATION_ALIAS,
  token_prefix: COLLECTION_RELATION_ALIAS,

  image: TOKEN_RELATION_ALIAS,
  token_name: TOKEN_RELATION_ALIAS,
};

const customQueryFields = {
  collection_id: '("Event".data::jsonb ->> 0)::integer',
  token_id: '("Event".data::jsonb ->> 1)::integer',
};
@Injectable()
export class TransactionService extends BaseService<Event, TransactionDTO> {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {
    super({ aliasFields, relationsFields, customQueryFields });
  }

  @SentryWrapper({ data: [], count: 0 })
  public async findTokenTransactions(
    queryArgs: IGQLQueryArgs<TransactionDTO>,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<TransactionDTO>> {
    const qb = this.repo.createQueryBuilder();

    this.applyArgs(qb, queryArgs, queryInfo);

    return this.getDataAndCount(qb, queryArgs);
  }

  private applyArgs(
    qb: SelectQueryBuilder<Event>,
    queryArgs: IGQLQueryArgs<TransactionDTO>,
    queryInfo: GraphQLResolveInfo,
  ): void {
    const queryFields = this.getQueryFields(queryInfo);

    const relations = {
      [COLLECTION_RELATION_ALIAS]: {
        table: 'collections',
        on: `"${COLLECTION_RELATION_ALIAS}".collection_id = ("Event".data::jsonb ->> 0)::integer`,
      },
      [TOKEN_RELATION_ALIAS]: {
        table: 'tokens',
        on: `"${TOKEN_RELATION_ALIAS}".collection_id = ("Event".data::jsonb ->> 0)::integer
        AND "${TOKEN_RELATION_ALIAS}".token_id = ("Event".data::jsonb ->> 1)::integer`,
      },
      [EXTRINSIC_RELATION_ALIAS]: {
        table: 'extrinsic',
        on: `"Extrinsic".block_index = "Event".block_index AND to_owner IS NOT NULL`,
        join: JOIN_TYPE.INNER,
      },
    } as IRelations;

    this.applySelect(qb, queryFields, relations);

    qb.andWhere({
      section: EventSection.COMMON,
      method: EventMethod.TRANSFER,
    });
    this.applyWhereCondition(qb, queryArgs);

    this.applyOrderCondition(qb, queryArgs);
    this.applyLimitOffset(qb, queryArgs);
  }
}
