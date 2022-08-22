import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('transaction')
export class TransactionDTO {
  @Field(() => String)
  block_index?: string;

  @Field(() => Int, { nullable: true })
  timestamp?: number;

  @Field(() => String)
  owner?: string;

  @Field(() => String)
  owner_normalized?: string;

  @Field(() => String)
  to_owner?: string;

  @Field(() => String)
  to_owner_normalized?: string;

  @Field(() => Int)
  collection_id?: number;

  @Field(() => Int)
  token_id?: number;

  @Field(() => String, { nullable: true })
  token_name?: string;

  @Field(() => String, { nullable: true }) // Token could be not scaned at the moment
  token_prefix?: string;

  @Field(() => String, { nullable: true }) // Collection could be not scaned at the moment
  collection_name?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  image?: object;
}
