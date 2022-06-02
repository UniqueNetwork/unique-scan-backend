import { Block } from '@entities/Block';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { BlockDto } from './block.dto';

@Injectable()
export class BlockService extends BaseService<Block, BlockDto> {
  constructor(@InjectRepository(Block) private repo: Repository<Block>) {
    super();
  }

  public async find(
    queryArgs: IGQLQueryArgs<BlockDto>,
  ): Promise<IDataListResponse<Block>> {
    const qb = this.repo.createQueryBuilder();

    qb.select('Block.block_number', 'block_number');
    qb.addSelect('Block.timestamp', 'timestamp');
    qb.addSelect('Block.block_hash', 'block_hash');
    qb.addSelect('Block.parent_hash', 'parent_hash');
    qb.addSelect('Block.extrinsics_root', 'extrinsics_root');
    qb.addSelect('Block.state_root', 'state_root');
    qb.addSelect('Block.session_length', 'session_length');
    qb.addSelect('Block.spec_name', 'spec_name');
    qb.addSelect('Block.spec_version', 'spec_version');
    qb.addSelect('Block.total_events', 'total_events');
    qb.addSelect('Block.num_transfers', 'num_transfers');
    qb.addSelect('Block.new_accounts', 'new_accounts');
    qb.addSelect('Block.total_issuance', 'total_issuance');
    qb.addSelect('Block.timestamp', 'timestamp');
    qb.addSelect('Block.need_rescan', 'need_rescan');
    qb.addSelect('Block.total_extrinsics', 'total_extrinsics');

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    const data = await qb.getRawMany();
    const count = await qb.getCount();
    return { data, count };
  }
}
