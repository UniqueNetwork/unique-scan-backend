import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
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
import { TokenDTO } from './token.dto';
import { CollectionDTO } from '../collection/collection.dto';

@InputType()
export class TokenWhereParams implements TWhereParams<TokenDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  collection_name?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  token_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  token_prefix?: GQLWhereOpsString;

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
  token_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  date_of_creation?: GQLOrderByParamsArgs;
}

@ArgsType()
export class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TokenDTO>
{
  @Field(() => TokenWhereParams, { nullable: true })
  where?: TokenWhereParams;

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
