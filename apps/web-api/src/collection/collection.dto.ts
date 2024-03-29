import { Collections } from '@entities/Collections';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON, GraphQLJSONObject } from 'graphql-type-json';
import { IV2Collection } from '@unique-nft/substrate-client/tokens';

export enum CollectionEnum {
  collection_id = 'collection_id',
  owner = 'owner',
  owner_normalized = 'owner_normalized',
  name = 'name',
  token_prefix = 'token_prefix',
}

@ObjectType('collection')
export class CollectionDTO implements Partial<Collections> {
  @Field(() => Int)
  collection_id?: number;

  @Field(() => String)
  owner?: string;

  @Field(() => String)
  owner_normalized?: string;

  @Field(() => String)
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  offchain_schema?: string;

  @Field(() => Float)
  token_limit?: number;

  @Field(() => String)
  token_prefix?: string;

  @Field(() => String, { nullable: true })
  collection_cover?: string;

  @Field(() => String)
  mode?: string;

  @Field(() => Boolean)
  mint_mode?: boolean;

  @Field(() => Boolean)
  nesting_enabled?: boolean;

  @Field(() => Int, { nullable: true })
  limits_account_ownership?: number;

  @Field(() => Float, { nullable: true })
  limits_sponsore_data_size?: number;

  @Field(() => Float, { nullable: true })
  limits_sponsore_data_rate?: number;

  @Field(() => Boolean, { nullable: true }) // todo remove nullable
  owner_can_transfer?: boolean;

  @Field(() => Boolean, { nullable: true }) // todo remove nullable
  owner_can_destroy?: boolean;

  @Field(() => String, { nullable: true })
  schema_version?: string;

  @Field(() => String, { nullable: true })
  sponsorship?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  const_chain_schema?: object;

  @Field(() => Int)
  tokens_count?: number;

  @Field(() => Int)
  holders_count?: number;

  @Field(() => Int)
  actions_count?: number;

  @Field(() => Int)
  transfers_count?: number;

  @Field(() => Int, { nullable: true })
  date_of_creation?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  variable_on_chain_schema?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  attributes_schema?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  properties?: object;

  @Field(() => GraphQLJSONObject, { nullable: true })
  permissions?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  token_property_permissions?: object;

  @Field(() => Boolean)
  burned?: boolean;

  @Field(() => GraphQLJSONObject, { nullable: true })
  schema_v2?: IV2Collection;

  @Field(() => String, { nullable: true })
  created_at_block_hash?: string;

  @Field(() => Int, { nullable: true })
  created_at_block_number?: number;

  @Field(() => String, { nullable: true })
  updated_at_block_hash?: string;

  @Field(() => Int, { nullable: true })
  updated_at_block_number?: number;

  @Field(() => String, { nullable: true })
  original_schema_version?: string | null;

  @Field(() => GraphQLJSONObject, { nullable: true })
  default_token_image?: object | null;

  @Field(() => GraphQLJSON, { nullable: true })
  potential_attributes?: any[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  customizing?: object | null;
}
