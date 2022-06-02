import { Extrinsic } from '@entities/Extrinsic';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { ExtrinsicDTO } from './extrinsic.dto';

@Injectable()
export class ExtrinsicService extends BaseService<Extrinsic, ExtrinsicDTO> {
  constructor(
    @InjectRepository(Extrinsic) private repo: Repository<Extrinsic>,
  ) {
    super();
  }

  public async find(
    queryArgs: IGQLQueryArgs<ExtrinsicDTO>,
  ): Promise<IDataListResponse<ExtrinsicDTO>> {
    const qb = this.repo.createQueryBuilder();

    qb.select('Extrinsic.block_index', 'block_index');
    qb.addSelect('Extrinsic.block_number', 'block_number');
    qb.addSelect('Extrinsic.signer', 'from_owner');
    qb.addSelect('Extrinsic.signer_normalized', 'from_owner_normalized');
    qb.addSelect('Extrinsic.to_owner', 'to_owner');
    qb.addSelect('Extrinsic.to_owner_normalized', 'to_owner_normalized');
    qb.addSelect('Extrinsic.hash', 'hash');
    qb.addSelect('Extrinsic.success', 'success');
    qb.addSelect('Extrinsic.timestamp', 'timestamp');
    qb.addSelect('Extrinsic.method', 'method');
    qb.addSelect('Extrinsic.section', 'section');
    qb.addSelect('Extrinsic.amount', 'amount');
    qb.addSelect('Extrinsic.fee', 'fee');
    qb.where({
      method: In([
        'transfer',
        'transferAll',
        'transferKeepAlive',
        'vestedTransfer',
      ]),
    });
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);
    const data = await qb.getRawMany();
    const count = await qb.getCount();
    return { data, count };
  }
}
