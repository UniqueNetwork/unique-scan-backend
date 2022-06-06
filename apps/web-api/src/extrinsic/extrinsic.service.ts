import { Event } from '@entities/Event';
import { Extrinsic } from '@entities/Extrinsic';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
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

    const subQuery = qb
      .subQuery()
      .select('block_index')
      .addSelect(
        `
        sum(CASE
          WHEN "Event".method = 'Transfer' THEN "Event".amount::double precision
          ELSE 0
        END)
        `,
        'amount',
      )
      .addSelect(
        `
        sum(CASE
          WHEN "Event".method = 'Deposit' THEN "Event".amount::double precision::double precision
          ELSE 0
        END)
        `,
        'fee',
      )
      .from(Event, 'Event')
      .where({
        phase: Not('Initialization'),
        section: 'balances',
        method: In(['Transfer', 'Deposit']),
      })
      .groupBy('"Event".block_index');

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
    qb.addSelect('"SumByEvent".amount', 'amount');
    qb.addSelect('"SumByEvent".fee', 'fee');
    qb.where({
      method: In([
        'transfer',
        'transferAll',
        'transferKeepAlive',
        'vestedTransfer',
      ]),
    });
    qb.leftJoin(
      subQuery.getQuery(),
      'SumByEvent',
      '"SumByEvent".block_index = "Extrinsic".block_index',
    );
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);
    const data = await qb.getRawMany();
    const count = await qb.getCount();
    return { data, count };
  }
}
