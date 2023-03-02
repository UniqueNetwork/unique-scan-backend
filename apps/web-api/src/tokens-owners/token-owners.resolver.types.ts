import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  TokenOwnersDistinctFieldsEnum,
  TokenOwnersDTO,
} from './token-owners.dto';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';

registerEnumType(TokenOwnersDistinctFieldsEnum, { name: 'TokenOwnersEnum' });

@InputType()
export class TokenOwnersWhereParams implements TWhereParams<TokenOwnersDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  token_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  amount?: GQLWhereOpsString;

  @Field(() => [TokenOwnersWhereParams], { nullable: true })
  _and?: TokenOwnersWhereParams[];

  @Field(() => [TokenOwnersWhereParams], { nullable: true })
  _or?: TokenOwnersWhereParams[];
}

@InputType()
export class TokenOwnersOrderByParams
  implements TOrderByParams<TokenOwnersDTO>
{
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner_normalized?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  token_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  amount?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  date_of_creation?: GQLOrderByParamsArgs;
}

@ArgsType()
export class QueryArgsTokenOwner
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TokenOwnersDTO>
{
  @Field(() => TokenOwnersDistinctFieldsEnum, { nullable: true })
  distinct_on?: TokenOwnersDistinctFieldsEnum;

  @Field(() => TokenOwnersWhereParams, { nullable: true })
  where?: TokenOwnersWhereParams;

  @Field(() => TokenOwnersOrderByParams, { nullable: true })
  order_by?: TokenOwnersOrderByParams;
}

@ObjectType()
export class TokenOwnersDataResponse extends ListDataType(TokenOwnersDTO) {}
