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
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
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

  @Field(() => [TokenWhereParams], { nullable: true })
  _and?: TokenWhereParams[];

  @Field(() => [TokenWhereParams], { nullable: true })
  _or?: TokenWhereParams[];
}

@InputType()
class TokenOrderByParams implements TOrderByParams<TokenDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  token_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  date_of_creation?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TokenDTO>
{
  @Field(() => TokenWhereParams, { nullable: true })
  where?: TokenWhereParams;

  @Field(() => TokenOrderByParams, { nullable: true })
  order_by?: TokenOrderByParams;
}

@ObjectType()
class TokenEntity extends TokenDTO {
  @Field(() => CollectionDTO, { nullable: true })
  collection?: CollectionDTO;
}

@ObjectType()
class TokenDataResponse extends ListDataType(TokenEntity) {}

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
