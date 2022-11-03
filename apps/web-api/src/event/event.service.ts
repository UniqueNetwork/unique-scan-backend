import { Event } from '@entities/Event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { EventDTO } from './event.dto';
import { EventMethod, EventSection } from '@common/constants';
import { TokenEventDTO } from './token-event.dto';
import { GraphQLResolveInfo } from 'graphql';
import { IRelations } from '../utils/base.service.types';

const EXTRINSIC_RELATION_ALIAS = 'Extrinsic';

const relationsFields = {
  author: EXTRINSIC_RELATION_ALIAS,
  result: EXTRINSIC_RELATION_ALIAS,
  fee: EXTRINSIC_RELATION_ALIAS,
};

const aliasFields = {
  action: 'method',
  author: 'signer',
  result: 'success',
};

const customQueryFields = {
  amount: `
    sum(CASE
      WHEN "Event".method = 'Transfer' THEN "Event".amount::double precision
      ELSE 0
    END)
  `,
  fee: `
    sum(CASE
      WHEN "Event".method = 'Deposit' THEN "Event".amount::double precision::double precision
      ELSE 0
    END)
  `,
  collection_id: '("Event".data::json->>0)::int',
  token_id: '("Event".data::json->>1)::int',
};

@Injectable()
export class EventService extends BaseService<Event, EventDTO> {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {
    super({ aliasFields, relationsFields, customQueryFields });
  }

  protected getConditionField(
    qb: SelectQueryBuilder<Event>,
    field: string,
  ): string {
    if (field === 'collection_id') {
      return `("${qb.alias}".data::json->>0)::int`;
    }

    if (field === 'token_id') {
      return `("${qb.alias}".data::json->>1)::int`;
    }

    return super.getConditionField(qb, field);
  }

  public async find(
    queryArgs: IGQLQueryArgs<EventDTO>,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<EventDTO>> {
    const qb = this.repo.createQueryBuilder();

    this.applySelect(qb, this.getQueryFields(queryInfo));

    qb.where({
      phase: Not('Initialization'),
      section: EventSection.BALANCES,
      method: In([EventMethod.TRANSFER, EventMethod.DEPOSIT]),
    });
    qb.groupBy('"Event".block_number');
    qb.addGroupBy('"Event".block_index');

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    return this.getDataAndCount(qb, queryArgs);
  }

  public async findTokenEvents(
    queryArgs: IGQLQueryArgs<Partial<TokenEventDTO>>,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<TokenEventDTO>> {
    const qb = this.repo.createQueryBuilder();

    const queryFields = this.getQueryFields(queryInfo);

    const relations = {
      [EXTRINSIC_RELATION_ALIAS]: {
        table: 'extrinsic',
        on: `"${EXTRINSIC_RELATION_ALIAS}".block_index = "Event".block_index`,
      },
    } as IRelations;

    this.applySelect(qb, queryFields, relations);

    qb.where({
      phase: Not('Initialization'),
      section: EventSection.COMMON,
      method: In([
        EventMethod.ITEM_CREATED,
        EventMethod.TRANSFER,
        EventMethod.ITEM_DESTROYED,
      ]),
    });

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    return this.getDataAndCount(qb, queryArgs);
  }
}
