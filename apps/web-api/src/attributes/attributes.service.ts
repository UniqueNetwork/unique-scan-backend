import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AttributesQueryArgs } from './attributes.resolver.types';
import { AttributesDto } from './attributes.dto';
import { IDataListResponse } from '../utils/gql-query-args';
import { GraphQLResolveInfo } from 'graphql';
import { BaseService } from '../utils/base.service';
import { Account, Attribute } from '@common/entities';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AttributesService extends BaseService<Attribute, AttributesDto> {
  constructor(
    @InjectRepository(Attribute)
    private attributeRepository: Repository<Attribute>
  ) {
    super();
  }

  async find(
    queryArgs: AttributesQueryArgs,
    queryInfo: GraphQLResolveInfo
  ): Promise<IDataListResponse<AttributesDto>> {
    const qb = this.attributeRepository.createQueryBuilder();

    const queryFields = this.getQueryFields(queryInfo);
    this.applySelect(qb, queryArgs, queryFields);
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    return this.getDataAndCount(qb, queryArgs);
  }
}
