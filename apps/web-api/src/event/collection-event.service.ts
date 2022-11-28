import { EventMethod, EventSection, JOIN_TYPE } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GraphQLResolveInfo } from 'graphql';
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IRelations } from '../utils/base.service.types';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { CollectionEventDTO } from './collection-event.dto';
import { EventDTO } from './event.dto';

const aliasFields = {
  action: 'method',
  author: 'signer',
  result: 'success',
};

const EXTRINSIC_RELATION_ALIAS = 'Extrinsic';

const relationsFields = {
  author: EXTRINSIC_RELATION_ALIAS,
  result: EXTRINSIC_RELATION_ALIAS,
  fee: EXTRINSIC_RELATION_ALIAS,
};

const customQueryFields = {
  collection_id: `"Event"."values"->>'collectionId'`,
};

@Injectable()
export class CollectionEventService extends BaseService<Event, EventDTO> {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {
    super({ aliasFields, relationsFields, customQueryFields });
  }

  protected getConditionField(
    qb: SelectQueryBuilder<Event>,
    field: string,
  ): string {
    if (field === 'collection_id') {
      return `"${qb.alias}"."values"->>'collectionId'`;
    }

    return super.getConditionField(qb, field);
  }

  public async find(
    queryArgs: IGQLQueryArgs<Partial<CollectionEventDTO>>,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<CollectionEventDTO>> {
    const qb = this.repo.createQueryBuilder();

    const queryFields = this.getQueryFields(queryInfo);
    const relations: IRelations = {
      [EXTRINSIC_RELATION_ALIAS]: {
        table: 'extrinsic',
        on: `"${EXTRINSIC_RELATION_ALIAS}".block_index = "Event".block_index`,
        join: JOIN_TYPE.INNER,
      },
    };

    this.applySelect(qb, queryArgs, queryFields, relations);

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    qb.andWhere({
      phase: Not('Initialization'),
      section: In([EventSection.COMMON, EventSection.UNIQUE]),
      method: In([
        EventMethod.COLLECTION_CREATED,
        EventMethod.COLLECTION_DESTROYED,
        EventMethod.COLLECTION_SPONSOR_SET,
        EventMethod.COLLECTION_SPONSOR_REMOVED,
        EventMethod.SPONSORSHIP_CONFIRMED,
        EventMethod.COLLECTION_LIMIT_SET,
        EventMethod.COLLECTION_ADMIN_ADDED,
        EventMethod.COLLECTION_ADMIN_REMOVED,
      ]),
    });

    return this.getDataAndCount(qb, queryArgs);
  }
}
