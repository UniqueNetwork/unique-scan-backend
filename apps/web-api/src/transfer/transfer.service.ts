import { Event } from '@entities/Event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IGQLQueryArgs } from '../utils/gql-query-args';
import { TransferDTO } from './transfer.dto';

@Injectable()
export class TransferService extends BaseService<Event, TransferDTO> {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {
    super();
  }

  public async find(queryArgs: IGQLQueryArgs<TransferDTO>): Promise<Event[]> {
    const qb = this.repo.createQueryBuilder();
    qb.select(['section', 'method', 'data']);
    qb.addSelect(`concat(block_number, '-', event_index)`, 'block_index');
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    qb.andWhere({ method: 'Transfer' });
    return qb.getRawMany();
  }
}
