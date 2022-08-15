import { EventMethod, EventSection } from '@common/constants';
import { Collections } from '@entities/Collections';
import { Event } from '@entities/Event';
import { Extrinsic } from '@entities/Extrinsic';
import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { TransactionDTO } from './transaction.dto';

const aliasFields = {
  from_owner: 'signer',
  from_owner_normalized: 'signer_normalized',
};

@Injectable()
export class TransactionService extends BaseService<Event, TransactionDTO> {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {
    super({ aliasFields });
  }

  public async findTokenTransactions(
    queryArgs: IGQLQueryArgs<TransactionDTO>,
  ): Promise<IDataListResponse<TransactionDTO>> {
    const qb = this.repo.createQueryBuilder();
    qb.select(['"Event".block_index', '"Event".timestamp']);

    qb.addSelect('("Event".data::jsonb ->> 0)::integer', 'collection_id');
    qb.addSelect('("Event".data::jsonb ->> 1)::integer', 'token_id');

    qb.addSelect('"Collection".name', 'collection_name');
    qb.addSelect('"Collection".token_prefix', 'token_prefix');

    // todo: Check this field when working on transactions resolver. See TokenByIdResult type.
    // qb.addSelect(`"Token".data ->> 'name'::text`, 'token_name');

    qb.addSelect('"Extrinsic".to_owner', 'to_owner');
    qb.addSelect('"Extrinsic".to_owner_normalized', 'to_owner_normalized');
    qb.addSelect('"Extrinsic".signer', 'owner');
    qb.addSelect('"Extrinsic".signer_normalized', 'owner_normalized');

    qb.leftJoin(
      Collections,
      'Collection',
      '"Collection".collection_id = ("Event".data::jsonb ->> 0)::integer',
    );

    qb.leftJoin(
      Tokens,
      'Token',
      `"Token".collection_id = ("Event".data::jsonb ->> 0)::integer
      AND "Token".token_id = ("Event".data::jsonb ->> 1)::integer`,
    );

    qb.innerJoin(
      Extrinsic,
      'Extrinsic',
      `"Extrinsic".block_index = "Event".block_index AND to_owner IS NOT NULL`,
    );

    qb.where({
      section: EventSection.COMMON,
      method: EventMethod.TRANSFER,
    });

    this.applyWhereCondition(qb, queryArgs);

    this.applyOrderCondition(qb, queryArgs);

    this.applyLimitOffset(qb, queryArgs);

    const count = await qb.getCount();
    const data = await qb.getRawMany();

    return { data, count };
  }
}
