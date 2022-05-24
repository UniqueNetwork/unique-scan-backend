import { Event } from '@entities/Event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { EventDTO } from './event.dto';

@Injectable()
export class EventService extends BaseService<Event, EventDTO> {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {
    super();
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
      section: 'balances',
      method: In(['Transfer', 'Deposit']),
    });
    qb.groupBy('"Event".block_number');
    qb.addGroupBy('"Event".block_index');

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    const data = await qb.getRawMany();
    const count = await qb.getCount();
    return { data, count };
  }
}
