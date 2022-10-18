import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
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
import { TokenDistinctFieldsEnum, TokenDTO } from './token.dto';
import { CollectionDTO } from '../collection/collection.dto';

registerEnumType(TokenDistinctFieldsEnum, { name: 'TokenEnum' });

export type AttributeFilterValue = [
  attributeKey: string, // key of attribute from collection.attributes_schema object
  attributeRawValue: string | number | object,
];

export type AttributeFilter = AttributeFilterValue[];

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

  @Field(() => GraphQLJSON, { nullable: true })
  attributes_filter?: AttributeFilter;

  @Field(() => TokenOrderByParams, { nullable: true })
  order_by?: TokenOrderByParams;
}

@ObjectType()
export class TokenEntity extends TokenDTO {
  @Field(() => CollectionDTO, { nullable: true })
  collection?: CollectionDTO;
}

@ObjectType()
export class TokenDataResponse extends ListDataType(TokenEntity) {}
