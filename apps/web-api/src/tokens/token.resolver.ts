import {
  Args,
  ArgsType,
  Field,
  InputType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { TokenDTO } from './token.dto';
import { TokenService } from './token.service';

@InputType()
class TokenWhereParams implements TWhereParams<TokenDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  token_id?: GQLWhereOpsInt;
}

@InputType()
class TokenOrderByParams implements TOrderByParams<TokenDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  token_id?: GQLOrderByParamsArgs;
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

@Resolver(() => TokenDTO)
export class TokenResolver {
  constructor(private service: TokenService) {}

  @Query(() => [TokenDTO])
  public tokens(@Args() args: QueryArgs): Promise<TokenDTO[]> {
    return this.service.find(args);
  }
}
