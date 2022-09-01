import { Block } from '@entities/Block';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { BlockDto } from './block.dto';
import { SentryWrapper } from '../utils/sentry.decorator';

@Injectable()
export class BlockService extends BaseService<Block, BlockDto> {
  constructor(@InjectRepository(Block) private repo: Repository<Block>) {
    super();
  }

  @SentryWrapper({ data: [], count: 0 })
  public async find(
    queryArgs: IGQLQueryArgs<BlockDto>,
  ): Promise<IDataListResponse<Block>> {
    const qb = this.repo.createQueryBuilder();

    qb.select([
      'block_number',
      'timestamp',
      'block_hash',
      'parent_hash',
      'extrinsics_root',
      'state_root',
      'session_length',
      'spec_name',
      'spec_version',
      'total_events',
      'num_transfers',
      'new_accounts',
      'total_issuance',
      'timestamp',
      'total_extrinsics',
      'need_rescan',
    ]);

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    // const data = await qb.getRawMany();
    // const count = await qb.getCount();
    return this.getDataAndCount(qb, queryArgs);
  }
}
