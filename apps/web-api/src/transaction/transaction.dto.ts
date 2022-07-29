import { Field, Int, ObjectType } from '@nestjs/graphql';

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

  @Field(() => String, { nullable: true }) // todo: remove nullable when sdk wixed
  token_prefix?: string;

  @Field(() => String, { nullable: true }) // todo: remove nullable when sdk wixed
  collection_name?: string;

  @Field(() => String)
  image_path?: string;
}
