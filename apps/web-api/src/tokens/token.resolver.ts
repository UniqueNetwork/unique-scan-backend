import {
  Args,
  ArgsType,
  Field,
  InputType,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { forwardRef, Inject } from '@nestjs/common';
import {
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  TWhereParams,
} from '../utils/gql-query-args';
import { TokenDTO } from './token.dto';
import { TokenService } from './token.service';
import { CollectionDTO } from '../collection/collection.dto';
import { CollectionService } from '../collection/collection.service';

@InputType()
class TokenWhereParams implements TWhereParams<TokenDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  token_id?: GQLWhereOpsInt;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TokenDTO>
{
  @Field(() => TokenWhereParams, { nullable: true })
  where?: TokenWhereParams;
}

@ObjectType()
class TokenEntity extends TokenDTO {
  @Field(() => [CollectionDTO], { nullable: true })
  collections?: CollectionDTO[];
}

@Resolver(() => TokenEntity)
export class TokenResolver {
  constructor(
    private service: TokenService,
    @Inject(forwardRef(() => CollectionService))
    private collectionService: CollectionService,
  ) {}

  @Query(() => [TokenEntity])
  public tokens(@Args() args: QueryArgs): Promise<TokenEntity[]> {
    return this.service.find(args);
  }

  @ResolveField()
  async collections(@Parent() { collection_id }: TokenEntity) {
    return this.collectionService.getByCollectionId(collection_id);
  }
}
