import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { forwardRef, Inject } from '@nestjs/common';
import { TokenService } from './token.service';
import { CollectionService } from '../collection/collection.service';
import { NestingArgs, NestingToken, TokenEntity } from './token.resolver.types';

@Resolver(() => NestingToken)
export class NestingResolver {
  constructor(
    private service: TokenService,
    @Inject(forwardRef(() => CollectionService))
    private collectionService: CollectionService,
  ) {}

  @Query(() => NestingToken, { nullable: true })
  public async tokenBundle(
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

  @ResolveField(() => [NestingToken])
  async nestingChildren(@Parent() { collection_id, token_id }: TokenEntity) {
    return this.service.findNestingChildren(collection_id, token_id);
  }
}
