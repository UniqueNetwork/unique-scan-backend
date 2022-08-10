import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('transaction')
export class TransactionDTO {
  @Field(() => String)
  block_index?: string;

  @Field(() => Int, { nullable: true })
  timestamp?: number;

  @Field(() => String)
  signer?: string;

  @Field(() => String)
  signer_normalized?: string;

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

  @Field(() => String, { nullable: true }) // Collection can be not scaned yet
  token_prefix?: string;

  @Field(() => String, { nullable: true }) // Collection can be not scaned yet
  collection_name?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  image?: object;
}
