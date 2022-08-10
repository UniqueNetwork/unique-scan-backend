import { Tokens } from '@entities/Tokens';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject, GraphQLJSON } from 'graphql-type-json';

export enum TokenDistinctFieldsEnum {
  token_id = 'token_id',
  collection_id = 'collection_id',
  owner = 'owner',
  owner_normalized = 'owner_normalized',
  token_prefix = 'token_prefix',
  collection_name = 'collection_name',
  token_name = 'token_name',
}

@ObjectType('token')
export class TokenDTO implements Partial<Tokens> {
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

  @Field(() => String)
  collection_name?: string;

  @Field(() => String)
  collection_description?: string;

  @Field(() => String, { nullable: true })
  collection_cover?: string;

  @Field(() => String, { nullable: true })
  token_name?: string;

  @Field(() => Int, { nullable: true })
  date_of_creation?: number;

  @Field(() => String, { nullable: true })
  parent_id?: string;

  @Field(() => Int, { nullable: true })
  transfers_count?: number;
}
