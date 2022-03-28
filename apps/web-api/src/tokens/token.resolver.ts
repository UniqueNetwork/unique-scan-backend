import {
  Args,
  ArgsType,
  Field,
  InputType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
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

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TokenDTO>
{
  @Field(() => TokenWhereParams, { nullable: true })
  where?: TokenWhereParams;
}

@Resolver(() => TokenDTO)
export class TokenResolver {
  constructor(private service: TokenService) {}

  @Query(() => [TokenDTO])
  public tokens(@Args() args: QueryArgs): Promise<TokenDTO[]> {
    return this.service.find(args);
  }
}
