import { Event } from '@entities/Event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { TransferDTO } from './transfer.dto';
import { SentryWrapper } from '../utils/sentry.decorator';
import { GraphQLResolveInfo } from 'graphql';
import { EventMethod } from '@common/constants';

const customQueryFields = {
  block_index: "CONCAT(block_number, '-', event_index)",
  data: 'data::text',
};
@Injectable()
export class TransferService extends BaseService<Event, TransferDTO> {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {
    super({ customQueryFields });
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: IGQLQueryArgs<TransferDTO>,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<Event>> {
    const qb = this.repo.createQueryBuilder();

    qb.where({ method: EventMethod.TRANSFER });

    this.applySelect(qb, this.getQueryFields(queryInfo));

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    return this.getDataAndCount(qb, queryArgs);
  }
}
