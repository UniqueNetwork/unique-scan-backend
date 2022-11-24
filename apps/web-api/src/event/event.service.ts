import { Event } from '@entities/Event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { EventDTO } from './event.dto';
import { EventMethod, EventSection } from '@common/constants';
import { GraphQLResolveInfo } from 'graphql';

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
    super({ customQueryFields });
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

    this.applySelect(qb, queryArgs, this.getQueryFields(queryInfo));

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    return this.getDataAndCount(qb, queryArgs);
  }
}
