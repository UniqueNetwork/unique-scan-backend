import { Tokens, TokenType } from '@entities/Tokens';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON, GraphQLJSONObject } from 'graphql-type-json';
import { DecodedAttributes } from '@unique-nft/schemas';
import { TokenWithInfoV2 } from '@unique-nft/substrate-client/tokens';

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
  attributes_v1?: DecodedAttributes;

  @Field(() => GraphQLJSON, { nullable: true })
  properties?: Array<{ key: string; value: string; valueHex: string }>;

  @Field(() => GraphQLJSONObject, { nullable: true })
  image_v1?: object;

  @Field(() => String, { nullable: true })
  image?: string;

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

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  image_details?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  attributes?: object[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  media?: object;

  @Field(() => GraphQLJSONObject, { nullable: true })
  royalties?: object[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  customizing?: object;

  @Field(() => GraphQLJSONObject, { nullable: true })
  customizing_overrides?: object;

  @Field(() => String, { nullable: true })
  animation_url?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  animation_details?: object;

  @Field(() => String, { nullable: true })
  youtube_url?: string;

  @Field(() => String, { nullable: true })
  created_by?: string;

  @Field(() => String, { nullable: true })
  background_color?: string;

  @Field(() => String, { nullable: true })
  external_url?: string;

  @Field(() => String, { nullable: true })
  locale?: string;
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
  tokens_parent?: string;

  // todo - define exact type
  @Field(() => [GraphQLJSONObject], { nullable: true })
  tokens_children?: object[];

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

  @Field(() => GraphQLJSONObject, { nullable: true })
  schema_v2?: TokenWithInfoV2;

  @Field(() => String, { nullable: true })
  created_at_block_hash?: string;

  @Field(() => Int, { nullable: true })
  created_at_block_number?: number;

  @Field(() => String, { nullable: true })
  updated_at_block_hash?: string;

  @Field(() => Int, { nullable: true })
  updated_at_block_number?: number;
}
