import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  GQLOrderByParamsArgs,
  TOrderByParams,
  TWhereParams,
  ListDataType,
  IWhereOperators,
} from '../utils/gql-query-args';
import { CollectionDTO, CollectionEnum } from './collection.dto';
import { TokenDTO } from '../tokens/token.dto';
import { TokenWhereParams } from '../tokens/token.resolver.types';

registerEnumType(CollectionEnum, { name: 'CollectionEnum' });

@InputType()
export class CollectionWhereParams implements TWhereParams<CollectionDTO> {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  tokens_count?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  name?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  description?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  token_prefix?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  mint_mode?: IWhereOperators;

  @Field(() => GQLWhereOpsString, { nullable: true })
  mode?: IWhereOperators;

  @Field(() => GQLWhereOpsString, { nullable: true })
  nesting_enabled?: IWhereOperators;

  @Field(() => GQLWhereOpsString, { nullable: true })
  burned?: IWhereOperators;

  @Field(() => TokenWhereParams, { nullable: true })
  tokens?: TokenWhereParams;

  @Field(() => [CollectionWhereParams], { nullable: true })
  _and?: CollectionWhereParams[];

  @Field(() => [CollectionWhereParams], { nullable: true })
  _or?: CollectionWhereParams[];

  @Field(() => GQLWhereOpsInt, { nullable: true })
  created_at_block_number?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  created_at_block_hash?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  updated_at_block_number?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  updated_at_block_hash?: GQLWhereOpsString;
}

@InputType()
export class CollectionOrderByParams implements TOrderByParams<CollectionDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  name?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  description?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  date_of_creation?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner_can_transfer?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  limits_sponsore_data_rate?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  limits_sponsore_data_size?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  limits_account_ownership?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_cover?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  token_limit?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  tokens_count?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  actions_count?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  holders_count?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  transfers_count?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner_normalized?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  nesting_enabled?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  created_at_block_number?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  updated_at_block_number?: GQLOrderByParamsArgs;
}

@ArgsType()
export class QueryArgs
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
export class CollectionEntity extends CollectionDTO {
  @Field(() => [TokenDTO], { nullable: true })
  tokens?: TokenDTO[];
}

@ObjectType()
export class CollectionDataResponse extends ListDataType(CollectionEntity) {}
