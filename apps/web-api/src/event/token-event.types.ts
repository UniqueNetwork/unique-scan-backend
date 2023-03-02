import { ArgsType, Field, InputType } from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsBoolean,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { TokenEventDTO } from './token-event.dto';

@InputType()
class TokenEventWhereParams implements TWhereParams<Partial<TokenEventDTO>> {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  token_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  action?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  author?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  data?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  type?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsBoolean, { nullable: true })
  result?: GQLWhereOpsBoolean;

  @Field(() => [TokenEventWhereParams], { nullable: true })
  _and?: TokenEventWhereParams[];

  @Field(() => [TokenEventWhereParams], { nullable: true })
  _or?: TokenEventWhereParams[];
}

@InputType()
class TokenEventOrderByParams
  implements TOrderByParams<Partial<TokenEventDTO>>
{
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  token_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  action?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  result?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  timestamp?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  fee?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  type?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  token_name?: GQLOrderByParamsArgs;
}

@ArgsType()
export class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<Partial<TokenEventDTO>>
{
  @Field(() => TokenEventWhereParams, { nullable: true })
  where?: TokenEventWhereParams;

  @Field(() => TokenEventOrderByParams, { nullable: true })
  order_by?: TokenEventOrderByParams;
}
