import { Event } from '@entities/Event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { GraphQLResolveInfo } from 'graphql';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { EventDTO } from './event.dto';

const customQueryFields = {
  amount: `
    (CASE
      WHEN "Event".method = 'Transfer' THEN "Event".amount::numeric
      ELSE 0
    END)
  `,
  fee: `
    (CASE
      WHEN "Event".method = 'Deposit' THEN "Event".amount::numeric
      ELSE 0
    END)
  `,
  collection_id: `COALESCE((("Event".values::json->>'collectionId')::int), NULL)`,
  token_id: `COALESCE((("Event".values::json->>'tokenId')::int), NULL)`,
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
