import { Args, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse } from '../utils/gql-query-args';
import { AttributeV1DTO } from './attributeV1DTO';
import {
  AttributesV1DataResponse,
  AttributesV1QueryArgs,
} from './attributesV1.resolver.types';
import { AttributesV1Service } from './attributesV1.service';

@Resolver(() => AttributeV1DTO)
export class AttributesV1Resolver {
  constructor(private service: AttributesV1Service) {}

  @Query(() => AttributesV1DataResponse, { name: 'attributes_v1' })
  public async attributes_v1(
    @Args() args: AttributesV1QueryArgs
  ): Promise<IDataListResponse<AttributeV1DTO>> {
    return this.service.getCollectionAttributes(args);
  }
}
