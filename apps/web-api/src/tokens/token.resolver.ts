import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { forwardRef, Inject } from '@nestjs/common';
import { IDataListResponse } from '../utils/gql-query-args';
import { TokenService } from './token.service';
import { CollectionService } from '../collection/collection.service';
import {
  QueryArgs,
  TokenDataResponse,
  TokenEntity,
} from './token.resolver.types';

@Resolver(() => TokenEntity)
export class TokenResolver {
  constructor(
    private service: TokenService,
    @Inject(forwardRef(() => CollectionService))
    private collectionService: CollectionService,
  ) {}

  @Query(() => TokenDataResponse)
  public tokens(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<TokenEntity>> {
    return this.service.find(args);
  }

  @ResolveField()
  async collection(@Parent() { collection_id }: TokenEntity) {
    return this.collectionService.getCollectionById(collection_id);
  }
}
