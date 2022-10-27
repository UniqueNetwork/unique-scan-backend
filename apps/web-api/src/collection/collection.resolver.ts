import {
  Args,
  ArgsType,
  Field,
  InputType,
  ObjectType,
  Query,
  registerEnumType,
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
  IDataListResponse,
  ListDataType,
} from '../utils/gql-query-args';
import { CollectionDTO, CollectionEnum } from './collection.dto';
import { CollectionService } from './collection.service';
import { TokenDTO } from '../tokens/token.dto';
import { TokenService } from '../tokens/token.service';

registerEnumType(CollectionEnum, { name: 'CollectionEnum' });

@InputType()
class CollectionWhereParams implements TWhereParams<CollectionDTO> {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  name?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  description?: GQLWhereOpsString;

  @Field(() => [CollectionWhereParams], { nullable: true })
  _and?: CollectionWhereParams[];

  @Field(() => [CollectionWhereParams], { nullable: true })
  _or?: CollectionWhereParams[];
}

@InputType()
class CollectionOrderByParams implements TOrderByParams<CollectionDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  description?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  date_of_creation?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<CollectionDTO>
{
  @Field(() => CollectionEnum, { nullable: true })
  distinct_on?: CollectionEnum;

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

@ObjectType()
class CollectionDataResponse extends ListDataType(CollectionEntity) {}

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
