import { Event } from '@entities/Event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { EventDTO } from './event.dto';
import { EventMethod, EventSection } from '@common/constants';
import { TokenEventDTO } from './token-event.dto';

const aliasFields = {
  action: 'method',
  author: 'signer',
  result: 'success',
};

const relationsFields = {
  author: 'Extrinsic',
  result: 'Extrinsic',
  fee: 'Extrinsic',
};
@Injectable()
export class EventService extends BaseService<Event, EventDTO> {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {
    super({ aliasFields, relationsFields });
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
  ): Promise<IDataListResponse<EventDTO>> {
    const qb = this.repo.createQueryBuilder();
    qb.select(['block_index', 'block_number']);
    qb.addSelect(
      `
        sum(CASE
          WHEN "Event".method = 'Transfer' THEN "Event".amount::double precision
          ELSE 0
        END)
        `,
      'amount',
    );
    qb.addSelect(
      `
        sum(CASE
          WHEN "Event".method = 'Deposit' THEN "Event".amount::double precision::double precision
          ELSE 0
        END)
        `,
      'fee',
    );
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
  ): Promise<IDataListResponse<TokenEventDTO>> {
    const qb = this.repo.createQueryBuilder();
    qb.select(['"Event".timestamp']);
    qb.addSelect('"Event".method', 'action');
    qb.addSelect('("Event".data::json->>0)::int', 'collection_id');
    qb.addSelect('("Event".data::json->>1)::int', 'token_id');
    qb.addSelect('"Event".values', 'values');

    qb.leftJoin(
      'extrinsic',
      'Extrinsic',
      '"Extrinsic".block_index = "Event".block_index',
    );

    qb.addSelect('"Extrinsic".signer', 'author');
    qb.addSelect('"Extrinsic".fee', 'fee');
    qb.addSelect('"Extrinsic".success', 'result');

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
