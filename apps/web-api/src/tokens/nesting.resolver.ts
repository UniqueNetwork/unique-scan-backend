import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { TokenService } from './token.service';
import { NestingArgs, NestingToken, TokenEntity } from './token.resolver.types';

// todo: FROM HERE
@Resolver(() => NestingToken)
export class NestingResolver {
  constructor(private service: TokenService) {}

  @Query(() => NestingToken, { nullable: true })
  public async bundleTree(
    @Args('input') { collection_id, token_id }: NestingArgs,
  ) {
    const bundle = await this.service.getBundleRoot(collection_id, token_id);
    if (!bundle) {
      throw Error(
        `Bundle for collection_id ${collection_id} and token_id ${token_id} not found`,
      );
    }

    return bundle;
  }

  @ResolveField(() => [NestingToken])
  async nestingChildren(@Parent() { collection_id, token_id }: TokenEntity) {
    return this.service.findNestingChildren(collection_id, token_id);
  }
}
