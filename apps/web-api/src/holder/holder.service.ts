import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IGQLQueryArgs } from '../utils/gql-query-args';
import { HolderDTO } from './holder.dto';

@Injectable()
export class HolderService extends BaseService<Tokens, HolderDTO> {
  constructor(@InjectRepository(Tokens) private repo: Repository<Tokens>) {
    super();
  }

  public async find(queryArgs: IGQLQueryArgs<HolderDTO>): Promise<Tokens[]> {
    const qb = this.repo.createQueryBuilder();
    qb.select(['collection_id', 'owner']);
    qb.addSelect('count(token_id)', 'count');
    qb.addGroupBy('Tokens.collection_id');
    qb.addGroupBy('owner');
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    const tokens = await qb.getRawMany();
    return tokens;
  }
}
