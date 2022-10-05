import { Args, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse } from '../utils/gql-query-args';
import { AttributeDTO } from './attribute.dto';
import {
  AttributesDataResponse,
  AttributesQueryArgs,
} from './attributes.resolver.types';
import { AttributesService } from './attributes.service';

@Resolver(() => AttributeDTO)
export class AttributesResolver {
  constructor(private service: AttributesService) {}

  @Query(() => AttributesDataResponse)
  public async attributes(
    @Args() args: AttributesQueryArgs,
  ): Promise<IDataListResponse<AttributeDTO>> {
    return this.service.getCollectionAttributes(args);
  }
}
