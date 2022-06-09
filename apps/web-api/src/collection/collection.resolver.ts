import { Args, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { forwardRef, Inject } from '@nestjs/common';
import { IDataListResponse } from '../utils/gql-query-args';
import { CollectionDTO } from './collection.dto';
import { CollectionService } from './collection.service';
import { TokenService } from '../tokens/token.service';
import {
  CollectionDataResponse,
  CollectionEntity,
  QueryArgs,
} from './collection.resolver.types';

@Resolver(() => CollectionEntity)
export class CollectionResolver {
  constructor(
    private service: CollectionService,
    @Inject(forwardRef(() => TokenService)) private tokenService: TokenService,
  ) {}

  @Query(() => CollectionDataResponse)
  public async collections(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<CollectionDTO>> {
    return this.service.find(args);
  }

  @ResolveField()
  async tokens(@Parent() { collection_id }: CollectionEntity) {
    return this.tokenService.getByCollectionId(collection_id);
  }
}
