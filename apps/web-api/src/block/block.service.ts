import { Block } from '@entities/Block';
import { Event } from '@entities/Event';
import { Extrinsic } from '@entities/Extrinsic';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { BlockDto, LastBlockDto } from './block.dto';

@Injectable()
export class BlockService extends BaseService<Block, BlockDto | LastBlockDto> {
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

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    const data = await qb.getRawMany();
    const count = await qb.getCount();
    return { data, count };
  }

  public async findLastBlock(
    queryArgs: IGQLQueryArgs<LastBlockDto>,
  ): Promise<IDataListResponse<Block>> {
    const qb = this.repo.createQueryBuilder();

    const extrinsicSubQuery = qb
      .subQuery()
      .select('Extrinsic.block_number', 'block_number')
      .addSelect('count(Extrinsic.block_number)', 'extrinsic_count')
      .from(Extrinsic, 'Extrinsic')
      .groupBy('"Extrinsic".block_number');

    const eventsSubQuery = qb
      .subQuery()
      .select('Event.block_number', 'block_number')
      .addSelect('count(Event.block_number)', 'event_count')
      .from(Event, 'Event')
      .groupBy('"Event".block_number');

    qb.select('Block.block_number', 'block_number');
    qb.addSelect('Block.timestamp', 'timestamp');
    qb.addSelect('"ExtrinsicCount".extrinsic_count', 'extrinsic_count');
    qb.addSelect('"EventCount".event_count', 'event_count');
    qb.leftJoin(
      extrinsicSubQuery.getQuery(),
      'ExtrinsicCount',
      '"ExtrinsicCount".block_number = Block.block_number',
    );
    qb.leftJoin(
      eventsSubQuery.getQuery(),
      'EventCount',
      '"EventCount".block_number = Block.block_number',
    );

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    const data = await qb.getRawMany();

    console.log('data', data);
    const count = await qb.getCount();
    return { data, count };
  }
}
