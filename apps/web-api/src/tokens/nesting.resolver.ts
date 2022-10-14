import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { forwardRef, Inject } from '@nestjs/common';
import { TokenService } from './token.service';
import { CollectionService } from '../collection/collection.service';
import {
  NestingArgs,
  NestingToken,
  QueryArgs,
  TokenEntity,
} from './token.resolver.types';

@Resolver(() => NestingToken)
export class NestingResolver {
  constructor(
    private service: TokenService,
    @Inject(forwardRef(() => CollectionService))
    private collectionService: CollectionService,
  ) {}

  @Query(() => NestingToken, { nullable: true })
  public async nestingToken(
    @Args('input') { collection_id, token_id }: NestingArgs,
  ) {
    const token = await this.service.getToken(collection_id, token_id);
    if (!token) {
      throw Error(
        `Token with collection_id ${collection_id} and token_id ${token_id} not found`,
      );
    }

    return token;
  }

  @ResolveField()
  async nestingChildren(
    @Args() args: QueryArgs,
    @Parent() { collection_id, token_id }: TokenEntity,
  ) {
    // TODO: check for children
    const tokens = await this.service.findNestingChildren(
      args,
      collection_id,
      token_id,
    );

    return tokens.data;
  }
}
