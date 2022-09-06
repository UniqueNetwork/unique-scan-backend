import { Collections } from '@entities/Collections';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

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
  type?: string;

  @Field(() => Boolean)
  mint_mode?: boolean;

  @Field(() => Int, { nullable: true })
  limits_account_ownership?: number;

  @Field(() => Float, { nullable: true })
  limits_sponsore_data_size?: number;

  @Field(() => Float, { nullable: true })
  limits_sponsore_data_rate?: number;

  @Field(() => Boolean)
  owner_can_transfer?: boolean;

  @Field(() => Boolean)
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

  @Field(() => GraphQLJSON, { nullable: true })
  token_properties_permissions?: object;
}
