import { Tokens, TokenType } from '@entities/Tokens';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON, GraphQLJSONObject } from 'graphql-type-json';

export enum TokenDistinctFieldsEnum {
  token_id = 'token_id',
  collection_id = 'collection_id',
  owner = 'owner',
  owner_normalized = 'owner_normalized',
  token_prefix = 'token_prefix',
  collection_name = 'collection_name',
  tokens_owner = 'tokens_owner',
  token_name = 'token_name',
}

@ObjectType('simple-token')
export class SimpleTokenDTO implements Partial<Tokens> {
  @Field(() => Int)
  token_id?: number;

  @Field(() => Int)
  collection_id?: number;

  @Field(() => GraphQLJSONObject, { nullable: true })
  attributes?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  properties?: object;

  @Field(() => GraphQLJSONObject, { nullable: true })
  image?: object;

  @Field(() => String)
  owner?: string;

  @Field(() => String)
  owner_normalized?: string;

  @Field(() => String)
  token_prefix?: string;

  @Field(() => String, { nullable: true })
  token_name?: string;

  @Field(() => Int, { nullable: true })
  date_of_creation?: number;

  @Field(() => String, { nullable: true })
  parent_id?: string;

  @Field(() => Boolean)
  is_sold?: boolean;

  @Field(() => Boolean)
  burned?: boolean;

  @Field(() => Int, { nullable: true })
  children_count?: number;

  @Field(() => Int, { nullable: true })
  bundle_created?: number;

  @Field(() => TokenType, { nullable: true })
  type?: TokenType;

  @Field(() => String, { nullable: true })
  total_pieces?: number;

  @Field(() => String, { nullable: true })
  amount?: number;

  @Field(() => Boolean)
  nested?: boolean;
}

@ObjectType('token')
export class TokenDTO extends SimpleTokenDTO implements Partial<Tokens> {
  @Field(() => String)
  collection_name?: string;

  @Field(() => String, { nullable: true })
  tokens_owner?: string;

  @Field(() => String, { nullable: true })
  tokens_amount?: string;

  @Field(() => String, { nullable: true })
  collection_description?: string;

  @Field(() => String, { nullable: true })
  collection_cover?: string;

  @Field(() => String, { nullable: true })
  collection_owner?: string;

  @Field(() => String, { nullable: true })
  collection_owner_normalized?: string;

  @Field(() => Int, { nullable: true })
  transfers_count?: number;
}
