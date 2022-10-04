import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import {
  IDataListResponse,
  IDateRange,
  IGQLQueryArgs,
  IStatsResponse,
} from '../utils/gql-query-args';
import { SentryWrapper } from '../utils/sentry.decorator';
import { AttributeDTO } from './attribute.dto';

@Injectable()
export class AttributesService extends BaseService<AttributeDTO, AttributeDTO> {
  constructor(
    @InjectRepository(Collections)
    private collectionRepository: Repository<Collections>,

    @InjectRepository(Tokens)
    private tokenRepository: Repository<Tokens>,

    private dataSource: DataSource,
  ) {
    super();
  }

  @SentryWrapper({ data: [], count: 0 })
  public async getCollectionAttributes(
    queryArgs: IGQLQueryArgs<AttributeDTO>,
    // ): Promise<IDataListResponse<AttributeDTO>> {
  ) {
    console.log(queryArgs);

    dataSource.que;
    // const qb = this.collectionRepository.createQueryBuilder();
    // qb.select('Account.account_id', 'account_id');
    // qb.addSelect('Account.available_balance', 'available_balance');
    // qb.addSelect('Account.free_balance', 'free_balance');
    // qb.addSelect('Account.locked_balance', 'locked_balance');
    // qb.addSelect('Account.timestamp', 'timestamp');
    // qb.addSelect('Account.block_height', 'block_height');
    // qb.addSelect('Account.account_id_normalized', 'account_id_normalized');

    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    // return this.getDataAndCount(qb, queryArgs);
  }
}
