import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { TokenType } from '@entities/Tokens';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  IWhereOperators,
  ListDataType,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { SimpleTokenDTO, TokenDistinctFieldsEnum, TokenDTO } from './token.dto';
import { CollectionDTO } from '../collection/collection.dto';

registerEnumType(TokenType, { name: 'TokenTypeEnum' });
registerEnumType(TokenDistinctFieldsEnum, { name: 'TokenEnum' });

@InputType()
export class GQLWhereTokensType {
  @Field(() => TokenType, { nullable: true })
  _eq?: TokenType;

  @Field(() => TokenType, { nullable: true })
  _neq?: TokenType;

  @Field(() => [TokenType], { nullable: true })
  _in?: TokenType[];
}

@InputType()
export class AttributeFilterValue {
  @Field({
    description:
      "The 'key' of attribute from 'attributes' object from the attributes query",
  })
  key: string;

  @Field({
    description:
      "The 'raw_value' of the attribute value from 'attributes[key].values[N]' object from the attributes query",
  })
  raw_value: string;
}

@InputType()
export class TokenWhereParams implements TWhereParams<TokenDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  collection_name?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  collection_owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  collection_owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  parent_id?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  is_sold?: IWhereOperators;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  token_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  token_prefix?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  token_name?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  burned?: IWhereOperators;

  @Field(() => GQLWhereTokensType, { nullable: true })
  type?: IWhereOperators;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  total_pieces?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  nested?: IWhereOperators;

  @Field(() => [TokenWhereParams], { nullable: true })
  _and?: TokenWhereParams[];

  @Field(() => [TokenWhereParams], { nullable: true })
  _or?: TokenWhereParams[];
}

@InputType()
export class TokenOrderByParams implements TOrderByParams<TokenDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner_normalized?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_name?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  token_name?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  parent_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  is_sold?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  token_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  date_of_creation?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  transfers_count?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  children_count?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  bundle_created?: GQLOrderByParamsArgs;
}

@ArgsType()
export class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TokenDTO>
{
  @Field(() => TokenDistinctFieldsEnum, { nullable: true })
  distinct_on?: TokenDistinctFieldsEnum;

  @Field(() => TokenWhereParams, { nullable: true })
  where?: TokenWhereParams;

  @Field(() => [AttributeFilterValue], { nullable: true })
  attributes_filter?: AttributeFilterValue[];

  @Field(() => TokenOrderByParams, { nullable: true })
  order_by?: TokenOrderByParams;
}

@InputType()
export class NestingArgs {
  @Field(() => Int)
  collection_id!: number;

  @Field(() => Int)
  token_id!: number;
}

@ObjectType()
export class TokenEntity extends TokenDTO {
  @Field(() => CollectionDTO, { nullable: true })
  collection?: CollectionDTO;
}

@ObjectType()
export class TokenDataResponse extends ListDataType(TokenEntity) {}

@ObjectType()
export class NestingToken extends SimpleTokenDTO {
  @Field(() => [NestingToken], { nullable: true })
  nestingChildren?: NestingToken[];
}
