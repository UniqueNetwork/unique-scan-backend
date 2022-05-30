import { Collections } from '@entities/Collections';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

export enum CollectionEnum {
  collection_id = 'collection_id',
  description = 'description',
  offchain_schema = 'offchain_schema',
  token_limit = 'token_limit',
  token_prefix = 'token_prefix',
  collection_cover = 'collection_cover',
  mint_mode = 'mint_mode',
  limits_account_ownership = 'limits_account_ownership',
  limits_sponsore_data_size = 'limits_sponsore_data_size',
  limits_sponsore_data_rate = 'limits_sponsore_data_rate',
  owner_can_transfer = 'owner_can_transfer',
  owner_can_destroy = 'owner_can_destroy',
  schema_version = 'schema_version',
  sponsorship = 'sponsorship',
  const_chain_schema = 'const_chain_schema',
  tokens_count = 'tokens_count',
  holders_count = 'holders_count',
  actions_count = 'actions_count',
  date_of_creation = 'date_of_creation',
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

  @Field(() => Int)
  token_limit?: number;

  @Field(() => String)
  token_prefix?: string;

  @Field(() => String, { nullable: true })
  collection_cover?: string;

  @Field(() => String)
  type?: string;

  @Field(() => Boolean)
  mint_mode?: boolean;

  @Field(() => Int, { nullable: true })
  limits_account_ownership?: number;

  @Field(() => Float, { nullable: true })
  limits_sponsore_data_size?: number;

  @Field(() => Float, { nullable: true })
  limits_sponsore_data_rate?: number;

  @Field(() => Boolean, { nullable: true })
  owner_can_transfer?: boolean;

  @Field(() => Boolean, { nullable: true })
  owner_can_destroy?: boolean;

  @Field(() => String, { nullable: true })
  schema_version?: string;

  @Field(() => String, { nullable: true })
  sponsorship?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  const_chain_schema?: object;

  @Field(() => Int)
  tokens_count?: number;

  @Field(() => Int)
  holders_count?: number;

  @Field(() => Int)
  actions_count?: number;

  @Field(() => Int, { nullable: true })
  date_of_creation?: number;
}
