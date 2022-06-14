import { Collections } from '@entities/Collections';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('collection')
export class CollectionDTO implements Partial<Collections> {
  @Field(() => Int)
  collection_id?: number;

  @Field(() => String)
  owner?: string;

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

  @Field(() => Boolean)
  owner_can_transfer: boolean;

  @Field(() => Boolean)
  owner_can_destroy: boolean;

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
