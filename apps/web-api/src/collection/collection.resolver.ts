import {
  Args,
  ArgsType,
  Field,
  InputType,
  ObjectType,
  Query,
  Resolver,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { forwardRef, Inject } from '@nestjs/common';
import {
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  GQLOrderByParamsArgs,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { CollectionDTO } from './collection.dto';
import { CollectionService } from './collection.service';
import { TokenDTO } from '../tokens/token.dto';
import { TokenService } from '../tokens/token.service';

@InputType()
class CollectionWhereParams implements TWhereParams<CollectionDTO> {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  description?: GQLWhereOpsString;
}

@InputType()
class CollectionOrderByParams implements TOrderByParams<CollectionDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  description?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<CollectionDTO>
{
  @Field(() => CollectionWhereParams, { nullable: true })
  where?: CollectionWhereParams;

  @Field(() => CollectionOrderByParams, { nullable: true })
  order_by?: CollectionOrderByParams;
}

@ObjectType()
class CollectionEntity extends CollectionDTO {
  @Field(() => [TokenDTO], { nullable: true })
  tokens?: TokenDTO[];
}

@Resolver(() => CollectionEntity)
export class CollectionResolver {
  constructor(
    private service: CollectionService,
    @Inject(forwardRef(() => TokenService)) private tokenService: TokenService,
  ) {}

  @Query(() => [CollectionEntity])
  public async collections(
    @Args() args: QueryArgs,
  ): Promise<CollectionEntity[]> {
    return this.service.find(args);
  }

  @ResolveField()
  async tokens(@Parent() { collection_id }: CollectionEntity) {
    console.log(collection_id);
    return this.tokenService.getByCollectionId(collection_id);
  }
}
