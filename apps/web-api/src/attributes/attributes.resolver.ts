import { Args, Info, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse } from '../utils/gql-query-args';
import { AttributesDto } from './attributes.dto';
import {
  AttributesDataResponse,
  AttributesQueryArgs,
} from './attributes.resolver.types';
import { AttributesService } from './attributes.service';
import { GraphQLResolveInfo } from 'graphql';

@Resolver(() => AttributesDto)
export class AttributesResolver {
  constructor(private attributesService: AttributesService) {}

  @Query(() => AttributesDataResponse)
  public async attributes(
    @Args() args: AttributesQueryArgs,
    @Info() info: GraphQLResolveInfo
  ): Promise<IDataListResponse<AttributesDto>> {
    return this.attributesService.find(args, info);
  }
}
